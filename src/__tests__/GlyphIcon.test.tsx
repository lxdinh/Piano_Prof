// GlyphIcon replaced the emoji chrome (🔥⚡💎🎵…) with vectors from the shared
// icon set, because emoji are bitmaps and the whole UI is authored on a fixed
// canvas then upscaled — so they resampled into mush while Baloo stayed crisp.
//
// The gap TypeScript cannot see: `IconName` is a union, but `Icon` renders from a
// SWITCH with a `default: return null`. A glyph may therefore point at a
// perfectly valid IconName that the switch has no case for, typecheck happily,
// and render an empty <Svg> on the device. These tests close that gap, and the
// achievements grid depends on it — `deriveAchievements` now emits glyph names
// instead of emoji, so a bad mapping silently blanks a badge.
import React from 'react';
import { render } from '@testing-library/react-native';

import Icon from '../ui/Icon';
import GlyphIcon, { GLYPH, GlyphName } from '../ui/GlyphIcon';
import { deriveAchievements } from '../data/progress';
import type { Profile } from '../data/content';

const NAMES = Object.keys(GLYPH) as GlyphName[];

// react-native-svg always emits an <RNSVGSvgView> wrapping an <RNSVGGroup>, even
// when the switch returned null — so "has children" is NOT a usable signal, and a
// naive version of this helper passed for every name including nonsense ones.
// Only counting actual drawing primitives distinguishes a drawn icon from a
// blank one; `proves the guard works` below keeps it honest.
const DRAWABLE = /^RNSVG(Path|Line|Polyline|Circle|Rect|Ellipse)$/;

function drawables(node: any): number {
  if (!node || typeof node !== 'object') return 0;
  let n = DRAWABLE.test(node.type) ? 1 : 0;
  for (const child of node.children ?? []) n += drawables(child);
  return n;
}

/** True when Icon's switch actually drew something for this name. */
function draws(name: string): boolean {
  return drawables(render(<Icon name={name as any} size={24} />).toJSON()) > 0;
}

/** Every colour react-native-svg resolved, as packed ARGB ints. */
function paints(node: any, out: number[] = []): number[] {
  if (!node || typeof node !== 'object') return out;
  for (const key of ['fill', 'stroke']) {
    const v = node.props?.[key];
    if (v && typeof v.payload === 'number') out.push(v.payload);
  }
  for (const child of node.children ?? []) paints(child, out);
  return out;
}

const argb = (hex: string) => (0xff000000 | parseInt(hex.slice(1), 16)) >>> 0;

describe('GlyphIcon — every glyph resolves to a drawable icon', () => {
  it('covers all nine glyphs', () => {
    expect(NAMES).toHaveLength(9);
  });

  it.each(NAMES)('%s renders a non-empty vector', (name) => {
    expect(draws(GLYPH[name].icon)).toBe(true);
  });

  it.each(NAMES)('%s carries a real colour', (name) => {
    expect(GLYPH[name].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it.each(NAMES)('renders %s through the GlyphIcon wrapper too', (name) => {
    expect(drawables(render(<GlyphIcon name={name} />).toJSON())).toBeGreaterThan(0);
  });

  it('paints each glyph in its emoji colour by default', () => {
    for (const name of NAMES) {
      const svg = render(<GlyphIcon name={name} />).toJSON();
      expect(paints(svg)).toContain(argb(GLYPH[name].color));
    }
  });

  it('lets a caller override the colour', () => {
    const svg = render(<GlyphIcon name="streak" color="#00FF00" />).toJSON();
    expect(paints(svg)).toContain(argb('#00FF00'));
    expect(paints(svg)).not.toContain(argb(GLYPH.streak.color));
  });

  it('proves the guard works — an unmapped name draws nothing', () => {
    expect(draws('definitely-not-an-icon')).toBe(false);
  });
});

describe('achievements grid — the glyph swap kept every badge drawable', () => {
  // Same shape progress.test.ts uses, so the two stay in step.
  const profile: Profile = {
    id: 't', name: 'Test', avatar: 'cool', bg: '#fff', color: '#58CC02',
    streak: 3, xp: 100, gems: 10, hearts: 5, levelId: 'kg', grade: 1,
    placed: true, path: 'chords', lastUnit: 'First 3 Notes', lang: 'en',
    progress: {}, todayXp: 0, lastActiveDate: '2026-07-20',
  };

  it('emits only glyph names the icon set can draw', () => {
    for (const a of deriveAchievements(profile)) {
      expect(NAMES).toContain(a.glyph);
      expect(draws(GLYPH[a.glyph].icon)).toBe(true);
    }
  });

  it('no longer carries emoji', () => {
    for (const a of deriveAchievements(profile)) {
      expect((a as unknown as { emoji?: string }).emoji).toBeUndefined();
    }
  });
});
