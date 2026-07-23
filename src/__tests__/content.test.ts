import { levelFromScore, starsFromHearts, LEVELS, levelById, PLACEMENT, SHELVES } from '../data/content';

describe('levelFromScore', () => {
  it('maps the extremes', () => {
    expect(levelFromScore(0).id).toBe('kg');
    expect(levelFromScore(12).id).toBe('ma');
  });
  it('is monotonic across the score range', () => {
    const order = LEVELS.map((l) => l.id);
    let prev = -1;
    for (let s = 0; s <= 12; s++) {
      const idx = order.indexOf(levelFromScore(s).id);
      expect(idx).toBeGreaterThanOrEqual(prev);
      prev = idx;
    }
  });
  it('covers the max score from scored questions', () => {
    const maxScore = PLACEMENT.filter((q) => !q.noScore)
      .reduce((sum, q) => sum + Math.max(...q.a.map((a) => a.v)), 0);
    expect(maxScore).toBe(12);
    expect(levelFromScore(maxScore).id).toBe('ma');
  });
});

describe('starsFromHearts', () => {
  it('mirrors the prototype thresholds (5→3★, 3-4→2★, else 1★)', () => {
    expect(starsFromHearts(5)).toBe(3);
    expect(starsFromHearts(4)).toBe(2);
    expect(starsFromHearts(3)).toBe(2);
    expect(starsFromHearts(2)).toBe(1);
    expect(starsFromHearts(0)).toBe(1);
  });
});

describe('content integrity', () => {
  it('levelById falls back to the first level', () => {
    expect(levelById('nope').id).toBe('kg');
  });
  it('every shelf references a real level', () => {
    for (const s of SHELVES) expect(LEVELS.some((l) => l.id === s.levelId)).toBe(true);
  });
  it('shelf items have unique ids', () => {
    const ids = SHELVES.flatMap((s) => s.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
