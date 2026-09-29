// Piano Professor — per-profile progress logic (pure, testable).
// Derives the home shelves' item states from a profile's progress map and
// applies lesson-completion rewards (XP, gems, streak, daily goal).

import { SHELVES, Shelf, ShelfItem, ItemState, Profile } from './content';
import { todayKey, dayKey, isYesterday, nowMs } from '../services/dateKey';
import { GlyphName } from '../ui/GlyphIcon';

export const DAILY_GOAL_XP = 50;
export const HEART_REFILL_MS = 30 * 60 * 1000; // 1 heart per 30 minutes

export type ProgressMap = Record<string, number>; // itemId -> stars (1..3)

export interface DerivedItem extends ShelfItem {
  derivedState: ItemState;
  derivedStars?: number;
}
export interface DerivedShelf extends Shelf { items: DerivedItem[]; }

/** Flattened teachable order (skips permanent "soon" teasers). */
export function itemOrder(): ShelfItem[] {
  return SHELVES.flatMap((s) => s.items).filter((i) => i.state !== 'soon');
}

/**
 * Compute shelf states from a progress map:
 * done = completed · active = first incomplete · locked = everything after.
 * "soon" teasers stay soon; premium flags are preserved (the active pointer
 * still lands on premium items — tapping them gates through the paywall).
 */
export function deriveShelves(progress: ProgressMap): DerivedShelf[] {
  const order = itemOrder();
  const activeIdx = order.findIndex((i) => !(i.id in progress));
  const stateOf = (item: ShelfItem): ItemState => {
    if (item.state === 'soon') return 'soon';
    if (item.id in progress) return 'done';
    const idx = order.findIndex((o) => o.id === item.id);
    return idx === activeIdx ? 'active' : 'locked';
  };
  return SHELVES.map((shelf) => ({
    ...shelf,
    items: shelf.items.map((item) => ({
      ...item,
      derivedState: stateOf(item),
      derivedStars: progress[item.id],
    })),
  }));
}

/** The item the "Continue" hero should open (first incomplete). */
export function activeItem(progress: ProgressMap): ShelfItem | null {
  return itemOrder().find((i) => !(i.id in progress)) ?? null;
}

/** Shelf containing the active item (for hero color/level). */
export function activeShelf(progress: ProgressMap): Shelf {
  const item = activeItem(progress);
  return SHELVES.find((s) => s.items.some((i) => i.id === item?.id)) ?? SHELVES[0];
}

/** % of the active shelf completed (drives the hero progress bar). */
export function shelfProgressPct(progress: ProgressMap): number {
  const shelf = activeShelf(progress);
  const items = shelf.items.filter((i) => i.state !== 'soon');
  if (!items.length) return 0;
  const done = items.filter((i) => i.id in progress).length;
  return Math.round((done / items.length) * 100);
}

export interface CompletionOpts {
  /** Trusted "now" in ms (defaults to the trusted clock). */
  now?: number;
  /** XP multiplier — 2 for premium ("Double XP"). Base XP is tracked separately. */
  xpMultiplier?: number;
  /** Premium unlocks one free streak repair per calendar month. */
  premium?: boolean;
  /**
   * Clock tampering detected: hold the day rollover. The lesson still counts
   * and still pays XP, but no free streak day and no quest/daily reset — so a
   * forward clock jump cannot manufacture rewards.
   */
  deferDayRewards?: boolean;
}

/**
 * Apply a lesson completion to a profile — pure so it's unit-testable.
 * Rewards: XP (x multiplier), 1 gem per star, streak (+1 on a new day; saved by
 * a freeze or a premium monthly repair if the chain broke), daily-goal bucket,
 * progress map, next unit title.
 */
