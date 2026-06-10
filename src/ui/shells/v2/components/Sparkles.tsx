import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface Spark {
  angle: number;   // radians around center
  radius: number;  // distance from center
  delay: number;
  color: string;
  size: number;
}

const SPARKS: Spark[] = [
  { angle: 0,            radius: 140, delay: 0,    color: '#F5B800', size: 8 },
  { angle: Math.PI / 4,  radius: 155, delay: 250,  color: '#58CC02', size: 6 },
  { angle: Math.PI / 2,  radius: 130, delay: 500,  color: '#5BB8E3', size: 7 },
  { angle: 3*Math.PI/4,  radius: 150, delay: 800,  color: '#FF7A9C', size: 5 },
  { angle: Math.PI,      radius: 140, delay: 1100, color: '#A78BFA', size: 8 },
  { angle: 5*Math.PI/4,  radius: 160, delay: 350,  color: '#F5B800', size: 6 },
  { angle: 3*Math.PI/2,  radius: 135, delay: 700,  color: '#58CC02', size: 7 },
  { angle: 7*Math.PI/4,  radius: 150, delay: 1000, color: '#5BB8E3', size: 5 },
];

function Twinkle({ spark }: { spark: Spark }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(spark.delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 480, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1.1, duration: 480, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 560, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 0.4, duration: 560, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.delay(1400),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [spark.delay, opacity, scale]);

  const x = Math.cos(spark.angle) * spark.radius;
  const y = Math.sin(spark.angle) * spark.radius;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.spark,
        {
          width: spark.size, height: spark.size,
          backgroundColor: spark.color,
          borderRadius: spark.size / 2,
          shadowColor: spark.color,
          transform: [{ translateX: x }, { translateY: y }, { scale }],
          opacity,
        },
      ]}
    />
  );
}

export default function Sparkles() {
  return (
    <View pointerEvents="none" style={styles.wrap}>
      {SPARKS.map((s, i) => <Twinkle key={i} spark={s} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  spark: {
    position: 'absolute',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});
