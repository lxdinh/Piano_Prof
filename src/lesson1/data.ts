// Piano Professor — Lesson 1 data, ported verbatim from "Lesson 1.html"
// (BLOCK 1 — LESSON DATA, lesson1_final_spec.md Part 2). The engine consumes
// exactly this structure. Levels follow the school stages (KG → … → Master).
import { handColor, Hand, Finger } from '../theme/handColors';
import { Dynamic } from './evaluation';

// ── Global config ─────────────────────────────
export const KEYBOARD = { lowest: 'C2', highest: 'C7', keys: 61 };  // 5-octave, Middle C = C4
export const LED_STRIP = { count: 60, lowest: 'C2', highest: 'B6' }; // C7 has NO LED — never light C7
export const CHORD_WINDOW_MS = 200;   // "simultaneous" = all keys down within 200ms, no extra keys
export const CHORD_WINDOW_LH_MS = 200;
export const WRONG_FLASH_MS = 150;    // red flash duration on wrong key
export const SHOW_LYRICS = true;      // DEV ONLY. Release: false → chord names + timing only (licensing)
export const SONG_BPM = 104;
export const SONG_BEATS = 4;

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export function noteToMidi(name: string): number {
  const m = /^([A-G]#?)(\d)$/.exec(name);
  if (!m) return -1;
  return (parseInt(m[2], 10) + 1) * 12 + NOTE_NAMES.indexOf(m[1]);
}
export function midiToNote(midi: number): string {
  return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
}
export const isBlackKey = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12);

export const KEY_LOW_MIDI = 36;   // C2
export const KEY_HIGH_MIDI = 96;  // C7 — counts as a key press, has no LED
export const LED_LOW_MIDI = 36;
export const LED_HIGH_MIDI = 95;  // B6
export const noteToLedIndex = (midi: number) =>
  midi >= LED_LOW_MIDI && midi <= LED_HIGH_MIDI ? midi - LED_LOW_MIDI : -1;

export const LED_RGB: Record<string, [number, number, number]> = {
  green: [88, 204, 2], cyan: [0, 205, 255], yellow: [255, 199, 0],
  orange: [255, 122, 10], red: [255, 64, 64], white: [255, 244, 214],
  // Hand-temperature colours (right hand warm, left hand cool) — see handColors.
  warm: handColor('R'), cool: handColor('L'),
};

export const ALL_LED_NOTES: string[] = (() => {
  const a: string[] = [];
  for (let m = LED_LOW_MIDI; m <= LED_HIGH_MIDI; m++) a.push(midiToNote(m));
  return a;
})();

// ── Chords (compact voicing — everything between F3 and G4) ──
export const CHORDS: Record<string, { right: string[]; left: string }> = {
  C:  { right: ['C4', 'E4', 'G4'], left: 'C3' },
  G:  { right: ['G3', 'B3', 'D4'], left: 'G2' },
  Am: { right: ['A3', 'C4', 'E4'], left: 'A2' },
  F:  { right: ['F3', 'A3', 'C4'], left: 'F2' },
};

// ── Song configs — shared by the professor's demo and the user's play-along ──
export interface SongBar { chord: string; lyric: string; }
export interface SongConfig {
  song: string;
  displayMode: 'lyrics' | 'chords';
  gateMode: 'pauseUntilCorrect';
  ignoreWrongKeys: boolean;
  ledLookAheadMs: number;
  ledColor: string;
  leftHandColor?: string;
  windowMs: number;
  chordMap: Record<string, string[]>;
  chart: SongBar[];
}

export const SONG_SMALL_TOWN_GIRL: SongConfig = {
  song: 'small_town_girl',
  displayMode: SHOW_LYRICS ? 'lyrics' : 'chords',
  gateMode: 'pauseUntilCorrect', ignoreWrongKeys: true,
  ledLookAheadMs: 500, ledColor: 'warm', windowMs: CHORD_WINDOW_MS,
  chordMap: { C: CHORDS.C.right, G: CHORDS.G.right, Am: CHORDS.Am.right, F: CHORDS.F.right },
  chart: [
    { chord: 'C', lyric: 'Just a' }, { chord: 'G', lyric: 'small town girl,' },
    { chord: 'Am', lyric: 'living in a' }, { chord: 'F', lyric: 'lonely world' },
    { chord: 'C', lyric: 'She took the' }, { chord: 'G', lyric: 'midnight train going' },
    { chord: 'Am', lyric: 'anywhere' }, { chord: 'F', lyric: '' },
  ],
};

