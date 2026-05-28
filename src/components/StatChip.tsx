import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';

export type StatChipKind = 'streak' | 'xp' | 'hearts' | 'gems';

const KIND_COLORS: Record<StatChipKind, { color: string; icon: string }> = {
  streak: { color: Colors.rust,   icon: '🔥' },
  xp:     { color: Colors.butter, icon: '⭐' },
  hearts: { color: Colors.error,  icon: '❤️' },
  gems:   { color: Colors.sky,    icon: '💎' },
};

export default function StatChip({ kind, value }: { kind: StatChipKind; value: number | string }) {
  const k = KIND_COLORS[kind];
  return (
    <View style={styles.chip}>
      <Text style={styles.icon}>{k.icon}</Text>
      <Text style={[styles.value, { color: k.color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: Radii.pill,
  },
  icon: { fontSize: Fonts.lg },
  value: { fontSize: Fonts.md, fontWeight: Fonts.weight.black },
});
