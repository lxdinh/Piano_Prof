// Piano Professor — write a two-staff piano score as MusicXML from timed notes.
//
// The output is the mirror image of what parseMusicXmlScore() reads: one part,
// staff 1 = right hand, staff 2 = left hand, staff 1 first in each measure then
// a <backup> to the measure start for staff 2. Every staff is padded with rests
// so a measure always sums to exactly beatsPerMeasure quarter-beats, notes that
// cross a barline (or do not fit a single note type) are split into tied pieces,
// and simultaneous notes on a staff are written as a <chord/>.

/** A note in quarter-note beats from the start of the piece. */
export interface NoteIn {
  midi: number;
  startBeats: number;
  durBeats: number;
}

export interface ScoreInput {
  title: string;
  composer?: string;
  tempoBpm: number;
  /** time signature numerator, e.g. 4 in 4/4, 3 in 3/4 */
  beatsPerMeasure: number;
  /** time signature denominator, e.g. 4 */
  beatType: number;
  /** key signature as MusicXML fifths (-7..7) */
  fifths: number;
  /** right hand (staff 1) and left hand (staff 2) */
  rh: NoteIn[];
  lh: NoteIn[];
}

/** Duration units per quarter note: a 16th is one unit. */
const DIVISIONS = 4;

/** Note types expressible as a single (optionally dotted) note, in 16ths, largest first. */
const TYPES: { units: number; type: string; dot: boolean }[] = [
  { units: 24, type: 'whole', dot: true },
  { units: 16, type: 'whole', dot: false },
  { units: 12, type: 'half', dot: true },
  { units: 8, type: 'half', dot: false },
  { units: 6, type: 'quarter', dot: true },
  { units: 4, type: 'quarter', dot: false },
  { units: 3, type: 'eighth', dot: true },
  { units: 2, type: 'eighth', dot: false },
  { units: 1, type: '16th', dot: false },
];

const SHARP_NAMES: [string, number][] = [
  ['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0],
  ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0],
];
const FLAT_NAMES: [string, number][] = [
  ['C', 0], ['D', -1], ['D', 0], ['E', -1], ['E', 0], ['F', 0],
  ['G', -1], ['G', 0], ['A', -1], ['A', 0], ['B', -1], ['B', 0],
];

/** A note snapped to the 16th grid (absolute units from the start of the piece). */
interface GridNote {
  midi: number;
  start: number;
  dur: number;
}

/** A piece of a note that lies inside one measure (units relative to the measure start). */
interface Piece extends GridNote {
  tieStart: boolean;
  tieStop: boolean;
}

/**
 * Serialise to a `<score-partwise>` document with one part and two staves
 * (staff 1 = right hand, staff 2 = left hand) that parseMusicXmlScore() reads
 * back with the same timing. Onsets and durations are snapped to a 16th grid.
 */
