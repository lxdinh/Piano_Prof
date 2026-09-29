// Piano Professor — billing backend selector.
//
// Same shape as src/account/backend.ts: real implementation when config is
// present, local stand-in otherwise, chosen once and cached. Screens never see
// which one is live except through `billingBackendName()`, which they use to be
// honest with the user rather than to change behaviour.

import { BillingBackend } from './types';
import { MockBillingBackend } from './mockBackend';
import { revenueCatConfigured } from './revenueCatConfig';

let instance: BillingBackend | null = null;

export function getBillingBackend(): BillingBackend {
  if (!instance) {
    if (revenueCatConfigured()) {
      // Required lazily so the native purchase SDK is only ever touched once
      // real keys exist — it does not load in Expo Go or under Jest.
      const { RevenueCatBillingBackend } =
        require('./revenueCatBackend') as typeof import('./revenueCatBackend');
      instance = new RevenueCatBillingBackend();
    } else {
      instance = new MockBillingBackend();
    }
  }
  return instance;
}

export function billingBackendName(): 'mock' | 'revenuecat' {
  return revenueCatConfigured() ? 'revenuecat' : 'mock';
}

/** True when purchases are real. The UI must not claim a sale otherwise. */
export function billingIsLive(): boolean {
  return revenueCatConfigured();
}

/** Tests only — drop the cached instance so a different config can be used. */
export function __resetBillingBackend(): void {
  instance = null;
}
