import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextStyle, StyleProp, Easing } from 'react-native';

interface Props {
  value: number;
  /** Animation length when the value changes. */
  duration?: number;
  style?: StyleProp<TextStyle>;
  /** Formatter — defaults to integer with thousands grouping. */
  format?: (n: number) => string;
  /** Render a prefix / suffix that doesn't animate (e.g. "+", " XP"). */
  prefix?: string;
  suffix?: string;
}

const formatDefault = (n: number) =>
  Math.round(n).toLocaleString();

// Counts the displayed number from its previous value to the new one.
// Listens to the underlying Animated.Value so we don't trigger a React render
// every frame — only when the int rounds change.
export default function AnimatedCounter({
  value, duration = 600, style, format = formatDefault, prefix, suffix,
}: Props) {
  const av = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(format(value));
  const lastInt = useRef(Math.round(value));

  useEffect(() => {
    const id = av.addListener(({ value: cur }) => {
      const rounded = Math.round(cur);
      if (rounded !== lastInt.current) {
        lastInt.current = rounded;
        setDisplay(format(cur));
      }
    });
    return () => av.removeListener(id);
  }, [av, format]);

  useEffect(() => {
    Animated.timing(av, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, duration, av]);

  return <Text style={style}>{prefix}{display}{suffix}</Text>;
}
