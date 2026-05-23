import 'dart:async';

import 'package:flutter/foundation.dart';

import '../audio/piano_audio.dart';
import '../ble/ble_controller.dart';
import '../ble/ble_transport.dart';
import '../ble/piano_professor_gatt.dart';
import '../data/user_repository.dart';
import '../input/note_input_service.dart';
import 'lesson_models.dart';
import 'note_mapping.dart';

/// UI state for the in-lesson screen (Dart port of LessonUIState).
sealed class LessonUiState {
  const LessonUiState();
}

class LessonIdle extends LessonUiState {
  const LessonIdle();
}

class LessonPlaying extends LessonUiState {
  const LessonPlaying({
    required this.stepIndex,
    required this.totalSteps,
    this.text = '',
    this.speaking = false,
    this.litWhites = const {},
    this.chordChips = const [],
  });
  final int stepIndex;
  final int totalSteps;
  final String text;
  final bool speaking;
  final Set<String> litWhites;
  final List<String> chordChips;
}

class LessonQuizState extends LessonUiState {
  const LessonQuizState(this.quiz, {this.lastWrong = false});
  final QuizData quiz;
  final bool lastWrong;
}

class LessonCompleteState extends LessonUiState {
  const LessonCompleteState(this.message);
  final String message;
}

/// Plays a lesson step-by-step, mirrors the Kotlin LessonViewModel, and pushes
/// LED frames to the connected module (if any) as chords/sequences play.
class LessonController extends ChangeNotifier {
  LessonController({required this.lesson, this.ble, this.repo, this.input, this.audio});

  final Lesson lesson;
  final BleController? ble;
  final UserRepository? repo;
  final NoteInputService? input;
  final PianoAudio? audio;

  final Set<int> _soundingMidis = {};

  LessonUiState _state = const LessonIdle();
  LessonUiState get state => _state;

  int _stepIndex = 0;
  int _runToken = 0; // bumped to cancel stale async playback
  bool _disposed = false;
  StreamSubscription<PlayedNote>? _quizSub; // "Listen & Wait" listener

  void start() => _runStep(0);

  ConnectedPeripheral? get _peripheral {
    final s = ble?.state;
    return s is BleConnected ? s.peripheral : null;
  }

  Future<void> _runStep(int index) async {
    if (_disposed) return;
    if (index >= lesson.steps.length) {
      _set(LessonCompleteState(lesson.complete));
      unawaited(repo?.completeLesson(lessonId: lesson.id, xp: 50) ?? Future.value());
      return;
    }
    _stepIndex = index;
    final token = ++_runToken;
    _quizSub?.cancel();
    _quizSub = null;
    _set(LessonPlaying(stepIndex: index, totalSteps: lesson.steps.length));
    for (final seg in lesson.steps[index].segments) {
      if (_disposed || token != _runToken) return;
      await _handle(seg, index, token);
    }
  }

  Future<void> _handle(Segment seg, int stepIndex, int token) async {
    final total = lesson.steps.length;
    switch (seg) {
      case Say s:
        _set(LessonPlaying(
            stepIndex: stepIndex, totalSteps: total, text: s.text, speaking: true));
        await _wait(s.text.length * 45);
        if (token != _runToken) return;
        _set(LessonPlaying(
            stepIndex: stepIndex, totalSteps: total, text: s.text));
        await _wait(s.gapMs);
      case PauseSeg p:
        await _wait(p.ms);
      case Chord c:
        _light(c.notes, c.color);
        _set(LessonPlaying(
          stepIndex: stepIndex,
          totalSteps: total,
          text: _currentText(),
          litWhites: _whites(c.notes),
          chordChips: c.notes.map(NoteMapping.pitchClass).toList(),
        ));
        await _wait(c.waitMs);
        _clear();
      case Seq sq:
        for (final n in sq.notes) {
          if (token != _runToken) return;
          _light([n], sq.color);
          _set(LessonPlaying(
              stepIndex: stepIndex, totalSteps: total, litWhites: _whites([n])));
          await _wait(sq.delayMs);
          _clear();
        }
        await _wait(sq.waitMs);
      case SeqAll sa:
        final acc = <String>[];
        for (final n in sa.notes) {
          if (token != _runToken) return;
          acc.add(n);
          _light(acc, sa.color);
          _set(LessonPlaying(
              stepIndex: stepIndex, totalSteps: total, litWhites: _whites(acc)));
          await _wait(sa.delayMs);
        }
        await _wait(sa.waitMs);
        _clear();
      case QuizSeg q:
        _set(LessonQuizState(q.quiz));
        _listenForKey(q.quiz);
    }
  }

  /// "Listen & Wait": for a find-the-key quiz, auto-advance when the student
  /// plays the target note on a connected MIDI keyboard.
  void _listenForKey(QuizData quiz) {
    _quizSub?.cancel();
    _quizSub = null;
    if (quiz is! KeyQuiz) return;
    final target = NoteMapping.toMidi(quiz.target);
    if (target == null || input == null) return;
    _quizSub = input!.notes.listen((n) {
      if (n.on && n.midi == target) {
        _quizSub?.cancel();
        _quizSub = null;
        onQuizAnswered(true);
      }
    });
  }

  void nextStep() => _runStep(_stepIndex + 1);

  void onQuizAnswered(bool correct) {
    _quizSub?.cancel();
    _quizSub = null;
    if (correct) {
      _runStep(_stepIndex + 1);
    } else {
      final s = _state;
      if (s is LessonQuizState) _set(LessonQuizState(s.quiz, lastWrong: true));
    }
  }

  // --- helpers ---
  String _currentText() => _state is LessonPlaying ? (_state as LessonPlaying).text : '';
  Set<String> _whites(List<String> notes) =>
      notes.map(NoteMapping.whiteKeyOf).toSet();

  void _light(List<String> notes, String color) {
    // Audio — always (independent of the LED hardware).
    for (final n in notes) {
      final m = NoteMapping.toMidi(n);
      if (m != null) {
        audio?.noteOn(m);
        _soundingMidis.add(m);
      }
    }
    // LEDs — only when a module is connected.
    final p = _peripheral;
    if (p == null) return;
    final (r, g, b) = NoteMapping.rgb(color);
    final leds = <({int index, int r, int g, int b})>[];
    for (final n in notes) {
      final i = NoteMapping.toLedIndex(n);
      if (i != null) leds.add((index: i, r: r, g: g, b: b));
    }
    if (leds.isEmpty) return;
    try {
      p.writeLed(PianoProfessorGatt.setMany(leds));
    } catch (_) {}
  }

  void _clear() {
    for (final m in _soundingMidis.toList()) {
      audio?.noteOff(m);
    }
    _soundingMidis.clear();
    final p = _peripheral;
    if (p == null) return;
    try {
      p.writeLed(PianoProfessorGatt.clearAll());
    } catch (_) {}
  }

  Future<void> _wait(int ms) async {
    if (ms <= 0) return;
    await Future<void>.delayed(Duration(milliseconds: ms));
  }

  void _set(LessonUiState s) {
    if (_disposed) return;
    _state = s;
    notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _runToken++;
    _quizSub?.cancel();
    _clear();
    super.dispose();
  }
}
