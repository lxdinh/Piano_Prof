import React from 'react';
import { Pressable, Text, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';

export type ChunkyButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'sky';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: ChunkyButtonVariant;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<ChunkyButtonVariant, { bg: string; shadow: string; text: string }> = {
  primary:   { bg: Colors.brand,   shadow: Colors.brandDark,  text: '#FFFFFF' },
  sky:       { bg: Colors.sky,     shadow: Colors.skyDark,    text: '#FFFFFF' },
  secondary: { bg: Colors.cream100, shadow: Colors.butterDark, text: Colors.ink900 },
  ghost:     { bg: 'transparent',  shadow: 'transparent',     text: Colors.ink700 },
  danger:    { bg: Colors.error,   shadow: '#C53A3A',         text: '#FFFFFF' },
};

export default function ChunkyButton({
  label, onPress, variant = 'primary', disabled, icon, style, fullWidth,
}: Props) {
  const v = VARIANT_STYLES[variant];
  return (
    <View style={[fullWidth && { width: '100%' }, style]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: v.bg },
          variant !== 'ghost' && { borderBottomColor: v.shadow, borderBottomWidth: pressed ? 0 : 4 },
          pressed && { transform: [{ translateY: 2 }] },
          disabled && { opacity: 0.5 },
        ]}
      >
        {icon}
        <Text style={[styles.label, { color: v.text }]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
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
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
