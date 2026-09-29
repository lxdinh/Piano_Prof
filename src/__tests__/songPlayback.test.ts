// The song player's maths, separated from the screen so it can be pinned
// exactly: which keys the keyboard shows, where each key is (this MUST equal
// Piano.tsx's geometry or the falling bars miss the keys), which notes sound /
// start in a frame, what the LED strip is told, the metronome grid, and the
// bar geometry in the lane.
import {
  keyboardRange, keyLayout, soundingAt, startedBetween, ledEntriesFor, beatInfo, fallingRects,
  KEY_GAP, BLACK_KEY_RATIO, MIN_NOTE_HEIGHT, MAX_WHITE_KEYS,
} from '../omr/songPlayback';
import type { NoteEvent, SongScore } from '../omr/musicxmlScore';
import { handColor } from '../theme/handColors';
import { midiToNote, isBlackKey } from '../lesson1/data';

function score(minMidi: number, maxMidi: number): SongScore {
  return { events: [], durationSec: 0, tempoBpm: 100, minMidi, maxMidi, measureCount: 0, fifths: 0, beatsPerMeasure: 4 };
}

function ev(midi: number, start: number, duration: number, staff = 1, note = midiToNote(midi)): NoteEvent {
  return { midi, note, start, duration, staff, measure: 0, startBeats: 0, durBeats: 0 };
}

function whites(low: number, high: number): number {
  let n = 0;
  for (let m = low; m <= high; m++) if (!isBlackKey(m)) n++;
  return n;
}

describe('keyboardRange', () => {
  it('rounds the song range down to a C and up to a B', () => {
    // D4..G5 → C4..B5 (already two octaves)
    expect(keyboardRange(score(62, 79))).toEqual({ low: 60, high: 83 });
  });

  it('always shows at least two octaves, growing upward first', () => {
    // E4..G4 is inside one octave: C4..B4 → widened to C4..B5
    expect(keyboardRange(score(64, 67))).toEqual({ low: 60, high: 83 });
  });

  it('grows downward when there is no room above', () => {
    // E6..F#6 → C6..B6, and B6 is the top of the strip, so the second octave goes below
    expect(keyboardRange(score(88, 90))).toEqual({ low: 72, high: 95 });
  });

  it('never goes below C2 (36) or above C7 (96)', () => {
    const low = keyboardRange(score(20, 30));
    expect(low.low).toBe(36);
    expect(low.high - low.low + 1).toBeGreaterThanOrEqual(24);
    expect(low.high % 12).toBe(11);

    const high = keyboardRange(score(100, 108));
    expect(high.high).toBe(96);
    expect(high.low % 12).toBe(0);
    expect(high.high - high.low + 1).toBeGreaterThanOrEqual(24);
  });

  it('trims a full-keyboard song to 35 white keys by dropping the lone C7', () => {
    const r = keyboardRange(score(36, 96));
    expect(r).toEqual({ low: 36, high: 95 });
    expect(whites(r.low, r.high)).toBe(MAX_WHITE_KEYS);
  });

  it('trims whole octaves from the side farther from the song centre', () => {
    // E2..B6 on a 21-white-key (3-octave) budget: centre 67.5 → first the
    // bottom octave goes (36 is farther), then the top one.
    const r = keyboardRange(score(40, 95), 21);
    expect(r).toEqual({ low: 48, high: 83 });
    expect(whites(r.low, r.high)).toBe(21);
  });

  it('handles an empty score (minMidi = maxMidi = 60)', () => {
    expect(keyboardRange(score(60, 60))).toEqual({ low: 60, high: 83 });
  });
});

