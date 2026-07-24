import { leaderboard, weeklyXpTotal, placeOf } from '../data/leaderboard';
import { Profile } from '../data/content';

const mk = (over: Partial<Profile>): Profile => ({
  id: 'x', name: 'X', avatar: 'cool', bg: '#fff', color: '#58CC02',
  streak: 0, xp: 0, gems: 0, hearts: 5, levelId: 'kg', grade: 1,
  placed: true, path: 'chords', lastUnit: 'x', lang: 'en',
  history: {}, todayXp: 0, ...over,
});

const TODAY = new Date('2026-07-24T12:00:00');
const dk = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = (n: number) => { const d = new Date(TODAY); d.setDate(d.getDate() - n); return dk(d); };

describe('weeklyXpTotal', () => {
  it('sums the last 7 days of history plus today\'s live bucket', () => {
    const p = mk({ history: { [daysAgo(1)]: 30, [daysAgo(3)]: 20, [daysAgo(10)]: 999 }, todayXp: 15 });
    // 30 + 20 + 15 (today) — the 10-day-old entry is outside the window
    expect(weeklyXpTotal(p, TODAY)).toBe(65);
  });
});

describe('leaderboard', () => {
  it('ranks by weekly XP descending and awards medals to the top three', () => {
    const a = mk({ id: 'a', name: 'Ava', history: { [daysAgo(1)]: 40 } });
    const b = mk({ id: 'b', name: 'Leo', history: { [daysAgo(1)]: 120 } });
    const c = mk({ id: 'c', name: 'Mum', history: { [daysAgo(1)]: 80 } });
    const ranks = leaderboard([a, b, c], TODAY);
    expect(ranks.map((r) => r.profile.id)).toEqual(['b', 'c', 'a']);
    expect(ranks.map((r) => r.place)).toEqual([1, 2, 3]);
    expect(ranks.map((r) => r.medal)).toEqual(['🥇', '🥈', '🥉']);
  });
  it('breaks weekly-XP ties by lifetime XP', () => {
    const a = mk({ id: 'a', name: 'Ava', xp: 500, history: { [daysAgo(1)]: 40 } });
    const b = mk({ id: 'b', name: 'Leo', xp: 900, history: { [daysAgo(1)]: 40 } });
    expect(leaderboard([a, b], TODAY).map((r) => r.profile.id)).toEqual(['b', 'a']);
  });
  it('leaves fourth place and beyond without a medal', () => {
    const ps = ['a', 'b', 'c', 'd'].map((id, i) => mk({ id, name: id, history: { [daysAgo(1)]: 100 - i } }));
    expect(leaderboard(ps, TODAY)[3].medal).toBeNull();
  });
});

describe('placeOf', () => {
  it('returns a profile\'s 1-based standing, 0 when absent', () => {
    const a = mk({ id: 'a', history: { [daysAgo(1)]: 10 } });
    const b = mk({ id: 'b', history: { [daysAgo(1)]: 90 } });
    expect(placeOf([a, b], 'b', TODAY)).toBe(1);
    expect(placeOf([a, b], 'a', TODAY)).toBe(2);
    expect(placeOf([a, b], 'zzz', TODAY)).toBe(0);
  });
});
