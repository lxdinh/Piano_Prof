import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Fonts, Gradients } from '../theme/tokens';

interface Props {
  earnedToday: number;
  goal: number;
  size?: number;
  thickness?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// A clean SVG progress ring with an animated stroke-dashoffset. Center shows
// "earned / goal" with a checkmark once the daily goal is hit. Used at the
// top of the Learn tab — a much more rewarding "daily" hero than a bar.
export default function DailyGoalRing({
  earnedToday, goal, size = 130, thickness = 12,
}: Props) {
  const pct = goal === 0 ? 0 : Math.min(1, earnedToday / goal);
  const done = earnedToday >= goal && goal > 0;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, anim]);

  const dashOffset = anim.interpolate({ inputRange: [0, 1], outputRange: [c, 0] });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Gradients.brand[0]} />
            <Stop offset="1" stopColor={Gradients.brand[1]} />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={Colors.inkLine}
          strokeWidth={thickness}
          fill="none"
        />
        {/* Progress (start at 12 o'clock, fill clockwise) */}
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={r}
          stroke="url(#ring)"
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dashOffset as unknown as number}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {done ? (
          <>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.label}>Daily goal!</Text>
          </>
        ) : (
          <>
            <Text style={styles.value}>{earnedToday}</Text>
            <Text style={styles.label}>/ {goal} XP</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: Fonts.xl, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  label: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink500, marginTop: 2 },
  check: { fontSize: Fonts['3xl'], color: Colors.brand, fontWeight: Fonts.weight.black },
});
