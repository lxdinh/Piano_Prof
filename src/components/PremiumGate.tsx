import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';
import ChunkyButton from './ChunkyButton';
import { useEntitlement } from '../billing/entitlement';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  children: React.ReactNode;
  feature?: string;
}

// Wrap any premium-only UI. Free users see a paywall prompt instead.
export default function PremiumGate({ children, feature = 'This feature' }: Props) {
  const nav = useNavigation<Nav>();
  const { isPremium } = useEntitlement();

  if (isPremium) return <>{children}</>;

  return (
    <View style={styles.wrap}>
      <Text style={styles.lock}>⭐</Text>
      <Text style={styles.title}>{feature} is Premium</Text>
      <Text style={styles.body}>Unlock it with Piano Professor Premium.</Text>
      <ChunkyButton label="See Premium" onPress={() => nav.navigate('Paywall')} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl,
    backgroundColor: '#FFFFFF', borderRadius: Radii.xl, borderWidth: 2, borderColor: Colors.inkLine,
  },
  lock: { fontSize: 40 },
  title: { fontSize: Fonts.lg, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  body: { fontSize: Fonts.base, color: Colors.ink500, textAlign: 'center', marginBottom: Spacing.sm },
});
