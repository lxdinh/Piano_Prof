import { buildMusicXml, ScoreInput } from '../omr/musicxmlWriter';
import { parseMusicXmlScore, NoteEvent } from '../omr/musicxmlScore';

const base = (over: Partial<ScoreInput>): ScoreInput => ({
  title: 'Test',
  tempoBpm: 100,
  beatsPerMeasure: 4,
  beatType: 4,
  fifths: 0,
  rh: [],
  lh: [],
  ...over,
});

const timing = (e: NoteEvent) => ({ midi: e.midi, staff: e.staff, start: e.startBeats, dur: e.durBeats });
const sortEv = <T extends { start: number; midi: number; staff: number }>(xs: T[]) =>
  [...xs].sort((a, b) => a.start - b.start || a.staff - b.staff || a.midi - b.midi);
const expected = (input: ScoreInput) =>
  sortEv([
    ...input.rh.map((n) => ({ midi: n.midi, staff: 1, start: n.startBeats, dur: n.durBeats })),
    ...input.lh.map((n) => ({ midi: n.midi, staff: 2, start: n.startBeats, dur: n.durBeats })),
  ]);

const measuresOf = (xml: string) => xml.match(/<measure[\s\S]*?<\/measure>/g) ?? [];

/** Sum of non-chord note durations per staff in one measure (no backups within a staff). */
function staffSums(measure: string): Record<number, number> {
  const sums: Record<number, number> = { 1: 0, 2: 0 };
  for (const tok of measure.match(/<note>[\s\S]*?<\/note>/g) ?? []) {
    if (/<chord\/>/.test(tok)) continue;
    const staff = Number(/<staff>(\d)<\/staff>/.exec(tok)![1]);
    sums[staff] += Number(/<duration>(\d+)<\/duration>/.exec(tok)![1]);
  }
  return sums;
}

