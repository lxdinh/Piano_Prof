// Multi-page merge: a song spans several sheets, OMR runs per page, and each
// page comes back as its own <score-partwise>. This is the step that turns them
// into one continuous score — and it arrived from the MCR branch with no tests
// at all, despite being the part that decides whether bar 9 exists.
//
// Merging is verified THROUGH the parser as well as structurally: a merge that
// produces well-formed-looking XML but loses measures, or renumbers them wrong,
// still breaks the player, and only parsing catches that.

import { mergeMusicXml } from '../omr/mergeMusicXml';
import { parseMusicXmlScore } from '../omr/musicxmlScore';

/** One page of `count` single-note measures, starting at bar `from`. */
function page(from: number, count: number, opts: { attrs?: boolean; parts?: number } = {}): string {
  const { attrs = true, parts = 1 } = opts;
  const header = attrs
    ? '<attributes><divisions>1</divisions><key><fifths>0</fifths></key>'
      + '<time><beats>4</beats><beat-type>4</beat-type></time></attributes><sound tempo="120"/>'
    : '';
  let xml = '<score-partwise><part-list>';
  for (let p = 0; p < parts; p++) xml += `<score-part id="P${p + 1}"/>`;
  xml += '</part-list>';
  for (let p = 0; p < parts; p++) {
    xml += `<part id="P${p + 1}">`;
    for (let m = 0; m < count; m++) {
      xml += `<measure number="${from + m}">${m === 0 ? header : ''}`
        + `<note><pitch><step>C</step><octave>4</octave></pitch>`
        + `<duration>4</duration><staff>${p + 1}</staff></note></measure>`;
    }
    xml += '</part>';
  }
  return xml + '</score-partwise>';
}

const measureNumbers = (xml: string) =>
  [...xml.matchAll(/<measure\b[^>]*\bnumber="([^"]+)"/g)].map((m) => Number(m[1]));

describe('mergeMusicXml', () => {
  it('keeps a single page untouched', () => {
    const one = page(1, 4);
    expect(mergeMusicXml([one])).toBe(one);
  });

  it('appends later pages and renumbers continuously', () => {
    // Every OMR page restarts its own bar numbering at 1, so without renumbering
    // a three-page song has three bar 1s.
    const merged = mergeMusicXml([page(1, 4), page(1, 4), page(1, 2)]);
    expect(measureNumbers(merged)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('loses no music — the parser sees every bar', () => {
    const merged = mergeMusicXml([page(1, 4), page(1, 4)]);
    const score = parseMusicXmlScore(merged);
    expect(score.measureCount).toBe(8);
    expect(score.events).toHaveLength(8);
  });

  it('carries the first page\'s key, tempo and time signature', () => {
    const score = parseMusicXmlScore(mergeMusicXml([page(1, 2), page(1, 2)]));
    expect(score.tempoBpm).toBe(120);
    expect(score.fifths).toBe(0);
    expect(score.beatsPerMeasure).toBe(4);
  });

  it('merges each part separately for a two-hand score', () => {
    // Two staves must stay two staves; appending page 2's bass onto page 1's
    // treble would silently transpose half the song.
    const merged = mergeMusicXml([page(1, 2, { parts: 2 }), page(1, 2, { parts: 2 })]);
    const score = parseMusicXmlScore(merged);
    expect(score.events.filter((e) => e.staff === 1)).toHaveLength(4);
    expect(score.events.filter((e) => e.staff === 2)).toHaveLength(4);
  });

  it('skips pages OMR could not read', () => {
    // A blurred page comes back without any <part>; the rest of the song should
    // still merge rather than the whole import failing.
    const merged = mergeMusicXml([page(1, 3), '<score-partwise><part-list/></score-partwise>', page(1, 2)]);
    expect(measureNumbers(merged)).toEqual([1, 2, 3, 4, 5]);
  });

  it('ignores extra parts on a later page', () => {
    // OMR sometimes hallucinates a third staff on one page; it must not become
    // a phantom part in the merged score.
    const merged = mergeMusicXml([page(1, 2, { parts: 1 }), page(1, 2, { parts: 3 })]);
    const score = parseMusicXmlScore(merged);
    expect(score.measureCount).toBe(4);
  });

  it('throws when nothing was readable at all', () => {
    expect(() => mergeMusicXml(['not xml', ''])).toThrow(/No readable MusicXML/);
  });
});
