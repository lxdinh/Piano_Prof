// Two-hand color convention, shared by lessons AND practice so the learner sees
// one consistent visual language everywhere a keyboard appears:
//
//   • LEFT hand  → cyan   (the lower register, below Middle C)
//   • RIGHT hand → orange (Middle C and above)
//
// This mirrors how most learning apps (and piano method books) color the two
// staves/hands. The split point is Middle C (MIDI 60), the classic boundary
// between the bass (left-hand) and treble (right-hand) registers.

export const HandColors = {
  left: '#00F0FF', // cyan
  right: '#FF9600', // orange
} as const;

/** Middle C — the conventional left/right hand divide. */
export const MIDDLE_C = 60;

/** Color a single MIDI note by the hand that conventionally plays it. */
export function handColorForMidi(midi: number): string {
  return midi < MIDDLE_C ? HandColors.left : HandColors.right;
}

/** Build a per-note color map (cyan/orange) for a set of MIDI notes. */
export function handColors(midi: number[]): Record<number, string> {
  const map: Record<number, string> = {};
  for (const m of midi) map[m] = handColorForMidi(m);
  return map;
}
