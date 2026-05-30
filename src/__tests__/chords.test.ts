import {
  makeRoot, buildChord, QUALITIES_BY_ID, CHORD_TREE, ROOT_LETTERS,
} from '../music/chords';

const q = (id: string) => QUALITIES_BY_ID[id];

describe('chord roots', () => {
  it('computes pitch classes with accidentals', () => {
    expect(makeRoot('C').pc).toBe(0);
    expect(makeRoot('C', 'sharp').pc).toBe(1);
    expect(makeRoot('D', 'flat').pc).toBe(1);
    expect(makeRoot('B', 'sharp').pc).toBe(0); // wraps
    expect(makeRoot('C', 'flat').pc).toBe(11); // wraps
  });

  it('labels roots for display', () => {
    expect(makeRoot('F', 'sharp').label).toBe('F#');
    expect(makeRoot('B', 'flat').label).toBe('Bb');
    expect(makeRoot('G').label).toBe('G');
  });
});

describe('buildChord', () => {
  it('spells a C major triad', () => {
    const c = buildChord(makeRoot('C'), q('maj'));
    expect(c.name).toBe('C');
    expect(c.noteNames).toEqual(['C', 'E', 'G']);
    // intervals 0,4,7 from C3 (48)
    expect(c.midi).toEqual([48, 52, 55]);
  });

  it('spells a Cm7', () => {
    const c = buildChord(makeRoot('C'), q('m7'));
    expect(c.name).toBe('Cm7');
    expect(c.noteNames).toEqual(['C', 'Eb', 'G', 'Bb']);
  });

  it('uses flat spelling for flat roots', () => {
    const c = buildChord(makeRoot('B', 'flat'), q('maj'));
    expect(c.name).toBe('Bb');
    expect(c.noteNames).toEqual(['Bb', 'D', 'F']);
  });

  it('spells chords by scale degree, not raw chromatics', () => {
    // diminished 7th stacks minor 3rds: C–Eb–Gb–Bbb (degree-correct).
    expect(buildChord(makeRoot('C'), q('dim7')).noteNames).toEqual(['C', 'Eb', 'Gb', 'Bbb']);
    // half-diminished: C–Eb–Gb–Bb
    expect(buildChord(makeRoot('C'), q('m7b5')).noteNames).toEqual(['C', 'Eb', 'Gb', 'Bb']);
    // augmented raises the 5th: C–E–G#
    expect(buildChord(makeRoot('C'), q('aug')).noteNames).toEqual(['C', 'E', 'G#']);
    // dominant 9th: C–E–G–Bb–D
    expect(buildChord(makeRoot('C'), q('9')).noteNames).toEqual(['C', 'E', 'G', 'Bb', 'D']);
  });

  it('keeps the tallest extension inside the keyboard range', () => {
    // B13 is the highest stack; must stay within C2..B6 (36..83).
    const c = buildChord(makeRoot('B'), q('13'));
    expect(Math.max(...c.midi)).toBeLessThanOrEqual(83);
    expect(Math.min(...c.midi)).toBeGreaterThanOrEqual(36);
  });

  it('builds every quality for every natural root without throwing', () => {
    for (const letter of ROOT_LETTERS) {
      for (const cat of CHORD_TREE) {
        for (const quality of cat.qualities) {
          const c = buildChord(makeRoot(letter), quality);
          expect(c.midi.length).toBe(quality.intervals.length);
          expect(c.noteNames.length).toBe(quality.intervals.length);
        }
      }
    }
  });
});
