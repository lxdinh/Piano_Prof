import {
  deriveShelves, activeItem, shelfProgressPct, applyCompletion, applyHeartRefill,
  itemOrder, HEART_REFILL_MS, weeklyXp, deriveAchievements, songsLearned,
} from '../data/progress';
import { Profile, seedProgress } from '../data/content';

const base: Profile = {
  id: 't', name: 'Test', avatar: 'cool', bg: '#fff', color: '#58CC02',
  streak: 3, xp: 100, gems: 10, hearts: 5, levelId: 'kg', grade: 1,
  placed: true, path: 'chords', lastUnit: 'First 3 Notes', lang: 'en',
  progress: {}, todayXp: 0, lastActiveDate: '2026-07-20',
};

describe('deriveShelves', () => {
  it('empty progress → first teachable item is active, rest locked', () => {
    const shelves = deriveShelves({});
    const order = itemOrder();
    const states = shelves.flatMap((s) => s.items).map((i) => [i.id, i.derivedState]);
    const byId = Object.fromEntries(states);
    expect(byId[order[0].id]).toBe('active');
    expect(byId[order[1].id]).toBe('locked');
  });
  it('keeps "soon" teasers as soon', () => {
    const soon = deriveShelves({}).flatMap((s) => s.items).find((i) => i.id === 'e5');
    expect(soon?.derivedState).toBe('soon');
  });
  it('completed items show as done with their stars', () => {
    const order = itemOrder();
    const shelves = deriveShelves({ [order[0].id]: 2 });
    const first = shelves.flatMap((s) => s.items).find((i) => i.id === order[0].id);
    const second = shelves.flatMap((s) => s.items).find((i) => i.id === order[1].id);
    expect(first?.derivedState).toBe('done');
    expect(first?.derivedStars).toBe(2);
    expect(second?.derivedState).toBe('active');
  });
});

describe('activeItem + progress %', () => {
  it('active item is the first incomplete', () => {
    const order = itemOrder();
    expect(activeItem({})?.id).toBe(order[0].id);
    expect(activeItem({ [order[0].id]: 3 })?.id).toBe(order[1].id);
  });
  it('shelf progress rises as items complete', () => {
    const order = itemOrder();
    const p0 = shelfProgressPct({});
    const p1 = shelfProgressPct({ [order[0].id]: 3 });
    expect(p1).toBeGreaterThan(p0);
  });
});

describe('applyCompletion', () => {
  it('awards xp, 1 gem per star, and records stars', () => {
    const p = applyCompletion(base, 'k1', 3, 40, '2026-07-21');
    expect(p.xp).toBe(140);
    expect(p.gems).toBe(13);
    expect(p.progress?.k1).toBe(3);
  });
  it('increments streak on a new day and resets the daily bucket', () => {
    const p = applyCompletion({ ...base, lastActiveDate: '2026-07-21', todayXp: 20 }, 'k1', 3, 40, '2026-07-22');
    expect(p.streak).toBe(4);
    expect(p.todayXp).toBe(40); // fresh day → bucket reset then +40
  });
  it('accumulates daily xp and holds streak within the same day', () => {
    const p = applyCompletion({ ...base, lastActiveDate: '2026-07-22', todayXp: 20 }, 'k1', 3, 40, '2026-07-22');
    expect(p.streak).toBe(3);
    expect(p.todayXp).toBe(60);
  });
  it('resets streak to 1 when the chain broke', () => {
    const p = applyCompletion({ ...base, lastActiveDate: '2026-07-10' }, 'k1', 3, 40, '2026-07-22');
    expect(p.streak).toBe(1);
  });
  it('keeps the higher star score on a repeat', () => {
    const once = applyCompletion(base, 'k1', 1, 40, '2026-07-22');
    const twice = applyCompletion(once, 'k1', 3, 40, '2026-07-22');
    expect(twice.progress?.k1).toBe(3);
  });
});

describe('profile stat derivation', () => {
  it('weeklyXp returns 7 days with today reflecting the live bucket', () => {
    const week = weeklyXp({ ...base, todayXp: 42, history: {} });
    expect(week).toHaveLength(7);
    expect(week[6].xp).toBe(42); // today
  });
  it('weeklyXp reads recorded history and merges today', () => {
    const p2 = applyCompletion({ ...base, history: {} }, 'k1', 3, 40, '2026-07-22');
    const week = weeklyXp(p2, new Date('2026-07-22T12:00:00'));
    expect(week[6].xp).toBeGreaterThanOrEqual(40);
  });
  it('deriveAchievements reflects real state', () => {
    const rich: Profile = { ...base, streak: 9, xp: 1500, progress: seedProgress() };
    const a = Object.fromEntries(deriveAchievements(rich).map((x) => [x.id, x.done]));
    expect(a.streak7).toBe(true);   // streak 9 ≥ 7
    expect(a.xp1000).toBe(true);    // 1500 ≥ 1000
    expect(a.firstSong).toBe(true); // seed completes a song (Twinkle)
    expect(a.perfect).toBe(true);   // seed has 3-star items
  });
  it('locks achievements for a fresh profile', () => {
    const fresh: Profile = { ...base, streak: 0, xp: 0, gems: 0, progress: {} };
    const a = Object.fromEntries(deriveAchievements(fresh).map((x) => [x.id, x.done]));
    expect(a.streak7).toBe(false);
    expect(a.xp1000).toBe(false);
    expect(a.firstSong).toBe(false);
  });
  it('songsLearned counts completed songs only', () => {
    expect(songsLearned({ ...base, progress: {} })).toBe(0);
    expect(songsLearned({ ...base, progress: seedProgress() })).toBeGreaterThanOrEqual(1);
  });
});

describe('applyHeartRefill', () => {
  it('refills 1 heart per 30 minutes and advances the timer', () => {
    const start = 1_000_000;
    const p = applyHeartRefill({ ...base, hearts: 2, heartsAt: start }, start + HEART_REFILL_MS + 5000);
    expect(p.hearts).toBe(3);
    expect(p.heartsAt).toBe(start + HEART_REFILL_MS);
  });
  it('caps at 5 and clears the timer when full', () => {
    const start = 1_000_000;
    const p = applyHeartRefill({ ...base, hearts: 3, heartsAt: start }, start + HEART_REFILL_MS * 5);
    expect(p.hearts).toBe(5);
    expect(p.heartsAt).toBeUndefined();
  });
  it('no-ops when hearts are full or no timer set', () => {
    expect(applyHeartRefill({ ...base, hearts: 5 }).hearts).toBe(5);
    expect(applyHeartRefill({ ...base, hearts: 2, heartsAt: undefined }).hearts).toBe(2);
  });
});
