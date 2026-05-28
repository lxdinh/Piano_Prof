import { todayKey, daysBetween, isYesterday, isSameDay } from '../services/dateKey';

describe('dateKey (local, not UTC)', () => {
  it('builds YYYY-MM-DD from local fields', () => {
    // Construct a local date and ensure the key reflects local Y/M/D.
    const d = new Date(2026, 4, 28); // May 28 2026 local
    expect(todayKey(d)).toBe('2026-05-28');
  });

  it('does not roll to next day in evening (UTC trap)', () => {
    // 11pm local on May 28 — toISOString() would report May 29 in many zones.
    const d = new Date(2026, 4, 28, 23, 0, 0);
    expect(todayKey(d)).toBe('2026-05-28');
  });

  it('computes whole-day differences', () => {
    expect(daysBetween('2026-05-28', '2026-05-29')).toBe(1);
    expect(daysBetween('2026-05-28', '2026-05-28')).toBe(0);
    expect(daysBetween('2026-05-01', '2026-05-31')).toBe(30);
  });

  it('detects yesterday and same-day', () => {
    expect(isYesterday('2026-05-27', '2026-05-28')).toBe(true);
    expect(isYesterday('2026-05-26', '2026-05-28')).toBe(false);
    expect(isSameDay('2026-05-28', '2026-05-28')).toBe(true);
  });
});
