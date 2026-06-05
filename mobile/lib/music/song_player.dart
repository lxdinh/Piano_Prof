import 'dart:async';

import 'package:flutter/foundation.dart';

import '../audio/piano_audio.dart';
import '../ble/ble_controller.dart';
import '../ble/ble_transport.dart';
import '../ble/piano_professor_gatt.dart';
import '../lessons/note_mapping.dart';
import 'musicxml.dart';

/// Plays a [Score] faithfully: schedules every note by its absolute beat
/// position (both hands), sounding it through [PianoAudio], lighting the
/// on-screen keyboard, and streaming LED frames to the module in realtime.
class SongPlayer extends ChangeNotifier {
  SongPlayer({required this.score, this.ble, this.audio});

  final Score score;
  final BleController? ble;
  final PianoAudio? audio;

  bool _playing = false;
  int _token = 0;
  bool _disposed = false;
  double _beat = 0;
  final Set<int> _sounding = {};
  final Map<int, String> _litColors = {}; // midi -> color (cyan LH / orange RH)

  // Onset slices reached so far — drives the notation cursor (one step per
  // distinct musical onset, matching OSMD's cursor which steps per timestamp).
  int _onsetIndex = -1;
  double _lastOnsetBeat = -1;
  int get onsetIndex => _onsetIndex;

  bool get playing => _playing;
  Set<int> get sounding => _sounding;

  /// midi → color name for the on-screen keyboard (cyan = left/bass staff,
  /// orange = right/treble staff).
  Map<int, String> get litColors => _litColors;
  double get progress =>
      score.totalBeats <= 0 ? 0 : (_beat / score.totalBeats).clamp(0.0, 1.0);
  int get totalBars => score.barCount;
  int get currentBar =>
      score.barLengthBeats <= 0 ? 0 : (_beat / score.barLengthBeats).floor() + 1;

  ConnectedPeripheral? get _peripheral {
    final s = ble?.state;
    return s is BleConnected ? s.peripheral : null;
  }

  Future<void> play() async {
    if (_playing) return;
    _playing = true;
    final token = ++_token;
    notifyListeners();

    final msPerBeat = 60000 / score.tempoBpm;
    final acts = <_NoteAct>[];
    for (final n in score.notes) {
      acts.add(_NoteAct(n.startBeat, true, n.midi, n.staff));
      acts.add(_NoteAct(n.endBeat, false, n.midi, n.staff));
    }
    // sort by time; at the same instant, release before strike
    acts.sort((a, b) {
      final c = a.beat.compareTo(b.beat);
      return c != 0 ? c : (a.on ? 1 : -1);
    });

    _sounding.clear();
    _onsetIndex = -1;
    _lastOnsetBeat = -1;
    var last = 0.0;
    for (final a in acts) {
      if (_disposed || token != _token) return _finish();
      final waitMs = ((a.beat - last) * msPerBeat).round();
      if (waitMs > 0) await Future<void>.delayed(Duration(milliseconds: waitMs));
      if (_disposed || token != _token) return _finish();
      last = a.beat;
      _beat = a.beat;
      if (a.on) {
        if (a.beat > _lastOnsetBeat + 1e-6) {
          _onsetIndex++;
          _lastOnsetBeat = a.beat;
        }
        _sounding.add(a.midi);
        _litColors[a.midi] = a.staff == 2
            ? NoteMapping.leftHandColor
            : NoteMapping.rightHandColor;
        audio?.noteOn(a.midi);
      } else {
        _sounding.remove(a.midi);
        _litColors.remove(a.midi);
        audio?.noteOff(a.midi);
      }
      _writeLeds();
      notifyListeners();
    }
    if (token == _token) _finish();
  }

  void stop() {
    _token++;
    _finish();
  }

  void _finish() {
    for (final m in _sounding.toList()) {
      audio?.noteOff(m);
    }
    _sounding.clear();
    _litColors.clear();
    _clearLeds();
    _playing = false;
    _beat = 0;
    _onsetIndex = -1;
    _lastOnsetBeat = -1;
    if (!_disposed) notifyListeners();
  }

  void _writeLeds() {
    final p = _peripheral;
    if (p == null) return;
    if (_sounding.isEmpty) {
      try {
        p.writeLed(PianoProfessorGatt.clearAll());
      } catch (_) {}
      return;
    }
    final leds = <({int index, int r, int g, int b})>[];
    _litColors.forEach((m, col) {
      final i = m - NoteMapping.ledBaseMidi;
      if (i >= 0 && i < NoteMapping.ledCount) {
        final (r, g, b) = NoteMapping.rgb(col);
        leds.add((index: i, r: r, g: g, b: b));
      }
    });
    try {
      p.writeLed(PianoProfessorGatt.setMany(leds));
    } catch (_) {}
  }

  void _clearLeds() {
    final p = _peripheral;
    if (p == null) return;
    try {
      p.writeLed(PianoProfessorGatt.clearAll());
    } catch (_) {}
  }

  @override
  void dispose() {
    _disposed = true;
    _token++;
    for (final m in _sounding.toList()) {
      audio?.noteOff(m);
    }
    _clearLeds();
    super.dispose();
  }
}

class _NoteAct {
  _NoteAct(this.beat, this.on, this.midi, this.staff);
  final double beat;
  final bool on;
  final int midi;
  final int staff; // 1 = right hand (treble), 2 = left hand (bass)
}
