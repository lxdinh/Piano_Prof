import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Motion } from '../theme/tokens';

interface Props {
  /** 0..1 */
  progress: number;
  height?: number;
  /** Continuous shimmer sweep across the fill — for live progress moments. */
  shimmer?: boolean;
}

const AnimatedLG = Animated.createAnimatedComponent(LinearGradient);

export default function XpBar({ progress, height = 12, shimmer = false }: Props) {
  const pct = Math.max(0, Math.min(1, progress));
  const widthAnim = useRef(new Animated.Value(pct)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Spring the fill to its target — feels alive when XP lands.
  useEffect(() => {
    Animated.spring(widthAnim, { toValue: pct, ...Motion.spring.settle, useNativeDriver: false }).start();
  }, [pct, widthAnim]);

  // Optional sweeping highlight.
  useEffect(() => {
    if (!shimmer) return;
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
    );
    shimmerAnim.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [shimmer, shimmerAnim]);

  const widthInterpolate = widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const shimmerX = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 220] });

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View style={[styles.fillWrap, { width: widthInterpolate, height, borderRadius: height / 2 }]}>
        <AnimatedLG
          colors={[Gradients.brand[0], Gradients.brand[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { height, borderRadius: height / 2 }]}
        />
        {/* Bright highlight stripe at the leading edge */}
        <View style={[styles.gleam, { height: height * 0.5, borderRadius: height / 4 }]} />
        {shimmer && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmer,
              { height, transform: [{ translateX: shimmerX }, { rotate: '15deg' }] },
            ]}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.inkLine,
    overflow: 'hidden',
    width: '100%',
  },
  fillWrap: { overflow: 'hidden' },
  fill: { width: '100%' },
  gleam: {
    position: 'absolute',
    top: 1.5,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    width: 24,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
});
