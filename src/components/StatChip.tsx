import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Fonts, Radii, Spacing, Motion } from '../theme/tokens';
import AnimatedCounter from './AnimatedCounter';

export type StatChipKind = 'streak' | 'xp' | 'hearts' | 'gems';

const KIND_COLORS: Record<StatChipKind, { color: string; icon: string; bg: string }> = {
  streak: { color: Colors.rust,   icon: '🔥', bg: 'rgba(194,65,12,0.10)' },
  xp:     { color: Colors.butter, icon: '⭐', bg: 'rgba(245,184,0,0.12)' },
  hearts: { color: Colors.error,  icon: '❤️', bg: 'rgba(255,75,75,0.10)' },
  gems:   { color: Colors.sky,    icon: '💎', bg: 'rgba(91,184,227,0.12)' },
};

interface Props {
  kind: StatChipKind;
  value: number;
}

// Chip pops (scale 1 → 1.15 → 1) on every value change so newly earned XP /
// gems / streak days feel rewarded.
export default function StatChip({ kind, value }: Props) {
  const k = KIND_COLORS[kind];
  const scale = useRef(new Animated.Value(1)).current;
  const lastValue = useRef(value);

  useEffect(() => {
    if (value === lastValue.current) return;
    lastValue.current = value;
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.18, ...Motion.spring.pop, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, ...Motion.spring.press, useNativeDriver: true }),
    ]).start();
  }, [value, scale]);

  return (
    <Animated.View style={[styles.chip, { backgroundColor: k.bg, transform: [{ scale }] }]}>
      <Animated.Text style={styles.icon}>{k.icon}</Animated.Text>
      <AnimatedCounter value={value} style={[styles.value, { color: k.color }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.pill,
  },
  icon: { fontSize: Fonts.lg },
  value: { fontSize: Fonts.md, fontWeight: Fonts.weight.black },
});
