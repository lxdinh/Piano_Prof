// Piano Professor — RevenueCat config.
//
// Paste your PUBLIC SDK keys here to turn on real purchases. Until they are
// filled in the app uses the mock backend, so development and the test suite
// keep working with no store account — the same arrangement as
// src/account/firebaseConfig.ts.
//
// Where to get them: RevenueCat dashboard → Project settings → API keys →
// "Public app-specific" key, one per platform. See docs/BILLING_SETUP.md.
//
// These are PUBLIC keys and are safe in the app bundle. The secret key must
// never be here — it belongs on a server, and this app does not have one.

export interface RevenueCatConfig {
  /** Public SDK key for iOS (starts `appl_`). */
  iosKey: string;
  /** Public SDK key for Android (starts `goog_`). */
  androidKey: string;
  /**
   * Entitlement identifier configured in RevenueCat that grants Premium.
   * Everything paid hangs off this one string.
   */
  entitlementId: string;
}

export const REVENUECAT_CONFIG: RevenueCatConfig = {
  iosKey: '',
  androidKey: '',
  entitlementId: 'premium',
};

export function revenueCatConfigured(): boolean {
  return Boolean(REVENUECAT_CONFIG.iosKey || REVENUECAT_CONFIG.androidKey);
}