describe('keyLayout (must equal Piano.tsx geometry)', () => {
  // Piano.tsx: KEY_GAP = 2, kw = (width − (n−1)·gap) / n, blackW = kw·0.62,
  // boundaryCenter(i) = (i+1)(kw+gap) − gap/2, black.left = center − blackW/2.
  // Width 292 for C4..B4 (7 whites) gives kw = (292 − 12) / 7 = 40 exactly.
  const W = 7 * 40 + 6 * KEY_GAP; // 292
  const layout = keyLayout(60, 71, W);

  it('uses Piano.tsx constants', () => {
    expect(KEY_GAP).toBe(2);
    expect(BLACK_KEY_RATIO).toBe(0.62);
  });

  it('white keys share the width minus gaps: x = i·(kw+gap), w = kw', () => {
    const whiteMidis = [60, 62, 64, 65, 67, 69, 71];
    whiteMidis.forEach((m, i) => {
      const k = layout.get(m)!;
      expect(k.black).toBe(false);
      expect(k.w).toBeCloseTo(40, 6);
      expect(k.x).toBeCloseTo(i * 42, 6);
    });
    // the last white key ends flush with the key area
    const b4 = layout.get(71)!;
    expect(b4.x + b4.w).toBeCloseTo(W, 6);
  });

  it('black keys are 0.62·kw wide and centred on the boundary as Piano.tsx places them', () => {
    const blackW = 40 * 0.62; // 24.8
    // leftWhite index → centre = (leftWhite+1)·42 − 1
    const expected: [number, number][] = [
      [61, 0], // C#4 sits on the C|D boundary
      [63, 1], // D#4
      [66, 3], // F#4 (leftWhite = F4 = index 3)
      [68, 4], // G#4
      [70, 5], // A#4
    ];
    for (const [midi, leftWhite] of expected) {
      const k = layout.get(midi)!;
      const centre = (leftWhite + 1) * 42 - 1;
      expect(k.black).toBe(true);
      expect(k.w).toBeCloseTo(blackW, 6);
      expect(k.x).toBeCloseTo(centre - blackW / 2, 6);
    }
    expect(layout.get(61)!.x).toBeCloseTo(28.6, 6);
    expect(layout.get(70)!.x).toBeCloseTo(238.6, 6);
  });

  it('covers every key in the range and nothing else', () => {
    expect(layout.size).toBe(12);
    expect(layout.has(59)).toBe(false);
    expect(layout.has(72)).toBe(false);
  });

  it('honours a custom gap and degrades to empty on a zero width', () => {
    const noGap = keyLayout(60, 71, 280, 0);
    expect(noGap.get(60)!.w).toBeCloseTo(40, 6);
    expect(noGap.get(71)!.x).toBeCloseTo(240, 6);
    expect(keyLayout(60, 71, 0).size).toBe(0);
  });
});

describe('soundingAt / startedBetween', () => {
  const a = ev(60, 1, 0.5);
  const b = ev(64, 1.5, 0.5);
  const c = ev(67, 2, 1);
  const events = [a, b, c];

  it('soundingAt is start-inclusive and end-exclusive', () => {
    expect(soundingAt(events, 0.999)).toEqual([]);
    expect(soundingAt(events, 1)).toEqual([a]);
    expect(soundingAt(events, 1.25)).toEqual([a]);
    expect(soundingAt(events, 1.5)).toEqual([b]); // a ended exactly here
    expect(soundingAt(events, 2.5)).toEqual([c]);
    expect(soundingAt(events, 3)).toEqual([]);
  });

  it('startedBetween covers [t0, t1)', () => {
    expect(startedBetween(events, 1, 1.5)).toEqual([a]);
    expect(startedBetween(events, 1.5, 2)).toEqual([b]);
    expect(startedBetween(events, 2, 2.5)).toEqual([c]);
    expect(startedBetween(events, 0, 3)).toEqual([a, b, c]);
    expect(startedBetween(events, 1, 1)).toEqual([]);
    expect(startedBetween(events, 2, 1)).toEqual([]);
  });

  it('consecutive frames trigger each note exactly once', () => {
    const notes = [0, 0.4, 0.8, 1.2, 1.6].map((s, i) => ev(60 + i, s, 0.3));
    const frames = [0, 0.4, 0.8, 1.2, 1.6, 2.0];
    const fired: number[] = [];
    for (let i = 1; i < frames.length; i++) {
      fired.push(...startedBetween(notes, frames[i - 1], frames[i]).map((e) => e.midi));
    }
    expect(fired).toEqual([60, 61, 62, 63, 64]);
  });
});

describe('ledEntriesFor', () => {
  it('lights the right hand warm and the left hand cool', () => {
    const [rr, rg, rb] = handColor('R');
    const [lr, lg, lb] = handColor('L');
    expect(ledEntriesFor([ev(60, 0, 1, 1), ev(48, 0, 1, 2)])).toEqual([
      { note: 'C4', r: rr, g: rg, b: rb },
      { note: 'C3', r: lr, g: lg, b: lb },
    ]);
  });

  it('names notes with sharps only, whatever the score spelled', () => {
    const entries = ledEntriesFor([ev(61, 0, 1, 1, 'Db4'), ev(70, 0, 1, 2, 'Bb4')]);
    expect(entries.map((e) => e.note)).toEqual(['C#4', 'A#4']);
  });

  it('skips notes with no LED (C7 = 96 and anything below C2)', () => {
    const entries = ledEntriesFor([ev(96, 0, 1), ev(35, 0, 1), ev(95, 0, 1)]);
    expect(entries.map((e) => e.note)).toEqual(['B6']);
  });
});

