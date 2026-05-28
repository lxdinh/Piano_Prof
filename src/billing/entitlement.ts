import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Entitlement read. In production this is written by a store webhook → backend
// (users/{uid}/private/subscription, client read-only). For v1 there is no
// store SDK wired, so entitlement is read from local storage and defaults to
// "free". RevenueCat's `react-native-purchases` would replace getTier().

export type Tier = 'free' | 'super' | 'max';

const TIER_KEY = 'pp.entitlement.tier';

export async function getTier(): Promise<Tier> {
  try {
    const raw = await AsyncStorage.getItem(TIER_KEY);
    return raw === 'super' || raw === 'max' ? raw : 'free';
  } catch {
    return 'free';
  }
}

export async function setTier(tier: Tier): Promise<void> {
  try {
    await AsyncStorage.setItem(TIER_KEY, tier);
  } catch {
    /* ignore */
  }
}

export function useEntitlement(): { tier: Tier; isPremium: boolean; refresh: () => void } {
  const [tier, setTierState] = useState<Tier>('free');
  const load = () => { getTier().then(setTierState); };
  useEffect(load, []);
  return { tier, isPremium: tier !== 'free', refresh: load };
}
