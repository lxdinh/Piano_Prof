import {
  CHORD_TYPES, CHORD_FAMILIES, CHORD_ROOTS, chordTypeById,
  buildChord, spellChord, COF_KEYS, majTriad, minTriad, cofSigText,
} from '../data/theory';

describe('chord building', () => {
  it('C major is C-E-G', () => {
    const c = buildChord('major', CHORD_ROOTS[0]);
    expect(c.notes).toEqual([60, 64, 67]);
    expect(c.name).toBe('C');
  });
  it('D minor 7 transposes correctly', () => {
    const d = CHORD_ROOTS.find((r) => r.name === 'D')!;
    const c = buildChord('min7', d);
    expect(c.notes).toEqual([62, 65, 69, 72]);
    expect(c.name).toBe('Dm7');
  });
  it('every family type exists', () => {
    for (const fam of CHORD_FAMILIES) {
      for (const t of fam.types) expect(CHORD_TYPES.some((c) => c.id === t)).toBe(true);
    }
  });
  it('unknown type falls back safely', () => {
    expect(chordTypeById('bogus').id).toBe('major');
  });
});

describe('chord spelling', () => {
  it('spells C minor with a flat third', () => {
    const spelled = spellChord(buildChord('minor', CHORD_ROOTS[0]));
    expect(spelled.map((n) => n.name)).toEqual(['C', 'E♭', 'G']);
  });
  it('spells E augmented with a sharp fifth (B♯)', () => {
    const e = CHORD_ROOTS.find((r) => r.name === 'E')!;
    const spelled = spellChord(buildChord('aug', e));
    expect(spelled.map((n) => n.name)).toEqual(['E', 'G♯', 'B♯']);
  });
  it('spells G dominant 7 with a natural F', () => {
    const g = CHORD_ROOTS.find((r) => r.name === 'G')!;
    const spelled = spellChord(buildChord('dom7', g));
    expect(spelled.map((n) => n.name)).toEqual(['G', 'B', 'D', 'F']);
  });
});

describe('circle of fifths', () => {
  it('has 12 keys, each a fifth apart (clockwise)', () => {
    expect(COF_KEYS).toHaveLength(12);
    for (let i = 0; i < 12; i++) {
      const a = COF_KEYS[i].root;
      const b = COF_KEYS[(i + 1) % 12].root;
      expect((b - a + 12) % 12).toBe(7);
    }
  });
  it('relative minor sits a minor third below the major root', () => {
    for (const k of COF_KEYS) expect((k.root - k.minRoot + 12) % 12).toBe(3);
  });
  it('triads have the right qualities', () => {
    expect(majTriad(60)).toEqual([60, 64, 67]);
    expect(minTriad(57)).toEqual([57, 60, 64]);
  });
  it('key signature text names the accidentals', () => {
    expect(cofSigText(COF_KEYS[0])).toBe('No sharps or flats');
    expect(cofSigText(COF_KEYS[1])).toBe('1 sharp · F♯');
    expect(cofSigText(COF_KEYS[2])).toBe('2 sharps · F♯ C♯');
  });
});