export function buildMusicXml(input: ScoreInput): string {
  const beatsPerMeasure = Math.max(1, Math.round(input.beatsPerMeasure) || 4);
  const beatType = Math.max(1, Math.round(input.beatType) || 4);
  const fifths = Math.max(-7, Math.min(7, Math.round(input.fifths) || 0));
  const tempo = Math.round((input.tempoBpm > 0 ? input.tempoBpm : 120) * 100) / 100;
  // Measure length in 16ths; never below one 16th even for odd signatures.
  const measureUnits = Math.max(1, Math.round((beatsPerMeasure * 16) / beatType));

  const rh = snap(input.rh);
  const lh = snap(input.lh);
  const lastEnd = Math.max(0, ...rh.map((n) => n.start + n.dur), ...lh.map((n) => n.start + n.dur));
  const measureCount = Math.max(1, Math.ceil(lastEnd / measureUnits));

  const rhMeasures = splitIntoMeasures(rh, measureUnits, measureCount);
  const lhMeasures = splitIntoMeasures(lh, measureUnits, measureCount);

  const out: string[] = [];
  out.push('<?xml version="1.0" encoding="UTF-8"?>');
  out.push('<score-partwise version="3.1">');
  out.push(`  <work><work-title>${escapeXml(input.title || 'Untitled')}</work-title></work>`);
  if (input.composer) {
    out.push('  <identification>');
    out.push(`    <creator type="composer">${escapeXml(input.composer)}</creator>`);
    out.push('  </identification>');
  }
  out.push('  <part-list>');
  out.push('    <score-part id="P1"><part-name>Piano</part-name></score-part>');
  out.push('  </part-list>');
  out.push('  <part id="P1">');
  for (let m = 0; m < measureCount; m++) {
    out.push(`    <measure number="${m + 1}">`);
    if (m === 0) {
      out.push('      <attributes>');
      out.push(`        <divisions>${DIVISIONS}</divisions>`);
      out.push(`        <key><fifths>${fifths}</fifths></key>`);
      out.push(`        <time><beats>${beatsPerMeasure}</beats><beat-type>${beatType}</beat-type></time>`);
      out.push('        <staves>2</staves>');
      out.push('        <clef number="1"><sign>G</sign><line>2</line></clef>');
      out.push('        <clef number="2"><sign>F</sign><line>4</line></clef>');
      out.push('      </attributes>');
      out.push('      <direction placement="above">');
      out.push('        <direction-type>');
      out.push(`          <metronome><beat-unit>quarter</beat-unit><per-minute>${tempo}</per-minute></metronome>`);
      out.push('        </direction-type>');
      out.push(`        <sound tempo="${tempo}"/>`);
      out.push('      </direction>');
    }
    writeStaff(out, rhMeasures[m], 1, measureUnits, fifths);
    out.push(`      <backup><duration>${measureUnits}</duration></backup>`);
    writeStaff(out, lhMeasures[m], 2, measureUnits, fifths);
    out.push('    </measure>');
  }
  out.push('  </part>');
  out.push('</score-partwise>');
  return out.join('\n') + '\n';
}

/** Snap to the 16th grid; drop zero-length notes and pitches outside the piano. */
function snap(notes: NoteIn[]): GridNote[] {
  const out: GridNote[] = [];
  for (const n of notes) {
    if (!Number.isFinite(n.midi) || !Number.isFinite(n.startBeats) || !Number.isFinite(n.durBeats)) continue;
    if (n.durBeats <= 0) continue;
    const midi = Math.round(n.midi);
    if (midi < 21 || midi > 108) continue;
    const start = Math.max(0, Math.round(n.startBeats * DIVISIONS));
    const dur = Math.max(1, Math.round(n.durBeats * DIVISIONS));
    out.push({ midi, start, dur });
  }
  out.sort((a, b) => a.start - b.start || a.midi - b.midi);
  return out;
}

/** Cut notes at barlines into per-measure pieces, marking the ties between them. */
function splitIntoMeasures(notes: GridNote[], measureUnits: number, measureCount: number): Piece[][] {
  const measures: Piece[][] = Array.from({ length: measureCount }, () => []);
  for (const n of notes) {
    let pos = n.start;
    const end = n.start + n.dur;
    let first = true;
    while (pos < end) {
      const m = Math.floor(pos / measureUnits);
      if (m >= measureCount) break;
      const measureEnd = (m + 1) * measureUnits;
      const pieceEnd = Math.min(end, measureEnd);
      measures[m].push({
        midi: n.midi,
        start: pos - m * measureUnits,
        dur: pieceEnd - pos,
        tieStart: pieceEnd < end,
        tieStop: !first,
      });
      first = false;
      pos = pieceEnd;
    }
  }
  return measures;
}

/**
 * Write one staff of one measure: notes sharing onset and length as a chord,
 * rests over the gaps, a <backup> when a note starts while an earlier one still
 * sounds (or chord members differ in length), and rests up to the barline so the
 * staff always sums to measureUnits.
 */
