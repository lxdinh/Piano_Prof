// Piano Professor — the moment right after paying.
// An immediate, concrete win (gems + a named 7-day plan) so the purchase feels
// justified straight away and turns into practice rather than buyer's remorse.
import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import { PREMIUM_WELCOME_GEMS, PREMIUM_PLAN, applyPremiumWelcome, hasPremiumWelcome } from '../data/premium';

const PERKS: { icon: string; title: string; desc: string }[] = [
  { icon: '❤️', title: 'Unlimited hearts', desc: 'Never get blocked mid-practice' },
  { icon: '⚡', title: 'Double XP', desc: 'Every lesson counts twice' },
  { icon: '🧊', title: 'Monthly streak repair', desc: 'One missed day never ends your run' },
  { icon: '🎵', title: 'Exclusive songs', desc: 'A new premium song every month' },
];

export default function PremiumWelcome() {
  const { colors } = useAppTheme();
  const { activeProfile, updateActive } = useApp();
  const { go } = useRouter();
  const granted = useRef(false);
  const pop = useRef(new Animated.Value(0)).current;

  // Grant the welcome bonus exactly once (also guarded inside applyPremiumWelcome).
  useEffect(() => {
    if (granted.current || !activeProfile) return;
    granted.current = true;
    if (!hasPremiumWelcome(activeProfile)) updateActive(applyPremiumWelcome(activeProfile));
    Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [activeProfile, updateActive, pop]);

  return (
    <LinearGradient colors={[colors.gold, '#FF9600']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Maestro mood="trophy" size={110} bg="#ffffff44" float />
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 30, color: '#fff', textAlign: 'center' }}>
            Welcome to Premium! 🎉
          </Text>
          <Animated.View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: '#ffffff33', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 18,
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
          }}>
            <Icon name="gem" size={22} color="#fff" />
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 20, color: '#fff' }}>
              +{PREMIUM_WELCOME_GEMS} gems
            </Text>
          </Animated.View>
        </View>

        {/* perks now live in every session */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PERKS.map((p) => (
            <View key={p.title} style={{
              flexGrow: 1, flexBasis: 200, flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: '#ffffff26', borderRadius: 16, padding: 12,
            }}>
              <Text style={{ fontSize: 22 }}>{p.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Fonts.family.black, fontSize: 14, color: '#fff' }}>{p.title}</Text>
                <Text style={{ fontFamily: Fonts.family.bold, fontSize: 12, color: '#ffffffcc' }}>{p.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* a concrete plan — commitment beats a vague "enjoy premium" */}
        <View style={{ backgroundColor: '#ffffff26', borderRadius: 20, padding: 16, gap: 8 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 15, color: '#fff' }}>
            Your next 7 days
          </Text>
          {PREMIUM_PLAN.map((d) => (
            <View key={d.day} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#ffffff44', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: Fonts.family.black, fontSize: 12, color: '#fff' }}>{d.day}</Text>
              </View>
              <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: '#fff' }}>{d.title}</Text>
            </View>
          ))}
        </View>

        <PPButton label="Start day 1" size="lg" variant="white" full onPress={() => go('home')} />
      </ScrollView>
    </LinearGradient>
  );
}