describe('beatInfo', () => {
  it('counts beats from the tempo and accents beat 0 of every bar', () => {
    // 120 BPM → 0.5 s per beat, 4/4
    expect(beatInfo(0, 120, 4)).toEqual({ beat: 0, accent: true });
    expect(beatInfo(0.5, 120, 4)).toEqual({ beat: 1, accent: false });
    expect(beatInfo(1.99, 120, 4)).toEqual({ beat: 3, accent: false });
    expect(beatInfo(2, 120, 4)).toEqual({ beat: 4, accent: true });
    expect(beatInfo(4, 120, 4)).toEqual({ beat: 8, accent: true });
  });

  it('follows the time signature', () => {
    expect(beatInfo(1.5, 120, 3)).toEqual({ beat: 3, accent: true });
    expect(beatInfo(2, 120, 3)).toEqual({ beat: 4, accent: false });
  });

  it('is not fooled by floating point on a beat boundary', () => {
    // 600 BPM → 0.1 s per beat; 0.3 / 0.1 is 2.9999999999999996 in IEEE 754
    expect(beatInfo(0.3, 600, 4).beat).toBe(3);
  });

  it('never returns a negative beat and survives a nonsense tempo', () => {
    expect(beatInfo(-1, 120, 4).beat).toBe(0);
    expect(beatInfo(0, 0, 4)).toEqual({ beat: 0, accent: true });
  });
});

describe('fallingRects', () => {
  const layout = keyLayout(60, 71, 292);
  const LANE = 200;
  const PPS = 100;

  it("a bar's bottom edge sits on the key line at its start time", () => {
    const [r] = fallingRects([ev(60, 2, 1)], 2, layout, LANE, PPS);
    expect(r.y + r.h).toBeCloseTo(LANE, 6);
    expect(r.h).toBeCloseTo(100, 6); // 1 s × 100 px/s
    expect(r.y).toBeCloseTo(LANE - 100, 6);
    expect(r.sounding).toBe(true);
    expect(r.x).toBeCloseTo(layout.get(60)!.x, 6);
    expect(r.w).toBeCloseTo(layout.get(60)!.w, 6);
  });

  it('falls toward the key line as time advances', () => {
    const before = fallingRects([ev(60, 2, 1)], 1, layout, LANE, PPS)[0];
    expect(before.y + before.h).toBeCloseTo(LANE - 100, 6);
    expect(before.sounding).toBe(false);
    const mid = fallingRects([ev(60, 2, 1)], 2.5, layout, LANE, PPS)[0];
    expect(mid.y + mid.h).toBeCloseTo(LANE + 50, 6); // half of it has passed the line
    expect(mid.sounding).toBe(true);
  });

  it('omits bars fully above the lane or already past the key line', () => {
    const e = [ev(60, 2, 1)];
    expect(fallingRects(e, -1, layout, LANE, PPS)).toEqual([]); // bottom at −100
    expect(fallingRects(e, 0, layout, LANE, PPS)).toEqual([]); // bottom exactly at 0
    expect(fallingRects(e, 0.5, layout, LANE, PPS)).toHaveLength(1); // peeking in from the top
    expect(fallingRects(e, 3, layout, LANE, PPS)).toEqual([]); // ended: top at the key line
  });

  it('keeps very short notes at least MIN_NOTE_HEIGHT tall, bottom still on the onset', () => {
    const [r] = fallingRects([ev(60, 1, 0.01)], 1, layout, LANE, PPS);
    expect(r.h).toBe(MIN_NOTE_HEIGHT);
    expect(r.y + r.h).toBeCloseTo(LANE, 6);
  });

  it('carries staff and event index, and skips notes with no key on screen', () => {
    const rects = fallingRects([ev(30, 1, 1, 2), ev(64, 1, 1, 2)], 1, layout, LANE, PPS);
    expect(rects).toHaveLength(1);
    expect(rects[0]).toMatchObject({ midi: 64, staff: 2, index: 1 });
  });

  it('draws nothing without a lane', () => {
    expect(fallingRects([ev(60, 0, 1)], 0, layout, 0, PPS)).toEqual([]);
    expect(fallingRects([ev(60, 0, 1)], 0, layout, LANE, 0)).toEqual([]);
  });
});
