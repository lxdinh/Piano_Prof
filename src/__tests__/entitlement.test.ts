// The rules that decide paid access.
//
// This replaced a single boolean that any screen could set, that survived a
// reinstall, and that unlocked all five profiles no matter which plan was
// bought. Each of those is a way to lose money or to charge someone for
// something they already have, so the rules get exhaustive coverage.

import {
  daysRemaining, isActive, isPremiumProfile, planSeats, resolveSeats, seatsFor,
  subStatus,
} from '../billing/entitlement';
import { Entitlement, PLAN_SEATS, PlanId } from '../billing/types';

const T0 = 1_800_000_000_000;
const DAY = 86_400_000;

const ent = (over: Partial<Entitlement> = {}): Entitlement => ({
  planId: 'family', period: 'annual', seats: 5,
  expiresAt: T0 + 30 * DAY, trial: false, willRenew: true, source: 'store',
  ...over,
});

describe('isActive', () => {
  it('nothing owned is not active', () => {
    expect(isActive(null, T0)).toBe(false);
  });

  it('is active before expiry and not after', () => {
    expect(isActive(ent({ expiresAt: T0 + 1 }), T0)).toBe(true);
    expect(isActive(ent({ expiresAt: T0 - 1 }), T0)).toBe(false);
  });

  it('treats the exact expiry instant as over', () => {
    expect(isActive(ent({ expiresAt: T0 }), T0)).toBe(false);
  });

  it('treats an unknown end date as still active', () => {
    // Some stores report no expiry for lifetime purchases. Reading "unknown" as
    // "expired" would lock out people who have paid.
    expect(isActive(ent({ expiresAt: null }), T0)).toBe(true);
  });
});

describe('seatsFor', () => {
  it.each(Object.keys(PLAN_SEATS) as PlanId[])('%s grants its plan seats', (planId) => {
    expect(seatsFor(ent({ planId, seats: PLAN_SEATS[planId] }), T0)).toBe(PLAN_SEATS[planId]);
  });

  it('grants nothing once expired', () => {
    expect(seatsFor(ent({ expiresAt: T0 - 1 }), T0)).toBe(0);
    expect(seatsFor(null, T0)).toBe(0);
  });

  it('never grants more seats than the plan sells', () => {
    // A store payload claiming 99 seats on an Individual plan must not unlock
    // the household.
    expect(seatsFor(ent({ planId: 'individual', seats: 99 }), T0)).toBe(1);
  });

  it('falls back to the plan when the seat count is missing', () => {
    expect(seatsFor(ent({ planId: 'duo', seats: 0 }), T0)).toBe(2);
  });
});

describe('resolveSeats', () => {
  const order = ['p1', 'p2', 'p3', 'p4', 'p5'];

  it('fills from household order when nobody is assigned', () => {
    // A fresh purchase has to be useful before anyone assigns anything.
    expect(resolveSeats(order, [], 2)).toEqual(['p1', 'p2']);
  });

  it('honours explicit assignment first', () => {
    expect(resolveSeats(order, ['p4'], 2)).toEqual(['p4', 'p1']);
  });

  it('never exceeds the seat count', () => {
    expect(resolveSeats(order, ['p1', 'p2', 'p3'], 1)).toEqual(['p1']);
  });

  it('drops assignments for profiles that no longer exist', () => {
    // A deleted profile must not keep consuming a paid seat.
    expect(resolveSeats(order, ['gone', 'p3'], 2)).toEqual(['p3', 'p1']);
  });

  it('does not seat the same profile twice', () => {
    expect(resolveSeats(order, ['p2', 'p2'], 3)).toEqual(['p2', 'p1', 'p3']);
  });

  it('grants nothing with no seats', () => {
    expect(resolveSeats(order, ['p1'], 0)).toEqual([]);
  });

  it('copes with more seats than profiles', () => {
    expect(resolveSeats(['p1'], [], 5)).toEqual(['p1']);
  });
});

describe('isPremiumProfile — the whole point of seats', () => {
  const order = ['p1', 'p2', 'p3', 'p4', 'p5'];

  it('Individual covers exactly one profile, not the household', () => {
    const e = ent({ planId: 'individual', seats: 1 });
    expect(isPremiumProfile('p1', e, order, [], T0)).toBe(true);
    expect(isPremiumProfile('p2', e, order, [], T0)).toBe(false);
  });

  it('Duo covers two', () => {
    const e = ent({ planId: 'duo', seats: 2 });
    expect(isPremiumProfile('p2', e, order, [], T0)).toBe(true);
    expect(isPremiumProfile('p3', e, order, [], T0)).toBe(false);
  });

  it('Family covers the whole household', () => {
    const e = ent({ planId: 'family', seats: 5 });
    for (const id of order) expect(isPremiumProfile(id, e, order, [], T0)).toBe(true);
  });

  it('follows an explicit assignment', () => {
    const e = ent({ planId: 'individual', seats: 1 });
    expect(isPremiumProfile('p4', e, order, ['p4'], T0)).toBe(true);
    expect(isPremiumProfile('p1', e, order, ['p4'], T0)).toBe(false);
  });

  it('covers nobody once expired', () => {
    const e = ent({ expiresAt: T0 - 1 });
    for (const id of order) expect(isPremiumProfile(id, e, order, [], T0)).toBe(false);
  });

  it('covers nobody with no subscription', () => {
    expect(isPremiumProfile('p1', null, order, [], T0)).toBe(false);
  });

  it('handles no active profile', () => {
    expect(isPremiumProfile(null, ent(), order, [], T0)).toBe(false);
  });
});

describe('subStatus', () => {
  it('distinguishes cancelled-but-paid-up from expired', () => {
    // Someone who cancelled still has access, and must not be told otherwise.
    expect(subStatus(ent({ willRenew: false }), T0)).toBe('cancelling');
    expect(subStatus(ent({ willRenew: false, expiresAt: T0 - 1 }), T0)).toBe('expired');
  });

  it('reports a trial as a trial', () => {
    expect(subStatus(ent({ trial: true }), T0)).toBe('trial');
  });

  it('reports an ordinary renewing subscription', () => {
    expect(subStatus(ent(), T0)).toBe('active');
  });

  it('reports nothing owned', () => {
    expect(subStatus(null, T0)).toBe('none');
  });
});

describe('daysRemaining', () => {
  it('rounds up so a part-day still counts', () => {
    expect(daysRemaining(ent({ expiresAt: T0 + DAY * 2.5 }), T0)).toBe(3);
  });

  it('never goes negative', () => {
    expect(daysRemaining(ent({ expiresAt: T0 - DAY * 9 }), T0)).toBe(0);
  });

  it('is unknown for an open-ended entitlement', () => {
    expect(daysRemaining(ent({ expiresAt: null }), T0)).toBeNull();
    expect(daysRemaining(null, T0)).toBeNull();
  });
});

describe('planSeats', () => {
  it('matches what the Paywall sells', () => {
    expect(planSeats('individual')).toBe(1);
    expect(planSeats('duo')).toBe(2);
    expect(planSeats('family')).toBe(5);
  });
});
