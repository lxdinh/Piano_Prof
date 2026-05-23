import 'dart:async';

import 'package:flutter/foundation.dart';

import '../ble/ble_controller.dart';
import '../ble/ble_transport.dart';
import '../ble/piano_professor_gatt.dart';
import '../lessons/note_mapping.dart';
import 'musicxml.dart';

/// Plays a whole [Score] back as a preview: highlights the on-screen piano and,
/// if an LED module is paired, sends LED frames over BLE in realtime so the
/// strip lights up in time with the music.
class SongPlayer extends ChangeNotifier {
  SongPlayer({required this.score, this.ble});

  final Score score;
  final BleController? ble;

  double tempoBpm = 90;
  int _index = -1;
  bool _playing = false;
  int _token = 0;
  bool _disposed = false;

  Set<String> litWhites = {};

  int get index => _index;
  bool get playing => _playing;
  int get total => score.events.length;

  ConnectedPeripheral? get _peripheral {
    final s = ble?.state;
    return s is BleConnected ? s.peripheral : null;
  }

  Future<void> play() async {
    if (_playing) return;
    _playing = true;
    final token = ++_token;
    notifyListeners();
    for (var i = 0; i < score.events.length; i++) {
      if (_disposed || token != _token) return;
      final e = score.events[i];
      _index = i;
      litWhites = e.midiNotes.map(_whiteLetter).toSet();
      _lightLeds(e.midiNotes);
      notifyListeners();
      final ms = (e.beats * 60000 / tempoBpm).round().clamp(150, 3000);
      await Future<void>.delayed(Duration(milliseconds: ms));
      _clearLeds();
    }
    if (token == _token) _finish();
  }

  void stop() {
    _token++;
    _finish();
  }

  void _finish() {
    _playing = false;
    _index = -1;
    litWhites = {};
    _clearLeds();
    notifyListeners();
  }

  void _lightLeds(List<int> midis) {
    final p = _peripheral;
    if (p == null || midis.isEmpty) return;
    final leds = <({int index, int r, int g, int b})>[];
    for (final m in midis) {
      final idx = m - NoteMapping.ledBaseMidi;
      if (idx >= 0 && idx < NoteMapping.ledCount) {
        leds.add((index: idx, r: 88, g: 204, b: 2)); // brand green
      }
    }
    if (leds.isNotEmpty) {
      try {
        p.writeLed(PianoProfessorGatt.setMany(leds));
      } catch (_) {}
    }
  }

  void _clearLeds() {
    final p = _peripheral;
    if (p == null) return;
    try {
      p.writeLed(PianoProfessorGatt.clearAll());
    } catch (_) {}
  }

  // Fold any pitch onto its natural letter for the 8-white-key on-screen piano.
  static String _whiteLetter(int midi) {
    const letters = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
    return letters[midi % 12];
  }

  @override
  void dispose() {
    _disposed = true;
    _token++;
    _clearLeds();
    super.dispose();
  }
}
