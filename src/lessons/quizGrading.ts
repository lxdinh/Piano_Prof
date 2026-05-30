// Pure grading logic for "play this note/chord" quiz steps. Kept separate from
// the React engine hook so it can be unit-tested in isolation.

export type GradeResult =
  | { kind: 'correct'; complete: boolean }  // a still-needed note was played
  | { kind: 'repeat' }                       // an already-played correct note
  | { kind: 'wrong' };                       // a note that isn't part of the answer

/**
 * Grade a single played note against a quiz.
 *
 * @param midi        the note the learner just played
 * @param expected    all notes the quiz asks for (the full chord/answer)
 * @param remaining   notes still un-played (mutated by the caller on 'correct')
 */
export function gradeNote(
  midi: number,
  expected: ReadonlySet<number>,
  remaining: ReadonlySet<number>,
): GradeResult {
  if (remaining.has(midi)) {
    return { kind: 'correct', complete: remaining.size === 1 };
  }
  if (expected.has(midi)) {
    // Correct note, but already counted — a harmless double-press.
    return { kind: 'repeat' };
  }
  return { kind: 'wrong' };
}
