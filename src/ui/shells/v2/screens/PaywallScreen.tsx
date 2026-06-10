import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import PpCard from '../components/PpCard';
import MascotImage from '../components/MascotImage';
import { setTier } from '../../../../core/contract';
import { logEvent, Events } from '../../../../core/contract';

// Basic paywall. The purchase button is mocked for v1 (no store SDK) — it sets
// the local entitlement so premium-gated UI can be exercised end-to-end. Wiring
// react-native-purchases (RevenueCat) replaces onPurchase().
const PLANS = [
  { id: 'super', title: 'Super', price: '$6.99 / mo', features: ['Unlimited hearts', 'All grades unlocked', 'Sheet-music import'] },
  { id: 'max', title: 'Max', price: '$11.99 / mo', features: ['Everything in Super', 'Realistic AI instructor voice', 'Priority OMR processing'] },
] as const;

export default function PaywallScreen() {
  const nav = useNavigation();
  useEffect(() => { logEvent(Events.paywallView); }, []);

  const purchase = async (tier: 'super' | 'max') => {
    await setTier(tier); // mocked purchase
    nav.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <MascotImage mood="cheer" size={120} />
          <Text style={styles.title}>Go Premium</Text>
          <Text style={styles.subtitle}>Learn faster with unlimited practice and every feature unlocked.</Text>
        </View>

        {PLANS.map((p) => (
          <PpCard key={p.id} style={styles.plan}>
            <View style={styles.planHead}>
              <Text style={styles.planTitle}>{p.title}</Text>
              <Text style={styles.planPrice}>{p.price}</Text>
            </View>
            {p.features.map((f) => (
              <Text key={f} style={styles.feature}>✓ {f}</Text>
            ))}
            <ChunkyButton
              label={`Choose ${p.title}`}
              variant={p.id === 'max' ? 'primary' : 'sky'}
              fullWidth
              onPress={() => purchase(p.id)}
            />
          </PpCard>
        ))}

        <Text style={styles.disclaimer}>
          Purchases are mocked in this build. Store checkout (RevenueCat) is wired in a later phase.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream50 },
  scroll: { padding: Spacing.lg, gap: Spacing.lg },
  hero: { alignItems: 'center', gap: Spacing.xs },
  title: { fontSize: Fonts['2xl'], fontWeight: Fonts.weight.black, color: Colors.ink900 },
  subtitle: { fontSize: Fonts.base, color: Colors.ink500, textAlign: 'center', paddingHorizontal: Spacing.lg },
  plan: { gap: Spacing.sm },
  planHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  planTitle: { fontSize: Fonts.xl, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  planPrice: { fontSize: Fonts.md, fontWeight: Fonts.weight.bold, color: Colors.brand },
  feature: { fontSize: Fonts.base, color: Colors.ink700 },
  disclaimer: { fontSize: Fonts.sm, color: Colors.ink300, textAlign: 'center', fontStyle: 'italic' },
});
