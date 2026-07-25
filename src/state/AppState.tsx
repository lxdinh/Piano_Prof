// Piano Professor — app state (family profiles, premium, LED, sound).
// Mirrors the prototype's threaded `ctx` object (app.jsx / phone-tabs.jsx),
// backed by AsyncStorage so a household's profiles + progress persist.

import React, {
  createContext, useContext, useEffect, useMemo, useRef, useState, useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, PROFILES_SEED } from '../data/content';
import { applyCompletion, applyHeartRefill } from '../data/progress';
import { applyClaim } from '../data/quests';
import { applyPurchase, canBuy, ShopItem } from '../data/shop';
import { applyChestOpen, canOpenChest, chestTier } from '../data/chest';
import * as trustedTime from '../services/trustedTime';

/** Premium perk: Double XP on every lesson. */
export const PREMIUM_XP_MULTIPLIER = 2;

const STORAGE_KEY = 'pp.appstate.v1';
export const MAX_PROFILES = 5;

export interface LedState {
  connected: boolean;
  brightness: number;
  theme: string;
  calibrated: boolean;
}

export interface AppState {
  ready: boolean;
  profiles: Profile[];
  activeId: string | null;
  activeProfile: Profile | null;
  setActive: (id: string) => void;
  addProfile: (p: Omit<Profile, 'id'>) => string;
  updateProfile: (id: string, patch: Partial<Profile>) => void;
  removeProfile: (id: string) => void;
  updateActive: (patch: Partial<Profile>) => void;
  /** Replace the whole household (used when a synced account restores data). */
  importAll: (profiles: Profile[], activeId: string | null, premium: boolean) => void;
  completeItem: (itemId: string, stars: number, xp: number) => void;
  claimQuest: (questId: string) => void;
  /** Open today's free chest. Returns gems won, or 0 if already opened. */
  openChest: () => number;
  /** Spend gems in the shop. Returns true if the purchase went through. */
  buyShopItem: (id: ShopItem['id']) => boolean;
  loseHeart: () => void;
  refillHearts: () => void;
  premium: boolean;
  setPremium: (v: boolean) => void;
  led: LedState;
  setLed: (patch: Partial<LedState>) => void;
  muted: boolean;
  setMuted: (v: boolean) => void;
  ambient: boolean;
  setAmbient: (v: boolean) => void;
}

const Ctx = createContext<AppState | null>(null);

let idSeq = 0;
const newId = () => `p${Date.now().toString(36)}${(idSeq++).toString(36)}`;

interface Persisted {
  profiles: Profile[];
  activeId: string | null;
  premium: boolean;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  // Real installs start EMPTY so the first thing a family sees is their own
  // profile, not three strangers' streaks. The demo household stays available
  // in development for screenshots and manual testing.
  const [profiles, setProfiles] = useState<Profile[]>(() =>
    (__DEV__ ? JSON.parse(JSON.stringify(PROFILES_SEED)) as Profile[] : []));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [premium, setPremium] = useState(false);
  const [led, setLedState] = useState<LedState>({ connected: false, brightness: 80, theme: 'rainbow', calibrated: false });
  const [muted, setMuted] = useState(false);
  const [ambient, setAmbient] = useState(true);
  const hydrated = useRef(false);