function writeStaff(out: string[], pieces: Piece[], staff: number, measureUnits: number, fifths: number): void {
  if (pieces.length === 0) {
    out.push(`      <note><rest measure="yes"/><duration>${measureUnits}</duration><voice>${staff}</voice><staff>${staff}</staff></note>`);
    return;
  }
  // Group by onset + length; longer groups at the same onset go first so the
  // cursor reaches the farthest point before the shorter ones back up to the onset.
  const groups = new Map<string, Piece[]>();
  for (const p of pieces) {
    const key = `${p.start}/${p.dur}`;
    const g = groups.get(key);
    if (g) g.push(p);
    else groups.set(key, [p]);
  }
  const ordered = [...groups.values()].sort((a, b) => a[0].start - b[0].start || b[0].dur - a[0].dur);
  let cursor = 0;
  let reached = 0;
  for (const group of ordered) {
    group.sort((a, b) => a.midi - b.midi);
    const onset = group[0].start;
    if (onset > cursor) {
      writeRests(out, onset - cursor, staff);
    } else if (onset < cursor) {
      out.push(`      <backup><duration>${cursor - onset}</duration></backup>`);
    }
    const chunks = decompose(group[0].dur);
    chunks.forEach((units, i) => {
      const firstChunk = i === 0;
      const lastChunk = i === chunks.length - 1;
      group.forEach((p, idx) => {
        const tieStart = !lastChunk || p.tieStart;
        const tieStop = !firstChunk || p.tieStop;
        writeNote(out, p.midi, units, staff, fifths, idx > 0, tieStart, tieStop);
      });
    });
    cursor = onset + group[0].dur;
    reached = Math.max(reached, cursor);
  }
  if (cursor < reached) {
    // A shorter group after a backup left the cursor early; skip to the farthest point.
    out.push(`      <forward><duration>${reached - cursor}</duration></forward>`);
    cursor = reached;
  }
  if (cursor < measureUnits) writeRests(out, measureUnits - cursor, staff);
}

function writeRests(out: string[], units: number, staff: number): void {
  for (const u of decompose(units)) {
    const t = TYPES.find((x) => x.units === u)!;
    out.push(
      `      <note><rest/><duration>${u}</duration><voice>${staff}</voice><type>${t.type}</type>${t.dot ? '<dot/>' : ''}<staff>${staff}</staff></note>`,
    );
  }
}

function writeNote(
  out: string[],
  midi: number,
  units: number,
  staff: number,
  fifths: number,
  chord: boolean,
  tieStart: boolean,
  tieStop: boolean,
): void {
  const t = TYPES.find((x) => x.units === units)!;
  const [step, alter] = (fifths < 0 ? FLAT_NAMES : SHARP_NAMES)[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  const parts: string[] = ['      <note>'];
  if (chord) parts.push('<chord/>');
  parts.push(`<pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>${octave}</octave></pitch>`);
  parts.push(`<duration>${units}</duration>`);
  if (tieStop) parts.push('<tie type="stop"/>');
  if (tieStart) parts.push('<tie type="start"/>');
  parts.push(`<voice>${staff}</voice><type>${t.type}</type>${t.dot ? '<dot/>' : ''}<staff>${staff}</staff>`);
  if (tieStart || tieStop) {
    parts.push('<notations>');
    if (tieStop) parts.push('<tied type="stop"/>');
    if (tieStart) parts.push('<tied type="start"/>');
    parts.push('</notations>');
  }
  parts.push('</note>');
  out.push(parts.join(''));
}

/** Break a duration in 16ths into note-type sizes, largest first (all positive). */
function decompose(units: number): number[] {
  const out: number[] = [];
  let left = units;
  while (left > 0) {
    const t = TYPES.find((x) => x.units <= left)!;
    out.push(t.units);
    left -= t.units;
  }
  return out;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
