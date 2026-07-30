// Piano Professor — where the strip actually sits over the keyboard.
//
// The firmware streams MIDI notes but has no idea where the LED strip is
// physically mounted, so the app has always assumed `ledIndex = midi − 36`:
// LED 0 sits exactly over C2 and there is exactly one LED per semitone. Mount
// the strip an inch to the right, or run a strip with a different LED pitch,
// and every note lights the wrong key with no way to correct it.
//
// Calibration runs the opposite way round from the old design. Rather than ask
// the firmware where it is, the app lights ONE LED and the learner presses the
// key beneath it. Each press yields a {midiNote → ledIndex} anchor; two or more
// anchors pin down both the offset and the pitch of the strip, which is all the
// mapping needs.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { LED_LOW_MIDI, LED_HIGH_MIDI } from '../lesson1/data';
import { CalibrationAnchor, midiNoteToLedIndex } from './protocol';

const STORE_KEY = 'pp.calibration.v1';

export type { CalibrationAnchor };

/** The uncalibrated assumption: one LED per semitone, LED 0 over C2. */
export function defaultLedIndex(midi: number): number {
  return midi >= LED_LOW_MIDI && midi <= LED_HIGH_MIDI ? midi - LED_LOW_MIDI : -1;
}

/**
 * Physical LED index for a note, or -1 for "no LED covers this key".
 *
 * Fewer than two anchors cannot describe a line, so we fall back to the old
 * assumption — an uncalibrated install behaves exactly as it did before.
 *
 * Outside the calibrated span the answer is -1 rather than the nearest end.
 * `midiNoteToLedIndex` clamps, which is right for interpolation but wrong here:
 * clamping would pile every key beyond the strip onto its first or last LED,
 * lighting a bright end-dot for notes the strip does not physically cover.
 */
export function ledIndexFor(midi: number, anchors: CalibrationAnchor[]): number {
  if (anchors.length < 2) return defaultLedIndex(midi);

  const sorted = [...anchors].sort((a, b) => a.midiNote - b.midiNote);
  const lo = sorted[0];
  const hi = sorted[sorted.length - 1];
  if (midi < lo.midiNote || midi > hi.midiNote) return -1;

  return midiNoteToLedIndex(midi, sorted) ?? -1;
}

/** Which LED to light for calibration step `step`, given the strip length. */
export function targetLedIndex(step: number, ledCount: number, positions: readonly number[]): number {
  const pos = positions[Math.max(0, Math.min(step, positions.length - 1))];
  return Math.round(pos * Math.max(0, ledCount - 1));
}

/**
 * Anchors are only usable if they describe a strip running left-to-right: two
 * presses on the same key, or in the wrong order, would produce a divide-by-zero
 * or an inverted map. Rejecting them keeps a fumbled calibration from being
 * worse than none at all.
 */
export function anchorsUsable(anchors: CalibrationAnchor[]): boolean {
  if (anchors.length < 2) return false;
  const sorted = [...anchors].sort((a, b) => a.midiNote - b.midiNote);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].midiNote === sorted[i - 1].midiNote) return false;
    if (sorted[i].ledIndex <= sorted[i - 1].ledIndex) return false;
  }
  return true;
}

// ── Live state, read by the HAL on every frame ─────────────────
// Deliberately a module singleton rather than React state: `txFrame` runs at
// 25 fps inside the BLE backend and has no component to read a context from.

let anchors: CalibrationAnchor[] = [];

export function getAnchors(): CalibrationAnchor[] {
  return anchors;
}

export function isCalibrated(): boolean {
  return anchorsUsable(anchors);
}

/** Resolve a note to a physical LED with the anchors currently in force. */
export function currentLedIndex(midi: number): number {
  return ledIndexFor(midi, anchors);
}

export async function saveAnchors(next: CalibrationAnchor[]): Promise<void> {
  anchors = anchorsUsable(next) ? [...next].sort((a, b) => a.midiNote - b.midiNote) : [];
  try {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(anchors));
  } catch {
    /* a calibration that only lasts this session still beats none */
  }
}

export async function clearAnchors(): Promise<void> {
  anchors = [];
  try {
    await AsyncStorage.removeItem(STORE_KEY);
  } catch {
    /* ignore */
  }
}

/** Restore a previous calibration at launch. Safe to call more than once. */
export async function loadAnchors(): Promise<CalibrationAnchor[]> {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    anchors = Array.isArray(parsed) && anchorsUsable(parsed) ? parsed : [];
  } catch {
    anchors = [];
  }
  return anchors;
}

/** Test seam — set the in-memory anchors without touching storage. */
export function __setAnchorsForTest(next: CalibrationAnchor[]): void {
  anchors = next;
}
