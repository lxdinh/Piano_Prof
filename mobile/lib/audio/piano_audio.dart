import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter_soloud/flutter_soloud.dart';

import '../lessons/note_mapping.dart';
import 'sample_bank.dart';
import 'tone_synth.dart';

/// Polyphonic piano audio via SoLoud.
///
/// Plays notes by MIDI number. If a real sample pack is installed
/// (`assets/piano_samples/`), it plays the **nearest recorded sample** and
/// pitch-shifts it to the exact note (`setRelativePlaySpeed`) for an authentic
/// piano; otherwise it falls back to a built-in synth tone so the app is never
/// silent. A subtle global **reverb** adds room ambience, and a true **sustain
/// pedal** lets notes ring.
///
/// Engine-agnostic API (`noteOn`/`noteOff`/`setSustain`/`singSolfege`) so the
/// backend can change without touching callers.
class PianoAudio {
  final SoLoud _soloud = SoLoud.instance;
  bool _ready = false;
  bool _sustain = false;
  SampleBank? _bank;

  // Cached, loaded audio sources.
  final Map<int, AudioSource> _sampleSources = {}; // keyed by *sample* midi
  final Map<int, AudioSource> _synthSources = {}; // keyed by note midi
  final Map<String, AudioSource> _solfegeSources = {}; // keyed by syllable

  final Map<int, SoundHandle> _active = {}; // midi -> currently sounding voice
  final Set<int> _releasedUnderPedal = {}; // released while the pedal was down
  final List<SoundHandle> _solfegeHandles = []; // one-shot sung syllables

  /// Optional: synthesize a solfège syllable to WAV bytes (wired to the Gemini
  /// [VoiceService] in main). Lets the instructor "sing" Do-Re-Mi with no
  /// bundled voice pack; the clip is cached then pitch-shifted to the played note.
  Future<Uint8List?> Function(String text)? solfegeSynthesizer;

  bool get ready => _ready;

  /// True once a real sample pack is loaded (vs. the synth fallback).
  bool get usingSamples => _bank?.isLoaded ?? false;

  Future<void> init() async {
    try {
      if (!_soloud.isInitialized) {
        await _soloud.init();
      }
      _ready = true;
      try {
        _bank = await SampleBank.load();
      } catch (_) {
        _bank = null;
      }
      _enableReverb();
    } catch (_) {
      _ready = false; // app still runs silently if audio init fails
    }
  }

  void _enableReverb() {
    try {
      final fx = _soloud.filters.freeverbFilter;
      fx.activate();
      fx.wet.value = 0.16;    // matches HTML prototype reverb gain (was 0.08)
      fx.roomSize.value = 0.55;
      fx.damp.value = 0.45;
    } catch (_) {
      // Reverb is best-effort; ignore if unsupported on this platform.
    }
  }

  /// Returns the source for [midi] plus the playback speed needed to reach its
  /// exact pitch (1.0 for the synth, a pitch-shift factor for samples).
  Future<(AudioSource, double)> _voiceFor(int midi) async {
    final bank = _bank;
    if (bank != null && bank.isLoaded) {
      final e = bank.nearest(midi)!;
      var src = _sampleSources[e.midi];
      if (src == null) {
        src = await _soloud.loadAsset(e.assetPath);
        _sampleSources[e.midi] = src;
      }
      final speed = pow(2.0, (midi - e.midi) / 12.0).toDouble();
      return (src, speed);
    }
    var src = _synthSources[midi];
    if (src == null) {
      src = await _soloud.loadMem('pp_note_$midi', synthPianoWav(midi));
      _synthSources[midi] = src;
    }
    return (src, 1.0);
  }

  final Map<String, AudioSource> _sfxSources = {}; // ui sfx by type

  /// Play a short UI sound effect (correct / wrong / levelup / streak) — ported
  /// from the web prototype's sfx.js. Synthesized once then cached.
  Future<void> playSfx(String type) async {
    if (!_ready) return;
    try {
      var src = _sfxSources[type];
      if (src == null) {
        final wav = _sfxWavFor(type);
        if (wav == null) return;
        src = await _soloud.loadMem('pp_sfx_$type', wav);
        _sfxSources[type] = src;
      }
      await _soloud.play(src, volume: 0.9);
    } catch (e) {
      if (kDebugMode) debugPrint('PianoAudio.playSfx($type) failed: $e');
    }
  }

