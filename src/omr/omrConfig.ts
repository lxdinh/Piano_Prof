// Piano Professor — where sheet-music recognition runs.
//
// Same paste-in shape as src/billing/revenueCatConfig.ts and
// src/account/firebaseConfig.ts: with nothing configured the app falls back to
// the bundled demo score, so import → review → play stays exercisable in
// development and in the test suite with no server to deploy.
//
// Two sources, deliberately.
//
// 1. OMR_CONFIG.serverUrl is the PRODUCTION address, baked into the build.
//    Run backend/omr/deploy.sh (Cloud Run); it prints the exact line to paste
//    below. Learners never see or set this — the shipped app just works.
// 2. The Settings override is a DEVELOPER facility for pointing a build at a
//    laptop on the LAN without a rebuild. It lives behind Developer options
//    (Settings → tap the version row seven times → Scan server) so it cannot
//    be tripped over. The override wins when both are set.
//
// With neither set, the Import screen shows the bundled demo score.
//
// See docs/OMR_SETUP.md and backend/omr/README.md.

import AsyncStorage from '@react-native-async-storage/async-storage';

const OVERRIDE_KEY = 'pp.omr.serverUrl';

/**
 * Build-time default — the deployed service's HTTPS address, e.g.
 * 'https://pp-omr-xxxx-uc.a.run.app'. backend/omr/deploy.sh prints the line to
 * paste here. Empty = nothing deployed yet; the app falls back to the demo score.
 */
export const OMR_CONFIG = {
  serverUrl: '',
};

/** Trim and drop any trailing slash so `${server}/omr` never doubles up. */
function normalize(url: string | null | undefined): string | null {
  const trimmed = (url ?? '').trim().replace(/\/+$/, '');
  return trimmed ? trimmed : null;
}

/** The server actually in force: Settings override, else the build default. */
export async function getOmrServer(): Promise<string | null> {
  try {
    const override = normalize(await AsyncStorage.getItem(OVERRIDE_KEY));
    if (override) return override;
  } catch {
    /* fall through to the build default */
  }
  return normalize(OMR_CONFIG.serverUrl);
}

/** Set (or clear, with an empty string) the developer override from Settings. */
export async function setOmrServer(url: string): Promise<void> {
  const next = normalize(url);
  if (next) await AsyncStorage.setItem(OVERRIDE_KEY, next);
  else await AsyncStorage.removeItem(OVERRIDE_KEY);
}

export async function omrConfigured(): Promise<boolean> {
  return (await getOmrServer()) != null;
}

/** Exported for tests and for the Settings field's own validation. */
export function isPlausibleServerUrl(url: string): boolean {
  return /^https?:\/\/[^\s/]+/i.test(url.trim());
}
