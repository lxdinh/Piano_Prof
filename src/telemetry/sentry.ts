// Piano Professor — crash reporting (Sentry). Drop-in: a no-op until a DSN is
// provided, so the app builds and runs with no Sentry account.
//
// To turn it on: create a Sentry project and set EXPO_PUBLIC_SENTRY_DSN (an EAS
// environment variable / .env). Reporting then activates with no code changes.
// For native crash symbolication, also add the `@sentry/react-native/expo`
// config plugin + a SENTRY_AUTH_TOKEN EAS secret so EAS uploads source maps.
import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

/** True only when a DSN is set and we're not in a dev build. */
export const telemetryEnabled = Boolean(DSN) && !__DEV__;

export function initTelemetry(): void {
  if (!telemetryEnabled) return;
  Sentry.init({
    dsn: DSN,
    // Kids-app privacy defaults: no IP / user identifiers collected.
    sendDefaultPii: false,
    tracesSampleRate: 0.2,
  });
}

/** Report a handled error with optional context. Safe no-op when disabled. */
export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (!telemetryEnabled) return;
  try {
    Sentry.captureException(err, context ? { extra: context } : undefined);
  } catch {
    /* telemetry must never throw into the app */
  }
}

/** Wrap the root component for native crash handlers when enabled. */
export function wrapRoot<T>(component: T): T {
  return telemetryEnabled ? (Sentry.wrap(component as never) as T) : component;
}
