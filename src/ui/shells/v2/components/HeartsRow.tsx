import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../theme/tokens';

export default function HeartsRow({ hearts, max = 5 }: { hearts: number; max?: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: max }, (_, i) => (
        <Text key={i} style={[styles.heart, i >= hearts && styles.empty]}>
          {i < hearts ? '❤️' : '🤍'}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.xs },
  heart: { fontSize: Fonts.xl },
  empty: { opacity: 0.4 },
});

// keep Colors import to avoid unused — used in case theme tweaks land later.
void Colors;