describe('buildMusicXml', () => {
  it('round-trips a two-hand 4/4 piece with chords and a tie across the barline', () => {
    const input = base({
      rh: [
        { midi: 60, startBeats: 0, durBeats: 1 },
        { midi: 64, startBeats: 0, durBeats: 1 },
        { midi: 67, startBeats: 1, durBeats: 0.5 },
        { midi: 69, startBeats: 1.5, durBeats: 0.5 },
        { midi: 72, startBeats: 3, durBeats: 2 }, // crosses into measure 2
        { midi: 71, startBeats: 6, durBeats: 2 },
      ],
      lh: [
        { midi: 48, startBeats: 0, durBeats: 4 },
        { midi: 43, startBeats: 4, durBeats: 2 },
        { midi: 47, startBeats: 4, durBeats: 2 },
        { midi: 48, startBeats: 6, durBeats: 2 },
      ],
    });
    const xml = buildMusicXml(input);
    const score = parseMusicXmlScore(xml);
    expect(sortEv(score.events.map(timing))).toEqual(expected(input));
    expect(score.measureCount).toBe(2);
    expect(score.tempoBpm).toBe(100);
    expect(score.beatsPerMeasure).toBe(4);
    expect(score.fifths).toBe(0);
    // The tie is written out explicitly.
    expect(xml).toMatch(/<tie type="start"\/>/);
    expect(xml).toMatch(/<tie type="stop"\/>/);
    expect(xml).toMatch(/<tied type="start"\/>/);
    expect(xml).toMatch(/<chord\/>/);
    // Note types follow the durations.
    expect(xml).toMatch(/<type>eighth<\/type>/);
    expect(xml).toMatch(/<type>half<\/type>/);
    expect(xml).toMatch(/<type>whole<\/type>/);
  });

  it('round-trips a 3/4 waltz', () => {
    const input = base({
      beatsPerMeasure: 3,
      tempoBpm: 132,
      rh: [
        { midi: 67, startBeats: 0, durBeats: 3 },
        { midi: 69, startBeats: 3, durBeats: 1.5 },
        { midi: 71, startBeats: 4.5, durBeats: 1.5 },
      ],
      lh: [
        { midi: 43, startBeats: 0, durBeats: 1 },
        { midi: 47, startBeats: 1, durBeats: 1 },
        { midi: 50, startBeats: 2, durBeats: 1 },
        { midi: 43, startBeats: 3, durBeats: 1 },
        { midi: 47, startBeats: 4, durBeats: 1 },
        { midi: 50, startBeats: 5, durBeats: 1 },
      ],
    });
    const xml = buildMusicXml(input);
    const score = parseMusicXmlScore(xml);
    expect(score.beatsPerMeasure).toBe(3);
    expect(score.measureCount).toBe(2);
    expect(score.tempoBpm).toBe(132);
    expect(sortEv(score.events.map(timing))).toEqual(expected(input));
    expect(xml).toMatch(/<beats>3<\/beats><beat-type>4<\/beat-type>/);
    expect(xml).toMatch(/<type>quarter<\/type><dot\/>/);
    for (const m of measuresOf(xml)) expect(staffSums(m)).toEqual({ 1: 12, 2: 12 });
  });

  it('spells accidentals as flats in a flat key and sharps otherwise', () => {
    const fMajor = base({
      fifths: -1,
      rh: [{ midi: 70, startBeats: 0, durBeats: 1 }],
      lh: [{ midi: 53, startBeats: 0, durBeats: 1 }],
    });
    const xml = buildMusicXml(fMajor);
    expect(xml).toMatch(/<fifths>-1<\/fifths>/);
    expect(xml).toMatch(/<step>B<\/step><alter>-1<\/alter><octave>4<\/octave>/);
    const score = parseMusicXmlScore(xml);
    expect(score.fifths).toBe(-1);
    expect(score.events.find((e) => e.midi === 70)?.note).toBe('Bb4');
    expect(sortEv(score.events.map(timing))).toEqual(expected(fMajor));

    const gMajor = buildMusicXml(base({ fifths: 1, rh: [{ midi: 66, startBeats: 0, durBeats: 1 }] }));
    expect(gMajor).toMatch(/<step>F<\/step><alter>1<\/alter><octave>4<\/octave>/);
    expect(parseMusicXmlScore(gMajor).events[0].note).toBe('F#4');
  });

  it('writes whole-measure rests for an empty left hand and still round-trips', () => {
    const input = base({
      rh: [
        { midi: 60, startBeats: 0, durBeats: 1 },
        { midi: 62, startBeats: 1, durBeats: 1 },
        { midi: 64, startBeats: 2, durBeats: 2 },
        { midi: 65, startBeats: 4, durBeats: 4 },
      ],
    });
    const xml = buildMusicXml(input);
    const measures = measuresOf(xml);
    expect(measures).toHaveLength(2);
    for (const m of measures) {
      expect(m).toMatch(/<note><rest measure="yes"\/><duration>16<\/duration><voice>2<\/voice><staff>2<\/staff><\/note>/);
    }
    const score = parseMusicXmlScore(xml);
    expect(sortEv(score.events.map(timing))).toEqual(expected(input));
    expect(score.events.every((e) => e.staff === 1)).toBe(true);
  });

  it('fills every staff of every measure to exactly the time signature', () => {
    const input = base({
      rh: [
        { midi: 60, startBeats: 0.5, durBeats: 0.25 }, // leading gap of an eighth
        { midi: 62, startBeats: 1, durBeats: 1.25 },
        { midi: 64, startBeats: 3.75, durBeats: 0.25 },
        { midi: 65, startBeats: 5, durBeats: 0.75 },
      ],
      lh: [
        { midi: 48, startBeats: 2, durBeats: 1 },
        { midi: 50, startBeats: 9, durBeats: 0.5 }, // forces a third measure
      ],
    });
    const xml = buildMusicXml(input);
    const measures = measuresOf(xml);
    expect(measures).toHaveLength(3);
    for (const m of measures) {
      expect(staffSums(m)).toEqual({ 1: 16, 2: 16 });
      // exactly one backup between the staves
      expect(m.match(/<backup>/g)).toHaveLength(1);
    }
    expect(sortEv(parseMusicXmlScore(xml).events.map(timing))).toEqual(expected(input));
  });

  it('produces one part, two staves and 1..N measure numbers with header metadata', () => {
    const input = base({
      title: 'Ode & Joy <3',
      composer: 'L. v. Beethoven',
      rh: [{ midi: 64, startBeats: 0, durBeats: 1 }, { midi: 64, startBeats: 15, durBeats: 1 }],
    });
    const xml = buildMusicXml(input);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<score-partwise version="3.1">/);
    expect(xml.match(/<part\s/g)).toHaveLength(1);
    expect(xml.match(/<score-part\s/g)).toHaveLength(1);
    expect(xml).toContain('<staves>2</staves>');
    expect(xml).toContain('<work-title>Ode &amp; Joy &lt;3</work-title>');
    expect(xml).toContain('<creator type="composer">L. v. Beethoven</creator>');
    expect(xml).toContain('<divisions>4</divisions>');
    expect(xml).toContain('<clef number="1"><sign>G</sign><line>2</line></clef>');
    expect(xml).toContain('<clef number="2"><sign>F</sign><line>4</line></clef>');
    expect(xml).toContain('<sound tempo="100"/>');
    expect(xml).toContain('<per-minute>100</per-minute>');
    const numbers = [...xml.matchAll(/<measure number="(\d+)">/g)].map((m) => Number(m[1]));
    expect(numbers).toEqual([1, 2, 3, 4]);
    expect(parseMusicXmlScore(xml).measureCount).toBe(4);
  });

  it('writes a single measure of rests for an empty score', () => {
    const xml = buildMusicXml(base({}));
    const measures = measuresOf(xml);
    expect(measures).toHaveLength(1);
    expect(measures[0]?.match(/<rest measure="yes"\/>/g)).toHaveLength(2);
    const score = parseMusicXmlScore(xml);
    expect(score.events).toEqual([]);
    expect(score.beatsPerMeasure).toBe(4);
  });

  it('snaps to the 16th grid, keeps a minimum 16th and drops zero-length notes', () => {
    const xml = buildMusicXml(
      base({
        rh: [
          { midi: 60, startBeats: 0.01, durBeats: 0.02 }, // tiny → one 16th at 0
          { midi: 62, startBeats: 1.1, durBeats: 0.9 }, // → 1.0 .. 2.0
          { midi: 64, startBeats: 2, durBeats: 0 }, // dropped
        ],
      }),
    );
    const evs = sortEv(parseMusicXmlScore(xml).events.map(timing));
    expect(evs).toEqual([
      { midi: 60, staff: 1, start: 0, dur: 0.25 },
      { midi: 62, staff: 1, start: 1, dur: 1 },
    ]);
  });

  it('keeps simultaneous notes of different lengths on one staff', () => {
    const input = base({
      rh: [
        { midi: 60, startBeats: 0, durBeats: 2 },
        { midi: 67, startBeats: 0, durBeats: 1 },
        { midi: 69, startBeats: 1, durBeats: 1 },
        { midi: 64, startBeats: 2.5, durBeats: 1 }, // overlaps nothing, off-beat
        { midi: 65, startBeats: 3, durBeats: 1 }, // starts while E4 sounds
      ],
    });
    const xml = buildMusicXml(input);
    expect(sortEv(parseMusicXmlScore(xml).events.map(timing))).toEqual(expected(input));
  });

  it('splits awkward lengths into tied pieces', () => {
    const input = base({ rh: [{ midi: 60, startBeats: 0, durBeats: 1.25 }] }); // 5 sixteenths
    const xml = buildMusicXml(input);
    const notes = (measuresOf(xml)[0]?.match(/<note>[\s\S]*?<\/note>/g) ?? []).filter((n) => /<pitch>/.test(n));
    expect(notes).toHaveLength(2);
    expect(notes[0]).toMatch(/<type>quarter<\/type>/);
    expect(notes[0]).toMatch(/<tie type="start"\/>/);
    expect(notes[1]).toMatch(/<type>16th<\/type>/);
    expect(notes[1]).toMatch(/<tie type="stop"\/>/);
    expect(sortEv(parseMusicXmlScore(xml).events.map(timing))).toEqual(expected(input));
  });
});
