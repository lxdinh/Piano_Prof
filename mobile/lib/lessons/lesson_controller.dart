import 'dart:async';

import 'package:flutter/foundation.dart';

import '../audio/piano_audio.dart';
import '../audio/voice_service.dart';
import '../ble/ble_controller.dart';
import '../ble/ble_transport.dart';
import '../ble/piano_professor_gatt.dart';
import '../data/profile_controller.dart';
import '../input/note_input_service.dart';
import '../services/analytics_service.dart';
import 'lesson_data.dart';
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
    this.litColors = const {},
    this.chordChips = const [],
  });
  final int stepIndex;
  final int totalSteps;
  final String text;
  final bool speaking;

  /// MIDI note → color name (cyan = left hand, orange = right hand). Drives the
  /// on-screen keyboard highlight and the LED strip.
  final Map<int, String> litColors;
  final List<String> chordChips;
}

class LessonQuizState extends LessonUiState {
  const LessonQuizState(this.quiz, {this.lastWrong = false});
  final QuizData quiz;
  final bool lastWrong;
}

class LessonCompleteState extends LessonUiState {
  const LessonCompleteState(this.message, {this.reward});
  final String message;

  /// Stars / XP / gems / streak earned — null for the brief moment before the
  /// reward write resolves.
  final LessonReward? reward;
}

/// The learner ran out of hearts mid-lesson — the run fails (no XP).
class LessonFailedState extends LessonUiState {
  const LessonFailedState(this.message);
  final String message;
}

/// Plays a lesson step-by-step, mirrors the Kotlin LessonViewModel, speaks the
/// instructor lines (Gemini voice), sounds the piano (real samples + pedal),
/// sings solfège in tune, and pushes per-hand LED frames to the module.
class LessonController extends ChangeNotifier {
  LessonController({
    required this.lesson,
    this.ble,
    this.profile,
    this.input,
    this.audio,
    this.voice,
    this.analytics,
  });

  final Lesson lesson;
  final BleController? ble;
  final ProfileController? profile;
  final NoteInputService? input;
  final PianoAudio? audio;
  final VoiceService? voice;
  final AnalyticsService? analytics;

  final Set<int> _soundingMidis = {};
  int _mistakes = 0; // wrong quiz answers this run → stars + hearts

  LessonUiState _state = const LessonIdle();
  LessonUiState get state => _state;

  int _stepIndex = 0;
  int _runToken = 0; // bumped to cancel stale async playback
  bool _disposed = false;
  StreamSubscription<PlayedNote>? _quizSub; // "Listen & Wait" listener

  void start() {
    if (profile != null && !profile!.canStartLesson) {
      _set(const LessonFailedState(
          'Out of hearts! They refill over time — or go Premium for unlimited.'));
      return;
    }
    analytics?.lessonStart(lesson.id);
    _runStep(0);
  }

  ConnectedPeripheral? get _peripheral {
    final s = ble?.state;
    return s is BleConnected ? s.peripheral : null;
  }

  Future<void> _runStep(int index) async {
    if (_disposed) return;
    voice?.stop();
    if (index >= lesson.steps.length) {
      audio?.playSfx('levelup'); // little fanfare on finish
      _set(LessonCompleteState(lesson.complete));
      voice?.speak(lesson.complete); // celebrate out loud (if voice installed)
      _awardCompletion();
      return;
    }
    _stepIndex = index;
    final token = ++_runToken;
    _quizSub?.cancel();
    _quizSub = null;
    _set(LessonPlaying(stepIndex: index, totalSteps: lesson.steps.length));
    // Pre-fetch all remaining Say lines sequentially in the background so every
    // upcoming sentence is already cached by the time we reach it.
    unawaited(_prefetchFrom(index, token));
    for (final seg in lesson.steps[index].segments) {
      if (_disposed || token != _runToken) return;
      await _handle(seg, index, token);
    }
  }

  /// Sequentially pre-fetch every Say line from [fromIndex] to the end of the
  /// lesson. Stops immediately if the lesson is cancelled or the user skips
  /// (token mismatch). Sequential to stay within the API rate limit.
  Future<void> _prefetchFrom(int fromIndex, int token) async {
    for (var i = fromIndex; i < lesson.steps.length; i++) {
      for (final seg in lesson.steps[i].segments) {
        if (_disposed || token != _runToken) return;
        if (seg is Say) await voice?.prefetch(seg.text);
      }
    }
    // Also pre-fetch the completion message spoken at the end.
    if (!_disposed && token == _runToken) {
      await voice?.prefetch(lesson.complete);
    }
  }

