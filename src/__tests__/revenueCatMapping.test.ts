// The RevenueCat → Entitlement translation.
//
// This is the one part of billing that cannot be verified from here: it needs
// real store products and a sandbox account. What CAN be pinned is the mapping,
// which is where a silent revenue bug would live — a product id that stops
// parsing quietly downgrades a Family subscriber to one seat.

import { parseProductId, toEntitlement } from '../billing/revenueCatMapping';
import { PLAN_SEATS } from '../billing/types';

// Only the fields the mapping reads; the real type has ~15 more.
const info = (over: Record<string, unknown> = {}) => ({
  identifier: 'premium',
  isActive: true,
  willRenew: true,
  periodType: 'NORMAL',
  expirationDateMillis: 1_800_000_000_000,
  productIdentifier: 'pp_family_annual',
  ...over,
} as never);

describe('parseProductId', () => {
  it('reads every plan and period we sell', () => {
    for (const plan of Object.keys(PLAN_SEATS)) {
      for (const period of ['monthly', 'annual']) {
        expect(parseProductId(`pp_${plan}_${period}`)).toEqual({ planId: plan, period });
      }
    }
  });

  it('tolerates the Play Billing base-plan suffix', () => {
    // Google appends `:base-plan-id`, which would otherwise fail to parse and
    // silently downgrade every Android subscriber to a single seat.
    expect(parseProductId('pp_family_annual:p1y')).toEqual({
      planId: 'family', period: 'annual',
    });
  });

  it('rejects anything that is not ours', () => {
    expect(parseProductId('some_other_app_sub')).toBeNull();
    expect(parseProductId('pp_family')).toBeNull();
    expect(parseProductId('pp_enterprise_annual')).toBeNull();
    expect(parseProductId('pp_family_weekly')).toBeNull();
    expect(parseProductId('')).toBeNull();
  });
});

describe('toEntitlement', () => {
  it('maps a live Family subscription to five seats', () => {
    expect(toEntitlement(info())).toEqual({
      planId: 'family', period: 'annual', seats: 5,
      expiresAt: 1_800_000_000_000, trial: false, willRenew: true, source: 'store',
    });
  });

  it('grants nothing when the entitlement is inactive or absent', () => {
    expect(toEntitlement(info({ isActive: false }))).toBeNull();
    expect(toEntitlement(undefined)).toBeNull();
  });

  it('recognises both free-period flavours as a trial', () => {
    expect(toEntitlement(info({ periodType: 'TRIAL' }))!.trial).toBe(true);
    expect(toEntitlement(info({ periodType: 'INTRO' }))!.trial).toBe(true);
    expect(toEntitlement(info({ periodType: 'NORMAL' }))!.trial).toBe(false);
  });

  it('carries a cancelled-but-paid-up subscription through', () => {
    expect(toEntitlement(info({ willRenew: false }))!.willRenew).toBe(false);
  });

  it('accepts a missing expiry as open-ended', () => {
    expect(toEntitlement(info({ expirationDateMillis: null }))!.expiresAt).toBeNull();
  });

  it('falls back to the SMALLEST plan for an unknown product', () => {
    // Safe direction to be wrong in: an unrecognised product still grants
    // access (they paid) but never hands out seats nobody bought.
    const e = toEntitlement(info({ productIdentifier: 'legacy_lifetime' }))!;
    expect(e.planId).toBe('individual');
    expect(e.seats).toBe(1);
  });

  it('derives seats from the plan, never from the payload', () => {
    for (const plan of Object.keys(PLAN_SEATS)) {
      const e = toEntitlement(info({ productIdentifier: `pp_${plan}_monthly` }))!;
      expect(e.seats).toBe(PLAN_SEATS[plan as keyof typeof PLAN_SEATS]);
    }
  });
});
