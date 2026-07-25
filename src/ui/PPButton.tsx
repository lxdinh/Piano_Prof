// Piano Professor — chunky button (ds-core.jsx `ChunkyButton` port).
// Two stacked layers: a solid "plate" edge + a gradient face that presses down
// into it. Palettes/sizes match the prototype 1:1.
import React, { useRef } from 'react';
import { Animated, Pressable, Text, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Fonts } from '../theme/tokens';
import * as haptics from '../feedback/haptics';

export type PPVariant = 'green' | 'gold' | 'sky' | 'streak' | 'danger' | 'white' | 'dark' | 'ghost';
export type PPSize = 'sm' | 'md' | 'lg' | 'xl';

// [face-light, face-dark, plate, text]
const PALETTE: Record<PPVariant, [string, string, string, string]> = {
  green:  ['#6FE018', '#58CC02', '#3D8E00', '#ffffff'],
  gold:   ['#FFCB2E', '#F5B800', '#C28A00', '#5a3d00'],
  sky:    ['#56B4E8', '#2F9BD6', '#1E6E99', '#ffffff'],
  streak: ['#FF8F66', '#FF7A52', '#C2410C', '#ffffff'],
  danger: ['#FF6B6B', '#FF4B4B', '#C81E1E', '#ffffff'],
  white:  ['#FFFFFF', '#FFFFFF', '#E2D9BE', '#2E84AD'],
  dark:   ['#4B4742', '#393632', '#1c1a17', '#ffffff'],
  ghost:  ['transparent', 'transparent', 'transparent', '#2D2A26'],
};

const SIZES: Record<PPSize, { padV: number; padH: number; fs: number; plate: number; radius: number }> = {
  sm: { padV: 9, padH: 16, fs: 15, plate: 4, radius: 14 },
  md: { padV: 14, padH: 24, fs: 18, plate: 5, radius: 18 },
  lg: { padV: 18, padH: 30, fs: 21, plate: 6, radius: 22 },
  xl: { padV: 22, padH: 38, fs: 25, plate: 6, radius: 26 },
};

interface Props {
  label: string;
  onPress?: () => void;
  variant?: PPVariant;
  size?: PPSize;
  full?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
}

export default function PPButton({
  label, onPress, variant = 'green', size = 'md', full, disabled, icon, textColor, style,
}: Props) {
  const pal = PALETTE[variant];
  const sz = SIZES[size];
  const isGhost = variant === 'ghost';
  const press = useRef(new Animated.Value(0)).current;

  const to = (v: number) =>
    Animated.spring(press, { toValue: v, useNativeDriver: true, friction: 7, tension: 240 }).start();

  // Press sinks the face down into the base by `plate` px. At rest the face sits
  // on top and the base shows as a `plate`-tall rim at the bottom.
  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, sz.plate] });

  const handlePress = () => {
    if (disabled) return;
    haptics.tap();
    onPress?.();
  };

  return (
    <View style={[full && { width: '100%' }, disabled && { opacity: 0.45 }, style]}>
      {/* The base IS the button's background — one rounded rect, so its corners
          always match the face (no detached "underscore"), robust under scaling. */}
      <Pressable
        onPress={handlePress}
        onPressIn={() => !disabled && to(1)}
        onPressOut={() => to(0)}
        disabled={disabled}
        style={{
          borderRadius: sz.radius,
          backgroundColor: isGhost ? 'transparent' : pal[2],
          paddingBottom: isGhost ? 0 : sz.plate,
        }}
      >
        <Animated.View style={{ transform: [{ translateY }] }}>
          <LinearGradient
            colors={isGhost ? ['transparent', 'transparent'] : [pal[0], pal[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              paddingVertical: sz.padV, paddingHorizontal: sz.padH, borderRadius: sz.radius,
              borderWidth: variant === 'white' || isGhost ? 2 : 0,
              borderColor: variant === 'white' ? '#EAE0C4' : isGhost ? '#EAE0C4' : 'transparent',
            }}
          >
            {icon}
            <Text
              numberOfLines={1}
              style={{
                // Buttons are display type — chunky Baloo, not body Nunito.
                color: textColor ?? pal[3], fontSize: sz.fs, fontFamily: Fonts.family.display,
                letterSpacing: 0.3,
                textTransform: isGhost ? 'none' : 'uppercase',
              }}
            >
              {label}
            </Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </View>
  );
}
