import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Spacing } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import MascotImage from '../components/MascotImage';

type Nav = NativeStackNavigationProp<RootStackParamList, 'LessonComplete'>;
type Rt = RouteProp<RootStackParamList, 'LessonComplete'>;

function Star({ filled, delay }: { filled: boolean; delay: number }) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 90, delay, useNativeDriver: true }).start();
  }, [scale, delay]);
  return (
    <Animated.Text style={[styles.star, { transform: [{ scale }] }, !filled && styles.starEmpty]}>
      ★
    </Animated.Text>
  );
}

export default function LessonCompleteScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.top}>
          <MascotImage mood="trophy" size={150} />
          <Text style={styles.title}>Lesson complete!</Text>

          <View style={styles.stars}>
            {[0, 1, 2].map((i) => (
              <Star key={i} filled={i < params.stars} delay={200 + i * 220} />
            ))}
          </View>

          <View style={styles.rewardRow}>
            <View style={styles.reward}>
              <Text style={styles.rewardValue}>+{params.xp}</Text>
              <Text style={styles.rewardLabel}>XP</Text>
            </View>
            <View style={styles.reward}>
              <Text style={styles.rewardValue}>+{params.stars}</Text>
              <Text style={styles.rewardLabel}>💎 Gems</Text>
            </View>
          </View>

          <Text style={styles.message}>{params.message}</Text>
        </View>

        <ChunkyButton
          label="Continue"
          fullWidth
          onPress={() => nav.navigate('MainTabs', { screen: 'Learn' })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream50 },
  content: { flex: 1, padding: Spacing.xl, justifyContent: 'space-between' },
  top: { alignItems: 'center', gap: Spacing.md, marginTop: Spacing['2xl'] },
  title: { fontSize: Fonts['3xl'], fontWeight: Fonts.weight.black, color: Colors.ink900 },
  stars: { flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.md },
  star: { fontSize: 56, color: Colors.butter },
  starEmpty: { color: Colors.inkLine },
  rewardRow: { flexDirection: 'row', gap: Spacing.xl },
  reward: { alignItems: 'center' },
  rewardValue: { fontSize: Fonts['2xl'], fontWeight: Fonts.weight.black, color: Colors.brand },
  rewardLabel: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 1 },
  message: { fontSize: Fonts.md, color: Colors.ink700, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.lg },
});
