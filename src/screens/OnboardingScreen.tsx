import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Spacing } from '../theme/tokens';
import { LedColors } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import LedStripArt from '../components/LedStripArt';
import MascotImage from '../components/MascotImage';
import { setBool } from '../storage/settings';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const DEMO_COUNT = 24;

// A gentle left-to-right light sweep evoking the "Canon in D" intro demo.
function useSweep(): string[] {
  const [colors, setColors] = useState<string[]>(() => new Array(DEMO_COUNT).fill(Colors.ink900));
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setColors(() =>
        Array.from({ length: DEMO_COUNT }, (_, k) => {
          const dist = Math.abs(k - (i % DEMO_COUNT));
          if (dist === 0) return LedColors[i % LedColors.length];
          if (dist === 1) return LedColors[(i + 2) % LedColors.length];
          return Colors.ink900;
        }),
      );
      i++;
    }, 180);
    return () => clearInterval(id);
  }, []);
  return colors;
}

export default function OnboardingScreen() {
  const nav = useNavigation<Nav>();
  const ledColors = useSweep();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [fade]);

  const begin = async () => {
    await setBool('onboarded', true);
    nav.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Animated.View style={[styles.content, { opacity: fade }]}>
        <View style={styles.hero}>
          <MascotImage mood="wave" size={150} />
          <Text style={styles.title}>Piano Professor</Text>
          <Text style={styles.subtitle}>Learn piano the smart way — chords first, real songs fast.</Text>
        </View>

        <View style={styles.demo}>
          <LedStripArt ledColors={ledColors} width={320} height={90} count={DEMO_COUNT} />
          <Text style={styles.caption}>Your keys light up. You just follow along.</Text>
        </View>

        <ChunkyButton label="Get started" onPress={begin} fullWidth />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream50 },
  content: { flex: 1, padding: Spacing.xl, justifyContent: 'space-between' },
  hero: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing['2xl'] },
  title: { fontSize: Fonts['3xl'], fontWeight: Fonts.weight.black, color: Colors.ink900, marginTop: Spacing.md },
  subtitle: { fontSize: Fonts.md, color: Colors.ink500, textAlign: 'center', paddingHorizontal: Spacing.lg, lineHeight: 22 },
  demo: { alignItems: 'center', gap: Spacing.md },
  caption: { fontSize: Fonts.base, color: Colors.ink700, fontWeight: Fonts.weight.heavy, textAlign: 'center' },
});
