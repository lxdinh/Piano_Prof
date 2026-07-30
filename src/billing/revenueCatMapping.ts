// Piano Professor — RevenueCat payload → our Entitlement.
//
// Kept apart from revenueCatBackend.ts, which pulls in react-native and the
// native purchase SDK. Everything here is pure and free of both (the RevenueCat
// import below is types-only and erases at build), so the mapping — the part
// where a silent revenue bug would live — is testable in the fast unit project
// with no store, no device and no emulator.

import type { PurchasesEntitlementInfo } from 'react-native-purchases';

import { BillingPeriod, Entitlement, PLAN_SEATS, PlanId } from './types';

/**
 * `pp_family_annual` → { planId: 'family', period: 'annual' }.
 *
 * PRODUCT NAMING is the contract with the RevenueCat dashboard: identifiers
 * must read `pp_<plan>_<period>`. See docs/BILLING_SETUP.md.
 */
export function parseProductId(
  productId: string,
): { planId: PlanId; period: BillingPeriod } | null {
  // Play Billing appends the base-plan id as `product:base-plan`.
  const [base] = productId.split(':');
  const m = /^pp_(individual|duo|family)_(monthly|annual)$/.exec(base);
  if (!m) return null;
  return { planId: m[1] as PlanId, period: m[2] as BillingPeriod };
}

/** Map a RevenueCat entitlement onto ours, or null if it grants nothing. */
export function toEntitlement(
  info: PurchasesEntitlementInfo | undefined,
): Entitlement | null {
  if (!info || !info.isActive) return null;
  const parsed = parseProductId(info.productIdentifier);
  // An active entitlement from a product we don't recognise still deserves
  // access — falling through to the smallest plan is the safe direction to be
  // wrong in, because it never grants seats that weren't paid for.
  const planId = parsed?.planId ?? 'individual';
  return {
    planId,
    period: parsed?.period ?? 'monthly',
    // Seats always come from the PLAN, never from the payload, so a malformed
    // or spoofed seat count cannot widen a subscription.
    seats: PLAN_SEATS[planId],
    expiresAt: info.expirationDateMillis ?? null,
    // periodType is 'TRIAL' | 'INTRO' | 'NORMAL'.
    trial: info.periodType === 'TRIAL' || info.periodType === 'INTRO',
    willRenew: info.willRenew,
    source: 'store',
  };
}
