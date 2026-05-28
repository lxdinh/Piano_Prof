import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import StatChip from './StatChip';
import { useUser } from '../gamification/UserProvider';
import { Colors, Fonts, Spacing } from '../theme/tokens';

export default function TopStatsBar({ title }: { title?: string }) {
  const { profile } = useUser();
  return (
    <View style={styles.bar}>
      {title ? <Text style={styles.title}>{title}</Text> : <View />}
      <View style={styles.stats}>
        <StatChip kind="streak" value={profile?.streakCount ?? 0} />
        <StatChip kind="gems" value={profile?.gems ?? 0} />
        <StatChip kind="hearts" value={profile?.hearts.count ?? 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: Fonts.xl, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  stats: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
});
