import 'package:flutter_soloud/flutter_soloud.dart';

import 'tone_synth.dart';

/// Polyphonic piano audio via SoLoud. Plays notes by MIDI number using
/// on-the-fly synthesized tones (cached per note). Supports a sustain pedal:
/// while sustain is on, released notes keep ringing until the pedal lifts.
///
/// Engine-agnostic API (`noteOn`/`noteOff`/`setSustain`) so the backend can be
/// swapped (e.g. to a `.sf2` SoundFont) without touching callers.
class PianoAudio {
  final SoLoud _soloud = SoLoud.instance;
  bool _ready = false;
  bool _sustain = false;

  final Map<int, AudioSource> _sources = {}; // midi -> loaded tone
  final Map<int, SoundHandle> _active = {}; // midi -> currently sounding voice
  final Set<int> _releasedUnderPedal = {}; // released while the pedal was down

  bool get ready => _ready;

  Future<void> init() async {
    try {
      if (!_soloud.isInitialized) {
        await _soloud.init();
      }
      _ready = true;
    } catch (_) {
      _ready = false; // app still runs silently if audio init fails
    }
  }

  Future<AudioSource> _sourceFor(int midi) async {
    final cached = _sources[midi];
    if (cached != null) return cached;
    final src = await _soloud.loadMem('pp_note_$midi', synthPianoWav(midi));
    _sources[midi] = src;
    return src;
  }

  Future<void> noteOn(int midi, {double velocity = 0.9}) async {
    if (!_ready || midi < 0 || midi > 127) return;
    try {
      final prev = _active.remove(midi);
      if (prev != null) await _soloud.stop(prev); // retrigger same note cleanly
      final handle = await _soloud.play(
        await _sourceFor(midi),
        volume: velocity.clamp(0.05, 1.0),
      );
      _active[midi] = handle;
      _releasedUnderPedal.remove(midi);
    } catch (_) {}
  }

  Future<void> noteOff(int midi) async {
    if (!_ready) return;
    if (_sustain) {
      _releasedUnderPedal.add(midi); // keep ringing until pedal up
      return;
    }
    final handle = _active.remove(midi);
    if (handle != null) {
      try {
        await _soloud.stop(handle);
      } catch (_) {}
    }
  }

  void setSustain(bool on) {
    _sustain = on;
    if (!on) {
      for (final midi in _releasedUnderPedal.toList()) {
        final handle = _active.remove(midi);
        if (handle != null) {
          try {
            _soloud.stop(handle);
          } catch (_) {}
        }
      }
      _releasedUnderPedal.clear();
    }
  }

  Future<void> allNotesOff() async {
    for (final handle in _active.values.toList()) {
      try {
        await _soloud.stop(handle);
      } catch (_) {}
    }
    _active.clear();
    _releasedUnderPedal.clear();
  }

  /// Convenience: play a chord (notes together).
  Future<void> playChord(Iterable<int> midis, {double velocity = 0.9}) async {
    for (final m in midis) {
      await noteOn(m, velocity: velocity);
    }
  }
}
