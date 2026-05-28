import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';

interface Props {
  grade: number;
  state?: 'locked' | 'active' | 'completed';
}

export default function GradeBadge({ grade, state = 'active' }: Props) {
  const styleByState = {
    locked: { bg: Colors.cream100, fg: Colors.ink300 },
    active: { bg: Colors.brand, fg: '#FFFFFF' },
    completed: { bg: Colors.sky, fg: '#FFFFFF' },
  } as const;
  const s = styleByState[state];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.fg }]}>Grade {grade}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
    alignSelf: 'flex-start',
  },
  text: { fontSize: Fonts.sm, fontWeight: Fonts.weight.black, letterSpacing: 0.5 },
});
