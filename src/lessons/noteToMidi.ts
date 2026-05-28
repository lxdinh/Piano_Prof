// Convert scientific pitch notation (e.g. "C4", "Bb3", "F#5") to MIDI note numbers.
// Middle C = C4 = MIDI 60.

const STEP: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

export function noteToMidi(note: string): number | null {
  const m = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(note.trim());
  if (!m) return null;
  const letter = m[1].toUpperCase();
  const accidental = m[2];
  const octave = parseInt(m[3], 10);
  let semi = STEP[letter];
  if (semi === undefined) return null;
  if (accidental === '#') semi += 1;
  if (accidental === 'b') semi -= 1;
  return semi + (octave + 1) * 12;
}

export function notesToMidi(notes: string[]): number[] {
  const out: number[] = [];
  for (const n of notes) {
    const m = noteToMidi(n);
    if (m !== null) out.push(m);
  }
  return out;
}
