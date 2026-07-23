// Piano Professor — themed design tokens (light + dark)
//
// Ported 1:1 from the new design prototype's CSS custom properties
// (":root" light + "[data-theme=dark]" in "Piano Professor.html"). These drive
// the whole rebuilt UI through useAppTheme(). Brand hues stay constant across
// themes; only the neutral/surface tokens flip.

import { Fonts, Radii, Spacing } from './tokens';

export type ThemeMode = 'light' | 'dark';

export interface PPColors {
  // app surfaces / neutrals (theme-dependent)
  bg: string;        // --cream (screen background)
  surface: string;   // --surface (cards)
  surface2: string;  // --surface-2 (insets, tracks)
  ink: string;       // --ink (primary text)
  inkSoft: string;   // --ink-soft (secondary text)
  inkFaint: string;  // --ink-faint (tertiary text / labels)
  line: string;      // --line (borders + chunky plate shadow)
  navActive: string; // --nav-active (selected nav pill)
  segTrack: string;  // --seg-track
  segActive: string; // --seg-active
  selGold: string;   // --sel-gold (selection tints)
  selGreen: string;
  selSky: string;

  // brand hues (constant across themes)
  green: string;
  greenDark: string;
  gold: string;
  goldDeep: string;
  sky: string;
  skyDeep: string;
  streak: string;
  streakDark: string;
  error: string;
  errorDeep: string;
  purple: string;
}

const BRAND = {
  green: '#58CC02',
  greenDark: '#46A302',
  gold: '#F5B800',
  goldDeep: '#C28A00',
  sky: '#5BB8E3',
  skyDeep: '#2E84AD',
  streak: '#FF7A52',
  streakDark: '#C2410C',
  error: '#FF4B4B',
  errorDeep: '#C81E1E',
  purple: '#9b6bff',
} as const;

export const LightColors: PPColors = {
  bg: '#FFFAEC',
  surface: '#FFFFFF',
  surface2: '#F7F1DE',
  ink: '#2D2A26',
  inkSoft: '#79735F',
  inkFaint: '#A99F82',
  line: '#EAE0C4',
  navActive: '#E3F3FB',
  segTrack: '#EFE7CC',
  segActive: '#FFFFFF',
  selGold: '#FFF7E0',
  selGreen: '#F1FCE6',
  selSky: '#EAF6FC',
  ...BRAND,
};

export const DarkColors: PPColors = {
  bg: '#0E1A2C',
  surface: '#16263E',
  surface2: '#20375A',
  ink: '#EAF2FC',
  inkSoft: '#AEC2DE',
  inkFaint: '#6E88AD',
  line: '#2A4267',
  navActive: '#123C56',
  segTrack: '#182B45',
  segActive: '#2B4670',
  selGold: '#33301B',
  selGreen: '#15331F',
  selSky: '#123247',
  ...BRAND,
};

export function getColors(mode: ThemeMode): PPColors {
  return mode === 'dark' ? DarkColors : LightColors;
}

// Re-export the scale tokens so screens can pull everything from one place.
export { Fonts, Radii, Spacing };
