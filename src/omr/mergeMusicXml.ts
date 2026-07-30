// Merge per-page MusicXML documents (one per scanned sheet) into a single
// score for the whole song. OMR runs page-by-page, so each page arrives as its
// own <score-partwise>; we keep the first page as the base document and append
// every later page's measures to the matching part (matched by position —
// OMR engines emit parts in the same order on every page). Measure numbers are
// then renumbered sequentially so players/notation tools see one continuous
// score. Each page's opening <attributes> (divisions/clef/key) travel with its
// measures, which is valid MusicXML and keeps per-page divisions correct.

const PART_RE = /<part\s[^>]*>[\s\S]*?<\/part>/g;
const MEASURE_RE = /<measure[\s\S]*?<\/measure>/g;

export function mergeMusicXml(pages: string[]): string {
  const usable = pages.filter((p) => /<part\s[^>]*>/.test(p));
  if (usable.length === 0) throw new Error('No readable MusicXML pages to merge.');
  if (usable.length === 1) return usable[0];

  const base = usable[0];
  const baseParts = base.match(PART_RE) ?? [];
  const extraMeasures: string[][] = baseParts.map(() => []);

  for (const page of usable.slice(1)) {
    const pageParts = page.match(PART_RE) ?? [];
    pageParts.forEach((part, i) => {
      if (i >= extraMeasures.length) return; // page has more parts than page 1; drop extras
      extraMeasures[i].push(...(part.match(MEASURE_RE) ?? []));
    });
  }

  // Splice each part's appended measures in before its </part>, then renumber.
  let partIndex = 0;
  const merged = base.replace(PART_RE, (partXml) => {
    const extras = extraMeasures[partIndex++] ?? [];
    const joined = extras.length
      ? partXml.replace(/<\/part>\s*$/, `${extras.join('\n')}\n</part>`)
      : partXml;
    let n = 0;
    return joined.replace(/(<measure\b[^>]*?\bnumber=")[^"]*(")/g, (_m, pre, post) => {
      n += 1;
      return `${pre}${n}${post}`;
    });
  });
  return merged;
}
