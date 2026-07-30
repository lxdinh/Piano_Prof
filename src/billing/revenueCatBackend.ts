// Piano Professor — real purchases, via RevenueCat.
//
// WHY REVENUECAT AND NOT StoreKit/Play Billing DIRECTLY. A receipt has to be
// verified somewhere the user cannot tamper with, and this app has no server —
// Firebase is not even configured. Validating on-device is trivially bypassed,
// so RevenueCat's servers do it and hand back an entitlement we can trust.
//
// Loaded lazily by ./backend.ts, and only when revenueCatConfig.ts has keys, so
// the native SDK is never touched in Expo Go, in the test suite, or before the
// store is set up.
//
// PRODUCT NAMING is the contract with the dashboard: identifiers must read
// `pp_<plan>_<period>`, e.g. `pp_family_annual`. That is how a purchase maps
// back to a seat count. See docs/BILLING_SETUP.md.

import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo, PurchasesPackage,
} from 'react-native-purchases';

import { REVENUECAT_CONFIG } from './revenueCatConfig';
import { parseProductId, toEntitlement } from './revenueCatMapping';
import {
  BillingBackend, BillingProduct, Entitlement, PurchaseResult, RestoreResult,
} from './types';

function introDays(pkg: PurchasesPackage): number | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price > 0) return null; // a discount, not a free trial
  const per = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 }[intro.periodUnit?.toUpperCase() ?? ''] ?? 0;
  const days = per * (intro.cycles || 1);
  return days > 0 ? days : null;
}

export class RevenueCatBillingBackend implements BillingBackend {
  readonly name = 'revenuecat' as const;
  private ready = false;
  private packages = new Map<string, PurchasesPackage>();

  async init(): Promise<void> {
    if (this.ready) return;
    const apiKey = Platform.OS === 'ios'
      ? REVENUECAT_CONFIG.iosKey
      : REVENUECAT_CONFIG.androidKey;
    if (!apiKey) throw new Error('RevenueCat key missing for this platform');
    Purchases.configure({ apiKey });
    this.ready = true;
  }

  async getProducts(): Promise<BillingProduct[]> {
    await this.init();
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return [];

    const out: BillingProduct[] = [];
    for (const pkg of current.availablePackages) {
      const parsed = parseProductId(pkg.product.identifier);
      if (!parsed) continue; // not one of ours — ignore rather than mis-sell
      this.packages.set(pkg.product.identifier, pkg);
      out.push({
        planId: parsed.planId,
        period: parsed.period,
        // Store-localised and already formatted. Never format money ourselves:
        // it is the store that knows the user's currency and tax.
        priceLabel: pkg.product.priceString,
        priceMicros: Math.round(pkg.product.price * 1e6),
        currencyCode: pkg.product.currencyCode,
        productId: pkg.product.identifier,
        trialDays: introDays(pkg),
      });
    }
    return out;
  }

  async purchase(productId: string): Promise<PurchaseResult> {
    await this.init();
    let pkg = this.packages.get(productId);
    if (!pkg) {
      await this.getProducts(); // cold start, or the offering changed
      pkg = this.packages.get(productId);
    }
    if (!pkg) {
      return { ok: false, cancelled: false, message: 'That plan is not available right now.' };
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const entitlement = this.pick(customerInfo);
      if (!entitlement) {
        return {
          ok: false,
          cancelled: false,
          message: 'The purchase went through but no subscription came back. '
            + 'Try “Restore purchases” — you have not been charged twice.',
        };
      }
      return { ok: true, entitlement };
    } catch (e) {
      // Backing out of the store sheet is not a failure and must never show an
      // error — it is the single most common outcome of opening a paywall.
      const err = e as { userCancelled?: boolean | null; message?: string };
      if (err?.userCancelled) return { ok: false, cancelled: true };
      return { ok: false, cancelled: false, message: err?.message ?? 'The purchase could not be completed.' };
    }
  }

  async restore(): Promise<RestoreResult> {
    await this.init();
    try {
      return { ok: true, entitlement: this.pick(await Purchases.restorePurchases()) };
    } catch (e) {
      const err = e as { message?: string };
      return { ok: false, message: err?.message ?? 'Could not reach the store.' };
    }
  }

  async getEntitlement(): Promise<Entitlement | null> {
    await this.init();
    try {
      return this.pick(await Purchases.getCustomerInfo());
    } catch {
      // Offline. Say nothing rather than revoking access on a flaky network —
      // the provider keeps the last known entitlement in that case.
      return null;
    }
  }

  onChange(cb: (e: Entitlement | null) => void): () => void {
    const listener = (info: CustomerInfo) => cb(this.pick(info));
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => { Purchases.removeCustomerInfoUpdateListener(listener); };
  }

  private pick(info: CustomerInfo): Entitlement | null {
    return toEntitlement(info.entitlements.active[REVENUECAT_CONFIG.entitlementId]);
  }
}
