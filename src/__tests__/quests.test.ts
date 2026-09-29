import { dailyQuests, questsToday, claimableCount, applyClaim } from '../data/quests';
import { Profile } from '../data/content';

const base: Profile = {
  id: 't', name: 'T', avatar: 'cool', bg: '#fff', color: '#58CC02',
  streak: 0, xp: 0, gems: 0, hearts: 5, levelId: 'kg', grade: 1,
  placed: true, path: 'chords', lastUnit: 'x', lang: 'en',
};
const DAY = '2026-07-24';

describe('dailyQuests', () => {
  it('gives 3 quests — one xp, one lessons, one perfect', () => {
    const q = dailyQuests(DAY);
    expect(q).toHaveLength(3);
    expect(q.map((x) => x.kind)).toEqual(['xp', 'lessons', 'perfect']);
  });
  it('is deterministic within a day and can vary across days', () => {
    expect(dailyQuests(DAY).map((q) => q.id)).toEqual(dailyQuests(DAY).map((q) => q.id));
    const ids = new Set<string>();
    for (let d = 1; d <= 20; d++) ids.add(dailyQuests(`2026-08-${d}`)[0].id);
    expect(ids.size).toBeGreaterThan(1); // the xp quest rotates over time
  });
});

describe('questsToday', () => {
  it('tracks progress from live activity', () => {
    const q = questsToday({ ...base, todayXp: 20, todayLessons: 1, todayPerfect: true }, DAY);
    q.forEach((s) => { expect(s.done).toBe(true); expect(s.claimable).toBe(true); });
  });
  it('is not done before the goal', () => {
    const q = questsToday({ ...base, todayXp: 5, todayLessons: 0, todayPerfect: false }, DAY);
    expect(q.every((s) => !s.done)).toBe(true);
    expect(claimableCount({ ...base, todayXp: 5 }, DAY)).toBe(0);
  });
  it('clamps current to the goal', () => {
    const q = questsToday({ ...base, todayXp: 999 }, DAY);
    const xp = q.find((s) => s.quest.kind === 'xp')!;
    expect(xp.current).toBe(xp.quest.goal);
  });
});

describe('applyClaim', () => {
  it('awards gems and marks the quest claimed, once', () => {
    const p0: Profile = { ...base, todayLessons: 3, gems: 0 };
    const lessons = questsToday(p0, DAY).find((s) => s.quest.kind === 'lessons')!;
    const p1 = applyClaim(p0, lessons.quest.id, DAY);
    expect(p1.gems).toBe(lessons.quest.reward);
    expect(p1.questsClaimed).toContain(lessons.quest.id);
    // claiming again is a no-op
    const p2 = applyClaim(p1, lessons.quest.id, DAY);
    expect(p2.gems).toBe(p1.gems);
  });
  it('refuses to claim an unfinished quest', () => {
    const p = applyClaim({ ...base, todayXp: 0 }, dailyQuests(DAY)[0].id, DAY);
    expect(p.gems).toBe(0);
    expect(p.questsClaimed ?? []).toHaveLength(0);
  });
  it('resets claims when the day changes', () => {
    const claimedYesterday: Profile = { ...base, todayLessons: 3, questDay: '2026-07-23', questsClaimed: ['les1', 'les3'] };
    const q = questsToday(claimedYesterday, DAY);
    expect(q.find((s) => s.quest.kind === 'lessons')!.claimed).toBe(false); // fresh day
  });
});
