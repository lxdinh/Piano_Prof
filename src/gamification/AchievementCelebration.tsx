import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radii, Spacing, Elevation, Motion } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import Confetti from '../components/Confetti';
import { useAchievements } from './UserProvider';
import { useSpin } from '../feedback/motion';
import * as haptics from '../feedback/haptics';

// Full-screen overlay shown when an achievement levels up.
export default function AchievementCelebration() {
  const { celebrating, dismissCelebration } = useAchievements();

  const scale = useRef(new Animated.Value(0)).current;
  const cardLift = useRef(new Animated.Value(40)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const spin = useSpin(8000);

  useEffect(() => {
    if (!celebrating) return;

    // staged celebration choreography
    scale.setValue(0);
    cardLift.setValue(40);
    ringScale.setValue(0);

    haptics.thud();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, ...Motion.spring.pop, useNativeDriver: true }),
        Animated.spring(cardLift, { toValue: 0, ...Motion.spring.settle, useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    const t = setTimeout(() => haptics.success(), 350);
    return () => clearTimeout(t);
  }, [celebrating, scale, cardLift, ringScale]);

  if (!celebrating) return null;

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismissCelebration}>
      <Pressable style={styles.backdrop} onPress={dismissCelebration}>
        <Confetti count={50} durationMs={3200} />
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateY: cardLift }, { scale }] },
          ]}
        >
          {/* Rotating colored rays behind the badge */}
          <Animated.View
            pointerEvents="none"
            style={[styles.raysWrap, { transform: [{ rotate }, { scale: ringScale }] }]}
          >
            <View style={[styles.rayBar, { backgroundColor: celebrating.color, transform: [{ rotate: '0deg' }] }]} />
            <View style={[styles.rayBar, { backgroundColor: celebrating.color, transform: [{ rotate: '60deg' }] }]} />
            <View style={[styles.rayBar, { backgroundColor: celebrating.color, transform: [{ rotate: '120deg' }] }]} />
          </Animated.View>

          {/* Badge */}
          <LinearGradient
            colors={[celebrating.color, shadeDarker(celebrating.color)]}
            style={styles.iconWrap}
          >
            <Text style={styles.icon}>{celebrating.icon}</Text>
          </LinearGradient>

          <Text style={styles.kicker}>Achievement unlocked!</Text>
          <Text style={styles.title}>{celebrating.title}</Text>
          <Text style={styles.desc}>{celebrating.description}</Text>
          <ChunkyButton label="Awesome!" onPress={dismissCelebration} fullWidth haptic="bump" />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// Cheap darker shade: drop ~25% lightness by halving each channel.
function shadeDarker(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const r = Math.round(parseInt(h.slice(0, 2), 16) * 0.7);
  const g = Math.round(parseInt(h.slice(2, 4), 16) * 0.7);
  const b = Math.round(parseInt(h.slice(4, 6), 16) * 0.7);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,17,23,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    gap: Spacing.md,
    overflow: 'hidden',
    ...Elevation.lg,
  },
  raysWrap: {
    position: 'absolute',
    top: 36,
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rayBar: {
    position: 'absolute',
    width: 280,
    height: 18,
    opacity: 0.10,
    borderRadius: 12,
  },
  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    ...Elevation.md,
  },
  icon: { fontSize: 58 },
  kicker: {
    color: Colors.ink500,
    fontSize: Fonts.sm,
    fontWeight: Fonts.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  title: { color: Colors.ink900, fontSize: Fonts['2xl'], fontWeight: Fonts.weight.black, textAlign: 'center' },
  desc: { color: Colors.ink700, fontSize: Fonts.md, textAlign: 'center', marginBottom: Spacing.sm },
});