export const SONG_LOVE_STORY: SongConfig = {
  song: 'love_story',
  displayMode: SHOW_LYRICS ? 'lyrics' : 'chords',
  gateMode: 'pauseUntilCorrect', ignoreWrongKeys: true,
  ledLookAheadMs: 500, ledColor: 'warm', windowMs: CHORD_WINDOW_MS,
  chordMap: { C: CHORDS.C.right, G: CHORDS.G.right, Am: CHORDS.Am.right, F: CHORDS.F.right },
  chart: [
    { chord: 'C', lyric: 'Romeo take me' },
    { chord: 'C', lyric: 'somewhere we can be alone' },
    { chord: 'G', lyric: "I'll be waiting," },
    { chord: 'G', lyric: "all there's left to do is run" },
    { chord: 'Am', lyric: "You'll be the prince and" },
    { chord: 'Am', lyric: "I'll be the princess" },
    { chord: 'F', lyric: "It's a love story," },
    { chord: 'G', lyric: 'baby just say' },
    { chord: 'C', lyric: 'yes' },
  ],
};

export const SONG_DSB_CHORUS: SongConfig = {
  song: 'dont_stop_believin_chorus',
  displayMode: SHOW_LYRICS ? 'lyrics' : 'chords',
  gateMode: 'pauseUntilCorrect', ignoreWrongKeys: true,
  ledLookAheadMs: 500, ledColor: 'warm', leftHandColor: 'cool',
  windowMs: CHORD_WINDOW_LH_MS,
  chordMap: {
    C: [CHORDS.C.left, ...CHORDS.C.right],
    G: [CHORDS.G.left, ...CHORDS.G.right],
    Am: [CHORDS.Am.left, ...CHORDS.Am.right],
    F: [CHORDS.F.left, ...CHORDS.F.right],
  },
  chart: [
    { chord: 'C', lyric: "Don't stop" }, { chord: 'G', lyric: 'believing,' },
    { chord: 'Am', lyric: 'hold on to the' }, { chord: 'F', lyric: 'feeling' },
    { chord: 'C', lyric: 'Streetlight' }, { chord: 'G', lyric: 'people' },
    { chord: 'Am', lyric: '' }, { chord: 'F', lyric: '' },
  ],
};

export const SONG_TITLES: Record<string, string> = {
  small_town_girl: "Don't Stop Believin' — Journey (verse)",
  love_story: 'Love Story — Taylor Swift',
  dont_stop_believin_chorus: "Don't Stop Believin' — chorus · + left hand",
};

// ── Segment model ──
export type Segment =
  | { type: 'mascot'; action: 'appear' }
  | { type: 'typeSay'; text: string; rate?: number }
  | { type: 'say'; text: string; rate?: number }
  | { type: 'pause'; ms: number }
  | { type: 'ledOn'; notes: string[] | 'all'; color?: string; effect?: string }
  | { type: 'ledOff'; notes: string[] | 'all' }
  | { type: 'sayWithSeq'; text: string; notes: string[]; color: string; syncPerWord?: boolean; rate?: number }
  | { type: 'waitPressCount'; note: string; count: number; showTicks?: boolean; onWrongKey?: WrongOpts }
  | { type: 'waitPressAll'; notes: string[]; anyOrder?: boolean; turnOffOnPress?: boolean; onWrongKey?: WrongOpts }
  | { type: 'waitPressOrdered'; notes: string[]; turnOffOnPress?: boolean; onWrongOrder?: WrongOpts }
  | { type: 'waitPressAny'; notes: string[]; onWrongKey?: WrongOpts }
  // Graded single note: lit in the finger colour at the intended-dynamic
  // brightness; scored on pitch + hold length + dynamics with spoken coaching.
  | { type: 'waitNote'; note: string; hand?: Hand; finger?: Finger; dynamic?: Dynamic; durationBeats?: number; onWrongKey?: WrongOpts }
  | { type: 'waitChord'; notes: string[]; windowMs: number; onNotSimultaneous?: { say: string } }
  | { type: 'waitChordCount'; notes: string[]; count: number; windowMs: number; showTicks?: boolean }
  | { type: 'followLight'; sequence: { chord: string[] }[]; color: string; windowMs: number; turnOffOnPress?: boolean }
  | ({ type: 'songDemo' } & SongConfig)
  | ({ type: 'playAlong' } & SongConfig)
  | { type: 'quiz'; mode: 'multipleChoice'; question: string; options: string[]; answer: number; retryUntilCorrect?: boolean; onWrong?: { label: string }; onCorrect?: { typeSay: string } }
  | { type: 'nextButton' }
  | { type: 'awardXP'; amount: number }
  | { type: 'lessonCompleteScreen' };

