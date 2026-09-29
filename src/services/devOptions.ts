// Piano Professor — developer options.
//
// Some settings exist for whoever builds the app, not for learners: the
// scan-server address is the obvious one (see src/omr/omrConfig.ts — the
// shipped build has the address baked in). Showing those rows to everyone
// invites support tickets from people who tapped something they never needed.
// So they hide behind the classic Android gesture: tap the version row in
// Settings seven times. Nothing here throws — a broken storage layer just
// means the options read as off.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pp.dev.v1';

/** Taps on the version row needed to toggle developer options. */
export const DEV_TAPS_NEEDED = 7;

export async function isDevOptionsEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setDevOptionsEnabled(on: boolean): Promise<void> {
  try {
    if (on) await AsyncStorage.setItem(KEY, '1');
    else await AsyncStorage.removeItem(KEY);
  } catch {
    /* best-effort: the toggle simply does not persist */
  }
}

/**
 * Whether `count` taps is enough to reveal (or hide) developer options.
 * Pure, so the gesture threshold is testable without a component.
 */
export function revealTaps(count: number, needed = DEV_TAPS_NEEDED): boolean {
  return Number.isFinite(count) && count >= needed;
}
