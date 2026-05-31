// Chord theory — the "music tree" behind the Practice chord library.
//
// A chord is picked in two steps, exactly like the UI prompts:
//   1. a ROOT  (letter C..B, optionally sharp/flat)
//   2. a QUALITY (maj, min, maj7, m7b5, 13, …)
// From (root, quality) we derive both the display note names and the MIDI
// notes to light + play on the keyboard.
//
// Everything here is pure + framework-free so it's trivially unit-testable.

export type Accidental = 'natural' | 'sharp' | 'flat';

export interface Root {
  /** Letter A–G. */
  letter: string;
  accidental: Accidental;
  /** Pitch class 0–11 (C = 0). */
  pc: number;
  /** Display name, e.g. "C", "F#", "Bb". */
  label: string;
}

export interface ChordQuality {
  /** Stable id, e.g. "maj7". */
  id: string;
  /** Suffix appended to the root, e.g. "maj7" → "Cmaj7". */
  suffix: string;
  /** Full spoken name, e.g. "major 7th". */
  name: string;
  /** Semitone offsets from the root (drives MIDI + lit keys). */
  intervals: number[];
  /**
   * Scale degree for each interval (1 = root, 3 = third, 7 = seventh,
   * 9/11/13 = extensions). Drives correct enharmonic note spelling so e.g. a
   * minor 7th reads C–Eb–G–Bb, not C–D#–G–A#. Parallel to `intervals`.
   */
  degrees: number[];
  /** One-line description of the feeling/use. */
  blurb: string;
}

export interface ChordCategory {
  id: string;
  title: string;
  qualities: ChordQuality[];
}

// ── Roots ─────────────────────────────────────────────────────────────────────
const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const ROOT_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

const ACC_SUFFIX: Record<Accidental, string> = { natural: '', sharp: '#', flat: 'b' };
const ACC_SHIFT: Record<Accidental, number> = { natural: 0, sharp: 1, flat: -1 };

export function makeRoot(letter: string, accidental: Accidental = 'natural'): Root {
  const base = LETTER_PC[letter.toUpperCase()] ?? 0;
  const pc = ((base + ACC_SHIFT[accidental]) % 12 + 12) % 12;
  return { letter: letter.toUpperCase(), accidental, pc, label: letter.toUpperCase() + ACC_SUFFIX[accidental] };
}

// ── Note spelling ─────────────────────────────────────────────────────────────
// Proper degree-based spelling: a chord note is named from the letter its scale
// degree lands on, then accidentals (#, b, x, bb) are added so the pitch class
// matches. This makes a Cm7 read C–Eb–G–Bb (not C–D#–G–A#) and a C°7 read
// C–Eb–Gb–Bbb — which is what a learning app should teach.
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_INDEX: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

// Map a scale degree (1,3,5,7,9,11,13) to how many letters above the root it is.
function letterStepsForDegree(degree: number): number {
  return (degree - 1) % 7;
}

function accidentalString(delta: number): string {
  if (delta === 0) return '';
  if (delta === 1) return '#';
  if (delta === 2) return 'x';      // double sharp
  if (delta === -1) return 'b';
  if (delta === -2) return 'bb';    // double flat
  return delta > 0 ? '#'.repeat(delta) : 'b'.repeat(-delta);
}

/** Name a chord tone from its root, target pitch class, and scale degree. */
function spellDegree(root: Root, targetPc: number, degree: number): string {
  const letterIdx = (LETTER_INDEX[root.letter] + letterStepsForDegree(degree)) % 7;
  const letter = LETTERS[letterIdx];
  const naturalPc = LETTER_PC[letter];
  // Smallest signed accidental that turns the natural letter into the target pc.
  let delta = (((targetPc - naturalPc) % 12) + 12) % 12;
  if (delta > 6) delta -= 12; // prefer flats over many sharps (e.g. 11 → -1)
  return letter + accidentalString(delta);
}

