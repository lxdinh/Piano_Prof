import 'dart:math';
import 'dart:typed_data';

/// Generates a short piano-ish tone for a MIDI note as a complete WAV (PCM16,
/// mono) byte buffer. This is the **no-asset baseline** so the app is never
/// silent; a real `.sf2`/sample pack can replace it later for full fidelity.
///
/// Tone = a few decaying harmonics + a fast attack and exponential decay
/// envelope (a soft electric-piano/bell character).
Uint8List synthPianoWav(int midi, {int sampleRate = 44100, double seconds = 2.4}) {
  final freq = 440.0 * pow(2.0, (midi - 69) / 12.0);
  final n = (sampleRate * seconds).round();
  final samples = Int16List(n);

  // Relative amplitudes of harmonics 1..6 (strong fundamental, softer overtones).
  const harmonics = [1.0, 0.55, 0.33, 0.18, 0.10, 0.05];
  final twoPiF = 2 * pi * freq;
  const decay = 4.5; // exponential decay rate (per second)
  final attack = (sampleRate * 0.006).round(); // ~6 ms attack to avoid a click

  for (var i = 0; i < n; i++) {
    final t = i / sampleRate;
    var s = 0.0;
    for (var h = 0; h < harmonics.length; h++) {
      s += harmonics[h] * sin(twoPiF * (h + 1) * t);
    }
    var env = exp(-decay * t);
    if (i < attack) env *= i / attack;
    var v = s * env * 0.22; // headroom so summed harmonics don't clip
    if (v > 1) v = 1;
    if (v < -1) v = -1;
    samples[i] = (v * 32767).round();
  }
  return _wrapWav(samples, sampleRate);
}

Uint8List _wrapWav(Int16List samples, int sampleRate) {
  final data = samples.buffer.asUint8List(); // little-endian on Android/x86
  final b = BytesBuilder();
  void str(String s) => b.add(s.codeUnits);
  void u32(int v) => b.add([v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff]);
  void u16(int v) => b.add([v & 0xff, (v >> 8) & 0xff]);

  str('RIFF');
  u32(36 + data.length);
  str('WAVE');
  str('fmt ');
  u32(16); // PCM fmt chunk size
  u16(1); // audio format = PCM
  u16(1); // channels = mono
  u32(sampleRate);
  u32(sampleRate * 2); // byte rate (mono, 16-bit)
  u16(2); // block align
  u16(16); // bits per sample
  str('data');
  u32(data.length);
  b.add(data);
  return b.toBytes();
}
