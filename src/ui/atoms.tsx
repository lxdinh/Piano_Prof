// Piano Professor — small design-system atoms (StatChip, Card, ProgressBar).
import React from 'react';
import { View, Text, Pressable, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '../theme/AppTheme';
import { Fonts } from '../theme/tokens';

export type StatKind = 'streak' | 'xp' | 'gems' | 'hearts';

const STAT_META: Record<StatKind, { emoji: string; ink: string }> = {
  streak: { emoji: '🔥', ink: '#C2410C' },
  xp: { emoji: '⚡', ink: '#9A6E00' },
  gems: { emoji: '💎', ink: '#2E84AD' },
  hearts: { emoji: '❤️', ink: '#C81E1E' },
};

export function StatChip({ kind, value, big, onPress }: {
  kind: StatKind; value: number | string; big?: boolean; onPress?: () => void;
}) {
  const { colors } = useAppTheme();
  const m = STAT_META[kind];
  const Body = onPress ? Pressable : View;
  return (
    <Body
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: big ? 8 : 6,
        paddingVertical: big ? 8 : 5, paddingLeft: big ? 12 : 9, paddingRight: big ? 16 : 13,
        borderRadius: 999, borderWidth: 2, borderColor: 'rgba(0,0,0,0.06)',
        backgroundColor: colors.surface,
      }}
    >
      <Text style={{ fontSize: big ? 22 : 18 }}>{m.emoji}</Text>
      <Text style={{ color: m.ink, fontFamily: Fonts.family.black, fontWeight: '900', fontSize: big ? 22 : 17 }}>
        {value}
      </Text>
    </Body>
  );
}

export function Card({ children, style, pad = 20, onPress }: {
  children: React.ReactNode; style?: StyleProp<ViewStyle>; pad?: number; onPress?: () => void;
}) {
  const { colors } = useAppTheme();
  const Body = onPress ? Pressable : View;
  return (
    <Body
      onPress={onPress}
      style={[{
        backgroundColor: colors.surface, borderRadius: 24, padding: pad,
        borderWidth: 2, borderColor: colors.line,
        borderBottomWidth: 6, borderBottomColor: colors.line,
      }, style]}
    >
      {children}
    </Body>
  );
}

export function Segmented({ options, value, onChange }: {
  options: { value: string; label: string }[]; value: string; onChange: (v: string) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.segTrack, borderRadius: 14, padding: 4, gap: 4, alignSelf: 'center' }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)}
            style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 11, backgroundColor: on ? colors.segActive : 'transparent' }}>
            <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 15, color: on ? colors.ink : colors.inkFaint }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({ value, height = 14, color, track, style }: {
  value: number; height?: number; color?: string; track?: string; style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={[{ height, borderRadius: 999, backgroundColor: track ?? colors.line, overflow: 'hidden', width: '100%' }, style]}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: 999, backgroundColor: color ?? colors.green }}>
        <View style={{ position: 'absolute', top: 2, left: 6, right: 6, height: Math.max(2, height / 3.5), borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.4)' }} />
      </View>
    </View>
  );
}