// ── The chord tree ────────────────────────────────────────────────────────────
// Grouped root→quality so the UI can present a clean, theory-ordered menu.
// Every common chord lives here; intervals are semitones from the root.
export const CHORD_TREE: ChordCategory[] = [
  {
    id: 'triads',
    title: 'Triads',
    qualities: [
      { id: 'maj',  suffix: '',     name: 'major',          intervals: [0, 4, 7],  degrees: [1, 3, 5],  blurb: 'Bright and happy — the home base.' },
      { id: 'min',  suffix: 'm',    name: 'minor',          intervals: [0, 3, 7],  degrees: [1, 3, 5],  blurb: 'Soft and sad — the minor color.' },
      { id: 'dim',  suffix: 'dim',  name: 'diminished',     intervals: [0, 3, 6],  degrees: [1, 3, 5],  blurb: 'Tense and spooky — wants to resolve.' },
      { id: 'aug',  suffix: 'aug',  name: 'augmented',      intervals: [0, 4, 8],  degrees: [1, 3, 5],  blurb: 'Dreamy and unsettled — floats upward.' },
      { id: 'sus2', suffix: 'sus2', name: 'suspended 2nd',  intervals: [0, 2, 7],  degrees: [1, 2, 5],  blurb: 'Open and airy — no major/minor 3rd.' },
      { id: 'sus4', suffix: 'sus4', name: 'suspended 4th',  intervals: [0, 5, 7],  degrees: [1, 4, 5],  blurb: 'Suspended tension — leans home.' },
      { id: 'pow',  suffix: '5',    name: 'power chord',    intervals: [0, 7],     degrees: [1, 5],     blurb: 'Just root + 5th — pure and strong.' },
    ],
  },
  {
    id: 'sixths',
    title: 'Sixths',
    qualities: [
      { id: '6',   suffix: '6',   name: 'major 6th',  intervals: [0, 4, 7, 9],  degrees: [1, 3, 5, 6],  blurb: 'Sweet, vintage, jazzy major.' },
      { id: 'm6',  suffix: 'm6',  name: 'minor 6th',  intervals: [0, 3, 7, 9],  degrees: [1, 3, 5, 6],  blurb: 'Smooth minor with a wistful lift.' },
    ],
  },
  {
    id: 'sevenths',
    title: 'Sevenths',
    qualities: [
      { id: '7',     suffix: '7',     name: 'dominant 7th',     intervals: [0, 4, 7, 10], degrees: [1, 3, 5, 7], blurb: 'Bluesy and driving — wants to move.' },
      { id: 'maj7',  suffix: 'maj7',  name: 'major 7th',        intervals: [0, 4, 7, 11], degrees: [1, 3, 5, 7], blurb: 'Lush and dreamy — classic jazz.' },
      { id: 'm7',    suffix: 'm7',    name: 'minor 7th',        intervals: [0, 3, 7, 10], degrees: [1, 3, 5, 7], blurb: 'Mellow and cool — soulful minor.' },
      { id: 'mMaj7', suffix: 'mMaj7', name: 'minor-major 7th',  intervals: [0, 3, 7, 11], degrees: [1, 3, 5, 7], blurb: 'Mysterious — James Bond tension.' },
      { id: 'dim7',  suffix: 'dim7',  name: 'diminished 7th',   intervals: [0, 3, 6, 9],  degrees: [1, 3, 5, 7], blurb: 'Fully tense — stacked minor 3rds.' },
      { id: 'm7b5',  suffix: 'm7b5',  name: 'half-diminished',  intervals: [0, 3, 6, 10], degrees: [1, 3, 5, 7], blurb: 'Smoky and unresolved — jazz ii–V.' },
      { id: 'aug7',  suffix: '7#5',   name: 'augmented 7th',    intervals: [0, 4, 8, 10], degrees: [1, 3, 5, 7], blurb: 'Raised 5th with a bite.' },
    ],
  },
  {
    id: 'extensions',
    title: 'Extensions',
    qualities: [
      { id: 'add9', suffix: 'add9', name: 'added 9th',     intervals: [0, 4, 7, 14],     degrees: [1, 3, 5, 9],         blurb: 'Major with a shimmering 9th on top.' },
      { id: '9',    suffix: '9',    name: 'dominant 9th',  intervals: [0, 4, 7, 10, 14],  degrees: [1, 3, 5, 7, 9],      blurb: 'Funky and full — 7th plus a 9th.' },
      { id: 'maj9', suffix: 'maj9', name: 'major 9th',     intervals: [0, 4, 7, 11, 14],  degrees: [1, 3, 5, 7, 9],      blurb: 'Gorgeous and open — pure lush.' },
      { id: 'm9',   suffix: 'm9',   name: 'minor 9th',     intervals: [0, 3, 7, 10, 14],  degrees: [1, 3, 5, 7, 9],      blurb: 'Deep, velvety minor color.' },
      { id: '11',   suffix: '11',   name: 'dominant 11th', intervals: [0, 7, 10, 14, 17], degrees: [1, 5, 7, 9, 11],     blurb: 'Wide and suspended — gospel flavor.' },
      { id: '13',   suffix: '13',   name: 'dominant 13th', intervals: [0, 4, 10, 14, 21], degrees: [1, 3, 7, 9, 13],     blurb: 'Big band richness — the full stack.' },
    ],
  },
];

/** Flat lookup of every quality by id. */
export const QUALITIES_BY_ID: Record<string, ChordQuality> = Object.fromEntries(
  CHORD_TREE.flatMap((c) => c.qualities).map((q) => [q.id, q]),
);

// ── Derived chord data ────────────────────────────────────────────────────────
export interface BuiltChord {
  name: string;        // "Cmaj7"
  spokenName: string;  // "C major 7th"
  noteNames: string[]; // ["C", "E", "G", "B"]
  midi: number[];      // sorted MIDI notes to light + play
}

// Base octave for the root so even the tallest stack (13th = +21 semis) stays
// inside the rendered keyboard (C2..B6 = MIDI 36..83). C3 = 48 keeps B13 ≤ 80.
const ROOT_BASE_MIDI = 48;

export function buildChord(root: Root, quality: ChordQuality): BuiltChord {
  const rootMidi = ROOT_BASE_MIDI + root.pc;
  const midi = quality.intervals.map((iv) => rootMidi + iv);
  const noteNames = quality.intervals.map((iv, i) =>
    spellDegree(root, (root.pc + iv) % 12, quality.degrees[i]),
  );
  return {
    name: root.label + quality.suffix,
    spokenName: `${root.label} ${quality.name}`,
    noteNames,
    midi,
  };
}
