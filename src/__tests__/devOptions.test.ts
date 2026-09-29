// Developer options — the hidden toggle behind the Settings version row.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEV_TAPS_NEEDED, isDevOptionsEnabled, revealTaps, setDevOptionsEnabled,
} from '../services/devOptions';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

describe('developer options — persistence', () => {
  it('is off until someone turns it on', async () => {
    expect(await isDevOptionsEnabled()).toBe(false);
  });

  it('remembers being turned on', async () => {
    await setDevOptionsEnabled(true);
    expect(await isDevOptionsEnabled()).toBe(true);
  });

  it('can be turned off again', async () => {
    await setDevOptionsEnabled(true);
    await setDevOptionsEnabled(false);
    expect(await isDevOptionsEnabled()).toBe(false);
  });

  it('reads as off, rather than throwing, when storage is broken', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage down'));
    await expect(isDevOptionsEnabled()).resolves.toBe(false);
  });

  it('swallows a failed write', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage down'));
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('storage down'));
    await expect(setDevOptionsEnabled(true)).resolves.toBeUndefined();
    await expect(setDevOptionsEnabled(false)).resolves.toBeUndefined();
  });
});

describe('developer options — the tap gesture', () => {
  it('needs seven taps', () => {
    expect(DEV_TAPS_NEEDED).toBe(7);
    expect(revealTaps(6)).toBe(false);
    expect(revealTaps(7)).toBe(true);
  });

  it('does not un-reveal on an eighth tap', () => {
    expect(revealTaps(8)).toBe(true);
  });

  it('takes a custom threshold', () => {
    expect(revealTaps(2, 3)).toBe(false);
    expect(revealTaps(3, 3)).toBe(true);
  });

  it('ignores nonsense counts', () => {
    expect(revealTaps(NaN)).toBe(false);
    expect(revealTaps(-1)).toBe(false);
  });
});