export function applyCompletion(
  p: Profile, itemId: string, stars: number, xp: number, today = todayKey(),
  opts: CompletionOpts = {},
): Profile {
  const { xpMultiplier = 1, premium = false, deferDayRewards = false, now = nowMs() } = opts;
  const gainedXp = Math.round(xp * xpMultiplier);

  // A tampered clock defers the day rollover — everything below then behaves as
  // if the learner were still on their last genuine active day.
  const day = deferDayRewards ? (p.lastActiveDate ?? today) : today;
  const newDay = p.lastActiveDate !== day;
  const chainAlive = !p.lastActiveDate || isYesterday(p.lastActiveDate, day) || p.lastActiveDate === day;
  const progress: ProgressMap = { ...(p.progress ?? {}), [itemId]: Math.max(stars, p.progress?.[itemId] ?? 0) };
  const next = activeItem(progress);
  // Streak resolution — a freeze, then (for premium) a monthly repair, saves the
  // run after a missed day.
  const freezes = p.streakFreezes ?? 0;
  const month = day.slice(0, 7); // YYYY-MM
  let streak = p.streak;
  let usedFreeze = false;
  let usedRepair = false;
  if (newDay) {
    if (chainAlive) streak = p.streak + 1;
    else if (freezes > 0) { streak = p.streak + 1; usedFreeze = true; }
    else if (premium && p.lastRepairMonth !== month) { streak = p.streak + 1; usedRepair = true; }
    else streak = 1;
  }
  // Per-day XP history, pruned to the last 14 days. This tracks BASE xp: the
  // premium 2x boost accelerates the headline lifetime number, but must not
  // shrink the daily practice goal or let a paying parent dominate the family
  // league — those both read from this history.
  const history: Record<string, number> = { ...(p.history ?? {}) };
  history[day] = (history[day] ?? 0) + xp;
  const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 14);
  for (const k of Object.keys(history)) if (k < dayKey(cutoff)) delete history[k];
  return {
    ...p,
    progress,
    history,
    xp: p.xp + gainedXp,
    // Lifetime XP without the multiplier — the league's tie-break.
    baseXp: (p.baseXp ?? p.xp) + xp,
    gems: p.gems + stars,
    todayXp: (newDay ? 0 : (p.todayXp ?? 0)) + xp,
    todayLessons: (newDay ? 0 : (p.todayLessons ?? 0)) + 1,
    todayPerfect: (newDay ? false : (p.todayPerfect ?? false)) || stars >= 3,
    streak,
    streakFreezes: usedFreeze ? freezes - 1 : freezes,
    lastRepairMonth: usedRepair ? month : p.lastRepairMonth,
    streakAt: newDay ? now : p.streakAt,
    lastActiveDate: day,
    lastUnit: next?.title ?? p.lastUnit,
  };
}

// ── Profile stats derivation (weekly chart + achievements) ──
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Last 7 days of XP (oldest → today), today merged with the live daily bucket. */
export function weeklyXp(p: Profile, today = new Date()): { label: string; xp: number }[] {
  const hist = p.history ?? {};
  const out: { label: string; xp: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = dayKey(d);
    let xp = hist[key] ?? 0;
    if (i === 0) xp = Math.max(xp, p.todayXp ?? 0); // today's live bucket
    out.push({ label: DOW[d.getDay()], xp });
  }
  return out;
}

export interface Achievement { id: string; glyph: GlyphName; name: string; done: boolean; }

/** Derive the achievements grid from real profile state. */
export function deriveAchievements(p: Profile): Achievement[] {
  const prog = p.progress ?? {};
  const doneIds = new Set(Object.keys(prog));
  const allItems = SHELVES.flatMap((s) => s.items);
  const doneSongs = allItems.filter((i) => i.kind === 'song' && doneIds.has(i.id)).length;
  const perfectCount = Object.values(prog).filter((s) => s >= 3).length;
  // a level is "graduated" when all its non-soon items are done
  const graduated = SHELVES.some((s) => {
    const items = s.items.filter((i) => i.state !== 'soon');
    return items.length > 0 && items.every((i) => doneIds.has(i.id));
  });
  return [
    { id: 'streak7', glyph: 'streak', name: '7-Day Streak', done: p.streak >= 7 },
    { id: 'firstSong', glyph: 'songs', name: 'First Song', done: doneSongs >= 1 },
    { id: 'perfect', glyph: 'perfect', name: 'Perfect Lesson', done: perfectCount >= 1 },
    { id: 'xp1000', glyph: 'xp', name: '1000 XP', done: p.xp >= 1000 },
    { id: 'chordMaster', glyph: 'chord', name: 'Chord Master', done: doneIds.has('e1') },
    { id: 'graduate', glyph: 'diploma', name: 'Grade Graduate', done: graduated },
  ];
}

/** Count of distinct songs the profile has completed. */
export function songsLearned(p: Profile): number {
  const doneIds = new Set(Object.keys(p.progress ?? {}));
  return SHELVES.flatMap((s) => s.items).filter((i) => i.kind === 'song' && doneIds.has(i.id)).length;
}

/**
 * Timed heart refill: 1 heart per 30 min since the last heart was lost.
 *
 * `now` comes from the TRUSTED clock, which is monotonic within a session — so
 * moving the device clock forward while the app runs or sits backgrounded (the
 * realistic attack on the energy economy) grants nothing. `suspicious` defers
 * refills entirely while an active tamper signal is present. Hearts genuinely
 * earned while the app was closed still land, because trusted time keeps
 * advancing across sessions.
 */
export function applyHeartRefill(
  p: Profile, now = nowMs(), suspicious = false,
): Profile {
  if (p.hearts >= 5 || !p.heartsAt || suspicious) return p;
  const refills = Math.floor(Math.max(0, now - p.heartsAt) / HEART_REFILL_MS);
  if (refills <= 0) return p;
  const hearts = Math.min(5, p.hearts + refills);
  return { ...p, hearts, heartsAt: hearts >= 5 ? undefined : p.heartsAt + refills * HEART_REFILL_MS };
}
