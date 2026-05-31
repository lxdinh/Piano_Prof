import React, { useRef } from 'react';
import {
  Animated, Pressable, Text, StyleSheet, View, ViewStyle, StyleProp,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Colors, Fonts, Radii, Spacing, Gradients, Elevation, Motion,
} from '../theme/tokens';
import * as haptics from '../feedback/haptics';

export type ChunkyButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'sky' | 'violet';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: ChunkyButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  /** Haptic intensity. `none` disables. */
  haptic?: 'none' | 'tap' | 'press' | 'bump';
}

// Per-variant: gradient fill, "shadow plate" color (the chunky bottom edge),
// and label color. The button is rendered as TWO stacked layers — the shadow
// plate underneath and the gradient face on top — so the press animation
// can drop the face down by SHADOW_DEPTH and the shadow appears to vanish.
const VARIANTS: Record<ChunkyButtonVariant, {
  gradient: readonly [string, string];
  shadow: string;
  text: string;
  /** Flat fill used while disabled, so the button reads "not ready yet" without
   *  exposing the dark shadow plate (which looked like a two-tone green). */
  disabled?: readonly [string, string];
}> = {
  primary:   { gradient: Gradients.brand,  shadow: '#2E7000', text: '#FFFFFF', disabled: ['#AEE38C', '#A2DC7C'] },
  sky:       { gradient: Gradients.sky,    shadow: '#1F6A8A', text: '#FFFFFF' },
  violet:    { gradient: Gradients.violet, shadow: '#5B21B6', text: '#FFFFFF' },
  secondary: { gradient: ['#FFF8E1', '#FFE6BA'] as const, shadow: '#C99300', text: Colors.ink900 },
  danger:    { gradient: ['#FF7C7C', '#E63A3A'] as const, shadow: '#8F2424', text: '#FFFFFF' },
  ghost:     { gradient: ['transparent', 'transparent'] as const, shadow: 'transparent', text: Colors.ink700 },
};

const SHADOW_DEPTH = 5;

export default function ChunkyButton({
  label, onPress, variant = 'primary', disabled, loading, icon, style,
  fullWidth, haptic = 'press',
}: Props) {
  const v = VARIANTS[variant];
  const isGhost = variant === 'ghost';
  // When disabled, drop the chunky shadow plate (the dark bottom edge) entirely —
  // that's what made the disabled CONTINUE button look like two stacked greens.
  // Filled variants get a flat light fill instead of a dimmed gradient.
  const disabledFlat = disabled && !!v.disabled;
  const faceGradient: readonly [string, string] = disabledFlat ? v.disabled! : v.gradient;
  const showShadow = !isGhost && !disabled;
  const press = useRef(new Animated.Value(0)).current;

  const animateTo = (to: number) => {
    Animated.spring(press, { toValue: to, ...Motion.spring.press, useNativeDriver: true }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic !== 'none') haptics[haptic]();
    onPress?.();
  };

  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, SHADOW_DEPTH] });
  const shadowH = press.interpolate({ inputRange: [0, 1], outputRange: [SHADOW_DEPTH, 0] });

  return (
    <View style={[fullWidth && { width: '100%' }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => animateTo(1)}
        onPressOut={() => animateTo(0)}
        disabled={disabled || loading}
        style={styles.wrap}
        hitSlop={6}
      >
        {/* Shadow plate (chunky bottom edge) — hidden while disabled */}
        {showShadow && (
          <Animated.View
            pointerEvents="none"
            style={[styles.shadowPlate, { backgroundColor: v.shadow, height: shadowH }]}
          />
        )}
        {/* Face */}
        <Animated.View
          style={[
            styles.face,
            { transform: [{ translateY: showShadow ? translateY : 0 }] },
            // Filled variants with a dedicated disabled fill stay full-opacity
            // (flat light green); others fall back to a gentle dim.
            disabled && !disabledFlat && { opacity: 0.5 },
          ]}
        >
          <LinearGradient
            colors={[faceGradient[0], faceGradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[
              styles.gradient,
              isGhost && { backgroundColor: 'transparent' },
              !isGhost && Elevation.sm,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={v.text} />
            ) : (
              <>
                {icon}
                <Text style={[styles.label, { color: v.text }]} numberOfLines={1}>{label}</Text>
              </>
            )}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: Radii.lg, paddingBottom: SHADOW_DEPTH },
  shadowPlate: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    borderBottomLeftRadius: Radii.lg,
    borderBottomRightRadius: Radii.lg,
  },
  face: { borderRadius: Radii.lg, overflow: 'hidden' },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radii.lg,
    minHeight: 52,
  },
  label: {
    fontSize: Fonts.md,
    fontWeight: Fonts.weight.black,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