  Future<void> _handle(Segment seg, int stepIndex, int token) async {
    final total = lesson.steps.length;
    switch (seg) {
      case Say s:
        _set(LessonPlaying(
            stepIndex: stepIndex, totalSteps: total, text: s.text, speaking: true));
        final dur = await voice?.speak(s.text);
        if (token != _runToken) {
          voice?.stop();
          return;
        }
        await _wait(dur?.inMilliseconds ?? s.text.length * 45);
        if (token != _runToken) return;
        _set(LessonPlaying(stepIndex: stepIndex, totalSteps: total, text: s.text));
        await _wait(s.gapMs);
      case PauseSeg p:
        await _wait(p.ms);
      case Chord c:
        if (c.pedal) audio?.setSustain(true);
        final colors = _light(c.notes, c.hand);
        _set(LessonPlaying(
          stepIndex: stepIndex,
          totalSteps: total,
          text: _currentText(),
          litColors: colors,
          chordChips: c.notes.map(NoteMapping.pitchClass).toList(),
        ));
        await _wait(c.waitMs);
        _clear();
      case Seq sq:
        if (sq.pedal) audio?.setSustain(true);
        for (final n in sq.notes) {
          if (token != _runToken) return;
          final colors = _light([n], sq.hand);
          if (sq.solfege) {
            final m = NoteMapping.toMidi(n);
            if (m != null) audio?.singSolfege(m);
          }
          _set(LessonPlaying(
              stepIndex: stepIndex, totalSteps: total, litColors: colors));
          await _wait(sq.delayMs);
          _clear();
        }
        await _wait(sq.waitMs);
      case SeqAll sa:
        if (sa.pedal) audio?.setSustain(true);
        final acc = <String>[];
        for (final n in sa.notes) {
          if (token != _runToken) return;
          acc.add(n);
          final colors = _light(acc, sa.hand);
          if (sa.solfege) {
            final m = NoteMapping.toMidi(n);
            if (m != null) audio?.singSolfege(m);
          }
          _set(LessonPlaying(
              stepIndex: stepIndex, totalSteps: total, litColors: colors));
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

  /// Replay the current step from the top (re-speak + re-demo) — for the Replay
  /// button when a learner didn't catch it.
  void replayStep() => _runStep(_stepIndex);

  void onQuizAnswered(bool correct) {
    _quizSub?.cancel();
    _quizSub = null;
    if (correct) {
      audio?.playSfx('correct');
      _runStep(_stepIndex + 1);
    } else {
      _registerMistake();
    }
  }

  /// A wrong answer costs a heart and a star. At zero hearts the run fails.
  Future<void> _registerMistake() async {
    _mistakes++;
    audio?.playSfx('wrong');
    final hearts = await profile?.spendHeart();
    if (_disposed) return;
    if (hearts != null && hearts.isEmpty) {
      _runToken++; // cancel any pending playback
      voice?.stop();
      _clear();
      _set(const LessonFailedState(
          'Out of hearts! They refill over time — or go Premium for unlimited. '
          'Come back and try again soon.'));
      return;
    }
    final s = _state;
    if (s is LessonQuizState) _set(LessonQuizState(s.quiz, lastWrong: true));
  }

  /// Persist stars/XP/gems/streak, then surface the reward on the complete card.
  Future<void> _awardCompletion() async {
    final reward = await profile?.completeLesson(
      lessonId: lesson.id,
      kind: lessonKindFor(lesson.id),
      mistakes: _mistakes,
    );
    if (_disposed || reward == null) return;
    analytics?.lessonComplete(lesson.id, reward.stars, reward.xpEarned);
    if (_state is LessonCompleteState) {
      _set(LessonCompleteState(lesson.complete, reward: reward));
    }
  }

  /// Tap-to-hear on the on-screen keyboard (also used to answer a key quiz).
  void pressKey(int midi) {
    audio?.noteOn(midi);
    final s = _state;
    if (s is LessonQuizState && s.quiz is KeyQuiz) {
      final target = NoteMapping.toMidi((s.quiz as KeyQuiz).target);
      if (target == midi) onQuizAnswered(true);
    }
  }

  // Tapped keys ring out naturally (the sample/synth has its own decay) instead
  // of being cut off the instant you lift your finger — like a real piano.
  void releaseKey(int midi) {}

  // --- helpers ---
  String _currentText() => _state is LessonPlaying ? (_state as LessonPlaying).text : '';

  String _handColor(int midi, Hand hand) {
    switch (hand) {
      case Hand.left:
        return NoteMapping.leftHandColor;
      case Hand.right:
        return NoteMapping.rightHandColor;
      case Hand.both:
      case Hand.auto:
        return midi < NoteMapping.middleC
            ? NoteMapping.leftHandColor
            : NoteMapping.rightHandColor;
    }
  }

  /// Sound + light the given notes, colored by [hand]. Returns the midi→color
  /// map for the on-screen keyboard.
  Map<int, String> _light(List<String> notes, Hand hand) {
    final colors = <int, String>{};
    for (final n in notes) {
      final m = NoteMapping.toMidi(n);
      if (m == null) continue;
      colors[m] = _handColor(m, hand);
      audio?.noteOn(m);
      _soundingMidis.add(m);
    }
    final p = _peripheral;
    if (p != null && colors.isNotEmpty) {
      final leds = <({int index, int r, int g, int b})>[];
      colors.forEach((m, col) {
        final i = m - NoteMapping.ledBaseMidi;
        if (i >= 0 && i < NoteMapping.ledCount) {
          final (r, g, b) = NoteMapping.rgb(col);
          leds.add((index: i, r: r, g: g, b: b));
        }
      });
      if (leds.isNotEmpty) {
        try {
          p.writeLed(PianoProfessorGatt.setMany(leds));
        } catch (_) {}
      }
    }
    return colors;
  }

  void _clear() {
    audio?.setSustain(false); // flush any pedal-held notes
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
    voice?.stop();
    _clear();
    super.dispose();
  }
}
