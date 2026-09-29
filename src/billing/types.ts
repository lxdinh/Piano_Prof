// Piano Professor — what "Premium" actually means.
//
// It used to be a single boolean flipped by a button. That could not express any
// of the things a subscription really has: when it runs out, whether it is a
// trial, which plan was bought, or how many profiles it covers. The Paywall
// sells Individual (1 profile), Duo (2) and Family (5), so the seat count is a
// thing the app has to know rather than marketing copy.

/** Plan ids sold on the Paywall — must match `PLANS` in src/data/content.ts. */
export type PlanId = 'individual' | 'duo' | 'family';
export type BillingPeriod = 'monthly' | 'annual';

/** Seats each plan covers. The single source of truth for entitlement width. */
export const PLAN_SEATS: Record<PlanId, number> = {
  individual: 1,
  duo: 2,
  family: 5,
};

/**
 * What the store says this household is owed, right now.
 *
 * `null` anywhere means "not entitled" — never a partially-filled object, so a
 * missing field can't read as an accidental unlock.
 */
export interface Entitlement {
  planId: PlanId;
  period: BillingPeriod;
  /** Profiles this subscription covers. */
  seats: number;
  /**
   * Trusted-clock ms when access ends. null = no known end (lifetime, or a
   * store that does not report one). Past values mean expired.
   */
  expiresAt: number | null;
  /** Still inside the introductory free period. */
  trial: boolean;
  /** Cancelled but paid up — access continues until `expiresAt`. */
  willRenew: boolean;
  /** Where this came from, so the UI never claims a real purchase it hasn't got. */
  source: 'store' | 'mock';
}

/** A purchasable product, priced by the store in the user's own currency. */
export interface BillingProduct {
  planId: PlanId;
  period: BillingPeriod;
  /** Store-localised, already formatted — never format money ourselves. */
  priceLabel: string;
  /** For "save 30%" style comparisons; in the store's minor units. */
  priceMicros: number;
  currencyCode: string;
  /** Identifier to hand back to `purchase()`. */
  productId: string;
  /** Length of any introductory free period, in days. */
  trialDays: number | null;
}

export type PurchaseResult =
  | { ok: true; entitlement: Entitlement }
  /** The user backed out. Not an error — never show a failure message for this. */
  | { ok: false; cancelled: true }
  | { ok: false; cancelled: false; message: string };

export type RestoreResult =
  | { ok: true; entitlement: Entitlement | null }
  | { ok: false; message: string };

/**
 * Swappable billing implementation, mirroring src/account/backend.ts. The
 * screens only ever see this interface, so the mock and the real store are
 * interchangeable and the app is testable without a store account.
 */
export interface BillingBackend {
  readonly name: 'mock' | 'revenuecat';
  /** Prepare the SDK. Safe to call more than once. */
  init(): Promise<void>;
  /** Products for sale, store-priced. Empty when the store is unreachable. */
  getProducts(): Promise<BillingProduct[]>;
  purchase(productId: string): Promise<PurchaseResult>;
  /**
   * Re-read entitlements the user already owns. Both stores REQUIRE a visible
   * restore path for approval, and it is the only way a paying user gets access
   * back on a new device.
   */
  restore(): Promise<RestoreResult>;
  /** Current entitlement, or null. Cheap — reads cached state. */
  getEntitlement(): Promise<Entitlement | null>;
  /** Fires whenever the store changes entitlement (renewal, expiry, refund). */
  onChange(cb: (e: Entitlement | null) => void): () => void;
}
