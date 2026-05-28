import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

interface Props {
  /** Pieces of confetti. Defaults to 60 — feels generous but cheap. */
  count?: number;
  /** Bigger fall height for richer screens. */
  durationMs?: number;
  /** Pause animation (useful when the screen is offscreen). */
  active?: boolean;
}

const COLORS = ['#58CC02', '#F5B800', '#FF4B4B', '#5BB8E3', '#8B5CF6', '#FF7A9C', '#FF9600'];
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Lightweight RN-only confetti: each piece is an absolutely-positioned
// Animated.View that falls + sways + rotates. Uses the native driver so
// hundreds can run without dropping frames.
export default function Confetti({ count = 60, durationMs = 3500, active = true }: Props) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: `c${i}`,
        color: COLORS[i % COLORS.length],
        x: Math.random() * SCREEN_W,
        size: 6 + Math.random() * 6,
        delay: Math.random() * 600,
        duration: durationMs + Math.random() * 1500,
        sway: 30 + Math.random() * 50,
        rotateStart: Math.random() * 360,
        shape: (Math.random() < 0.5 ? 'rect' : 'circle') as 'rect' | 'circle',
      })),
    [count, durationMs],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map(({ id, ...rest }) => (
        <Piece key={id} {...rest} active={active} />
      ))}
    </View>
  );
}

function Piece({
  x, size, color, delay, duration, sway, rotateStart, shape, active,
}: {
  x: number; size: number; color: string; delay: number; duration: number;
  sway: number; rotateStart: number; shape: 'rect' | 'circle'; active: boolean;
}) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, [t, duration, delay, active]);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [-40, SCREEN_H + 40] });
  const translateX = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, sway, -sway] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: [`${rotateStart}deg`, `${rotateStart + 720}deg`] });
  const opacity = t.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: size,
        height: size * (shape === 'rect' ? 0.7 : 1),
        backgroundColor: color,
        borderRadius: shape === 'circle' ? size / 2 : 1,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}
