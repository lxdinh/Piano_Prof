// Piano Professor — Streak milestones + calendar (pure, testable).
// The streak is the #1 retention driver; this powers the Streak screen:
// a headline count, the next milestone to chase, and a month calendar of
// which days were active.
import { Profile } from './content';
import { dayKey, parseKey } from '../services/dateKey';

export interface Milestone { days: number; emoji: string; name: string; }

export const MILESTONES: Milestone[] = [
  { days: 3, emoji: '🌱', name: 'Sprout' },
  { days: 7, emoji: '🔥', name: 'On Fire' },
  { days: 14, emoji: '⚡', name: 'Electric' },
  { days: 30, emoji: '🌟', name: 'Star Player' },
  { days: 50, emoji: '💎', name: 'Diamond' },
  { days: 100, emoji: '👑', name: 'Centurion' },
  { days: 365, emoji: '🏆', name: 'Year of Music' },
];

/** Milestones already reached at the current streak length. */
export function earnedMilestones(streak: number): Milestone[] {
  return MILESTONES.filter((m) => streak >= m.days);
}

/** The next milestone to chase, or null once every milestone is earned. */
export function nextMilestone(streak: number): Milestone | null {
  return MILESTONES.find((m) => streak < m.days) ?? null;
}

/** Progress (0..1) from the previous milestone toward the next one. */
export function milestoneProgress(streak: number): number {
  const next = nextMilestone(streak);
  if (!next) return 1;
  const prev = [...MILESTONES].reverse().find((m) => streak >= m.days)?.days ?? 0;
  const span = next.days - prev;
  return span <= 0 ? 0 : Math.min(1, (streak - prev) / span);
}

/**
 * The set of YYYY-MM-DD keys the profile was active on. The streak invariant —
 * `streak` consecutive days ending at lastActiveDate — reconstructs the run
 * even beyond the pruned XP history, which is unioned in for older activity.
 */
export function streakDates(p: Profile): Set<string> {
  const set = new Set<string>();
  if (p.lastActiveDate && p.streak > 0) {
    const end = parseKey(p.lastActiveDate);
    for (let i = 0; i < p.streak; i++) {
      const d = new Date(end); d.setDate(end.getDate() - i);
      set.add(dayKey(d));
    }
  }
  for (const [k, xp] of Object.entries(p.history ?? {})) if (xp > 0) set.add(k);
  return set;
}

export interface CalCell { key: string; day: number; active: boolean; today: boolean; }

/** A month grid (leading blanks as null) for the month containing `today`. */
export function monthCalendar(p: Profile, today = new Date()): (CalCell | null)[] {
  const active = streakDates(p);
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayK = dayKey(today);
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (CalCell | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null); // leading blanks
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dayKey(new Date(year, month, d));
    cells.push({ key, day: d, active: active.has(key), today: key === todayK });
  }
  return cells;
}