  // hydrate
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const p = JSON.parse(raw) as Persisted;
          if (Array.isArray(p.profiles) && p.profiles.length) {
            // apply elapsed timed heart refills on boot
            // Trusted clock + tamper guard: hearts accrue only over real time.
            const now = trustedTime.now();
            const sus = trustedTime.isSuspicious();
            setProfiles(p.profiles.map((pr) => applyHeartRefill(pr, now, sus)));
          }
          if (p.activeId) setActiveId(p.activeId);
          if (typeof p.premium === 'boolean') setPremium(p.premium);
        }
      } catch {
        /* ignore — fall back to seed */
      } finally {
        hydrated.current = true;
        setReady(true);
      }
    })();
  }, []);

  // persist
  useEffect(() => {
    if (!hydrated.current) return;
    const data: Persisted = { profiles, activeId, premium };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [profiles, activeId, premium]);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeId) ?? null,
    [profiles, activeId],
  );

  const setActive = useCallback((id: string) => setActiveId(id), []);

  const addProfile = useCallback((p: Omit<Profile, 'id'>) => {
    const id = newId();
    setProfiles((ps) => (ps.length >= MAX_PROFILES ? ps : [...ps, { ...p, id }]));
    return id;
  }, []);

  const updateProfile = useCallback((id: string, patch: Partial<Profile>) => {
    setProfiles((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const removeProfile = useCallback((id: string) => {
    setProfiles((ps) => ps.filter((p) => p.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  }, []);

  // NOTE: read activeId from closure (deps) — never call setProfiles inside a
  // setActiveId updater; updaters must stay pure (dev mode double-invokes them).
  const updateActive = useCallback((patch: Partial<Profile>) => {
    if (!activeId) return;
    setProfiles((ps) => ps.map((p) => (p.id === activeId ? { ...p, ...patch } : p)));
  }, [activeId]);

  const importAll = useCallback((next: Profile[], nextActive: string | null, nextPremium: boolean) => {
    if (Array.isArray(next) && next.length) setProfiles(next);
    setActiveId(nextActive ?? null);
    setPremium(nextPremium);
  }, []);

  const completeItem = useCallback((itemId: string, stars: number, xp: number) => {
    if (!activeId) return;
    // Premium earns Double XP; a tampered device clock defers the day rollover
    // so a forward jump can't mint streak days or reset quests.
    const opts = {
      now: trustedTime.now(),
      xpMultiplier: premium ? PREMIUM_XP_MULTIPLIER : 1,
      premium,
      deferDayRewards: trustedTime.isSuspicious(),
    };
    setProfiles((ps) => ps.map((p) => (p.id === activeId
      ? applyCompletion(p, itemId, stars, xp, trustedTime.todayKey(), opts) : p)));
  }, [activeId, premium]);

  const claimQuest = useCallback((questId: string) => {
    if (!activeId) return;
    setProfiles((ps) => ps.map((p) => (p.id === activeId
      ? applyClaim(p, questId, trustedTime.todayKey()) : p)));
  }, [activeId]);

  /** Open today's free chest. Returns the gems won, or 0 if unavailable. */
  const openChest = useCallback((): number => {
    const p = profiles.find((x) => x.id === activeId);
    const day = trustedTime.todayKey();
    const sus = trustedTime.isSuspicious();
    if (!p || !canOpenChest(p, day, sus)) return 0;
    const won = chestTier(p.id, day).gems;
    setProfiles((ps) => ps.map((x) => (x.id === activeId ? applyChestOpen(x, day, sus) : x)));
    return won;
  }, [profiles, activeId]);

  const buyShopItem = useCallback((id: ShopItem['id']): boolean => {
    const p = profiles.find((x) => x.id === activeId);
    if (!p || !canBuy(p, id)) return false;
    setProfiles((ps) => ps.map((x) => (x.id === activeId ? applyPurchase(x, id) : x)));
    return true;
  }, [profiles, activeId]);

  const loseHeart = useCallback(() => {
    if (!activeId) return;
    if (premium) return; // Premium perk: unlimited hearts — never blocked mid-practice.
    setProfiles((ps) => ps.map((p) => (p.id === activeId
      ? { ...p, hearts: Math.max(0, p.hearts - 1), heartsAt: p.heartsAt ?? trustedTime.now() }
      : p)));
  }, [activeId, premium]);

  const refillHearts = useCallback(() => {
    if (!activeId) return;
    setProfiles((ps) => ps.map((p) => (p.id === activeId ? { ...p, hearts: 5, heartsAt: undefined } : p)));
  }, [activeId]);

  const setLed = useCallback((patch: Partial<LedState>) => {
    setLedState((cur) => ({ ...cur, ...patch }));
  }, []);

  const value = useMemo<AppState>(() => ({
    ready, profiles, activeId, activeProfile,
    setActive, addProfile, updateProfile, removeProfile, updateActive, importAll,
    completeItem, claimQuest, openChest, buyShopItem, loseHeart, refillHearts,
    premium, setPremium, led, setLed, muted, setMuted, ambient, setAmbient,
  }), [ready, profiles, activeId, activeProfile, setActive, addProfile, updateProfile,
    removeProfile, updateActive, importAll, completeItem, claimQuest, openChest, buyShopItem, loseHeart, refillHearts, premium, led, setLed, muted, ambient]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppStateProvider>');
  return v;
}
