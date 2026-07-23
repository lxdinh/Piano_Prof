// Piano Professor — chord library + circle-of-fifths data.
// Ported from the prototype (app/chord-library.jsx, app/circle-of-fifths.jsx).

// ── Chord types ────────────────────────────────────────────────────
export interface ChordType {
  id: string;
  suffix: string;
  label: string;
  semis: number[];
  degrees: string[];
  steps: string;
  letterSteps: number[];
  punch: string;
  line: string;
  color: string;
  deep: string;
}

export const CHORD_TYPES: ChordType[] = [
  { id: 'major', suffix: '',     label: 'Major',        semis: [0, 4, 7],     degrees: ['1', '3', '5'],         steps: 'Whole+Half · Half+Whole (4-3)', letterSteps: [0, 2, 4],    punch: 'Happy ☀️',    line: 'Bright like a sunny birthday.', color: '#58CC02', deep: '#3D8E00' },
  { id: 'minor', suffix: 'm',    label: 'Minor',        semis: [0, 3, 7],     degrees: ['1', '♭3', '5'],        steps: 'Half+Whole · Whole+Half (3-4)', letterSteps: [0, 2, 4],    punch: 'Sad 🌧️',      line: 'Slide the middle note DOWN a half-step.', color: '#5BB8E3', deep: '#2E84AD' },
  { id: 'dim',   suffix: 'dim',  label: 'Diminished',   semis: [0, 3, 6],     degrees: ['1', '♭3', '♭5'],       steps: 'Half+Whole · Half+Whole (3-3)', letterSteps: [0, 2, 4],    punch: 'Spooky 👻',   line: 'Both top notes squished down — scary movie!', color: '#9b6bff', deep: '#6b3fd4' },
  { id: 'aug',   suffix: 'aug',  label: 'Augmented',    semis: [0, 4, 8],     degrees: ['1', '3', '♯5'],        steps: 'Whole+Half · Whole+Half (4-4)', letterSteps: [0, 2, 4],    punch: 'Dreamy ✨',   line: 'Stretch the top note UP — floaty and mysterious.', color: '#FF7A52', deep: '#C2410C' },
  { id: 'maj7',  suffix: 'maj7', label: 'Major 7th',    semis: [0, 4, 7, 11], degrees: ['1', '3', '5', '7'],    steps: 'Add the note a half-step under the root', letterSteps: [0, 2, 4, 6], punch: 'Jazzy 😎',    line: 'Smooth, classy, coffee-shop vibes.', color: '#F5B800', deep: '#C28A00' },
  { id: 'dom7',  suffix: '7',    label: 'Dominant 7th', semis: [0, 4, 7, 10], degrees: ['1', '3', '5', '♭7'],   steps: 'Add a whole-step under the root', letterSteps: [0, 2, 4, 6], punch: 'Bluesy 🎷',   line: 'Itchy — it really wants to go home.', color: '#F5B800', deep: '#C28A00' },
  { id: 'min7',  suffix: 'm7',   label: 'Minor 7th',    semis: [0, 3, 7, 10], degrees: ['1', '♭3', '5', '♭7'],  steps: 'Minor chord + a flat 7th', letterSteps: [0, 2, 4, 6], punch: 'Chill 🛋️',    line: 'Mellow and cozy, like a lazy Sunday.', color: '#F5B800', deep: '#C28A00' },
  { id: 'sus2',  suffix: 'sus2', label: 'Suspended 2',  semis: [0, 2, 7],     degrees: ['1', '2', '5'],         steps: 'Swap the 3rd for the 2nd', letterSteps: [0, 1, 4],    punch: 'Open 🌅',     line: 'No happy/sad — wide and waiting.', color: '#58CC02', deep: '#3D8E00' },
  { id: 'sus4',  suffix: 'sus4', label: 'Suspended 4',  semis: [0, 5, 7],     degrees: ['1', '4', '5'],         steps: 'Swap the 3rd for the 4th', letterSteps: [0, 3, 4],    punch: 'Suspense 🎬', line: 'Hangs in the air — needs to resolve!', color: '#58CC02', deep: '#3D8E00' },
];

export const chordTypeById = (id: string): ChordType =>
  CHORD_TYPES.find((c) => c.id === id) ?? CHORD_TYPES[0];

export interface ChordFamily { id: string; name: string; icon: string; hook: string; types: string[]; }

export const CHORD_FAMILIES: ChordFamily[] = [
  { id: 'triads', name: 'Triads', icon: '🔺', hook: "3 notes stacked. The 'middle' note decides the mood.", types: ['major', 'minor', 'dim', 'aug'] },
  { id: 'sevenths', name: 'Sevenths', icon: '7️⃣', hook: 'Triad + one extra note on top. Richer, jazzier.', types: ['maj7', 'dom7', 'min7'] },
  { id: 'suspended', name: 'Suspended', icon: '⏸️', hook: 'Swap the middle note — no major or minor, just tension.', types: ['sus2', 'sus4'] },
];

export interface ChordRoot { name: string; midi: number; letter: number; }

