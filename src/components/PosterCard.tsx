import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radii, Spacing, Elevation } from '../theme/tokens';

export type PosterState = 'active' | 'done' | 'locked' | 'soon';

interface Props {
  title: string;
  subtitle?: string;
  /** Big emoji/glyph shown on the cover. */
  icon: string;
  cover: readonly [string, string];
  state?: PosterState;
  width?: number;
  onPress?: () => void;
}

const BADGE: Record<PosterState, { text: string; tint: string } | null> = {
  active: null,
  done: { text: '✓', tint: Colors.sky },
  locked: { text: '🔒', tint: 'rgba(0,0,0,0.45)' },
  soon: { text: 'SOON', tint: Colors.butterDark },
};

/**
 * A Netflix-style poster tile used across the Learn path and Songbook: a
 * gradient cover with a glyph and a state badge, plus a title/subtitle below.
 */
export default function PosterCard({
  title, subtitle, icon, cover, state = 'active', width = 150, onPress,
}: Props) {
  const dimmed = state === 'locked' || state === 'soon';
  const badge = BADGE[state];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ width }, pressed && onPress && { transform: [{ scale: 0.97 }] }]}
    >
      <LinearGradient
        colors={dimmed ? ['#D8C9A8', '#C9B690'] : cover}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cover, Elevation.sm]}
      >
        <Text style={[styles.icon, dimmed && { opacity: 0.7 }]}>{icon}</Text>
        {state === 'active' && <View style={styles.activeRing} />}
        {badge && (
          <View style={[styles.badge, { backgroundColor: badge.tint }]}>
            <Text style={styles.badgeText}>{badge.text}</Text>
          </View>
        )}
      </LinearGradient>
      <Text style={[styles.title, dimmed && { color: Colors.ink500 }]} numberOfLines={2}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cover: {
    height: 96, borderRadius: Radii.lg,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  icon: { fontSize: 40 },
  activeRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radii.lg, borderWidth: 3, borderColor: Colors.butter,
  },
  badge: {
    position: 'absolute', top: 8, right: 8,
    minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: Fonts.xs, fontWeight: Fonts.weight.black, letterSpacing: 0.5 },
  title: {
    marginTop: Spacing.sm, fontSize: Fonts.base, fontWeight: Fonts.weight.black,
    color: Colors.ink900,
  },
  subtitle: { fontSize: Fonts.xs, color: Colors.ink500, fontWeight: Fonts.weight.heavy, marginTop: 1 },
});
