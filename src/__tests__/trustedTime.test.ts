// The anti-cheat proof: these tests simulate a user changing the device clock
// and assert the reward economy does not move.
import {
  resolveNow, ratchetDayKey, dayKeyOf, TimeState, SUSPICIOUS_DRIFT_MS,
} from '../services/trustedTime';
import { applyCompletion, applyHeartRefill } from '../data/progress';
import { Profile } from '../data/content';

const HOUR = 3600_000;
const DAY = 24 * HOUR;
const T0 = new Date(2026, 0, 10, 12, 0, 0).getTime(); // local noon

const state = (over: Partial<TimeState> = {}): TimeState => ({
  anchor: { utc: T0, mono: 1000, device: T0, trusted: true },
  highWater: T0,
  maxDayKey: dayKeyOf(T0),
  ...over,
});

const profile = (over: Partial<Profile> = {}): Profile => ({
  id: 'p', name: 'Test', avatar: 'cool', bg: '#fff', color: '#000',
  streak: 5, xp: 100, gems: 10, hearts: 5, levelId: 'kg', grade: 1,
  placed: true, path: 'chords', lastUnit: 'x', lang: 'en',
  ...over,
});

describe('trusted clock vs a tampered device clock', () => {
  it('ignores a forward clock jump while the app is running (monotonic wins)', () => {
    // 10 real minutes pass, but the user sets the clock forward 2 days.
    const mono = 1000 + 10 * 60_000;
    const r = resolveNow(state(), T0 + 2 * DAY, mono);
    expect(r.now).toBe(T0 + 10 * 60_000); // real elapsed only
    expect(r.suspicious).toBe(true); // and we KNOW they tampered
  });

  it('ignores a backward clock jump (time is forward-only)', () => {
    const r = resolveNow(state(), T0 - 5 * DAY, 1000 + 60_000);
    expect(r.now).toBe(T0 + 60_000);
    expect(r.suspicious).toBe(true);
  });

  it('does not flag ordinary small drift as tampering', () => {
    const mono = 1000 + 60_000;
    const r = resolveNow(state(), T0 + 60_000 + 30_000, mono); // 30s off
    expect(r.suspicious).toBe(false);
    expect(Math.abs(r.driftMs)).toBeLessThan(SUSPICIOUS_DRIFT_MS);
  });

  it('never resolves earlier than the high-water mark', () => {
    const s = state({ highWater: T0 + 10 * DAY });
    expect(resolveNow(s, T0, 1000).now).toBe(T0 + 10 * DAY);
  });

  it('ratchets the day key forward only', () => {
    expect(ratchetDayKey('2026-01-10', '2026-01-11')).toBe('2026-01-11'); // advances
    expect(ratchetDayKey('2026-01-10', '2026-01-09')).toBe('2026-01-10'); // rollback ignored
  });
});

describe('streak cannot be farmed by the clock', () => {
  it('grants a streak day on a genuine new day', () => {
    const p = profile({ streak: 5, lastActiveDate: '2026-01-10' });
    const next = applyCompletion(p, 'a', 3, 20, '2026-01-11');
    expect(next.streak).toBe(6);
  });

  it('does NOT grant a streak day when the clock looks tampered with', () => {
    const p = profile({ streak: 5, lastActiveDate: '2026-01-10' });
    const next = applyCompletion(p, 'a', 3, 20, '2026-01-25', { deferDayRewards: true });
    expect(next.streak).toBe(5); // no free day
    expect(next.lastActiveDate).toBe('2026-01-10'); // day did not roll over
    expect(next.xp).toBeGreaterThan(p.xp); // but the lesson still counted
  });

  it('does not reset the streak when the day is deferred', () => {
    const p = profile({ streak: 30, lastActiveDate: '2026-01-10' });
    const next = applyCompletion(p, 'a', 3, 20, '2026-02-20', { deferDayRewards: true });
    expect(next.streak).toBe(30); // an honest 30-day run survives
  });

  it('keeps quests on the same day when deferred (no quest re-roll)', () => {
    const p = profile({ lastActiveDate: '2026-01-10', todayXp: 40, todayLessons: 2 });
    const next = applyCompletion(p, 'a', 3, 20, '2026-01-11', { deferDayRewards: true });
    // buckets keep accumulating instead of resetting to a fresh quest day
    expect(next.todayXp).toBe(60);
    expect(next.todayLessons).toBe(3);
  });
});

describe('hearts cannot be refilled by the clock', () => {
  it('refills over genuine elapsed time', () => {
    const p = profile({ hearts: 2, heartsAt: T0 });
    expect(applyHeartRefill(p, T0 + 61 * 60_000).hearts).toBe(4); // 2 x 30min
  });

  it('grants nothing while the clock looks tampered with', () => {
    const p = profile({ hearts: 0, heartsAt: T0 });
    expect(applyHeartRefill(p, T0 + 5 * DAY, true).hearts).toBe(0);
  });

  it('still refills hearts genuinely earned while the app was closed', () => {
    const p = profile({ hearts: 1, heartsAt: T0 });
    expect(applyHeartRefill(p, T0 + 3 * HOUR).hearts).toBe(5); // capped at 5
  });
});

describe('premium perks', () => {
  it('doubles headline XP but leaves the daily goal and league on base XP', () => {
    const p = profile({ xp: 100, lastActiveDate: '2026-01-11' });
    const next = applyCompletion(
      p, 'a', 3, 20, '2026-01-11', { xpMultiplier: 2, premium: true, now: T0 },
    );
    expect(next.xp).toBe(140); // 20 x 2 on the headline number
    expect(next.baseXp).toBe(120); // base tracked separately
    expect(next.todayXp).toBe(20); // daily goal unaffected — same practice required
    expect(next.history?.['2026-01-11']).toBe(20); // league/chart read base XP
  });

  it('repairs a broken streak once per month for premium', () => {
    const p = profile({ streak: 20, lastActiveDate: '2026-01-01', streakFreezes: 0 });
    const repaired = applyCompletion(p, 'a', 3, 20, '2026-01-11', { premium: true });
    expect(repaired.streak).toBe(21); // saved
    expect(repaired.lastRepairMonth).toBe('2026-01');

    // a second break in the SAME month is not repaired again
    const again = applyCompletion(
      { ...repaired, lastActiveDate: '2026-01-11' }, 'b', 3, 20, '2026-01-20', { premium: true },
    );
    expect(again.streak).toBe(1);
  });

  it('does not repair for free users', () => {
    const p = profile({ streak: 20, lastActiveDate: '2026-01-01', streakFreezes: 0 });
    expect(applyCompletion(p, 'a', 3, 20, '2026-01-11').streak).toBe(1);
  });
});
