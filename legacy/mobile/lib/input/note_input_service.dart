import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

import '../ble/ble_controller.dart';
import '../ble/ble_transport.dart';
import '../ble/piano_professor_gatt.dart';

/// A note the student actually played.
class PlayedNote {
  const PlayedNote({required this.midi, required this.velocity, required this.on});
  final int midi;
  final int velocity;
  final bool on;
}

/// Sources the notes the student plays. The ESP32 controller reads the piano's
/// USB-MIDI / TRS-MIDI and forwards Note events over BLE (see PROJECT_PLAN §7),
/// so when the LED module is paired we get real played notes here — this powers
/// lessons' "Listen & Wait". Microphone pitch-detection is the planned fallback
/// (wired as an experimental toggle for now).
class NoteInputService extends ChangeNotifier {
  NoteInputService(this._ble) {
    _ble.addListener(_onBleChanged);
    _onBleChanged();
  }

  final BleController _ble;
  final StreamController<PlayedNote> _notes = StreamController<PlayedNote>.broadcast();

  StreamSubscription<NoteEvent>? _noteSub;
  ConnectedPeripheral? _peripheral;

  PlayedNote? lastNote;
  bool micEnabled = false;

  Stream<PlayedNote> get notes => _notes.stream;

  String? get sourceName {
    final s = _ble.state;
    return s is BleConnected ? s.peripheral.name : null;
  }

  bool get hasInput => sourceName != null;

  void _onBleChanged() {
    final s = _ble.state;
    final p = s is BleConnected ? s.peripheral : null;
    if (identical(p, _peripheral)) return;
    _peripheral = p;
    _noteSub?.cancel();
    _noteSub = null;
    if (p != null) {
      _noteSub = p.noteEvents.listen((e) {
        final n = PlayedNote(midi: e.midiNote, velocity: e.velocity, on: e.on);
        lastNote = n;
        _notes.add(n);
        notifyListeners();
      });
    }
    notifyListeners();
  }

  /// Microphone fallback — requests permission. Pitch detection (YIN/MPM) is a
  /// planned follow-up; this only gates the experimental toggle for now.
  Future<bool> enableMic() async {
    final status = await Permission.microphone.request();
    micEnabled = status.isGranted;
    notifyListeners();
    return micEnabled;
  }

  @override
  void dispose() {
    _ble.removeListener(_onBleChanged);
    _noteSub?.cancel();
    _notes.close();
    super.dispose();
  }
}
