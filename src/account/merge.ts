// Piano Professor — conflict-safe household merge.
//
// THE BUG THIS FIXES: sync used to pick a winner by `Date.now()` and then
// REPLACE the loser wholesale. A device with a skewed clock could therefore
// overwrite good data with stale data, and signing in on a device that had
// local progress silently discarded it. Learners losing months of practice is
// worse than any cheat.
//
// RULES
//  1. Order by a monotonic `rev` counter, never by a wall clock.
//  2. Completed lessons are SACRED: the progress map is unioned by max stars,
//     so a lesson can never become un-completed by a sync.
//  3. XP history is unioned by max per day; streaks/lifetime XP take the max.
//  4. Spendable balances (gems, hearts, freezes) follow the higher-rev copy
//     rather than max() — max() would let someone spend on one device, restore
//     on another and duplicate the currency.
import { Profile } from '../data/content';
import { SyncData } from './types';

/** Merge two per-day XP maps, keeping the higher value for each day. */
function mergeHistory(
  a: Record<string, number> = {}, b: Record<string, number> = {},
): Record<string, number> {
  const out: Record<string, number> = { ...a };
  for (const [day, xp] of Object.entries(b)) out[day] = Math.max(out[day] ?? 0, xp);
  return out;
}

/** Merge two progress maps, keeping the best star count for each lesson. */
function mergeProgress(
  a: Record<string, number> = {}, b: Record<string, number> = {},
): Record<string, number> {
  const out: Record<string, number> = { ...a };
  for (const [id, stars] of Object.entries(b)) out[id] = Math.max(out[id] ?? 0, stars);
  return out;
}

/**
 * Merge one profile from two sources. `primary` is the higher-rev copy and wins
 * for spendable/live state; achievement-shaped state is unioned so nothing a
 * learner earned is ever lost.
 */
export function mergeProfile(primary: Profile, other: Profile): Profile {
  return {
    ...primary,
    progress: mergeProgress(primary.progress, other.progress),
    history: mergeHistory(primary.history, other.history),
    // Earned, never-decreasing achievements
    xp: Math.max(primary.xp, other.xp),
    baseXp: Math.max(primary.baseXp ?? primary.xp, other.baseXp ?? other.xp),
    streak: Math.max(primary.streak, other.streak),
    lastActiveDate: [primary.lastActiveDate, other.lastActiveDate]
      .filter(Boolean).sort().pop() ?? primary.lastActiveDate,
    // Spendable balances follow the newer copy only (see rule 4).
    gems: primary.gems,
    hearts: primary.hearts,
    streakFreezes: primary.streakFreezes,
  };
}

/**
 * Merge two household snapshots. Returns the union: every profile present in
 * either side survives, and profiles present in both are merged field-wise.
 * The higher-`rev` snapshot is authoritative for ordering-sensitive state.
 */
export function mergeSync(local: SyncData, remote: SyncData): SyncData {
  const localNewer = (local.rev ?? 0) >= (remote.rev ?? 0);
  const primary = localNewer ? local : remote;
  const secondary = localNewer ? remote : local;

  const primaryProfiles = (primary.profiles ?? []) as Profile[];
  const secondaryProfiles = (secondary.profiles ?? []) as Profile[];
  const byId = new Map<string, Profile>();

  for (const p of primaryProfiles) byId.set(p.id, p);
  for (const s of secondaryProfiles) {
    const p = byId.get(s.id);
    byId.set(s.id, p ? mergeProfile(p, s) : s); // keep profiles only the other side has
  }
  // Preserve the primary's ordering, then append any extras from the secondary.
  const order = [
    ...primaryProfiles.map((p) => p.id),
    ...secondaryProfiles.map((p) => p.id).filter((id) => !primaryProfiles.some((p) => p.id === id)),
  ];

  return {
    profiles: order.map((id) => byId.get(id)!).filter(Boolean),
    activeId: primary.activeId ?? secondary.activeId,
    // Premium is an entitlement — if either side has it, keep it.
    premium: !!(local.premium || remote.premium),
    rev: Math.max(local.rev ?? 0, remote.rev ?? 0) + 1,
    updatedAt: Math.max(local.updatedAt ?? 0, remote.updatedAt ?? 0),
  };
}
