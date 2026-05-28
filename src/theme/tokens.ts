// Piano Professor — design tokens (React Native)
// Mirrors CSS custom properties in pp-styles.css

export const Colors = {
  // brand
  brand:      '#58CC02',
  brandDark:  '#46A302',
  brandLight: '#7CE62A',

  // sky (Bluetooth / info)
  sky:        '#5BB8E3',
  skyDark:    '#3A9EC9',
  skyLight:   '#A3D8F0',

  // cream / paper
  cream50:    '#FFFAEC',
  cream100:   '#FFF3CC',
  paper:      '#FFFAEC',

  // butter / warning
  butter:     '#F5B800',
  butterDark: '#C99300',
  butterBg:   '#FFE6BA',

  // rust / danger
  rust:       '#C2410C',
  rustLight:  '#FF7A52',

  // ink scale
  ink900:     '#2A1D11',
  ink700:     '#4A3728',
  ink500:     '#7A6250',
  ink300:     '#B09E8C',
  inkLine:    '#E8D9BC',

  // status
  success:    '#58CC02',
  error:      '#FF4B4B',
  warning:    '#F5B800',

  // dark theme (connected screen)
  darkBg:     '#0F1117',
  darkSurface:'rgba(255,255,255,0.06)',
  darkBorder: 'rgba(255,255,255,0.12)',
  darkText:   '#FFFFFF',
  darkSubtext:'rgba(255,255,255,0.7)',
  darkMuted:  'rgba(255,255,255,0.4)',
} as const;

export const Fonts = {
  xs:   10,
  sm:   11,
  base: 14,
  md:   16,
  lg:   18,
  xl:   22,
  '2xl': 28,
  '3xl': 34,
  weight: {
    bold:  '800' as const,
    black: '900' as const,
    heavy: '700' as const,
  },
} as const;

export const Radii = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  pill: 999,
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl': 28,
} as const;

// Duolingo-style LED color palette (matches LedStripArt defaults)
export const LedColors = [
  '#FF4B4B', // red
  '#FF9600', // orange
  '#F5B800', // yellow
  '#58CC02', // green (brand)
  '#5BB8E3', // sky
  '#8B5CF6', // violet
  '#FF7A9C', // pink
] as const;

// ── Gradients ───────────────────────────────────────────────────
// Pairs are [start, end] for expo-linear-gradient. Tuned for a warm,
// premium, candy-like feel against the cream paper.
export const Gradients = {
  brand:   ['#6FE021', '#46A302'] as const, // chunky green button
  sky:     ['#7FCBEF', '#3A9EC9'] as const,
  butter:  ['#FFD54A', '#F5B800'] as const,
  rust:    ['#FF8A5C', '#C2410C'] as const,
  violet:  ['#A78BFA', '#7C3AED'] as const,
  paper:   ['#FFFDF6', '#FFF3CC'] as const, // subtle screen backdrop
  dark:    ['#1A1F2E', '#0F1117'] as const, // connected / lesson stage
  rainbow: ['#FF4B4B', '#F5B800', '#58CC02', '#5BB8E3', '#8B5CF6'] as const,
  successGlow: ['#7CE62A', '#58CC02'] as const,
} as const;

// ── Elevation (cross-platform shadow presets) ───────────────────
// iOS uses shadow*, Android uses elevation. Spread into a style.
export const Elevation = {
  none: {},
  sm: {
    shadowColor: '#2A1D11', shadowOpacity: 0.06, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  md: {
    shadowColor: '#2A1D11', shadowOpacity: 0.10, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  lg: {
    shadowColor: '#2A1D11', shadowOpacity: 0.16, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },
  glow: {
    shadowColor: '#58CC02', shadowOpacity: 0.5, shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 }, elevation: 10,
  },
} as const;

// ── Motion ──────────────────────────────────────────────────────
// Shared timing/spring constants so every animation feels related.
export const Motion = {
  duration: { fast: 150, base: 250, slow: 450, xslow: 800 },
  spring: {
    // bouncy press feedback
    press:  { friction: 6, tension: 220 },
    // playful pop (stars, badges)
    pop:    { friction: 4, tension: 90 },
    // gentle settle (entrances)
    settle: { friction: 8, tension: 60 },
  },
} as const;
