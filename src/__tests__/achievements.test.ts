import { ACHIEVEMENTS, levelFor, evaluateAchievements, StatSnapshot } from '../gamification/achievements';

const ZERO: StatSnapshot = {
  lessonsCompleted: 0, totalXp: 0, streakCount: 0, perfectLessons: 0,
  chordsPlayed: 0, devicesPaired: 0, songsImported: 0, gems: 0,
};

describe('achievements', () => {
  it('has 8 badges', () => {
    expect(ACHIEVEMENTS).toHaveLength(8);
  });

  it('computes level from thresholds', () => {
    const def = ACHIEVEMENTS.find((a) => a.id === 'on_fire')!; // [3,7,30]
    expect(levelFor(def, 0).level).toBe(0);
    expect(levelFor(def, 3).level).toBe(1);
    expect(levelFor(def, 7).level).toBe(2);
    expect(levelFor(def, 100).level).toBe(3);
  });

  it('reports progress toward next level', () => {
    const def = ACHIEVEMENTS.find((a) => a.id === 'on_fire')!; // [3,7,30]
    const { level, progress } = levelFor(def, 5); // between 3 and 7
    expect(level).toBe(1);
    expect(progress).toBeCloseTo((5 - 3) / (7 - 3));
  });

  it('flags newly unlocked achievements', () => {
    const snap: StatSnapshot = { ...ZERO, lessonsCompleted: 1, totalXp: 100 };
    const { newlyUnlocked, updates } = evaluateAchievements(snap, {});
    const ids = newlyUnlocked.map((a) => a.id);
    expect(ids).toContain('first_steps'); // lessonsCompleted >= 1
    expect(ids).toContain('xp_hunter');   // totalXp >= 100
    expect(updates['first_steps'].unlockedAt).not.toBeNull();
  });

  it('does not re-flag already-unlocked levels', () => {
    const snap: StatSnapshot = { ...ZERO, lessonsCompleted: 1 };
    const current = { first_steps: { level: 1, progress: 0, unlockedAt: 123 } };
    const { newlyUnlocked } = evaluateAchievements(snap, current);
    expect(newlyUnlocked.map((a) => a.id)).not.toContain('first_steps');
  });
});
