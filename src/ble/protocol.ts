// Piano Professor — BLE binary command encoder
// Every function returns a Uint8Array ready for BLE write-without-response.

import { CMD, PATTERN } from './constants';

type RGB = [number, number, number];

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

// ── Single LED ─────────────────────────────────────────────────
export function cmdSetSingle(index: number, r: number, g: number, b: number): Uint8Array {
  return new Uint8Array([CMD.SET_SINGLE, index, clamp(r), clamp(g), clamp(b)]);
}

// ── Contiguous range, one color ────────────────────────────────
export function cmdSetRange(
  start: number,
  end: number,
  r: number,
  g: number,
  b: number,
): Uint8Array {
  return new Uint8Array([CMD.SET_RANGE, start, end, clamp(r), clamp(g), clamp(b)]);
}

// ── Sparse key highlight (up to 20 LEDs per packet, ~MTU safe) ─
// Used by the lesson engine to light the exact keys for the current chord.
export function cmdSetMulti(entries: Array<{ index: number; rgb: RGB }>): Uint8Array {
  const payload = [CMD.SET_MULTI, entries.length];
  for (const { index, rgb } of entries) {
    payload.push(index, clamp(rgb[0]), clamp(rgb[1]), clamp(rgb[2]));
  }
  return new Uint8Array(payload);
}

// ── Clear all ──────────────────────────────────────────────────
export function cmdClearAll(): Uint8Array {
  return new Uint8Array([CMD.CLEAR_ALL]);
}

// ── Commit (flush framebuffer → strip) ─────────────────────────
// Must be sent after any set commands for them to appear on hardware.
export function cmdCommit(): Uint8Array {
  return new Uint8Array([CMD.COMMIT]);
}

// ── Patterns ──────────────────────────────────────────────────
export function cmdRainbow(speedMs = 30): Uint8Array {
  return new Uint8Array([CMD.RUN_PATTERN, PATTERN.RAINBOW, speedMs]);
}

export function cmdBreathing(r: number, g: number, b: number, speedMs = 20): Uint8Array {
  return new Uint8Array([CMD.RUN_PATTERN, PATTERN.BREATHING, speedMs, clamp(r), clamp(g), clamp(b)]);
}

export function cmdStatic(r: number, g: number, b: number): Uint8Array {
  return new Uint8Array([CMD.RUN_PATTERN, PATTERN.STATIC, 0, clamp(r), clamp(g), clamp(b)]);
}

export function cmdSuccessBurst(): Uint8Array {
  return new Uint8Array([CMD.RUN_PATTERN, PATTERN.SUCCESS_BURST, 40]);
}

// ── Calibration control ─────────────────────────────────────────
export function cmdEnterCalibration(): Uint8Array {
  return new Uint8Array([CMD.ENTER_CAL]);
}

export function cmdExitCalibration(): Uint8Array {
  return new Uint8Array([CMD.EXIT_CAL]);
}

// ── Convenience: highlight calibration targets on the strip ─────
// Lights LEDs at evenly-spaced positions so user can see which physical
// keys map to the 3 calibration points. ledCount comes from BLE_CHAR_LED_COUNT.
export function cmdCalibrationHighlight(ledCount: number): Uint8Array {
  const positions = [0, Math.floor(ledCount / 2), ledCount - 1];
  const entries = positions.map((index) => ({ index, rgb: [0x58, 0xCC, 0x02] as RGB }));
  const clear = [CMD.CLEAR_ALL];
  const multi = [CMD.SET_MULTI, entries.length];
  for (const { index, rgb } of entries) {
    multi.push(index, rgb[0], rgb[1], rgb[2]);
  }
  // Combine clear + multi into one packet so firmware sees both before commit
  return new Uint8Array([...clear, ...multi]);
}

// ── Lesson helper: map MIDI note → LED index using calibration map ─
// calMap is an array of {midiNote, ledIndex} for the 3 anchor points.
// We interpolate linearly between anchors.
export type CalibrationAnchor = { midiNote: number; ledIndex: number };

export function midiNoteToLedIndex(
  midiNote: number,
  anchors: CalibrationAnchor[],
): number | null {
  if (anchors.length < 2) return null;
  const sorted = [...anchors].sort((a, b) => a.midiNote - b.midiNote);

  // Clamp to range
  if (midiNote <= sorted[0].midiNote) return sorted[0].ledIndex;
  if (midiNote >= sorted[sorted.length - 1].midiNote) return sorted[sorted.length - 1].ledIndex;

  for (let i = 0; i < sorted.length - 1; i++) {
    const lo = sorted[i];
    const hi = sorted[i + 1];
    if (midiNote >= lo.midiNote && midiNote <= hi.midiNote) {
      const t = (midiNote - lo.midiNote) / (hi.midiNote - lo.midiNote);
      return Math.round(lo.ledIndex + t * (hi.ledIndex - lo.ledIndex));
    }
  }
  return null;
}
