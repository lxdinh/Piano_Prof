import { gradeNote } from '../lessons/quizGrading';

// Simulate the engine's per-quiz state: expected = full answer, remaining =
// notes still to play. Mirrors how engine.notePlayed drives gradeNote.
function play(answer: number[], presses: number[]) {
  const expected = new Set(answer);
  const remaining = new Set(answer);
  const events: string[] = [];
  let hearts = 5;
  let passed = false;
  for (const midi of presses) {
    const r = gradeNote(midi, expected, remaining);
    events.push(r.kind);
    if (r.kind === 'correct') {
      remaining.delete(midi);
      if (r.complete) passed = true;
    } else if (r.kind === 'wrong') {
      hearts -= 1;
    }
    if (hearts <= 0) break;
  }
  return { events, hearts, passed, remaining };
}

describe('quiz grading', () => {
  it('passes a single-note quiz when the right key is played', () => {
    const { passed, hearts } = play([60], [60]);
    expect(passed).toBe(true);
    expect(hearts).toBe(5);
  });

  it('requires every note of a chord, in any order', () => {
    const { passed, hearts } = play([60, 64, 67], [67, 60, 64]);
    expect(passed).toBe(true);
    expect(hearts).toBe(5);
  });

  it('is not complete until the final note lands', () => {
    const { passed, remaining } = play([60, 64, 67], [60, 64]);
    expect(passed).toBe(false);
    expect(remaining.has(67)).toBe(true);
  });

  it('costs a heart for a wrong note but keeps grading', () => {
    const { passed, hearts, events } = play([60, 64, 67], [61, 60, 64, 67]);
    expect(events[0]).toBe('wrong');
    expect(passed).toBe(true);
    expect(hearts).toBe(4);
  });

  it('does not punish double-pressing an already-correct note', () => {
    const { passed, hearts, events } = play([60, 64], [60, 60, 64]);
    expect(events).toEqual(['correct', 'repeat', 'correct']);
    expect(passed).toBe(true);
    expect(hearts).toBe(5);
  });

  it('runs out of hearts after five wrong notes', () => {
    const { passed, hearts } = play([60], [61, 62, 63, 65, 66, 68]);
    expect(hearts).toBe(0);
    expect(passed).toBe(false);
  });
});
