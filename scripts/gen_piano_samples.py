#!/usr/bin/env python3
"""
Generate the Piano Professor sample set: one warm, smooth WAV per semitone
from C2 (MIDI 36) up to C7 (MIDI 96).

Why regenerate instead of pitch-shifting:
- The keyboard now spans C2..B6. The old set stopped at C6, so the top keys
  had no correct sample (they clamped an octave down = wrong pitch / silence).
- Real pianos have MANY partials low down but FEW, quiet partials up high.
  That sparseness is what makes high notes sweet instead of "tinny"/harsh.
  So here partial count + brightness FALL as pitch rises, and the top octave
  gets a gentle level taper — the "smooth & lovely after C5" the user asked for.

Timbre is tuned to match the existing mid-register samples (measured C4 had a
~1/k^1.4 partial rolloff, ~20 ms soft attack, ~1.6 s exponential decay) so the
low/mid notes sound the same as before; only the highs are made mellower.

Format matches the originals exactly: mono, 16-bit, 22050 Hz, 1.6 s.
"""
import os
import math
import wave
import numpy as np

SR = 22050
DUR = 1.6
N = int(SR * DUR)
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'audio', 'piano')

NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
MIN_MIDI = 36   # C2
MAX_MIDI = 96   # C7  (keyboard tops out at B6 = 95; C7 gives headroom)
TARGET_PEAK = 0.33  # matches the original samples' peak level


def midi_to_freq(m):
    return 440.0 * (2 ** ((m - 69) / 12.0))


def midi_to_name(m):
    return f"{NOTE_NAMES[m % 12]}{m // 12 - 1}"


def partial_count(midi):
    """Fewer partials up high — the key to a smooth, non-harsh top end."""
    if midi <= 48:   return 14   # C2..B2 rich
    if midi <= 60:   return 12   # C3..B3
    if midi <= 72:   return 9    # C4..B4
    if midi <= 79:   return 6    # C5..G5
    if midi <= 84:   return 4    # Ab5..C6 mellow
    return 3                     # above C6 — soft & bell-like


def brightness(midi):
    """Extra per-partial roll-off that grows with pitch (0..1, higher=darker)."""
    if midi <= 60:   return 1.00
    if midi <= 72:   return 0.92
    if midi <= 79:   return 0.82
    if midi <= 84:   return 0.70
    return 0.58


def level(midi):
    """Gentle volume taper so notes above C5 stay soft and lovely."""
    if midi <= 72:   return 1.00          # up to C5 full
    return max(0.62, 1.00 - (midi - 72) * 0.012)


def render(midi):
    f0 = midi_to_freq(midi)
    t = np.arange(N) / SR
    npart = partial_count(midi)
    bright = brightness(midi)
    B = 0.0004 + max(0, midi - 60) * 0.00002   # slight inharmonicity, more up high

    sig = np.zeros(N)
    # Two layers detuned a few cents -> gentle chorus warmth (no harsh beating).
    for cents, w in [(-2.5, 0.5), (0.0, 1.0), (2.5, 0.5)]:
        fl = f0 * (2 ** (cents / 1200.0))
        for k in range(1, npart + 1):
            fk = k * fl * math.sqrt(1 + B * k * k)   # inharmonic stretch
            if fk > SR * 0.45:
                break
            amp = (1.0 / (k ** 1.4)) * (bright ** (k - 1))  # matches measured C4
            sig += w * amp * np.sin(2 * math.pi * fk * t)

    # Amplitude envelope: ~20 ms raised-cosine attack (no click) + exp decay,
    # decay tuned to the original ~1.6 s tail. Click-free fade at the very end.
    env = np.exp(-t / (DUR * 0.42))
    a = int(0.020 * SR)
    env[:a] *= 0.5 - 0.5 * np.cos(np.linspace(0, math.pi, a))
    f = int(0.030 * SR)
    env[-f:] *= np.linspace(1, 0, f)
    sig *= env

    # One-pole low-pass to soften the very top; cutoff capped so highs stay sweet.
    cutoff = min(8000.0, max(2200.0, f0 * 6))
    alpha = (1.0 / SR) / (1.0 / (2 * math.pi * cutoff) + 1.0 / SR)
    # vectorised one-pole via lfilter-style recurrence
    y = np.empty_like(sig)
    acc = 0.0
    for i in range(N):
        acc += alpha * (sig[i] - acc)
        y[i] = acc
    sig = y

    peak = np.max(np.abs(sig)) or 1.0
    sig = sig / peak * TARGET_PEAK * level(midi)
    return sig


def write_wav(path, sig):
    pcm = (np.clip(sig, -1, 1) * 32767).astype('<i2').tobytes()
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm)


def main():
    os.makedirs(OUT, exist_ok=True)
    for midi in range(MIN_MIDI, MAX_MIDI + 1):
        name = midi_to_name(midi)
        write_wav(os.path.join(OUT, f"{name}.wav"), render(midi))
    print(f"wrote {MAX_MIDI - MIN_MIDI + 1} samples to {os.path.normpath(OUT)} "
          f"({midi_to_name(MIN_MIDI)}..{midi_to_name(MAX_MIDI)})")


if __name__ == '__main__':
    main()
