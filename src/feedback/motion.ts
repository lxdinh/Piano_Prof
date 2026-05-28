import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Motion } from '../theme/tokens';

// Reusable motion primitives. All return Animated.Value(s) that can be wired
// straight into transforms / opacity / etc. Each hook owns its own loop and
// stops cleanly on unmount.

/** Slow inhale/exhale loop — for living, idle UI (mascot, current path node). */
export function useBreathing(min = 0.96, max = 1.04, ms = 2400): Animated.Value {
  const v = useRef(new Animated.Value(min)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: max, duration: ms / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: min, duration: ms / 2, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, min, max, ms]);
  return v;
}

/** Stronger pulse — for CTA glows and "tap me" affordances. */
export function usePulse(min = 0.4, max = 1, ms = 1400): Animated.Value {
  const v = useRef(new Animated.Value(min)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: max, duration: ms / 2, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: min, duration: ms / 2, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, min, max, ms]);
  return v;
}

/** Continuous rotation. Returns 0..1 — interpolate to a `deg` value. */
export function useSpin(ms = 4000): Animated.Value {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.linear, useNativeDriver: true }),
    );
    v.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [v, ms]);
  return v;
}

/** Fade + lift entrance — drop-in for new screens or hero elements. */
export function useEntrance(delay = 0): { opacity: Animated.Value; translateY: Animated.Value } {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: Motion.duration.slow, delay, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
      Animated.spring(translateY, { toValue: 0, ...Motion.spring.settle, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);
  return { opacity, translateY };
}

/** Spring pop — call .start() to play a one-shot scale punch (0 → 1.15 → 1). */
export function usePop(): { scale: Animated.Value; play: () => void } {
  const scale = useRef(new Animated.Value(1)).current;
  const play = () => {
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, ...Motion.spring.pop, useNativeDriver: true }).start();
  };
  return { scale, play };
}

/** Small "shake" — for incorrect answers / shake-to-dismiss. */
export function useShake(): { translateX: Animated.Value; play: () => void } {
  const translateX = useRef(new Animated.Value(0)).current;
  const play = () => {
    const steps = [-8, 8, -6, 6, -3, 3, 0];
    Animated.sequence(
      steps.map((to) =>
        Animated.timing(translateX, { toValue: to, duration: 50, useNativeDriver: true }),
      ),
    ).start();
  };
  return { translateX, play };
}
