// Piano Professor — who is actually Premium, right now.
//
// Pure and side-effect free, so the rules that decide paid access can be tested
// exhaustively without a store, a clock, or a React tree.
//
// Two things are being decided here, and they are separate on purpose:
//   1. Is the subscription live at all? (expiry, using the TRUSTED clock — the
//      same one the streak and heart economy use, so winding the device forward
//      cannot extend a subscription any more than it can mint streak days)
//   2. Which profiles does it cover? (seats)

import { Entitlement, PLAN_SEATS, PlanId } from './types';

/**
 * Is this entitlement live at `now`?
 *
 * A null entitlement is not live. A null `expiresAt` IS live — some stores do
 * not report an end date for lifetime purchases, and treating "unknown" as
 * "expired" would lock out people who have paid.
 */
export function isActive(e: Entitlement | null, now: number): boolean {
  if (!e) return false;
  if (e.expiresAt == null) return true;
  return e.expiresAt > now;
}

/** Seats an entitlement grants, floored at 1 and clamped to the plan. */
export function seatsFor(e: Entitlement | null, now: number): number {
  if (!isActive(e, now)) return 0;
  const planMax = PLAN_SEATS[e!.planId] ?? 1;
  return Math.max(1, Math.min(e!.seats || planMax, planMax));
}

/**
 * Resolve which profiles hold the seats.
 *
 * `assigned` is the household's explicit choice. Anything else is filled from
 * `order` (the profile list) so a fresh purchase is useful immediately without
 * making someone assign seats before they can play. Assignments for profiles
 * that no longer exist are dropped rather than silently consuming a seat.
 */
export function resolveSeats(
  order: string[], assigned: string[], seats: number,
): string[] {
  if (seats <= 0) return [];
  // Deduped: a repeated id in the stored assignment would otherwise consume two
  // paid seats and cover one profile.
  const valid = [...new Set(assigned.filter((id) => order.includes(id)))];
  const held = valid.slice(0, seats);
  if (held.length >= seats) return held;

  const taken = new Set(held);
  for (const id of order) {
    if (held.length >= seats) break;
    if (!taken.has(id)) { held.push(id); taken.add(id); }
  }
  return held;
}

/** Does `profileId` have paid access? */
export function isPremiumProfile(
  profileId: string | null,
  e: Entitlement | null,
  order: string[],
  assigned: string[],
  now: number,
): boolean {
  if (!profileId) return false;
  const seats = seatsFor(e, now);
  if (seats <= 0) return false;
  return resolveSeats(order, assigned, seats).includes(profileId);
}

/** Whole days left, for "3 days left in your trial". Null when open-ended. */
export function daysRemaining(e: Entitlement | null, now: number): number | null {
  if (!e || e.expiresAt == null) return null;
  return Math.max(0, Math.ceil((e.expiresAt - now) / 86_400_000));
}

/**
 * Plain-language state for the subscription screen. Deliberately distinguishes
 * "cancelled but still paid up" from "expired": the first still has access and
 * should not be told otherwise.
 */
export type SubStatus = 'none' | 'trial' | 'active' | 'cancelling' | 'expired';

export function subStatus(e: Entitlement | null, now: number): SubStatus {
  if (!e) return 'none';
  if (!isActive(e, now)) return 'expired';
  if (e.trial) return 'trial';
  return e.willRenew ? 'active' : 'cancelling';
}

/** Seats a plan sells, for the Paywall copy. */
export function planSeats(planId: PlanId): number {
  return PLAN_SEATS[planId] ?? 1;
}
