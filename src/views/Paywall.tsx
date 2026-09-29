// Piano Professor — Paywall: gold pitch panel + plan selector.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import { Segmented } from '../ui/atoms';
import { PLANS } from '../data/content';
import { useBilling } from '../billing/BillingProvider';
import { BillingPeriod, PlanId } from '../billing/types';

const BENEFITS = [
  'Unlimited hearts — never stop mid-lesson',
  'Every song, lesson and exercise unlocked',
  'All family profiles level up together',
  'Offline lessons & priority support',
];

export default function Paywall() {
  const { colors } = useAppTheme();
  const { go, back, toast } = useRouter();
  const insets = useSafeAreaInsets();
  const [cycle, setCycle] = useState<BillingPeriod>('annual');
  const [planId, setPlanId] = useState<PlanId>('family');
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { products, purchase, restore, live } = useBilling();

  /** Store-priced product for a plan at the selected cycle, if the store has it. */
  const productFor = (id: string) =>
    products.find((p) => p.planId === id && p.period === cycle);

  // Fall back to the static copy only when the store hasn't answered — never
  // invent a price we might charge differently.
  const fallbackPrice = (monthly: number) =>
    `$${(cycle === 'annual' ? monthly : monthly * 1.6).toFixed(2)}`;

  const selected = productFor(planId);
  const trialDays = selected?.trialDays ?? null;

  const buy = async () => {
    if (!selected) {
      setError('That plan isn’t available from the store right now. Try again in a moment.');
      return;
    }
    setError(null);
    setBusy('buy');
    const res = await purchase(selected.productId);
    setBusy(null);
    if (res.ok) {
      // Straight to the welcome moment (gems + 7-day plan) rather than dropping
      // the buyer back where they were — the immediate win is what converts a
      // purchase into practice.
      go('premiumWelcome');
      return;
    }
    if (res.cancelled) return; // backing out is not an error
    setError(res.message);
  };

  // Both stores require a visible restore path, and it is the only way someone
  // who already pays gets their subscription back on a new device.
  const restorePurchases = async () => {
    setError(null);
    setBusy('restore');
    const res = await restore();
    setBusy(null);
    if (!res.ok) { setError(res.message); return; }
    if (res.entitlement) { toast('Subscription restored 🎉'); back(); }
    else setError('No previous purchase found on this account.');
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg, paddingTop: insets.top }}>
      {/* pitch panel */}
      <LinearGradient colors={['#FFCB2E', '#F5A623']} style={{ width: '40%', padding: 26, justifyContent: 'center', gap: 12 }}>
        <Pressable onPress={back} hitSlop={10} style={{ position: 'absolute', top: insets.top + 12, left: 16 }}>
          <Icon name="close" size={26} color="#5a3d00" />
        </Pressable>
        <Maestro mood="trophy" size={110} bg="#ffffff55" ring={4} ringColor="#ffffff88" float />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="crown" size={26} color="#5a3d00" />
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 28, color: '#5a3d00' }}>Premium</Text>
        </View>
        {BENEFITS.map((b, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="check" size={18} color="#5a3d00" />
            <Text style={{ flex: 1, fontFamily: Fonts.family.bold, fontSize: 14, color: '#5a3d00' }}>{b}</Text>
          </View>
        ))}
      </LinearGradient>

      {/* plans */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 26, gap: 14, paddingBottom: insets.bottom + 26 }}>
        <Segmented
          value={cycle} onChange={(v) => setCycle(v as BillingPeriod)}
          options={[{ value: 'annual', label: 'Annual · save 37%' }, { value: 'monthly', label: 'Monthly' }]}
        />
        {PLANS.map((p) => {
          const on = planId === p.id;
          return (
            <Pressable key={p.id} onPress={() => setPlanId(p.id as PlanId)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 20,
                backgroundColor: on ? colors.selGold : colors.surface,
                borderWidth: 2.5, borderColor: on ? colors.gold : colors.line, borderBottomWidth: 6,
              }}>
              <Text style={{ fontSize: 30 }}>{p.icon}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontFamily: Fonts.family.black, fontSize: 20, color: colors.ink }}>{p.name}</Text>
                  {p.best && (
                    <View style={{ backgroundColor: colors.green, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 9 }}>
                      <Text style={{ fontFamily: Fonts.family.black, fontSize: 10, color: '#fff' }}>BEST VALUE</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontFamily: Fonts.family.bold, fontSize: 13, color: colors.inkSoft }}>{p.blurb}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {/* Store-localised price when we have one — it knows the user's
                    currency and tax; our own arithmetic does not. */}
                <Text style={{ fontFamily: Fonts.family.black, fontSize: 22, color: colors.ink }}>
                  {productFor(p.id)?.priceLabel ?? fallbackPrice(p.monthly)}
                </Text>
                <Text style={{ fontFamily: Fonts.family.bold, fontSize: 12, color: colors.inkFaint }}>
                  {cycle === 'annual' ? '/year' : '/month'}
                </Text>
              </View>
            </Pressable>
          );
        })}
        {error && (
          <Text style={{ textAlign: 'center', fontFamily: Fonts.family.bold, fontSize: 13, color: colors.error }}>
            {error}
          </Text>
        )}

        {busy === 'buy' ? (
          <ActivityIndicator color={colors.green} style={{ paddingVertical: 14 }} />
        ) : (
          <PPButton
            // Only promise a trial the store actually offers on this product.
            label={trialDays ? `Start ${trialDays}-day free trial` : 'Subscribe'}
            size="lg" variant="green" full onPress={buy} disabled={busy != null}
          />
        )}

        <PPButton
          label="Restore purchases" size="md" variant="ghost" full
          onPress={restorePurchases} disabled={busy != null}
        />

        <Text style={{ textAlign: 'center', fontFamily: Fonts.family.bold, fontSize: 12, color: colors.inkFaint }}>
          {trialDays
            ? 'Cancel anytime. No charge until the trial ends.'
            : 'Cancel anytime in your store account settings.'}
        </Text>

        {!live && (
          // Never let a tester believe a real sale happened.
          <Text style={{ textAlign: 'center', fontFamily: Fonts.family.bold, fontSize: 11, color: colors.gold }}>
            Test mode — no store is configured, so nothing is charged.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
