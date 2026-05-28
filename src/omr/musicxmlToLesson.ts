import { Lesson, LessonStep, LessonSegment } from '../lessons/schema';

// Minimal MusicXML → Lesson converter. MusicXML is large and complex; for the
// playable preview we only need the pitch sequence, which lives in
// <note><pitch><step/><alter/><octave/></pitch></note> elements. We extract
// those with regex (no XML lib dependency) and group consecutive same-onset
// notes (<chord/>) into chords. Good enough for a chord-annotated preview;
// a full parser can replace this later.

interface ParsedNote {
  note: string;     // scientific pitch e.g. "C4"
  isChord: boolean; // true if <chord/> present (same onset as previous)
}

const STEP_TO_SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function parseMusicXmlNotes(xml: string): ParsedNote[] {
  const notes: ParsedNote[] = [];
  const noteBlocks = xml.match(/<note[\s\S]*?<\/note>/g) ?? [];
  for (const block of noteBlocks) {
    if (/<rest\s*\/?>/.test(block)) continue;
    const step = /<step>\s*([A-G])\s*<\/step>/.exec(block)?.[1];
    const octave = /<octave>\s*(-?\d+)\s*<\/octave>/.exec(block)?.[1];
    if (!step || octave == null) continue;
    const alter = Number(/<alter>\s*(-?\d+)\s*<\/alter>/.exec(block)?.[1] ?? '0');
    const isChord = /<chord\s*\/?>/.test(block);
    notes.push({ note: spell(step, alter, Number(octave)), isChord });
  }
  return notes;
}

function spell(step: string, alter: number, octave: number): string {
  // Keep it simple: render sharps/flats explicitly; engine's noteToMidi handles #/b.
  const acc = alter > 0 ? '#'.repeat(alter) : alter < 0 ? 'b'.repeat(-alter) : '';
  void STEP_TO_SEMI; // semitone table reserved for future transposition
  return `${step}${acc}${octave}`;
}

/** Group notes into chords (by <chord/> onset) and cap to keep the preview short. */
export function groupIntoChords(notes: ParsedNote[], maxGroups = 24): string[][] {
  const groups: string[][] = [];
  for (const n of notes) {
    if (n.isChord && groups.length > 0) {
      groups[groups.length - 1].push(n.note);
    } else {
      groups.push([n.note]);
    }
  }
  return groups.slice(0, maxGroups);
}

export function musicXmlToLesson(xml: string, title = 'Imported score'): Lesson {
  const groups = groupIntoChords(parseMusicXmlNotes(xml));

  const segments: LessonSegment[] = [
    { type: 'say', text: `Here is ${title}. Watch the keys light up, then play along.` },
  ];
  for (const g of groups) {
    if (g.length > 1) {
      segments.push({ type: 'chord', notes: g, color: 'cyan', wait: 1200 });
    } else {
      segments.push({ type: 'seq', notes: g, color: 'cyan', delay: 500 });
    }
  }

  const steps: LessonStep[] = [{ segments }];

  return {
    id: `omr-${Date.now().toString(36)}`,
    grade: 0,
    title,
    subtitle: 'Imported from sheet music',
    xpReward: 10,
    complete: `Nice! You played through ${title}.`,
    steps,
  };
}
