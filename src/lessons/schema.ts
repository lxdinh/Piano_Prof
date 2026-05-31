// Piano Professor — lesson data schema
// Drives the lesson engine. Each lesson is a sequence of steps,
// each step a sequence of segments. Mirrors the structure of the
// prototype's hardcoded lessons.js (root of repo).

export type LedColorName =
  | 'cyan' | 'magenta' | 'yellow' | 'green' | 'red' | 'orange' | 'sky' | 'violet' | 'pink';

/** Which hand plays a passage. Drives LED color + "left hand first" ordering. */
export type HandName = 'left' | 'right' | 'both';

export interface SaySegment {
  type: 'say';
  text: string;
  /** TTS speed multiplier. Default 1.0 */
  rate?: number;
  /** TTS pitch multiplier. Default 1.0 */
  pitch?: number;
  /** Extra silent gap after this line, ms. Default 0 */
  gap?: number;
  /**
   * Optional pre-rendered narration audio (e.g. server-side ElevenLabs). When
   * present the engine plays it instead of on-device TTS. Populated in Phase 3.
   */
  audioUrl?: string;
}

/**
 * Spoken/visual rhythm counting (e.g. 3/4 → "1-2-3"). Lets the professor teach
 * the pulse before notes. The engine degrades to speaking the count line.
 */
export interface CountSegment {
  type: 'count';
  /** Beats per bar, e.g. 3 for 3/4. */
  beats: number;
  /** Human meter label, e.g. "3/4". */
  meter: string;
  /** Optional tempo to pace the counting. */
  tempoBpm?: number;
  /** How many bars to count. Default 1. */
  bars?: number;
  audioUrl?: string;
}

export interface PauseSegment {
  type: 'pause';
  ms: number;
}

/** Highlight several notes at once and let them ring. */
export interface ChordSegment {
  type: 'chord';
  notes: string[];           // ["C4", "E4", "G4"]
  color?: LedColorName;
  /** How long to keep lit, ms. Default 1500 */
  wait?: number;
  /** Which hand plays this. Default colors by hand when `color` is unset. */
  hand?: HandName;
}

/** Light notes in sequence, one at a time. */
export interface SeqSegment {
  type: 'seq' | 'seqAll';
  notes: string[];
  color?: LedColorName;
  /** Ms between each note. Default 400 */
  delay?: number;
  hand?: HandName;
}

/**
 * Roll a chord one note at a time, low to high ("rải nốt từ hợp âm"). Played
 * like a sequence but semantically an arpeggiation of a single chord.
 */
export interface ArpeggioSegment {
  type: 'arpeggio';
  notes: string[];           // chord tones, low → high
  color?: LedColorName;
  /** Ms between each note. Default 220 */
  delay?: number;
  /** Hold the full chord this long after rolling, ms. Default 900 */
  wait?: number;
  hand?: HandName;
}

/** Quiz prompt: ask the user to play a specific chord/note. */
export interface QuizSegment {
  type: 'quiz';
  prompt: string;
  expect: string[];          // expected notes the user must play
  /** Visual hint color for highlighted target keys */
  color?: LedColorName;
  /** Reward in XP if answered correctly */
  xp?: number;
}

export type LessonSegment =
  | SaySegment | PauseSegment | ChordSegment | SeqSegment
  | CountSegment | ArpeggioSegment | QuizSegment;

export interface LessonStep {
  segments: LessonSegment[];
}

/** A repeated chord progression detected in the score ("chord loop"). */
export interface ChordLoopSection {
  label: string;             // e.g. "Verse loop"
  chords: string[];          // e.g. ["Am", "F", "C", "G"]
  repeat: number;            // times the loop repeats
}

/** Musical metadata extracted from the score by the server analysis step. */
export interface LessonMeta {
  timeSignature?: string;    // "3/4"
  keySignature?: string;     // "G major"
  tempoBpm?: number;
  measures?: number;
  sections?: ChordLoopSection[];
}

export interface Lesson {
  id: string;
  grade: number;
  title: string;
  subtitle?: string;
  complete: string;          // congratulations message
  xpReward: number;          // XP awarded on completion
  steps: LessonStep[];
  /** Optional analysis metadata (present for OMR-imported "professor" lessons). */
  meta?: LessonMeta;
}

export interface Grade {
  id: number;
  title: string;
  description?: string;
  lessons: Lesson[];
}
