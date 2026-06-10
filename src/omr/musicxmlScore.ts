// Timed MusicXML parser: turns a (possibly multi-page, merged) MusicXML string
// into a flat list of note events with onset + duration in seconds, ready for
// the falling-notes song player. Like musicxmlToLesson we tokenize with regex
// instead of pulling in an XML library; MusicXML from OMR engines is regular
// enough for that, and the app already follows this pattern.

export interface NoteEvent {
  midi: number;
  /** scientific pitch, e.g. "C#4" — handy for debugging / lesson conversion */
  note: string;
  /** onset in seconds from the start of the song */
  start: number;
  /** sounding length in seconds */
  duration: number;
  /** MusicXML staff: 1 = treble/right hand, 2 = bass/left hand */
  staff: number;
}

export interface SongScore {
  events: NoteEvent[];
  /** total length in seconds (last note end) */
  durationSec: number;
  tempoBpm: number;
  minMidi: number;
  maxMidi: number;
}

interface RawEvent {
  midi: number;
  note: string;
  startBeats: number;
  durBeats: number;
  staff: number;
  tieStart: boolean;
  tieStop: boolean;
}

const DEFAULT_TEMPO = 90;
const STEP_TO_SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Parse `<score-partwise>` MusicXML into timed note events. */
export function parseMusicXmlScore(xml: string, tempoOverride?: number): SongScore {
  const tempoBpm =
    tempoOverride ??
    (Number(/<sound[^>]*\btempo="([\d.]+)"/.exec(xml)?.[1] ?? NaN) || DEFAULT_TEMPO);

  const raw: RawEvent[] = [];
  const parts = xml.match(/<part\s[^>]*>[\s\S]*?<\/part>/g) ?? [];
  for (const part of parts) raw.push(...parsePart(part));

  // Merge ties: a tie-stop note extends the matching tie-start instead of
  // re-articulating. OMR ties are unreliable, so match loosely on pitch+staff
  // with the stop starting where the open note ends (small tolerance).
  const events: NoteEvent[] = [];
  const open = new Map<string, NoteEvent>(); // "midi/staff" → event awaiting tie-stop
  const secPerBeat = 60 / tempoBpm;
  raw.sort((a, b) => a.startBeats - b.startBeats);
  for (const r of raw) {
    const key = `${r.midi}/${r.staff}`;
    const start = r.startBeats * secPerBeat;
    const duration = Math.max(r.durBeats * secPerBeat, 0.05);
    const prev = open.get(key);
    if (r.tieStop && prev && Math.abs(prev.start + prev.duration - start) < secPerBeat * 0.25) {
      prev.duration += duration;
      if (!r.tieStart) open.delete(key);
      continue;
    }
    const ev: NoteEvent = { midi: r.midi, note: r.note, start, duration, staff: r.staff };
    events.push(ev);
    if (r.tieStart) open.set(key, ev);
  }

  events.sort((a, b) => a.start - b.start || a.midi - b.midi);
  let durationSec = 0;
  let minMidi = 127;
  let maxMidi = 0;
  for (const e of events) {
    durationSec = Math.max(durationSec, e.start + e.duration);
    minMidi = Math.min(minMidi, e.midi);
    maxMidi = Math.max(maxMidi, e.midi);
  }
  if (events.length === 0) { minMidi = 60; maxMidi = 60; }
  return { events, durationSec, tempoBpm, minMidi, maxMidi };
}

function parsePart(partXml: string): RawEvent[] {
  const out: RawEvent[] = [];
  let divisions = 1; // duration units per quarter note; updated by <attributes>
  let measureStart = 0; // absolute beats at the start of the current measure

  const measures = partXml.match(/<measure[\s\S]*?<\/measure>/g) ?? [];
  for (const measure of measures) {
    let cursor = 0; // beats from measure start
    let maxCursor = 0;
    let lastOnset = 0; // onset of the previous non-chord note (for <chord/>)

    const div = /<divisions>\s*(\d+)\s*<\/divisions>/.exec(measure)?.[1];
    if (div) divisions = Math.max(1, Number(div));

    // Walk <note>/<backup>/<forward> in document order — order matters because
    // <backup> rewinds the cursor for second voices / the other staff.
    const tokens = measure.match(/<(note|backup|forward)[\s\S]*?<\/\1>/g) ?? [];
    for (const tok of tokens) {
      const durUnits = Number(/<duration>\s*(\d+)\s*<\/duration>/.exec(tok)?.[1] ?? '0');
      const durBeats = durUnits / divisions;
      if (tok.startsWith('<backup')) {
        cursor = Math.max(0, cursor - durBeats);
        continue;
      }
      if (tok.startsWith('<forward')) {
        cursor += durBeats;
        maxCursor = Math.max(maxCursor, cursor);
        continue;
      }
      // <note>
      if (/<grace[\s>]/.test(tok)) continue; // grace notes have no duration
      const isChord = /<chord\s*\/?>/.test(tok);
      const isRest = /<rest[\s/>]/.test(tok);
      const onset = isChord ? lastOnset : cursor;
      if (!isChord) {
        lastOnset = cursor;
        cursor += durBeats;
        maxCursor = Math.max(maxCursor, cursor);
      }
      if (isRest) continue;
      const step = /<step>\s*([A-G])\s*<\/step>/.exec(tok)?.[1];
      const octave = /<octave>\s*(-?\d+)\s*<\/octave>/.exec(tok)?.[1];
      if (!step || octave == null) continue;
      const alter = Number(/<alter>\s*(-?\d+)\s*<\/alter>/.exec(tok)?.[1] ?? '0');
      const acc = alter > 0 ? '#'.repeat(alter) : alter < 0 ? 'b'.repeat(-alter) : '';
      const midi = STEP_TO_SEMI[step] + alter + (Number(octave) + 1) * 12;
      if (midi < 0 || midi > 127) continue;
      out.push({
        midi,
        note: `${step}${acc}${octave}`,
        startBeats: measureStart + onset,
        durBeats,
        staff: Number(/<staff>\s*(\d+)\s*<\/staff>/.exec(tok)?.[1] ?? '1'),
        tieStart: /<tie[^>]*type="start"/.test(tok),
        tieStop: /<tie[^>]*type="stop"/.test(tok),
      });
    }
    // Advance by the farthest point reached in this measure (robust even when
    // the OMR engine emits no time signature or slightly off backups).
    measureStart += maxCursor;
  }
  return out;
}
