import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import { useAchievements } from './UserProvider';

// Full-screen overlay shown when an achievement levels up. Driven by the
// celebration queue in UserProvider; renders nothing when idle.
export default function AchievementCelebration() {
  const { celebrating, dismissCelebration } = useAchievements();
  const scale = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (celebrating) {
      scale.setValue(0);
      spin.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(spin, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: true }),
      ]).start();
    }
  }, [celebrating, scale, spin]);

  if (!celebrating) return null;

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismissCelebration}>
      <Pressable style={styles.backdrop} onPress={dismissCelebration}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <Animated.View style={[styles.rays, { transform: [{ rotate }], backgroundColor: celebrating.color }]} />
          <View style={[styles.iconWrap, { backgroundColor: celebrating.color }]}>
            <Text style={styles.icon}>{celebrating.icon}</Text>
          </View>
          <Text style={styles.kicker}>Achievement unlocked!</Text>
          <Text style={styles.title}>{celebrating.title}</Text>
          <Text style={styles.desc}>{celebrating.description}</Text>
          <ChunkyButton label="Awesome!" onPress={dismissCelebration} fullWidth />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,17,23,0.75)',
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
  },
  rays: {
    position: 'absolute',
    top: -120,
    width: 280,
    height: 280,
    borderRadius: 24,
    opacity: 0.08,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  icon: { fontSize: 52 },
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
