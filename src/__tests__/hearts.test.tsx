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
import { BillingProvider, useBilling } from '../billing/BillingProvider';
import { getBillingBackend, __resetBillingBackend } from '../billing/backend';
import { MockBillingBackend, mockProductId } from '../billing/mockBackend';
import { HEART_REFILL_MS } from '../data/progress';
import * as trustedTime from '../services/trustedTime';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// The provider persists profiles, and the storage mock outlives a single test —
// without this, a test that empties the heart bar leaves it empty for the next.
beforeEach(async () => { await AsyncStorage.clear(); __resetBillingBackend(); });

// Billing sits ABOVE AppState now — premium gates hearts from inside it, so
// AppState has to be able to read the entitlement.
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BillingProvider><AppStateProvider>{children}</AppStateProvider></BillingProvider>
);

/** Mount the providers with a profile selected — nothing works without one. */
async function mount() {
  const h = renderHook(() => ({ app: useApp(), billing: useBilling() }), { wrapper });
  await act(async () => { h.result.current.app.setActive('p1'); });
  await waitFor(() => expect(h.result.current.app.activeProfile?.id).toBe('p1'));
  return h;
}

type Mounted = Awaited<ReturnType<typeof mount>>;

const hearts = (h: Mounted) => h.result.current.app.activeProfile!.hearts;

/** Premium is no longer settable — it has to be bought, even in tests. */
const subscribe = async (h: Mounted, plan: 'individual' | 'duo' | 'family' = 'family') => {
  await act(async () => {
    await h.result.current.billing.purchase(mockProductId(plan, 'annual'));
  });
  await waitFor(() => expect(h.result.current.app.premium).toBe(true));
};

const lapse = async (h: Mounted) => {
  await act(async () => { await (getBillingBackend() as MockBillingBackend).clear(); });
  await act(async () => { await h.result.current.billing.refresh(); });
  await waitFor(() => expect(h.result.current.app.premium).toBe(false));
};

afterEach(() => { jest.restoreAllMocks(); });

describe('spending hearts', () => {
  it('a wrong answer costs one', async () => {
    const h = await mount();
    expect(hearts(h)).toBe(5);
    await act(async () => { h.result.current.app.loseHeart(); });
    expect(hearts(h)).toBe(4);
  });

  it('runs down to zero and stops there', async () => {
    const h = await mount();
    for (let i = 0; i < 8; i++) {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => { h.result.current.app.loseHeart(); });
    }
    expect(hearts(h)).toBe(0);
  });

  it('starts the refill clock on the first heart lost', async () => {
    const h = await mount();
    expect(h.result.current.app.activeProfile!.heartsAt).toBeUndefined();
    await act(async () => { h.result.current.app.loseHeart(); });
    expect(h.result.current.app.activeProfile!.heartsAt).toEqual(expect.any(Number));
  });

  it('does not restart the clock on later losses', async () => {
    const h = await mount();
    await act(async () => { h.result.current.app.loseHeart(); });
    const first = h.result.current.app.activeProfile!.heartsAt;
    await act(async () => { h.result.current.app.loseHeart(); });
    expect(h.result.current.app.activeProfile!.heartsAt).toBe(first);
  });

  it('only touches the active profile', async () => {
    const h = await mount();
    const otherBefore = h.result.current.app.profiles.find((p) => p.id === 'p2')!.hearts;
    await act(async () => { h.result.current.app.loseHeart(); });
    expect(h.result.current.app.profiles.find((p) => p.id === 'p2')!.hearts).toBe(otherBefore);
  });
});

describe('Premium — unlimited hearts', () => {
  it('never loses one', async () => {
    const h = await mount();
    await subscribe(h);
    await act(async () => { h.result.current.app.loseHeart(); });
    expect(hearts(h)).toBe(5);
  });

  it('resumes costing hearts if Premium lapses', async () => {
    const h = await mount();
    await subscribe(h);
    await act(async () => { h.result.current.app.loseHeart(); });
    await lapse(h);
    await act(async () => { h.result.current.app.loseHeart(); });
    expect(hearts(h)).toBe(4);
  });
});

describe('getting hearts back', () => {
  it('a gem purchase refills the bar', async () => {
    const h = await mount();
    await act(async () => { h.result.current.app.loseHeart(); h.result.current.app.loseHeart(); });
    expect(hearts(h)).toBeLessThan(5);
    await act(async () => { h.result.current.app.buyShopItem('hearts'); });
    expect(hearts(h)).toBe(5);
  });

  it('refills over time while the app is open', async () => {
    // THE OTHER HALF of the dead loop: refills were applied only at hydration,
    // so sitting in the app with an empty bar never gave anything back — the
    // learner had to restart the app to collect what the clock already owed.
    jest.useFakeTimers();
    const h = await mount();
    await act(async () => { h.result.current.app.loseHeart(); });
    expect(hearts(h)).toBe(4);

    const owed = h.result.current.app.activeProfile!.heartsAt! + HEART_REFILL_MS + 1;
    jest.spyOn(trustedTime, 'now').mockReturnValue(owed);
    jest.spyOn(trustedTime, 'isSuspicious').mockReturnValue(false);

    await act(async () => { jest.advanceTimersByTime(60_000); });
    expect(hearts(h)).toBe(5);
    jest.useRealTimers();
  });

  it('withholds timed refills while the clock looks tampered with', async () => {
    jest.useFakeTimers();
    const h = await mount();
    await act(async () => { h.result.current.app.loseHeart(); });

    const owed = h.result.current.app.activeProfile!.heartsAt! + HEART_REFILL_MS * 5;
    jest.spyOn(trustedTime, 'now').mockReturnValue(owed);
    jest.spyOn(trustedTime, 'isSuspicious').mockReturnValue(true);

    await act(async () => { jest.advanceTimersByTime(60_000); });
    expect(hearts(h)).toBe(4); // still owed, but not while tampering is live
    jest.useRealTimers();
  });
});