  Uint8List? _sfxWavFor(String type) {
    switch (type) {
      case 'correct':
        return synthSfxWav([523.25, 659.25, 783.99], totalMs: 220, peak: 0.13);
      case 'wrong':
        return synthSfxWav([220.0, 207.65],
            totalMs: 260, wave: 'sawtooth', peak: 0.10);
      case 'levelup':
        return synthSfxWav([523.25, 659.25, 783.99, 1046.50],
            totalMs: 420, peak: 0.14);
      case 'streak':
        return synthSfxWav([1046.50, 1318.51],
            totalMs: 160, wave: 'sine', peak: 0.10);
      default:
        return null;
    }
  }

  /// Pre-render + cache the source for each of [midis] (no playback) so the
  /// first press of a key has no synth-render lag — which is what made chords
  /// feel laggy/cut-off. Safe to fire-and-forget at startup.
  Future<void> prewarm(Iterable<int> midis) async {
    if (!_ready) return;
    for (final m in midis) {
      if (m < 0 || m > 127) continue;
      try {
        await _voiceFor(m);
      } catch (_) {}
    }
  }

  Future<void> noteOn(int midi, {double velocity = 0.9}) async {
    if (!_ready || midi < 0 || midi > 127) return;
    try {
      final prev = _active.remove(midi);
      if (prev != null) await _soloud.stop(prev); // retrigger same note cleanly
      final (src, speed) = await _voiceFor(midi);
      // Play paused, set the pitch, then un-pause — avoids a wrong-pitch blip.
      final handle = await _soloud.play(
        src,
        volume: velocity.clamp(0.05, 1.0),
        paused: true,
      );
      if (speed != 1.0) _soloud.setRelativePlaySpeed(handle, speed);
      _soloud.setPause(handle, false);
      _active[midi] = handle;
      _releasedUnderPedal.remove(midi);
    } catch (e) {
      if (kDebugMode) debugPrint('PianoAudio.noteOn($midi) failed: $e');
    }
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

  /// Sing the solfège syllable for [midi] (Do, Re, Mi…) **in tune** with the
  /// note by pitch-shifting the pre-baked recording. No-op if the voice assets
  /// aren't installed or the note is chromatic. The piano still plays either way.
  Future<void> singSolfege(int midi, {double velocity = 0.85}) async {
    if (!_ready) return;
    final syllable = NoteMapping.solfegeSyllable(midi);
    if (syllable == null) return;
    try {
      var src = _solfegeSources[syllable];
      if (src == null) {
        src = await _loadFirst([
          'assets/voice/solfege/$syllable.ogg',
          'assets/voice/solfege/$syllable.wav',
        ]);
        // No bundled pack? Sing it with the Gemini voice (cached per syllable).
        if (src == null && solfegeSynthesizer != null) {
          final wav = await solfegeSynthesizer!(
              NoteMapping.solfegeSpoken[syllable] ?? syllable);
          if (wav != null) {
            src = await _soloud.loadMem('pp_solfege_$syllable.wav', wav);
          }
        }
        if (src == null) return; // no voice pack and no TTS key
        _solfegeSources[syllable] = src;
      }
      // Fold into a comfortable vocal octave (keeps the pitch class, avoids
      // chipmunk/growl extremes), then shift from the reference pitch.
      var m = midi;
      while (m < 55) {
        m += 12;
      }
      while (m > 79) {
        m -= 12;
      }
      final speed = pow(2.0, (m - NoteMapping.solfegeRefMidi) / 12.0).toDouble();
      final handle = await _soloud.play(src, volume: velocity, paused: true);
      if (speed != 1.0) _soloud.setRelativePlaySpeed(handle, speed);
      _soloud.setPause(handle, false);
      _solfegeHandles.add(handle);
      if (_solfegeHandles.length > 8) {
        final old = _solfegeHandles.removeAt(0); // free the oldest voice
        try {
          _soloud.stop(old);
        } catch (_) {}
      }
    } catch (_) {
      // Voice pack not installed — silent (piano carries the pitch).
    }
  }

  /// Load the first asset path that exists (.ogg preferred, .wav fallback).
  Future<AudioSource?> _loadFirst(List<String> paths) async {
    for (final p in paths) {
      try {
        return await _soloud.loadAsset(p);
      } catch (_) {}
    }
    return null;
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
