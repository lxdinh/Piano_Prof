import { parseMusicXmlScore } from '../omr/musicxmlScore';
import { mergeMusicXml } from '../omr/mergeMusicXml';

// Two-measure, two-staff page: RH C4 (quarter) then E4 (quarter); LH whole-note
// C3 written in voice 2 via <backup>. divisions=2 → quarter = 2 units.
const PAGE = (measureOffset = 0) => `
<score-partwise version="3.1">
  <part-list><score-part id="P1"/></part-list>
  <part id="P1">
    <measure number="${measureOffset + 1}">
      <attributes>
        <divisions>2</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <sound tempo="120"/>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><staff>1</staff></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>2</duration><staff>1</staff></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><staff>1</staff></note>
      <backup><duration>8</duration></backup>
      <note><pitch><step>C</step><octave>3</octave></pitch><duration>8</duration><staff>2</staff></note>
    </measure>
    <measure number="${measureOffset + 2}">
      <note><pitch><step>F</step><alter>1</alter><octave>4</octave></pitch><duration>4</duration><staff>1</staff></note>
      <note><chord/><pitch><step>A</step><octave>4</octave></pitch><duration>4</duration><staff>1</staff></note>
      <note><rest/><duration>4</duration></note>
    </measure>
  </part>
</score-partwise>`;

describe('parseMusicXmlScore', () => {
  it('computes onsets/durations in seconds from divisions + tempo', () => {
    const score = parseMusicXmlScore(PAGE());
    // tempo 120 → 0.5s per quarter note
    expect(score.tempoBpm).toBe(120);
    const c4 = score.events.find((e) => e.note === 'C4');
    const e4 = score.events.find((e) => e.note === 'E4');
    const g4 = score.events.find((e) => e.note === 'G4');
    expect(c4).toMatchObject({ start: 0, duration: 0.5, staff: 1 });
    expect(e4?.start).toBeCloseTo(0.5);
    expect(g4?.start).toBeCloseTo(1.0);
    expect(g4?.duration).toBeCloseTo(1.0);
  });

  it('handles <backup> so the left hand shares the right hand onset', () => {
    const score = parseMusicXmlScore(PAGE());
    const c3 = score.events.find((e) => e.note === 'C3');
    expect(c3).toMatchObject({ staff: 2 });
    expect(c3?.start).toBe(0);
    expect(c3?.duration).toBeCloseTo(2.0); // whole note at 120bpm
  });

  it('places <chord/> notes on the same onset and starts measure 2 after measure 1', () => {
    const score = parseMusicXmlScore(PAGE());
    const fSharp = score.events.find((e) => e.note === 'F#4');
    const a4 = score.events.find((e) => e.note === 'A4');
    expect(fSharp?.start).toBeCloseTo(2.0); // measure 1 was 4 beats = 2s
    expect(a4?.start).toBeCloseTo(2.0);
    expect(fSharp?.midi).toBe(66);
  });

  it('drops notes outside the piano range (OMR artifacts)', () => {
    const xml = PAGE().replace('<step>C</step><octave>4</octave>', '<step>C</step><octave>9</octave>');
    const score = parseMusicXmlScore(xml);
    expect(score.events.some((e) => e.note === 'C9')).toBe(false);
    expect(score.events.some((e) => e.note === 'E4')).toBe(true);
  });

  it('reports range + total duration and skips rests', () => {
    const score = parseMusicXmlScore(PAGE());
    expect(score.events.some((e) => Number.isNaN(e.midi))).toBe(false);
    expect(score.minMidi).toBe(48); // C3
    expect(score.maxMidi).toBe(69); // A4
    expect(score.durationSec).toBeCloseTo(3.0); // 2s + chord (1s)
  });
});

describe('mergeMusicXml', () => {
  it('returns a single page unchanged', () => {
    expect(mergeMusicXml([PAGE()])).toBe(PAGE());
  });

  it('appends later pages measures into part 1 and renumbers them', () => {
    const merged = mergeMusicXml([PAGE(), PAGE(10)]);
    const numbers = [...merged.matchAll(/<measure[^>]*number="(\d+)"/g)].map((m) => m[1]);
    expect(numbers).toEqual(['1', '2', '3', '4']);
    // still one part, one document
    expect(merged.match(/<part\s/g)).toHaveLength(1);
    expect(merged.match(/<score-partwise/g)).toHaveLength(1);
  });

  it('merged score plays page 2 after page 1', () => {
    const merged = mergeMusicXml([PAGE(), PAGE()]);
    const score = parseMusicXmlScore(merged);
    const c4s = score.events.filter((e) => e.note === 'C4');
    expect(c4s).toHaveLength(2);
    expect(c4s[0].start).toBe(0);
    // page 1 spans 8 beats (4 + 4, trailing rest included) = 4s at 120bpm
    expect(c4s[1].start).toBeCloseTo(4.0);
    expect(score.durationSec).toBeCloseTo(7.0); // 4s + page-2 content (3s)
  });

  it('throws when no page contains a part', () => {
    expect(() => mergeMusicXml(['<score-partwise></score-partwise>'])).toThrow();
  });
});
