import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radii, Spacing, Elevation } from '../theme/tokens';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  /** Render a soft warm gradient instead of flat white — for hero cards. */
  variant?: 'plain' | 'warm';
  /** Elevation preset. Default md. */
  elevation?: keyof typeof Elevation;
}

export default function PpCard({
  children, style, padded = true, variant = 'plain', elevation = 'md',
}: Props) {
  const padding = padded ? { padding: Spacing.lg } : null;

  if (variant === 'warm') {
    return (
      <LinearGradient
        colors={['#FFFFFF', '#FFF5DC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.card, Elevation[elevation], padding, style]}
      >
        {children}
      </LinearGradient>
    );
  }
  return (
    <View style={[styles.card, styles.plain, Elevation[elevation], padding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.inkLine,
  },
  plain: {
    backgroundColor: '#FFFFFF',
  },
});
