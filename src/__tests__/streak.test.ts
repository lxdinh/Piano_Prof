import {
  MILESTONES, earnedMilestones, nextMilestone, milestoneProgress, streakDates, monthCalendar,
} from '../data/streak';
import { Profile } from '../data/content';

const mk = (over: Partial<Profile>): Profile => ({
  id: 'x', name: 'X', avatar: 'cool', bg: '#fff', color: '#58CC02',
  streak: 0, xp: 0, gems: 0, hearts: 5, levelId: 'kg', grade: 1,
  placed: true, path: 'chords', lastUnit: 'x', lang: 'en', history: {}, ...over,
});

describe('milestones', () => {
  it('earns every milestone at or below the streak', () => {
    expect(earnedMilestones(0)).toHaveLength(0);
    expect(earnedMilestones(7).map((m) => m.days)).toEqual([3, 7]);
    expect(earnedMilestones(9999)).toHaveLength(MILESTONES.length);
  });
  it('points at the next milestone, null once all are earned', () => {
    expect(nextMilestone(0)?.days).toBe(3);
    expect(nextMilestone(7)?.days).toBe(14);
    expect(nextMilestone(365)).toBeNull();
  });
  it('reports progress between the previous and next milestone', () => {
    expect(milestoneProgress(0)).toBe(0);          // 0 of 0→3
    expect(milestoneProgress(5)).toBeCloseTo(0.5); // 5 is halfway across 3→7
    expect(milestoneProgress(7)).toBe(0);          // just hit 7, 0 toward 14
    expect(milestoneProgress(365)).toBe(1);        // maxed
  });
});

describe('streakDates', () => {
  it('reconstructs the run from streak + lastActiveDate', () => {
    const dates = streakDates(mk({ streak: 3, lastActiveDate: '2026-07-24' }));
    expect(dates.has('2026-07-24')).toBe(true);
    expect(dates.has('2026-07-23')).toBe(true);
    expect(dates.has('2026-07-22')).toBe(true);
    expect(dates.has('2026-07-21')).toBe(false); // streak is only 3
  });
  it('unions in older recorded history', () => {
    const dates = streakDates(mk({ streak: 1, lastActiveDate: '2026-07-24', history: { '2026-07-01': 40, '2026-07-02': 0 } }));
    expect(dates.has('2026-07-01')).toBe(true);  // had XP
    expect(dates.has('2026-07-02')).toBe(false); // logged but zero XP
  });
  it('is empty with no streak and no history', () => {
    expect(streakDates(mk({ streak: 0, lastActiveDate: undefined })).size).toBe(0);
  });
});

describe('monthCalendar', () => {
  it('pads leading blanks and marks active + today cells', () => {
    // July 2026 starts on a Wednesday → 3 leading blanks (Sun..Tue)
    const p = mk({ streak: 2, lastActiveDate: '2026-07-24' });
    const cells = monthCalendar(p, new Date('2026-07-24T12:00:00'));
    expect(cells.slice(0, 3).every((c) => c === null)).toBe(true);
    const byDay = new Map(cells.filter(Boolean).map((c) => [c!.day, c!]));
    expect(byDay.get(24)!.active).toBe(true);
    expect(byDay.get(24)!.today).toBe(true);
    expect(byDay.get(23)!.active).toBe(true);
    expect(byDay.get(22)!.active).toBe(false);
    expect(byDay.size).toBe(31); // July has 31 days
  });
});
