// Piano Professor — the live subscription, above the router.
//
// Replaces `setPremium(true)`. Premium is no longer something a button sets; it
// is derived from what the store says the household owns, plus which profiles
// hold the seats that entitlement paid for.
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as trustedTime from '../services/trustedTime';
import { getBillingBackend, billingIsLive } from './backend';
import { seatsFor, subStatus, SubStatus } from './entitlement';
import {
  BillingProduct, Entitlement, PurchaseResult, RestoreResult,
} from './types';

const SEATS_KEY = 'pp.billing.seats.v1';

export interface BillingAPI {
  /** Null when nothing is owned — check `ready` to tell that from "not loaded". */
  entitlement: Entitlement | null;
  ready: boolean;
  products: BillingProduct[];
  /** Store-backed, or the local stand-in. */
  live: boolean;
  status: SubStatus;
  /** How many profiles the subscription covers. 0 when not subscribed. */
  seats: number;
  /** The household's explicit seat choices, in preference order. */
  assigned: string[];
  purchase: (productId: string) => Promise<PurchaseResult>;
  restore: () => Promise<RestoreResult>;
  refresh: () => Promise<void>;
  /** Choose who the subscription covers. Extra ids beyond `seats` are ignored. */
  assignSeats: (profileIds: string[]) => void;
}

const Ctx = createContext<BillingAPI | null>(null);

// Sits ABOVE AppStateProvider on purpose. Premium gates XP multipliers and the
// heart economy from inside AppState, so AppState has to be able to read the
// entitlement — which it could not do if billing lived underneath it. AppState
// owns the profile list, so it is the one that turns `seats` + `assigned` into
// "is THIS profile premium".
export function BillingProvider({ children }: { children: React.ReactNode }) {
  const backend = useRef(getBillingBackend()).current;
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [products, setProducts] = useState<BillingProduct[]>([]);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  // Seat assignment is the household's choice and belongs to this device's
  // storage; the entitlement itself always comes from the store.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SEATS_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) setAssigned(parsed.filter((x) => typeof x === 'string'));
      } catch { /* fall back to automatic seating */ }
    })();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await backend.init();
        const e = await backend.getEntitlement();
        if (alive) setEntitlement(e);
      } catch {
        // A store that cannot be reached must not revoke access; leave whatever
        // we already had and try again on the next refresh.
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => { alive = false; };
  }, [backend]);

  // Renewals, expiries and refunds arrive without the app asking.
  useEffect(() => backend.onChange(setEntitlement), [backend]);

  useEffect(() => {
    let alive = true;
    backend.getProducts()
      .then((p) => { if (alive) setProducts(p); })
      .catch(() => { /* paywall falls back to its static copy */ });
    return () => { alive = false; };
  }, [backend]);

  const now = trustedTime.now();
  const seats = seatsFor(entitlement, now);

  const purchase = useCallback(async (productId: string) => {
    const res = await backend.purchase(productId);
    if (res.ok) setEntitlement(res.entitlement);
    return res;
  }, [backend]);

  const restore = useCallback(async () => {
    const res = await backend.restore();
    if (res.ok) setEntitlement(res.entitlement);
    return res;
  }, [backend]);

  const refresh = useCallback(async () => {
    try { setEntitlement(await backend.getEntitlement()); } catch { /* keep last known */ }
  }, [backend]);

  const assignSeats = useCallback((ids: string[]) => {
    setAssigned(ids);
    AsyncStorage.setItem(SEATS_KEY, JSON.stringify(ids)).catch(() => {});
  }, []);

  const value = useMemo<BillingAPI>(() => ({
    entitlement, ready, products, live: billingIsLive(),
    status: subStatus(entitlement, now),
    seats, assigned,
    purchase, restore, refresh, assignSeats,
  }), [entitlement, ready, products, now, seats, assigned,
    purchase, restore, refresh, assignSeats]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBilling(): BillingAPI {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBilling must be used inside <BillingProvider>');
  return v;
}
