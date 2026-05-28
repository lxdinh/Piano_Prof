import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radii } from '../theme/tokens';

interface Props {
  /** 0..1 */
  progress: number;
  height?: number;
}

export default function XpBar({ progress, height = 10 }: Props) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          { width: `${pct * 100}%`, height, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.inkLine,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    backgroundColor: Colors.brand,
  },
});
