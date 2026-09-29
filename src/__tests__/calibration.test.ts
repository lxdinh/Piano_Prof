// Calibration is the difference between "the strip lights up" and "the strip
// lights the RIGHT key", so these tests are mostly about the mapping being
// wrong in specific, physical ways: mounted off-centre, mounted with a
// different LED pitch, or not covering the whole keyboard.

import {
  anchorsUsable, clearAnchors, currentLedIndex, defaultLedIndex, getAnchors,
  isCalibrated, ledIndexFor, loadAnchors, saveAnchors, targetLedIndex,
  __setAnchorsForTest, CalibrationAnchor,
} from '../ble/calibration';
import { CAL_POSITIONS } from '../ble/constants';
import { LED_LOW_MIDI, LED_HIGH_MIDI, noteToLedIndex } from '../lesson1/data';

jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn(async (k: string) => store[k] ?? null),
    setItem: jest.fn(async (k: string, v: string) => { store[k] = v; }),
    removeItem: jest.fn(async (k: string) => { delete store[k]; }),
    __reset: () => { store = {}; },
  };
});

const anchors = (...pairs: [number, number][]): CalibrationAnchor[] =>
  pairs.map(([midiNote, ledIndex]) => ({ midiNote, ledIndex }));

beforeEach(async () => {
  __setAnchorsForTest([]);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('@react-native-async-storage/async-storage').__reset();
});

describe('uncalibrated behaviour is exactly what it always was', () => {
  it('falls back to midi − 36 with no anchors', () => {
    for (const midi of [36, 48, 60, 84, 95]) {
      expect(ledIndexFor(midi, [])).toBe(noteToLedIndex(midi));
    }
  });

  it('falls back with a single anchor — one point cannot describe a line', () => {
    expect(ledIndexFor(60, anchors([60, 10]))).toBe(defaultLedIndex(60));
  });

  it('still reports no LED beyond the strip', () => {
    expect(ledIndexFor(LED_HIGH_MIDI + 1, [])).toBe(-1);
    expect(ledIndexFor(LED_LOW_MIDI - 1, [])).toBe(-1);
  });
});

describe('a strip mounted off-centre', () => {
  // Strip shifted 5 LEDs right: the LED over C2 is index 5, not 0.
  const shifted = anchors([36, 5], [95, 64]);

  it('applies the offset', () => {
    expect(ledIndexFor(36, shifted)).toBe(5);
    expect(ledIndexFor(95, shifted)).toBe(64);
    expect(ledIndexFor(60, shifted)).toBe(29); // 24 semitones up, +5
  });

  it('is what the old hardcoded map got wrong', () => {
    expect(ledIndexFor(60, shifted)).not.toBe(defaultLedIndex(60));
  });
});

describe('a strip with a different LED pitch', () => {
  // 30 LEDs spanning 60 semitones — one LED per whole tone.
  const sparse = anchors([36, 0], [96, 30]);

  it('interpolates across the coarser spacing', () => {
    expect(ledIndexFor(36, sparse)).toBe(0);
    expect(ledIndexFor(66, sparse)).toBe(15);
    expect(ledIndexFor(96, sparse)).toBe(30);
  });

  it('never returns an index past the end of the strip', () => {
    for (let m = 36; m <= 96; m++) {
      const i = ledIndexFor(m, sparse);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThanOrEqual(30);
    }
  });
});

describe('keys the strip does not physically cover', () => {
  // A short strip over the middle of the keyboard only.
  const middle = anchors([48, 0], [72, 24]);

  it('reports no LED rather than clamping to the end', () => {
    // Clamping would light LED 0 for every key below the strip — a bright dot
    // stuck at one end whenever the learner plays low.
    expect(ledIndexFor(40, middle)).toBe(-1);
    expect(ledIndexFor(90, middle)).toBe(-1);
  });

  it('maps everything inside the span', () => {
    expect(ledIndexFor(48, middle)).toBe(0);
    expect(ledIndexFor(60, middle)).toBe(12);
    expect(ledIndexFor(72, middle)).toBe(24);
  });
});

describe('anchorsUsable — a fumbled calibration is worse than none', () => {
  it('accepts three ascending anchors', () => {
    expect(anchorsUsable(anchors([36, 0], [60, 30], [84, 59]))).toBe(true);
  });

  it('rejects the same key pressed twice', () => {
    expect(anchorsUsable(anchors([60, 0], [60, 30]))).toBe(false);
  });

  it('rejects a right-to-left run', () => {
    // Higher key, lower LED — the strip cannot run backwards.
    expect(anchorsUsable(anchors([36, 30], [60, 10]))).toBe(false);
  });

  it('rejects two dots landing on one LED', () => {
    expect(anchorsUsable(anchors([36, 7], [60, 7]))).toBe(false);
  });

  it('rejects fewer than two anchors', () => {
    expect(anchorsUsable([])).toBe(false);
    expect(anchorsUsable(anchors([60, 0]))).toBe(false);
  });
});

describe('targetLedIndex — which dot to light', () => {
  it('walks the strip end to end', () => {
    expect(targetLedIndex(0, 60, CAL_POSITIONS)).toBe(0);
    expect(targetLedIndex(1, 60, CAL_POSITIONS)).toBe(30);
    expect(targetLedIndex(2, 60, CAL_POSITIONS)).toBe(59);
  });

  it('adapts to a shorter strip', () => {
    expect(targetLedIndex(2, 30, CAL_POSITIONS)).toBe(29);
  });

  it('stays in range for degenerate strips', () => {
    expect(targetLedIndex(2, 1, CAL_POSITIONS)).toBe(0);
    expect(targetLedIndex(9, 60, CAL_POSITIONS)).toBe(59); // step past the end
  });
});

describe('persistence', () => {
  const good = anchors([36, 0], [60, 24], [84, 48]);

  it('round-trips a calibration', async () => {
    await saveAnchors(good);
    __setAnchorsForTest([]);
    expect(await loadAnchors()).toEqual(good);
    expect(isCalibrated()).toBe(true);
  });

  it('sorts on save so anchors captured out of order still work', async () => {
    await saveAnchors(anchors([84, 48], [36, 0], [60, 24]));
    expect(getAnchors().map((a) => a.midiNote)).toEqual([36, 60, 84]);
  });

  it('refuses to store an unusable calibration', async () => {
    await saveAnchors(anchors([60, 5], [60, 9]));
    expect(getAnchors()).toEqual([]);
    expect(isCalibrated()).toBe(false);
  });

  it('clears back to the default mapping', async () => {
    await saveAnchors(good);
    await clearAnchors();
    expect(isCalibrated()).toBe(false);
    expect(currentLedIndex(60)).toBe(defaultLedIndex(60));
  });

  it('survives corrupt stored data', async () => {
    const AS = require('@react-native-async-storage/async-storage');
    await AS.setItem('pp.calibration.v1', '{not json');
    expect(await loadAnchors()).toEqual([]);
    expect(currentLedIndex(60)).toBe(defaultLedIndex(60));
  });

  it('ignores stored anchors that no longer make sense', async () => {
    const AS = require('@react-native-async-storage/async-storage');
    await AS.setItem('pp.calibration.v1', JSON.stringify(anchors([60, 9], [36, 20])));
    expect(await loadAnchors()).toEqual([]);
  });
});

describe('currentLedIndex — what the HAL actually calls', () => {
  it('tracks whatever calibration is in force', () => {
    expect(currentLedIndex(60)).toBe(defaultLedIndex(60));
    __setAnchorsForTest(anchors([36, 5], [95, 64]));
    expect(currentLedIndex(60)).toBe(29);
  });
});
