// Placement test — a handful of self-assessment questions that drop a new
// learner into the right level of the Kindergarten → Master pathway, the way
// Simply Piano asks a few questions before your first lesson.
//
// Pure logic (no React) so it's unit-testable: answers → score → level.

import { LEVELS, PATH_ITEMS } from './pathway';

export interface PlacementOption {
  label: string;
  /** Higher = more experienced. */
  score: number;
}

export interface PlacementQuestion {
  id: string;
  prompt: string;
  options: PlacementOption[];
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: 'experience',
    prompt: 'Have you played piano before?',
    options: [
      { label: 'Never — total beginner', score: 0 },
      { label: 'A little, here and there', score: 1 },
      { label: 'Yes, I can play some songs', score: 2 },
      { label: "I'm quite advanced", score: 3 },
    ],
  },
  {
    id: 'middleC',
    prompt: 'Can you find middle C and play a simple melody?',
    options: [
      { label: 'Not yet', score: 0 },
      { label: 'With a bit of help', score: 1 },
      { label: 'Easily', score: 2 },
    ],
  },
  {
    id: 'chords',
    prompt: 'Do you know major and minor chords?',
    options: [
      { label: 'What are those?', score: 0 },
      { label: 'A few of them', score: 1 },
      { label: 'Yes, comfortably', score: 2 },
    ],
  },
  {
    id: 'reading',
    prompt: 'Can you read sheet music?',
    options: [
      { label: 'No', score: 0 },
      { label: 'A little', score: 1 },
      { label: 'Fluently', score: 2 },
    ],
  },
];

/** Max possible score across all questions (used for progress UI / tests). */
export const MAX_PLACEMENT_SCORE = PLACEMENT_QUESTIONS.reduce(
  (sum, q) => sum + Math.max(...q.options.map((o) => o.score)),
  0,
);

export interface PlacementResult {
  /** 1..6 — the LEVELS index the learner is placed into. */
  levelIndex: number;
  levelName: string;
  /** The grade number the learner starts on within that level. */
  gradeNumber: number;
  /** Authored lessons to mark complete (everything below the start grade). */
  completedLessonIds: string[];
}

/** Map a total score to a level index (1..6). */
export function scoreToLevelIndex(total: number): number {
  if (total <= 1) return 1; // Kindergarten
  if (total <= 3) return 2; // Elementary
  if (total <= 5) return 3; // Middle School
  if (total <= 7) return 4; // High School
  if (total <= 8) return 5; // University
  return 6;                  // Master
}

/** Compute the full placement from an answer score per question (in order). */
export function computePlacement(scores: number[]): PlacementResult {
  const total = scores.reduce((a, b) => a + b, 0);
  const levelIndex = scoreToLevelIndex(total);
  const level = LEVELS[levelIndex - 1];

  // Start on the first numbered grade of the placed level.
  const firstGrade = PATH_ITEMS.find(
    (it) => it.levelId === level.id && it.kind === 'grade',
  );
  const gradeNumber = firstGrade?.gradeNumber ?? 1;

  // Mark every authored numbered grade below the start grade as complete, so the
  // pathway's START card advances to the placed level. Only numbered grades
  // count — optional concepts/songs are never auto-completed.
  const completedLessonIds = PATH_ITEMS
    .filter((it) => it.lessonRef && it.gradeNumber !== undefined && it.gradeNumber < gradeNumber)
    .map((it) => it.lessonRef!.lessonId);

  return { levelIndex, levelName: level.short, gradeNumber, completedLessonIds };
}
