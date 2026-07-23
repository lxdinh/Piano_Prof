// Piano Professor — app state (family profiles, premium, LED, sound).
// Mirrors the prototype's threaded `ctx` object (app.jsx / phone-tabs.jsx),
// backed by AsyncStorage so a household's profiles + progress persist.

import React, {
  createContext, useContext, useEffect, useMemo, useRef, useState, useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, PROFILES_SEED } from '../data/content';

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
  const [profiles, setProfiles] = useState<Profile[]>(() =>
    JSON.parse(JSON.stringify(PROFILES_SEED)) as Profile[]);
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
          if (Array.isArray(p.profiles) && p.profiles.length) setProfiles(p.profiles);
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

  const updateActive = useCallback((patch: Partial<Profile>) => {
    setActiveId((id) => {
      if (id) setProfiles((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      return id;
    });
  }, []);

  const loseHeart = useCallback(() => {
    setActiveId((id) => {
      if (id) setProfiles((ps) => ps.map((p) => (p.id === id ? { ...p, hearts: Math.max(0, p.hearts - 1) } : p)));
      return id;
    });
  }, []);

  const refillHearts = useCallback(() => {
    setActiveId((id) => {
      if (id) setProfiles((ps) => ps.map((p) => (p.id === id ? { ...p, hearts: 5 } : p)));
      return id;
    });
  }, []);

  const setLed = useCallback((patch: Partial<LedState>) => {
    setLedState((cur) => ({ ...cur, ...patch }));
  }, []);

  const value = useMemo<AppState>(() => ({
    ready, profiles, activeId, activeProfile,
    setActive, addProfile, updateProfile, removeProfile, updateActive,
    loseHeart, refillHearts,
    premium, setPremium, led, setLed, muted, setMuted, ambient, setAmbient,
  }), [ready, profiles, activeId, activeProfile, setActive, addProfile, updateProfile,
    removeProfile, updateActive, loseHeart, refillHearts, premium, led, setLed, muted, ambient]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppStateProvider>');
  return v;
}
