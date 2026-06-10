import React, { createContext, useContext } from 'react';
import { Colors, Fonts, Radii, Spacing, LedColors } from './tokens';

export type Theme = {
  colors:  typeof Colors;
  fonts:   typeof Fonts;
  radii:   typeof Radii;
  spacing: typeof Spacing;
  ledColors: typeof LedColors;
};

const defaultTheme: Theme = {
  colors:    Colors,
  fonts:     Fonts,
  radii:     Radii,
  spacing:   Spacing,
  ledColors: LedColors,
};

const ThemeCtx = createContext<Theme>(defaultTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeCtx.Provider value={defaultTheme}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeCtx);
}
