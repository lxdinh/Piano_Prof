import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

const GLYPHS = ['♪', '♫', '♩', '♬', '♪'];
const COLORS = ['#58CC02', '#5BB8E3', '#F5B800', '#FF7A9C', '#A78BFA'];

interface NoteProps {
  index: number;
  active: boolean;
}

function Note({ index, active }: NoteProps) {
  const y = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const duration = 5400 + index * 700;
    const delay = index * 900;
    const startX = (index / 5) * (SCREEN_W - 80) + 40;
    x.setValue(startX);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, { toValue: -260, duration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.7, duration: 600, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.7, duration: duration - 1200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
          Animated.timing(rot, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
        ]),
        Animated.timing(y, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(rot, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, index, y, x, opacity, rot]);

  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] });
  const swayX = rot.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 14, -8] });

  return (
    <Animated.Text
      style={[
        styles.note,
        {
          color: COLORS[index % COLORS.length],
          left: x,
          transform: [{ translateY: y }, { translateX: swayX }, { rotate }],
          opacity,
        },
      ]}
    >
      {GLYPHS[index % GLYPHS.length]}
    </Animated.Text>
  );
}

interface Props {
  active?: boolean;
  count?: number;
}

export default function FloatingNotes({ active = true, count = 5 }: Props) {
  return (
    <View pointerEvents="none" style={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <Note key={i} index={i} active={active} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  note: {
    position: 'absolute',
    bottom: 80,
    fontSize: 36,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.06)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
