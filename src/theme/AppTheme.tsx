// Piano Professor — app theme provider (light / dark, persisted).
//
// Replaces the old stub ThemeContext for the rebuilt UI. Exposes the resolved
// color tokens plus a toggle. Persists the choice to AsyncStorage, mirroring the
// prototype's localStorage["pp-theme"] behavior.

import React, {
  createContext, useContext, useEffect, useMemo, useState, useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ThemeMode, PPColors, getColors, Fonts, Radii, Spacing,
} from './palette';

const STORAGE_KEY = 'pp-theme';

export interface AppTheme {
  mode: ThemeMode;
  colors: PPColors;
  fonts: typeof Fonts;
  radii: typeof Radii;
  spacing: typeof Spacing;
  isDark: boolean;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
}

const Ctx = createContext<AppTheme | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') setModeState(saved);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<AppTheme>(() => ({
    mode,
    colors: getColors(mode),
    fonts: Fonts,
    radii: Radii,
    spacing: Spacing,
    isDark: mode === 'dark',
    toggle,
    setMode,
  }), [mode, toggle, setMode]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppTheme(): AppTheme {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppTheme must be used inside <AppThemeProvider>');
  return v;
}
