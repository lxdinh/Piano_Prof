// Piano Professor — vector stand-ins for the emoji we used as UI chrome.
//
// The emoji looked jagged next to the type: system emoji are bitmaps, and the
// whole UI is rendered into a fixed canvas and then scaled up to the device, so
// they get resampled while Baloo 2 stays crisp at any size. These are drawn
// from the same SVG set as the rest of the icons, so they scale perfectly —
// while keeping each emoji's colour, which is the part worth keeping.
import React from 'react';
import Icon, { IconName } from './Icon';

export type GlyphName = 'streak' | 'xp' | 'gems' | 'songs' | 'hearts' | 'league' | 'diploma' | 'perfect' | 'chord';

/** Vector icon + the colour the matching emoji reads as. */
export const GLYPH: Record<GlyphName, { icon: IconName; color: string }> = {
  streak:  { icon: 'flame', color: '#FF6A2B' }, // 🔥
  xp:      { icon: 'bolt',  color: '#F5B800' }, // ⚡
  gems:    { icon: 'gem',   color: '#4FC3F7' }, // 💎
  songs:   { icon: 'music', color: '#A855F7' }, // 🎵
  hearts:  { icon: 'heart', color: '#FF5C77' }, // ❤️
  league:  { icon: 'crown', color: '#F5B800' }, // 🏆
  diploma: { icon: 'grad',  color: '#8D6E63' }, // 🎓
  perfect: { icon: 'star',  color: '#F5B800' }, // ⭐
  chord:   { icon: 'piano', color: '#5BB8E3' }, // 🎹
};

export default function GlyphIcon({ name, size = 28, color }: {
  name: GlyphName; size?: number; color?: string;
}) {
  const g = GLYPH[name];
  return <Icon name={g.icon} size={size} color={color ?? g.color} />;
}
