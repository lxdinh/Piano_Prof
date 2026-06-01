import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Fonts, Spacing } from '../theme/tokens';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * A Netflix-style content row: a heading and a horizontally-scrolling strip of
 * cards. Works the same in portrait and landscape — landscape simply reveals
 * more cards per row.
 */
export default function Shelf({ title, subtitle, children }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  head: { paddingHorizontal: Spacing.lg, gap: 2 },
  title: { fontSize: Fonts.lg, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  subtitle: { fontSize: Fonts.sm, color: Colors.ink500, fontWeight: Fonts.weight.heavy },
  row: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingVertical: 2 },
});