export interface WrongOpts { led?: 'redFlash'; say?: string; }
export interface LessonStep { title: string; segments: Segment[]; }
export interface Lesson1 { steps: LessonStep[]; }

// ── LESSON 1 — First Touch → First Songs ──
export const LESSON_1: Lesson1 = {
  steps: [

  // SECTION 1 — FIRST TOUCH
  { title: 'First Touch', segments: [
    { type: 'mascot', action: 'appear' },
    { type: 'typeSay', text: 'Hi there! Welcome to your very first piano lesson.' },
    { type: 'pause', ms: 400 },

    { type: 'ledOn', notes: ['C#4', 'D#4'], color: 'orange' },
    { type: 'typeSay', text: "First, let's find the group of 2 black keys in the middle of your piano — they're glowing orange." },
    { type: 'pause', ms: 700 },
    { type: 'ledOff', notes: ['C#4', 'D#4'] },
    { type: 'ledOn', notes: ['C4'], color: 'green' },
    { type: 'typeSay', text: 'Now, place your right thumb on the white key just to the left of them.' },
    { type: 'typeSay', text: 'This key is called Middle C.' },

    { type: 'typeSay', text: 'Go ahead — play C 3 times.' },
    { type: 'waitPressCount', note: 'C4', count: 3, showTicks: true,
      onWrongKey: { led: 'redFlash', say: "That's not C — press the glowing key." } },
    { type: 'ledOff', notes: 'all' },

    { type: 'typeSay', text: "Now let's find all the C keys on the keyboard, and press each one." },
    { type: 'ledOn', notes: ['C2', 'C3', 'C4', 'C5', 'C6'], color: 'green' },
    { type: 'waitPressAll', notes: ['C2', 'C3', 'C4', 'C5', 'C6'], anyOrder: true, turnOffOnPress: true,
      onWrongKey: { led: 'redFlash' } },
    { type: 'typeSay', text: 'Nice work!' },

    { type: 'typeSay', text: 'Next, rest your fingertips gently on the green lights.' },
    { type: 'ledOn', notes: ['C4', 'D4', 'E4', 'F4', 'G4'], color: 'green' },
    { type: 'pause', ms: 300 },
    { type: 'say', text: "Remember to curve your fingers, and keep your wrist up — it shouldn't touch the keys! Now press each lit key, from left to right." },
    { type: 'waitPressOrdered', notes: ['C4', 'D4', 'E4', 'F4', 'G4'], turnOffOnPress: true,
      onWrongOrder: { led: 'redFlash' } },

    { type: 'typeSay', text: 'Perfect!' },
    { type: 'nextButton' },
  ] },

  // SECTION 2 — THE KEYBOARD AND 7 NOTES
  { title: 'The Keyboard & 7 Notes', segments: [
    { type: 'say', text: "Now, we're gonna learn about the notes on the keyboard." },
    { type: 'pause', ms: 300 },

    { type: 'ledOn', notes: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4'], color: 'cyan' },
    { type: 'typeSay', text: 'An octave has 12 keys. Take a look at them on the keyboard.' },
    { type: 'pause', ms: 2000 },
    { type: 'ledOff', notes: 'all' },

    { type: 'ledOn', notes: ['C#4', 'D#4', 'C#5', 'D#5'], color: 'yellow' },
    { type: 'ledOn', notes: ['F#4', 'G#4', 'A#4', 'F#5', 'G#5', 'A#5'], color: 'orange' },
    { type: 'typeSay', text: 'See how the black keys come in groups of 2 and 3? That pattern repeats all the way up the keyboard.' },
    { type: 'pause', ms: 800 },
    { type: 'ledOff', notes: 'all' },

    { type: 'typeSay', text: 'And between them, there are 7 white keys in each octave.' },

    { type: 'sayWithSeq', text: "White keys start with C, D, E, F, G, A, B, and we're back at C.",
      notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], color: 'green', syncPerWord: true },

    { type: 'sayWithSeq', text: 'We can give these notes all a number: 1, 2, 3, 4, 5, 6, 7, and back to 1.',
      notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], color: 'green', syncPerWord: true },
    { type: 'pause', ms: 1000 },
    { type: 'ledOff', notes: 'all' },

    { type: 'typeSay', text: 'Alright — now try playing from C up to B, one key at a time.' },
    { type: 'ledOn', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'], color: 'green' },
    { type: 'waitPressOrdered', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'], turnOffOnPress: true,
      onWrongOrder: { led: 'redFlash' } },
    { type: 'ledOff', notes: 'all' },

    { type: 'typeSay', text: "Let's see if you remember. Can you play a C for me?" },
    { type: 'waitPressAny', notes: ['C2', 'C3', 'C4', 'C5', 'C6', 'C7'],
      onWrongKey: { led: 'redFlash', say: 'Try again!' } },
    { type: 'typeSay', text: "That's the one!" },
    { type: 'pause', ms: 300 },

    { type: 'typeSay', text: 'Great! Now, can you find an F?' },
    { type: 'waitPressAny', notes: ['F2', 'F3', 'F4', 'F5', 'F6'],
      onWrongKey: { led: 'redFlash', say: 'Try again!' } },
    { type: 'typeSay', text: 'You got it!' },
    { type: 'pause', ms: 300 },

    { type: 'ledOn', notes: ['B4'], color: 'green' },
    { type: 'quiz', mode: 'multipleChoice',
      question: 'What note is glowing?',
      options: ['E', 'G', 'B'], answer: 2,
      retryUntilCorrect: true,
      onWrong: { label: 'Incorrect' },
      onCorrect: { typeSay: 'Good job!' } },
    { type: 'ledOff', notes: 'all' },
    { type: 'nextButton' },
  ] },

  // SECTION 3 — 4 CHORDS
  { title: '4 Chords', segments: [
    { type: 'typeSay', text: 'Now move on to the simple chords.' },
    { type: 'typeSay', text: 'Most pop songs use just 4 chords: C, G, Am, F.' },

    { type: 'ledOn', notes: CHORDS.C.right, color: 'green' },
    { type: 'typeSay', text: "Let's study Chord C — chord number 1." },
    { type: 'say', text: 'Place your thumb on Middle C.' },
    { type: 'typeSay', text: 'Press C, E, G simultaneously.' },
    { type: 'waitChord', notes: CHORDS.C.right, windowMs: CHORD_WINDOW_MS,
      onNotSimultaneous: { say: 'You have to press them simultaneously!' } },
    { type: 'typeSay', text: 'Correct!' },
    { type: 'ledOff', notes: 'all' },
    { type: 'typeSay', text: 'Now play chord C 3 times.' },
    { type: 'waitChordCount', notes: CHORDS.C.right, count: 3, windowMs: CHORD_WINDOW_MS, showTicks: true },

    { type: 'ledOn', notes: CHORDS.G.right, color: 'green' },
    { type: 'typeSay', text: "Let's study Chord G — chord number 5." },
    { type: 'say', text: 'Place your thumb on the G just below Middle C.' },
    { type: 'typeSay', text: 'Press G, B, D simultaneously.' },
    { type: 'waitChord', notes: CHORDS.G.right, windowMs: CHORD_WINDOW_MS,
      onNotSimultaneous: { say: 'You have to press them simultaneously!' } },
    { type: 'typeSay', text: 'Correct!' },
    { type: 'ledOff', notes: 'all' },
    { type: 'typeSay', text: 'Now play chord G 3 times.' },
    { type: 'waitChordCount', notes: CHORDS.G.right, count: 3, windowMs: CHORD_WINDOW_MS, showTicks: true },

    { type: 'ledOn', notes: CHORDS.Am.right, color: 'green' },
    { type: 'typeSay', text: "Let's study Chord A minor — chord number 6." },
    { type: 'say', text: 'Place your thumb on the A below Middle C.' },
    { type: 'typeSay', text: 'Press A, C, E simultaneously.' },
    { type: 'waitChord', notes: CHORDS.Am.right, windowMs: CHORD_WINDOW_MS,
      onNotSimultaneous: { say: 'You have to press them simultaneously!' } },
    { type: 'typeSay', text: 'Correct!' },
    { type: 'ledOff', notes: 'all' },
    { type: 'typeSay', text: 'Now play chord Am 3 times.' },
    { type: 'waitChordCount', notes: CHORDS.Am.right, count: 3, windowMs: CHORD_WINDOW_MS, showTicks: true },

    { type: 'ledOn', notes: CHORDS.F.right, color: 'green' },
    { type: 'typeSay', text: "Let's study Chord F — chord number 4." },
    { type: 'say', text: 'Place your thumb on the F below Middle C.' },
    { type: 'typeSay', text: 'Press F, A, C simultaneously.' },
    { type: 'waitChord', notes: CHORDS.F.right, windowMs: CHORD_WINDOW_MS,
      onNotSimultaneous: { say: 'You have to press them simultaneously!' } },
    { type: 'typeSay', text: 'Correct!' },
    { type: 'ledOff', notes: 'all' },
    { type: 'typeSay', text: 'Now play chord F 3 times.' },
    { type: 'waitChordCount', notes: CHORDS.F.right, count: 3, windowMs: CHORD_WINDOW_MS, showTicks: true },

    { type: 'nextButton' },
  ] },

  // Practice: follow the light
  { title: 'Follow the Light', segments: [
    { type: 'typeSay', text: 'Practice: follow the light!' },
    { type: 'followLight',
      sequence: ['C', 'C', 'G', 'G', 'Am', 'Am', 'F', 'F'].map((c) => ({ chord: CHORDS[c].right })),
      color: 'cyan', windowMs: CHORD_WINDOW_MS, turnOffOnPress: true },
    { type: 'nextButton' },
  ] },

  // Songs 1 & 2 (right hand)
  { title: 'Play Your First Songs', segments: [
    { type: 'say', text: 'Song time! The music only moves forward when you play the right chord.' },
    { type: 'typeSay', text: "First up: Don't Stop Believin', by Journey." },
    { type: 'say', text: "Listen first — I'll play it once." },
    { type: 'songDemo', ...SONG_SMALL_TOWN_GIRL },
    { type: 'typeSay', text: 'Now your turn!' },
    { type: 'playAlong', ...SONG_SMALL_TOWN_GIRL },

    { type: 'typeSay', text: 'Beautiful! Next up: Love Story, by Taylor Swift.' },
    { type: 'say', text: "Listen first — I'll play it once." },
    { type: 'songDemo', ...SONG_LOVE_STORY },
    { type: 'typeSay', text: 'Now your turn!' },
    { type: 'playAlong', ...SONG_LOVE_STORY },
    { type: 'nextButton' },
  ] },

  // Song 3: add the left hand
  { title: 'Play with Feeling', segments: [
    { type: 'mascot', action: 'appear' },
    { type: 'typeSay', text: 'Music has feelings! The same note can whisper or shout — it depends how you press.' },
    { type: 'typeSay', text: 'See the key glow bright? Bright means play it STRONG. Give this C a firm press!' },
    { type: 'waitNote', note: 'C4', hand: 'R', finger: 1, dynamic: 'f',
      onWrongKey: { led: 'redFlash', say: 'Find the glowing key first.' } },
    { type: 'typeSay', text: 'Now it glows soft — play this one gently, like telling a secret.' },
    { type: 'waitNote', note: 'C4', hand: 'R', finger: 1, dynamic: 'p',
      onWrongKey: { led: 'redFlash', say: 'That same C — but soft this time.' } },
    { type: 'say', text: 'Beautiful! Loud and soft is how you tell a story on the piano.' },
  ] },

  { title: 'Add Your Left Hand', segments: [
    { type: 'typeSay', text: "Let's get more advanced by adding your left hand!" },
    { type: 'say', text: 'Your left hand adds one low note — the same letter as your right thumb.' },
    { type: 'ledOn', notes: CHORDS.C.right, color: 'green' },
    { type: 'ledOn', notes: [CHORDS.C.left], color: 'orange' },
    { type: 'say', text: 'For example: in Chord C, your right thumb is on C — so your left hand plays the low C, glowing orange.' },
    { type: 'ledOff', notes: 'all' },
    { type: 'ledOn', notes: CHORDS.G.right, color: 'green' },
    { type: 'ledOn', notes: [CHORDS.G.left], color: 'orange' },
    { type: 'say', text: 'Same idea in Chord G: right thumb on G, left hand on the low G.' },
    { type: 'pause', ms: 1200 },
    { type: 'ledOff', notes: 'all' },
    { type: 'typeSay', text: "We'll play the chorus of Don't Stop Believin' — left hand included this time." },

    { type: 'say', text: "Listen first — I'll play it once, both hands." },
    { type: 'songDemo', ...SONG_DSB_CHORUS },
    { type: 'typeSay', text: 'Now your turn!' },
    { type: 'playAlong', ...SONG_DSB_CHORUS },

    { type: 'typeSay', text: 'Lesson 1 complete — you played real songs on day one!' },
    { type: 'ledOn', notes: 'all', color: 'rainbow', effect: 'celebration' },
    { type: 'pause', ms: 2000 },
    { type: 'ledOff', notes: 'all' },
    { type: 'awardXP', amount: 50 },
    { type: 'lessonCompleteScreen' },
  ] },

  ],
};

export const CHORD_NAME_LOOKUP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  Object.keys(CHORDS).forEach((name) => {
    m[CHORDS[name].right.join(',')] = name;
    m[[CHORDS[name].left, ...CHORDS[name].right].join(',')] = name;
  });
  return m;
})();
export const chordDisplayName = (notes: string[]): string =>
  CHORD_NAME_LOOKUP[notes.join(',')] || notes.map((n) => n.replace(/\d/g, '')).join('·');
