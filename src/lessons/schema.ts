// Piano Professor — lesson data schema
// Drives the lesson engine. Each lesson is a sequence of steps,
// each step a sequence of segments. Mirrors the structure of the
// prototype's hardcoded lessons.js (root of repo).

export type LedColorName =
  | 'cyan' | 'magenta' | 'yellow' | 'green' | 'red' | 'orange' | 'sky' | 'violet' | 'pink';

export interface SaySegment {
  type: 'say';
  text: string;
  /** TTS speed multiplier. Default 1.0 */
  rate?: number;
  /** TTS pitch multiplier. Default 1.0 */
  pitch?: number;
  /** Extra silent gap after this line, ms. Default 0 */
  gap?: number;
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
}

/** Light notes in sequence, one at a time. */
export interface SeqSegment {
  type: 'seq' | 'seqAll';
  notes: string[];
  color?: LedColorName;
  /** Ms between each note. Default 400 */
  delay?: number;
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
  | SaySegment | PauseSegment | ChordSegment | SeqSegment | QuizSegment;

export interface LessonStep {
  segments: LessonSegment[];
}

export interface Lesson {
  id: string;
  grade: number;
  title: string;
  subtitle?: string;
  complete: string;          // congratulations message
  xpReward: number;          // XP awarded on completion
  steps: LessonStep[];
}

export interface Grade {
  id: number;
  title: string;
  description?: string;
  lessons: Lesson[];
}
