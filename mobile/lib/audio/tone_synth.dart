import 'dart:math';
import 'dart:typed_data';

/// Built-in piano tone — a faithful reconstruction of the **LuminaKeys** web
/// prototype's `playNote`, rendered once per note to a WAV (PCM16, mono) and
/// cached by the engine. A real sample pack (`assets/piano_samples/`) overrides
/// it when present.
///
/// Recipe (matches the Web Audio version): a **band-limited triangle**
/// fundamental (gain 0.5) + **sine** partials at 2·3·4·6 (gains .18/.09/.05/.02),
/// with the same envelope (attack→0.38 in 9 ms, decay τ≈0.22 s toward 0.12,
/// release from 0.4·dur, τ≈0.5·dur) and a tiny end-fade.
///
/// Two fixes vs. a naive port: (1) the triangle is **band-limited** — only
/// harmonics below Nyquist are summed, so high notes (C5+) don't *alias* into
/// harsh tones; (2) **fixed gains, no per-note normalization**, so high notes
/// (which have fewer harmonics) stay naturally softer instead of piercing.
Uint8List synthPianoWav(int midi, {int sampleRate = 44100, double seconds = 2.2}) {
  final freq = 440.0 * pow(2.0, (midi - 69) / 12.0);
  final n = (sampleRate * seconds).round();
  final nyq = sampleRate * 0.5 * 0.92; // band-limit headroom
  const twoPi = 2 * pi;

  // Harmonic amplitudes: a band-limited triangle (Fourier series, gain 0.5)
  // plus the web's extra sine partials at 2·3·4·6.
  final amp = <int, double>{};
  const triCoef = 8.0 / (pi * pi);
  for (var k = 1; freq * k < nyq; k += 2) {
    final sign = (((k - 1) ~/ 2) % 2 == 0) ? 1.0 : -1.0;
    amp[k] = (amp[k] ?? 0) + 0.5 * triCoef * sign / (k * k);
  }
  const extra = [[2, 0.18], [3, 0.09], [4, 0.05], [6, 0.02]];
  for (final e in extra) {
    final k = (e[0] as int);
    if (freq * k < nyq) amp[k] = (amp[k] ?? 0) + (e[1] as double);
  }
  final ks = amp.keys.toList();

  const dur = 1.8; // web playNote default
  const attackTime = 0.009;
  const attackPeak = 0.38;
  const decayTarget = 0.12;
  const decayTau = 0.22;
  const relStart = dur * 0.4; // 0.72 s
  const relTau = dur * 0.5; // 0.90 s

  double decayVal(double t) =>
      decayTarget + (attackPeak - decayTarget) * exp(-(t - attackTime) / decayTau);
  final gRel = decayVal(relStart);

  double env(double t) {
    if (t < attackTime) return attackPeak * (t / attackTime);
    if (t < relStart) return decayVal(t);
    return gRel * exp(-(t - relStart) / relTau);
  }

  final fadeStart = seconds - 0.02; // 20 ms anti-click tail
  const master = 2.6; // fixed output gain (matches the web's balance)
  final samples = Int16List(n);
  for (var i = 0; i < n; i++) {
    final t = i / sampleRate;
    final ph = twoPi * freq * t;
    var s = 0.0;
    for (final k in ks) {
      s += amp[k]! * sin(ph * k);
    }
    s *= env(t) * master;
    if (t > fadeStart) s *= (seconds - t) / 0.02;
    if (s > 1) s = 1;
    if (s < -1) s = -1;
    samples[i] = (s * 32767).round();
  }
  return _wrapWav(samples, sampleRate);
}

/// UI sound effect — a short sequence of decaying blips (port of the web
/// prototype's `sfx.js`): correct/wrong/level-up/streak chimes.
Uint8List synthSfxWav(
  List<double> freqs, {
  int totalMs = 200,
  String wave = 'triangle',
  double peak = 0.13,
  int sampleRate = 44100,
}) {
  final stepSec = (totalMs / freqs.length) / 1000.0;
  final totalSec = stepSec * freqs.length + 0.05;
  final n = (sampleRate * totalSec).round();
  final samples = Int16List(n);
  for (var fi = 0; fi < freqs.length; fi++) {
    final f = freqs[fi];
    final start = fi * stepSec;
    final dur = stepSec * 0.95;
    final tau = dur / 7.0; // exp decay → near-silent by the end of the blip
    final s0 = (start * sampleRate).floor();
    final s1 = ((start + dur) * sampleRate).ceil().clamp(0, n);
    for (var i = s0; i < s1; i++) {
      final tg = i / sampleRate - start;
      final g = tg < 0.005 ? peak * (tg / 0.005) : peak * exp(-(tg - 0.005) / tau);
      final tAbs = i / sampleRate;
      double s;
      switch (wave) {
        case 'sine':
          s = sin(2 * pi * f * tAbs);
        case 'sawtooth':
          final x = f * tAbs;
          s = 2 * (x - (x + 0.5).floorToDouble());
        default: // triangle
          s = (2 / pi) * asin(sin(2 * pi * f * tAbs));
      }
      var v = s * g;
      if (v > 1) v = 1;
      if (v < -1) v = -1;
      samples[i] = (v * 32767).round();
    }
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
