import {
  PLACEMENT_QUESTIONS, MAX_PLACEMENT_SCORE, scoreToLevelIndex, computePlacement,
} from '../lessons/placement';

describe('placement scoring', () => {
  it('maps the lowest score to Kindergarten (level 1)', () => {
    expect(scoreToLevelIndex(0)).toBe(1);
    expect(scoreToLevelIndex(1)).toBe(1);
  });

  it('maps the highest score to Master (level 6)', () => {
    expect(scoreToLevelIndex(MAX_PLACEMENT_SCORE)).toBe(6);
  });

  it('climbs levels monotonically as score rises', () => {
    let prev = 0;
    for (let s = 0; s <= MAX_PLACEMENT_SCORE; s++) {
      const lvl = scoreToLevelIndex(s);
      expect(lvl).toBeGreaterThanOrEqual(prev);
      expect(lvl).toBeGreaterThanOrEqual(1);
      expect(lvl).toBeLessThanOrEqual(6);
      prev = lvl;
    }
  });
});

describe('computePlacement', () => {
  it('places a total beginner at Kindergarten grade 1 with nothing pre-completed', () => {
    const allZero = PLACEMENT_QUESTIONS.map(() => 0);
    const r = computePlacement(allZero);
    expect(r.levelIndex).toBe(1);
    expect(r.gradeNumber).toBe(1);
    expect(r.completedLessonIds).toEqual([]);
  });

  it('places a maxed-out learner at Master with all authored grades below complete', () => {
    const allMax = PLACEMENT_QUESTIONS.map((q) => Math.max(...q.options.map((o) => o.score)));
    const r = computePlacement(allMax);
    expect(r.levelIndex).toBe(6);
    expect(r.gradeNumber).toBeGreaterThan(1);
    // Grade 1 + 2 authored lessons should be marked complete when skipping ahead.
    expect(r.completedLessonIds).toEqual(expect.arrayContaining(['g1-l1', 'g2-l1']));
  });

  it('completes grade-1/2 lessons when placed into Elementary', () => {
    // experience=2, middleC=1, chords=0, reading=0 → total 3 → Elementary (level 2)
    const r = computePlacement([2, 1, 0, 0]);
    expect(r.levelIndex).toBe(2);
    expect(r.completedLessonIds).toEqual(expect.arrayContaining(['g1-l1', 'g2-l1']));
  });
});