export const CHORD_ROOTS: ChordRoot[] = [
  { name: 'C', midi: 60, letter: 0 }, { name: 'D', midi: 62, letter: 1 },
  { name: 'E', midi: 64, letter: 2 }, { name: 'F', midi: 65, letter: 3 },
  { name: 'G', midi: 67, letter: 4 }, { name: 'A', midi: 69, letter: 5 },
];

export interface BuiltChord {
  type: ChordType;
  root: ChordRoot;
  notes: number[];
  name: string;
}

export function buildChord(typeId: string, root: ChordRoot): BuiltChord {
  const type = chordTypeById(typeId);
  return { type, root, notes: type.semis.map((s) => root.midi + s), name: root.name + type.suffix };
}

// Spell each chord tone with the correct letter + accidental (root-aware).
const LETTER_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];

export interface SpelledNote { name: string; letterIdx: number; acc: string; midi: number; }

export function spellChord(chord: BuiltChord): SpelledNote[] {
  return chord.type.semis.map((_, i) => {
    const letterIdx = (((chord.root.letter + chord.type.letterSteps[i]) % 7) + 7) % 7;
    const midi = chord.notes[i];
    let diff = (midi % 12) - LETTER_PC[letterIdx];
    if (diff > 6) diff -= 12;
    if (diff < -6) diff += 12;
    const acc = diff === 0 ? '' : diff === 1 ? '♯' : diff === -1 ? '♭' : diff === 2 ? '𝄪' : diff === -2 ? '𝄫' : '';
    return { name: LETTER_NAMES[letterIdx] + acc, letterIdx, acc, midi };
  });
}

// ── Circle of fifths ───────────────────────────────────────────────
export interface CofKey {
  maj: string; min: string; root: number; minRoot: number;
  sig: number; acc: '#' | 'b'; scale: string[];
}

export const COF_KEYS: CofKey[] = [
  { maj: 'C',  min: 'Am',  root: 60, minRoot: 57, sig: 0, acc: '#', scale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
  { maj: 'G',  min: 'Em',  root: 67, minRoot: 64, sig: 1, acc: '#', scale: ['G', 'A', 'B', 'C', 'D', 'E', 'F♯'] },
  { maj: 'D',  min: 'Bm',  root: 62, minRoot: 59, sig: 2, acc: '#', scale: ['D', 'E', 'F♯', 'G', 'A', 'B', 'C♯'] },
  { maj: 'A',  min: 'F♯m', root: 69, minRoot: 66, sig: 3, acc: '#', scale: ['A', 'B', 'C♯', 'D', 'E', 'F♯', 'G♯'] },
  { maj: 'E',  min: 'C♯m', root: 64, minRoot: 61, sig: 4, acc: '#', scale: ['E', 'F♯', 'G♯', 'A', 'B', 'C♯', 'D♯'] },
  { maj: 'B',  min: 'G♯m', root: 71, minRoot: 68, sig: 5, acc: '#', scale: ['B', 'C♯', 'D♯', 'E', 'F♯', 'G♯', 'A♯'] },
  { maj: 'G♭', min: 'E♭m', root: 66, minRoot: 63, sig: 6, acc: 'b', scale: ['G♭', 'A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F'] },
  { maj: 'D♭', min: 'B♭m', root: 61, minRoot: 58, sig: 5, acc: 'b', scale: ['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C'] },
  { maj: 'A♭', min: 'Fm',  root: 68, minRoot: 65, sig: 4, acc: 'b', scale: ['A♭', 'B♭', 'C', 'D♭', 'E♭', 'F', 'G'] },
  { maj: 'E♭', min: 'Cm',  root: 63, minRoot: 60, sig: 3, acc: 'b', scale: ['E♭', 'F', 'G', 'A♭', 'B♭', 'C', 'D'] },
  { maj: 'B♭', min: 'Gm',  root: 70, minRoot: 67, sig: 2, acc: 'b', scale: ['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A'] },
  { maj: 'F',  min: 'Dm',  root: 65, minRoot: 62, sig: 1, acc: 'b', scale: ['F', 'G', 'A', 'B♭', 'C', 'D', 'E'] },
];

export const COF_SHARP_ORDER = ['F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯'];
export const COF_FLAT_ORDER = ['B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭', 'F♭'];

export const majTriad = (r: number) => [r, r + 4, r + 7];
export const minTriad = (r: number) => [r, r + 3, r + 7];
export const majScaleMidi = (r: number) => [0, 2, 4, 5, 7, 9, 11].map((s) => r + s);

export function cofSigText(k: CofKey): string {
  if (k.sig === 0) return 'No sharps or flats';
  const order = k.acc === '#' ? COF_SHARP_ORDER : COF_FLAT_ORDER;
  const word = k.acc === '#' ? (k.sig === 1 ? 'sharp' : 'sharps') : (k.sig === 1 ? 'flat' : 'flats');
  return `${k.sig} ${word} · ${order.slice(0, k.sig).join(' ')}`;
}
