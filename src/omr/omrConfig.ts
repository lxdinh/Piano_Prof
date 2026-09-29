// Piano Professor — where sheet-music recognition runs.
//
// Same paste-in shape as src/billing/revenueCatConfig.ts and
// src/account/firebaseConfig.ts: with nothing configured the app falls back to
// the bundled demo score, so import → review → play stays exercisable in
// development and in the test suite with no server to deploy.
//
// Two sources, deliberately. A build-time default lets a shipped app point at
// your deployed service; the Settings override lets you point a debug build at
// a laptop on the LAN without a rebuild. The override wins when both are set.
//
// See docs/OMR_SETUP.md and backend/omr/README.md.

import AsyncStorage from '@react-native-async-storage/async-storage';

const OVERRIDE_KEY = 'pp.omr.serverUrl';

/** Build-time default, e.g. 'https://pp-omr-xxxx.run.app'. Empty = unset. */
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

/** Set (or clear, with an empty string) the Settings override. */
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
