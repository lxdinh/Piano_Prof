# Turning on real subscriptions (RevenueCat)

The app ships with a **mock** billing backend, so the Paywall, the trial, seat
assignment and the subscription screen all work in development with no store
account. Nothing is charged, and the UI says "Test mode" wherever it could be
mistaken for a real sale. Paste the keys below and the backend selector switches
automatically — no app code changes.

## Why RevenueCat and not StoreKit / Play Billing directly

A receipt has to be verified somewhere the user cannot tamper with. This app has
no server (Firebase isn't configured either), and validating on-device is
trivially bypassed. RevenueCat's servers do the validation and hand back an
entitlement the app can trust. It's free below roughly $2.5k/month of revenue.

## 1. Create the products

Both stores need the products created **on their side first**. Identifiers are a
contract with the app — `src/billing/revenueCatMapping.ts` parses them:

```
pp_<plan>_<period>          plan   = individual | duo | family
                            period = monthly | annual
```

So six products, e.g. `pp_family_annual`, `pp_individual_monthly`.

- **App Store Connect** → your app → Subscriptions → create a subscription group
  and add the six products. Add an introductory offer (7-day free trial) if you
  want the Paywall to advertise one — it only promises a trial the store
  actually returns.
- **Google Play Console** → Monetise → Subscriptions. Play appends the base-plan
  id to the product (`pp_family_annual:p1y`); the parser already handles that.

A product whose id doesn't parse still grants access — it just falls back to a
single seat. That's the safe direction to be wrong in, but it means a typo shows
up as "Family subscribers only get one seat", so check the ids.

## 2. Wire up RevenueCat

1. <https://app.revenuecat.com> → create a project.
2. Add both apps (iOS + Android), connect them to App Store Connect and Play.
3. **Products** → import the six product ids.
4. **Entitlements** → create one called `premium` and attach all six products.
   Everything paid hangs off that single entitlement.
5. **Offerings** → create the current offering and add the six as packages.
   `getProducts()` reads `offerings.current`, so anything not in the current
   offering will not appear on the Paywall.

## 3. Paste the keys

RevenueCat → Project settings → **API keys** → the *public app-specific* keys
(`appl_…` for iOS, `goog_…` for Android). Put them in
`src/billing/revenueCatConfig.ts`:

```ts
export const REVENUECAT_CONFIG: RevenueCatConfig = {
  iosKey: 'appl_xxxxxxxxxxxx',
  androidKey: 'goog_xxxxxxxxxxxx',
  entitlementId: 'premium',
};
```

These are **public** keys and are safe in the app bundle. The *secret* key must
never go here — it belongs on a server, which this app does not have.

## 4. Build and test

`react-native-purchases` is a native module, so it needs a real build — it does
not work in Expo Go:

```bash
npx expo prebuild
eas build --profile preview --platform android
```

Then test with a **sandbox account**:

- **iOS**: App Store Connect → Users and Access → Sandbox testers. Sign out of
  the App Store on the device first; the sandbox prompt appears at purchase.
- **Android**: add licence testers in Play Console, and install a build from a
  track (internal testing is enough) — not a sideloaded APK.

Worth walking through by hand, because none of it can be verified from CI:

1. Buy each plan; confirm the seat count in Subscription matches (1 / 2 / 5).
2. Kill and relaunch — the entitlement should come back without buying again.
3. "Restore purchases" on a second device signed into the same store account.
4. Cancel in the store; the app should show "Cancelled · access until <date>"
   and keep working until then, not revoke immediately.
5. Let a sandbox subscription lapse; Premium should switch off on its own.

## What the app deliberately does not do

- **No in-app cancel button.** An app cannot cancel a store subscription. The
  old screen had one, and it only flipped a local flag — leaving someone still
  being charged while the app told them they weren't. Subscription now points at
  the store's own settings instead.
- **No prices of our own.** Price labels come from the store, which knows the
  user's currency and tax. The static numbers in `PLANS` are a fallback for when
  the store hasn't answered yet.
- **No entitlement from sync.** Restoring a cloud backup does not grant Premium;
  only the store does. That's what "Restore purchases" is for.
