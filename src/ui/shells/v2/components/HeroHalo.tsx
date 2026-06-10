import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { usePulse, useBreathing } from '../theme/motion';

interface Props {
  size?: number;
  color?: string;
  children?: React.ReactNode;
}

/**
 * Soft radial glow that lives behind the mascot. Inner ring breathes,
 * outer ring pulses slowly — two layered halos give a real sense of depth.
 */
export default function HeroHalo({ size = 320, color = '#FFD86B', children }: Props) {
  const breathe = useBreathing(0.94, 1.06, 4200);
  const pulse = usePulse(0.45, 0.85, 5200);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: pulse, transform: [{ scale: breathe }] },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor={color} stopOpacity="0.55" />
              <Stop offset="0.45" stopColor={color} stopOpacity="0.18" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="haloInner" cx="50%" cy="50%" rx="30%" ry="30%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="100" cy="100" r="100" fill="url(#halo)" />
          <Circle cx="100" cy="100" r="55" fill="url(#haloInner)" />
        </Svg>
      </Animated.View>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
