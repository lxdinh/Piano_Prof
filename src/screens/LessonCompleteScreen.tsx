import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Spacing, Gradients, Elevation, Motion } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import MascotImage from '../components/MascotImage';
import Confetti from '../components/Confetti';
import AnimatedCounter from '../components/AnimatedCounter';
import * as haptics from '../feedback/haptics';

type Nav = NativeStackNavigationProp<RootStackParamList, 'LessonComplete'>;
type Rt = RouteProp<RootStackParamList, 'LessonComplete'>;

function Star({ filled, delay }: { filled: boolean; delay: number }) {
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      if (filled) haptics.bump();
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, ...Motion.spring.pop, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, [filled, delay, scale, rotate]);

  const rot = rotate.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] });

  return (
    <Animated.Text
      style={[
        styles.star,
        !filled && styles.starEmpty,
        { transform: [{ scale }, { rotate: rot }] },
      ]}
    >
      ★
    </Animated.Text>
  );
}

export default function LessonCompleteScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();

  // Hero entrance + lift
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(20)).current;
  // Reward animated values — fired with a 700ms hold after the stars
  const xpShown = useRef(new Animated.Value(0)).current;
  const gemShown = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    haptics.thud(); // big landing thump
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(heroTranslate, { toValue: 0, ...Motion.spring.settle, useNativeDriver: true }),
    ]).start();
    // After stars land, count rewards up
    const t1 = setTimeout(() => {
      Animated.timing(xpShown, { toValue: params.xp, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    }, 1300);
    const t2 = setTimeout(() => {
      Animated.timing(gemShown, { toValue: params.stars, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    }, 1600);
    const t3 = setTimeout(() => haptics.success(), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [params.xp, params.stars, heroOpacity, heroTranslate, xpShown, gemShown]);

  return (
    <View style={styles.bg}>
      <LinearGradient colors={[Gradients.paper[0], Gradients.paper[1]]} style={StyleSheet.absoluteFill} />
      <Confetti count={70} durationMs={3200} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View
          style={[
            styles.content,
            { opacity: heroOpacity, transform: [{ translateY: heroTranslate }] },
          ]}
        >
          <View style={styles.top}>
            <MascotImage mood="trophy" size={170} />
            <Text style={styles.title}>Lesson complete!</Text>

            <View style={styles.stars}>
              {[0, 1, 2].map((i) => (
                <Star key={i} filled={i < params.stars} delay={350 + i * 280} />
              ))}
            </View>

            <View style={styles.rewardRow}>
              <View style={[styles.reward, Elevation.md]}>
                <Text style={styles.rewardIcon}>⭐</Text>
                <RewardValue av={xpShown} prefix="+" suffix="" color={Colors.brand} />
                <Text style={styles.rewardLabel}>XP</Text>
              </View>
              <View style={[styles.reward, Elevation.md]}>
                <Text style={styles.rewardIcon}>💎</Text>
                <RewardValue av={gemShown} prefix="+" suffix="" color={Colors.sky} />
                <Text style={styles.rewardLabel}>Gems</Text>
              </View>
            </View>

            <Text style={styles.message}>{params.message}</Text>
          </View>

          <ChunkyButton
            label="Continue"
            fullWidth
            haptic="bump"
            onPress={() => nav.navigate('MainTabs', { screen: 'Learn' })}
          />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// Bridges an Animated.Value into the AnimatedCounter API. Listens once and
// pushes value updates into the counter — avoids re-rendering on every frame.
function RewardValue({
  av, prefix, suffix, color,
}: { av: Animated.Value; prefix?: string; suffix?: string; color: string }) {
  const [v, setV] = React.useState(0);
  useEffect(() => {
    const id = av.addListener(({ value }) => setV(Math.round(value)));
    return () => av.removeListener(id);
  }, [av]);
  return <AnimatedCounter value={v} prefix={prefix} suffix={suffix} style={[styles.rewardValue, { color }]} duration={120} />;
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, padding: Spacing.xl, justifyContent: 'space-between' },
  top: { alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xl },
  title: { fontSize: Fonts['3xl'], fontWeight: Fonts.weight.black, color: Colors.ink900 },

  stars: { flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.md },
  star: { fontSize: 64, color: Colors.butter, textShadowColor: 'rgba(245,184,0,0.5)', textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 } },
  starEmpty: { color: Colors.inkLine, textShadowRadius: 0 },

  rewardRow: { flexDirection: 'row', gap: Spacing.lg, marginVertical: Spacing.md },
  reward: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 20,
    minWidth: 120,
    gap: 4,
  },
  rewardIcon: { fontSize: 28 },
  rewardValue: { fontSize: Fonts['2xl'], fontWeight: Fonts.weight.black },
  rewardLabel: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 1 },

  message: { fontSize: Fonts.md, color: Colors.ink700, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.lg, marginTop: Spacing.md },
});
