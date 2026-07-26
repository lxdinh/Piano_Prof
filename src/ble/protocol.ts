// Piano Professor — BLE binary command encoder
// Every function returns a Uint8Array ready for BLE write-without-response.
//
// The firmware (firmware/controller/src/main.cpp) supports exactly four
// op-codes: SET_LED, SET_MANY, CLEAR_ALL, SET_BRIGHTNESS. It renders on every
// write, so COMMIT is unnecessary, and it has no animation or calibration
// modes. Encoders for those return an EMPTY array — `writeToLed` skips empty
// payloads, so these are safe no-ops that keep existing call-sites working.

import { CMD, CAL_STEPS } from './constants';

type RGB = [number, number, number];

/** A no-op payload: callers may still send it, the transport drops it. */
const NOOP = new Uint8Array(0);

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function idx(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

// ── Single LED ─────────────────────────────────────────────────
export function cmdSetSingle(index: number, r: number, g: number, b: number): Uint8Array {
  return new Uint8Array([CMD.SET_LED, idx(index), clamp(r), clamp(g), clamp(b)]);
}

// ── Sparse key highlight ───────────────────────────────────────
// Used by the lesson engine to light the exact keys for the current chord.
// Keep frames inside the negotiated MTU (~45 LEDs at MTU 185, 4 at the 23-byte
// default) — useBLE requests a larger MTU on connect.
export function cmdSetMulti(entries: Array<{ index: number; rgb: RGB }>): Uint8Array {
  if (entries.length === 0) return NOOP;
  const payload = [CMD.SET_MANY, entries.length & 0xff];
  for (const { index, rgb } of entries) {
    payload.push(idx(index), clamp(rgb[0]), clamp(rgb[1]), clamp(rgb[2]));
  }
  return new Uint8Array(payload);
}

// ── Contiguous range, one color ────────────────────────────────
// The firmware has no SET_RANGE, so expand it into a SET_MANY frame.
export function cmdSetRange(
  start: number,
  end: number,
  r: number,
  g: number,
  b: number,
): Uint8Array {
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  const entries: Array<{ index: number; rgb: RGB }> = [];
  for (let i = lo; i <= hi; i++) entries.push({ index: i, rgb: [r, g, b] });
  return cmdSetMulti(entries);
}

// ── Clear all ──────────────────────────────────────────────────
export function cmdClearAll(): Uint8Array {
  return new Uint8Array([CMD.CLEAR_ALL]);
}

// ── Brightness ─────────────────────────────────────────────────
export function cmdSetBrightness(level: number): Uint8Array {
  return new Uint8Array([CMD.SET_BRIGHTNESS, clamp(level)]);
}

// ── Commit — not needed; firmware draws on every write ─────────
export function cmdCommit(): Uint8Array {
  return NOOP;
}

// ── Patterns — unsupported by the firmware (stubbed) ───────────
// TODO: implement RUN_PATTERN in firmware, or drive animations from the app
// by streaming SET_MANY frames on a timer.
export function cmdRainbow(_speedMs = 30): Uint8Array {
  return NOOP;
}

export function cmdBreathing(_r: number, _g: number, _b: number, _speedMs = 20): Uint8Array {
  return NOOP;
}

/** Solid color across the strip. Needs ledCount since firmware has no fill. */
export function cmdStatic(r: number, g: number, b: number, ledCount = 0): Uint8Array {
  if (ledCount <= 0) return NOOP;
  return cmdSetRange(0, ledCount - 1, r, g, b);
}

export function cmdSuccessBurst(): Uint8Array {
  return NOOP;
}

// ── Calibration control — firmware has no calibration mode ─────
// Key presses stream continuously on the note-event characteristic, so the app
// drives calibration entirely on its own.
export function cmdEnterCalibration(): Uint8Array {
  return NOOP;
}

export function cmdExitCalibration(): Uint8Array {
  return NOOP;
}

// ── Calibration target positions ───────────────────────────────
// The LED indices lit during each calibration step, evenly spaced across the
// strip. Shared by the highlight encoder and the anchor-building logic so both
// agree on which LED corresponds to which step.
export function calibrationPositions(ledCount: number): number[] {
  const n = Math.max(1, ledCount);
  if (CAL_STEPS === 1) return [0];
  return Array.from({ length: CAL_STEPS }, (_, i) =>
    Math.round((i * (n - 1)) / (CAL_STEPS - 1)),
  );
}

// ── Convenience: highlight one calibration target ──────────────
// Lights the LED for `step` green. Send cmdClearAll() first.
export function cmdCalibrationHighlight(ledCount: number, step = 0): Uint8Array {
  const positions = calibrationPositions(ledCount);
  const index = positions[Math.max(0, Math.min(positions.length - 1, step))];
  return cmdSetSingle(index, 0x58, 0xcc, 0x02);
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
