// Piano Professor — billing without a store.
//
// Keeps the app usable in development, in the test suite, and in Expo Go, where
// no native purchase SDK exists. It grants a REAL entitlement object — expiry,
// trial, seats and all — so every screen exercises the same code paths the store
// backend drives. What it does not do is pretend to be a purchase: `source` is
// `'mock'`, and the UI says so out loud.
//
// This is the honest version of what the whole app used to do: the old Paywall
// called `setPremium(true)` and showed a real subscription card with a made-up
// billing date and card number.

import AsyncStorage from '@react-native-async-storage/async-storage';

import * as trustedTime from '../services/trustedTime';
import {
  BillingBackend, BillingProduct, Entitlement, PLAN_SEATS, PlanId,
  PurchaseResult, RestoreResult, BillingPeriod,
} from './types';

const STORE_KEY = 'pp.billing.mock.v1';
const DAY = 86_400_000;
const MOCK_TRIAL_DAYS = 7;

/** Prices are illustrative only — the real ones come from the store. */
const MONTHLY: Record<PlanId, number> = { individual: 18.74, duo: 20.83, family: 26.24 };

export function mockProductId(planId: PlanId, period: BillingPeriod): string {
  return `mock.${planId}.${period}`;
}

function parseProductId(productId: string): { planId: PlanId; period: BillingPeriod } | null {
  const [prefix, planId, period] = productId.split('.');
  if (prefix !== 'mock') return null;
  if (!(planId in PLAN_SEATS)) return null;
  if (period !== 'monthly' && period !== 'annual') return null;
  return { planId: planId as PlanId, period };
}

export class MockBillingBackend implements BillingBackend {
  readonly name = 'mock' as const;
  private cached: Entitlement | null = null;
  private loaded = false;
  private subs: ((e: Entitlement | null) => void)[] = [];

  async init(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      this.cached = raw ? (JSON.parse(raw) as Entitlement) : null;
    } catch {
      this.cached = null;
    }
    this.loaded = true;
  }

  async getProducts(): Promise<BillingProduct[]> {
    const out: BillingProduct[] = [];
    for (const planId of Object.keys(PLAN_SEATS) as PlanId[]) {
      for (const period of ['monthly', 'annual'] as BillingPeriod[]) {
        // Annual is billed once at a discount; monthly carries the usual markup.
        const monthly = period === 'annual' ? MONTHLY[planId] : MONTHLY[planId] * 1.6;
        const total = period === 'annual' ? monthly * 12 : monthly;
        out.push({
          planId,
          period,
          priceLabel: `$${total.toFixed(2)}`,
          priceMicros: Math.round(total * 1e6),
          currencyCode: 'USD',
          productId: mockProductId(planId, period),
          trialDays: MOCK_TRIAL_DAYS,
        });
      }
    }
    return out;
  }

  async purchase(productId: string): Promise<PurchaseResult> {
    const parsed = parseProductId(productId);
    if (!parsed) {
      return { ok: false, cancelled: false, message: `Unknown product ${productId}` };
    }
    const now = trustedTime.now();
    const entitlement: Entitlement = {
      planId: parsed.planId,
      period: parsed.period,
      seats: PLAN_SEATS[parsed.planId],
      expiresAt: now + MOCK_TRIAL_DAYS * DAY,
      trial: true,
      willRenew: true,
      source: 'mock',
    };
    await this.commit(entitlement);
    return { ok: true, entitlement };
  }

  async restore(): Promise<RestoreResult> {
    await this.init();
    return { ok: true, entitlement: this.cached };
  }

  async getEntitlement(): Promise<Entitlement | null> {
    await this.init();
    return this.cached;
  }

  onChange(cb: (e: Entitlement | null) => void): () => void {
    this.subs.push(cb);
    return () => { this.subs = this.subs.filter((s) => s !== cb); };
  }

  /** Test/dev affordance: drop the fake subscription. */
  async clear(): Promise<void> {
    await this.commit(null);
  }

  private async commit(e: Entitlement | null): Promise<void> {
    this.cached = e;
    this.loaded = true;
    try {
      if (e) await AsyncStorage.setItem(STORE_KEY, JSON.stringify(e));
      else await AsyncStorage.removeItem(STORE_KEY);
    } catch {
      /* an entitlement that lasts the session still beats crashing */
    }
    this.subs.forEach((cb) => cb(e));
  }
}
