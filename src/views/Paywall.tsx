// Piano Professor — Paywall: gold pitch panel + plan selector.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import { Segmented } from '../ui/atoms';
import { PLANS } from '../data/content';

const BENEFITS = [
  'Unlimited hearts — never stop mid-lesson',
  'Every song, lesson and exercise unlocked',
  'All family profiles level up together',
  'Offline lessons & priority support',
];

export default function Paywall() {
  const { colors } = useAppTheme();
  const { setPremium } = useApp();
  const { go, back } = useRouter();
  const insets = useSafeAreaInsets();
  const [cycle, setCycle] = useState('annual');
  const [planId, setPlanId] = useState('family');

  const price = (monthly: number) => (cycle === 'annual' ? monthly : monthly * 1.6);

  const startTrial = () => {
    setPremium(true);
    // Straight to the welcome moment (gems + 7-day plan) rather than dropping
    // the buyer back where they were — the immediate win is what converts a
    // purchase into practice.
    go('premiumWelcome');
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
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 28, color: '#5a3d00' }}>Premium</Text>
        </View>
        {BENEFITS.map((b, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="check" size={18} color="#5a3d00" />
            <Text style={{ flex: 1, fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 14, color: '#5a3d00' }}>{b}</Text>
          </View>
        ))}
      </LinearGradient>

      {/* plans */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 26, gap: 14, paddingBottom: insets.bottom + 26 }}>
        <Segmented
          value={cycle} onChange={setCycle}
          options={[{ value: 'annual', label: 'Annual · save 37%' }, { value: 'monthly', label: 'Monthly' }]}
        />
        {PLANS.map((p) => {
          const on = planId === p.id;
          return (
            <Pressable key={p.id} onPress={() => setPlanId(p.id)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 20,
                backgroundColor: on ? colors.selGold : colors.surface,
                borderWidth: 2.5, borderColor: on ? colors.gold : colors.line, borderBottomWidth: 6,
              }}>
              <Text style={{ fontSize: 30 }}>{p.icon}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 20, color: colors.ink }}>{p.name}</Text>
                  {p.best && (
                    <View style={{ backgroundColor: colors.green, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 9 }}>
                      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 10, color: '#fff' }}>BEST VALUE</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 13, color: colors.inkSoft }}>{p.blurb}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 22, color: colors.ink }}>${price(p.monthly).toFixed(2)}</Text>
                <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 12, color: colors.inkFaint }}>/month</Text>
              </View>
            </Pressable>
          );
        })}
        <PPButton label="Start 7-day free trial" size="lg" variant="green" full onPress={startTrial} />
        <Text style={{ textAlign: 'center', fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 12, color: colors.inkFaint }}>
          Cancel anytime. No charge until the trial ends.
        </Text>
      </ScrollView>
    </View>
  );
}
