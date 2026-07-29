// The hearts economy, end to end through AppStateProvider.
//
// All of this logic already existed and was already unit-tested — and none of it
// ran, because `loseHeart` and `refillHearts` had no callers anywhere in the
// app. Nothing ever cost a heart, so the counter never moved, the out-of-hearts
// Upsell was unreachable (Shell only shows it at hearts <= 0), and the gem sink
// for refills never opened. These tests exercise the loop through the provider
// the screens actually use, so a future disconnection shows up here.
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppStateProvider, useApp } from '../state/AppState';
import { HEART_REFILL_MS } from '../data/progress';
import * as trustedTime from '../services/trustedTime';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// The provider persists profiles, and the storage mock outlives a single test —
// without this, a test that empties the heart bar leaves it empty for the next.
beforeEach(async () => { await AsyncStorage.clear(); });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppStateProvider>{children}</AppStateProvider>
);

/** Mount the provider with a profile selected — nothing works without one. */
async function mount() {
  const h = renderHook(() => useApp(), { wrapper });
  await act(async () => { h.result.current.setActive('p1'); });
  await waitFor(() => expect(h.result.current.activeProfile?.id).toBe('p1'));
  return h;
}

const hearts = (h: { result: { current: ReturnType<typeof useApp> } }) =>
  h.result.current.activeProfile!.hearts;

afterEach(() => { jest.restoreAllMocks(); });

describe('spending hearts', () => {
  it('a wrong answer costs one', async () => {
    const h = await mount();
    expect(hearts(h)).toBe(5);
    await act(async () => { h.result.current.loseHeart(); });
    expect(hearts(h)).toBe(4);
  });

  it('runs down to zero and stops there', async () => {
    const h = await mount();
    for (let i = 0; i < 8; i++) {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => { h.result.current.loseHeart(); });
    }
    expect(hearts(h)).toBe(0);
  });

  it('starts the refill clock on the first heart lost', async () => {
    const h = await mount();
    expect(h.result.current.activeProfile!.heartsAt).toBeUndefined();
    await act(async () => { h.result.current.loseHeart(); });
    expect(h.result.current.activeProfile!.heartsAt).toEqual(expect.any(Number));
  });

  it('does not restart the clock on later losses', async () => {
    const h = await mount();
    await act(async () => { h.result.current.loseHeart(); });
    const first = h.result.current.activeProfile!.heartsAt;
    await act(async () => { h.result.current.loseHeart(); });
    expect(h.result.current.activeProfile!.heartsAt).toBe(first);
  });

  it('only touches the active profile', async () => {
    const h = await mount();
    const otherBefore = h.result.current.profiles.find((p) => p.id === 'p2')!.hearts;
    await act(async () => { h.result.current.loseHeart(); });
    expect(h.result.current.profiles.find((p) => p.id === 'p2')!.hearts).toBe(otherBefore);
  });
});

describe('Premium — unlimited hearts', () => {
  it('never loses one', async () => {
    const h = await mount();
    await act(async () => { h.result.current.setPremium(true); });
    await act(async () => { h.result.current.loseHeart(); });
    expect(hearts(h)).toBe(5);
  });

  it('resumes costing hearts if Premium lapses', async () => {
    const h = await mount();
    await act(async () => { h.result.current.setPremium(true); });
    await act(async () => { h.result.current.loseHeart(); });
    await act(async () => { h.result.current.setPremium(false); });
    await act(async () => { h.result.current.loseHeart(); });
    expect(hearts(h)).toBe(4);
  });
});

describe('getting hearts back', () => {
  it('a gem purchase refills the bar', async () => {
    const h = await mount();
    await act(async () => { h.result.current.loseHeart(); h.result.current.loseHeart(); });
    expect(hearts(h)).toBeLessThan(5);
    await act(async () => { h.result.current.buyShopItem('hearts'); });
    expect(hearts(h)).toBe(5);
  });

  it('refills over time while the app is open', async () => {
    // THE OTHER HALF of the dead loop: refills were applied only at hydration,
    // so sitting in the app with an empty bar never gave anything back — the
    // learner had to restart the app to collect what the clock already owed.
    jest.useFakeTimers();
    const h = await mount();
    await act(async () => { h.result.current.loseHeart(); });
    expect(hearts(h)).toBe(4);

    const owed = h.result.current.activeProfile!.heartsAt! + HEART_REFILL_MS + 1;
    jest.spyOn(trustedTime, 'now').mockReturnValue(owed);
    jest.spyOn(trustedTime, 'isSuspicious').mockReturnValue(false);

    await act(async () => { jest.advanceTimersByTime(60_000); });
    expect(hearts(h)).toBe(5);
    jest.useRealTimers();
  });

  it('withholds timed refills while the clock looks tampered with', async () => {
    jest.useFakeTimers();
    const h = await mount();
    await act(async () => { h.result.current.loseHeart(); });

    const owed = h.result.current.activeProfile!.heartsAt! + HEART_REFILL_MS * 5;
    jest.spyOn(trustedTime, 'now').mockReturnValue(owed);
    jest.spyOn(trustedTime, 'isSuspicious').mockReturnValue(true);

    await act(async () => { jest.advanceTimersByTime(60_000); });
    expect(hearts(h)).toBe(4); // still owed, but not while tampering is live
    jest.useRealTimers();
  });
});
