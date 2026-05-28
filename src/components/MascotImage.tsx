import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { Colors } from '../theme/tokens';

export type MascotMood =
  | 'happy' | 'wave' | 'thinking' | 'wow' | 'sad' | 'sleepy'
  | 'laugh' | 'wink' | 'cheer' | 'love' | 'shocked' | 'cool' | 'trophy';

interface Props {
  mood?: MascotMood;
  size?: number;
  onPress?: () => void;
}

// Lightweight Maestro Penguini placeholder rendered in SVG so we don't depend on
// asset bundling for the first build. Real PNG mood frames will land later in
// /assets/mascots/<mood>.png and this component can switch on `mood` to render them.
export default function MascotImage({ mood = 'happy', size = 140, onPress }: Props) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* body */}
        <Ellipse cx={100} cy={130} rx={68} ry={62} fill={Colors.ink900} />
        {/* belly */}
        <Ellipse cx={100} cy={140} rx={48} ry={48} fill={Colors.cream50} />
        {/* head */}
        <Circle cx={100} cy={70} r={52} fill={Colors.ink900} />
        {/* face */}
        <Ellipse cx={100} cy={84} rx={36} ry={32} fill={Colors.cream50} />
        {/* eyes */}
        <Circle cx={84} cy={72} r={5} fill={Colors.ink900} />
        <Circle cx={116} cy={72} r={5} fill={Colors.ink900} />
        {/* beak */}
        <Path d="M88 92 L112 92 L100 108 Z" fill={Colors.butter} />
        {/* bowtie */}
        <Path d="M82 124 L100 116 L82 108 Z M118 124 L100 116 L118 108 Z" fill={Colors.brand} />
        <Circle cx={100} cy={116} r={4} fill={Colors.brandDark} />
      </Svg>
      <Text style={styles.label}>{mood}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.ink500,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
