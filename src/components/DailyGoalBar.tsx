import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import XpBar from './XpBar';
import { Colors, Fonts, Spacing } from '../theme/tokens';

interface Props {
  earnedToday: number;
  goal: number;
}

export default function DailyGoalBar({ earnedToday, goal }: Props) {
  const pct = goal === 0 ? 0 : Math.min(1, earnedToday / goal);
  const done = earnedToday >= goal;
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>Daily goal</Text>
        <Text style={[styles.value, done && { color: Colors.brand }]}>
          {earnedToday} / {goal} XP {done ? '✓' : ''}
        </Text>
      </View>
      <XpBar progress={pct} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { color: Colors.ink500, fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, textTransform: 'uppercase', letterSpacing: 1 },
  value: { color: Colors.ink900, fontSize: Fonts.base, fontWeight: Fonts.weight.bold },
});
