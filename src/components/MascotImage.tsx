import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Image, ImageSourcePropType } from 'react-native';
import Svg, { Circle, Ellipse, Path, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';
import { Colors } from '../theme/tokens';
import { useBreathing } from '../feedback/motion';
import * as haptics from '../feedback/haptics';

export type MascotMood =
  | 'happy' | 'wave' | 'thinking' | 'wow' | 'sad' | 'sleepy'
  | 'laugh' | 'wink' | 'cheer' | 'love' | 'shocked' | 'cool' | 'trophy';

interface Props {
  mood?: MascotMood;
  size?: number;
  onPress?: () => void;
  /** Disable idle breathing animation (e.g. inside small tiles). */
  static?: boolean;
}

// ── PNG sprite map (PROVIDE THESE) ───────────────────────────────
// Drop 1024x1024 PNGs into assets/mascots/<mood>.png (transparent bg).
// Any mood missing here falls back to the in-code SVG placeholder below,
// so the app keeps working until art is finalized.
//
// Each entry uses static require() so Metro can bundle the file at build time.
// To add a mood image, uncomment the corresponding line.
const PNG_SOURCES: Partial<Record<MascotMood, ImageSourcePropType>> = {
  happy:    require('../../assets/mascots/teach.png'),            // default / instructor pose
  wave:     require('../../assets/mascots/welcome-cutout.png'),   // onboarding greeting
  thinking: require('../../assets/mascots/idea.png'),             // quiz prompt
  wow:      require('../../assets/mascots/wow.png'),
  sad:      require('../../assets/mascots/sad.png'),              // out of hearts
  sleepy:   require('../../assets/mascots/tired.png'),            // streak at risk / empty
  laugh:    require('../../assets/mascots/showman.png'),          // playful
  wink:     require('../../assets/mascots/star.png'),             // encouragement
  cheer:    require('../../assets/mascots/cheer.png'),            // quiz correct / onboarding
  love:     require('../../assets/mascots/love.png'),
  shocked:  require('../../assets/mascots/shocked.png'),          // wrong answer
  cool:     require('../../assets/mascots/cool.png'),             // profile
  trophy:   require('../../assets/mascots/trophy.png'),           // lesson complete / unlock
};

export default function MascotImage({ mood = 'happy', size = 140, onPress, static: isStatic }: Props) {
  const breath = useBreathing(0.97, 1.03, 2800);
  const blink = useBlink();
  const cross = useCrossfade(mood);

  const Wrapper: any = onPress ? Pressable : View;
  const handlePress = () => {
    haptics.tap();
    onPress?.();
  };

  const transform = isStatic ? [] : [{ scale: breath }];

  return (
    <Wrapper onPress={onPress ? handlePress : undefined} style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View style={[styles.inner, { width: size, height: size, transform }]}>
        {/* Outgoing layer */}
        {cross.prev && (
          <Animated.View style={[styles.layer, { opacity: cross.prevOpacity }]}>
            <Frame mood={cross.prev} size={size} blink={blink} />
          </Animated.View>
        )}
        {/* Current layer */}
        <Animated.View style={[styles.layer, { opacity: cross.nextOpacity }]}>
          <Frame mood={mood} size={size} blink={blink} />
        </Animated.View>
      </Animated.View>
    </Wrapper>
  );
}

// Picks PNG when available, falls back to SVG penguin otherwise.
function Frame({ mood, size, blink }: { mood: MascotMood; size: number; blink: Animated.Value }) {
  const png = PNG_SOURCES[mood];
  if (png) {
    return <Image source={png} style={{ width: size, height: size }} resizeMode="contain" />;
  }
  return <SvgPenguin mood={mood} size={size} blink={blink} />;
}

// ── Idle blink ───────────────────────────────────────────────────
// Drops the eye-lid (scaleY 1 → 0.05 → 1) every few seconds, varying timing.
function useBlink(): Animated.Value {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let cancelled = false;
    const scheduleNext = () => {
      const delay = 2200 + Math.random() * 2800;
      const id = setTimeout(() => {
        if (cancelled) return;
        Animated.sequence([
          Animated.timing(v, { toValue: 0.08, duration: 90, useNativeDriver: true }),
          Animated.timing(v, { toValue: 1, duration: 110, useNativeDriver: true }),
        ]).start(() => scheduleNext());
      }, delay);
      return id;
    };
    const id = scheduleNext();
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [v]);
  return v;
}

// ── Crossfade between moods ──────────────────────────────────────
function useCrossfade(mood: MascotMood) {
  const [prev, setPrev] = useState<MascotMood | null>(null);
  const nextOpacity = useRef(new Animated.Value(1)).current;
  const prevOpacity = useRef(new Animated.Value(0)).current;
  const last = useRef<MascotMood>(mood);

  useEffect(() => {
    if (last.current === mood) return;
    setPrev(last.current);
    last.current = mood;
    nextOpacity.setValue(0);
    prevOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(nextOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(prevOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setPrev(null);
    });
  }, [mood, nextOpacity, prevOpacity]);

  return { prev, prevOpacity, nextOpacity };
}

// ── SVG penguin fallback ─────────────────────────────────────────
// Polished placeholder until real art lands. Per-mood expressions are
// implemented by swapping the eye/mouth elements; body/bowtie stay constant.
function SvgPenguin({ mood, size, blink }: { mood: MascotMood; size: number; blink: Animated.Value }) {
  const accent = ACCENT[mood] ?? Colors.brand;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id="bodyG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2E2118" />
            <Stop offset="1" stopColor="#0E0A07" />
          </LinearGradient>
          <RadialGradient id="bellyG" cx="50%" cy="40%" rx="50%" ry="55%">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#FFE6A8" />
          </RadialGradient>
          <LinearGradient id="beakG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFD54A" />
            <Stop offset="1" stopColor="#F5B800" />
          </LinearGradient>
        </Defs>

        {/* feet */}
        <Ellipse cx={75} cy={185} rx={22} ry={9} fill="#F5B800" />
        <Ellipse cx={125} cy={185} rx={22} ry={9} fill="#F5B800" />

        {/* body */}
        <Ellipse cx={100} cy={135} rx={70} ry={62} fill="url(#bodyG)" />
        {/* belly */}
        <Ellipse cx={100} cy={142} rx={50} ry={50} fill="url(#bellyG)" />

        {/* wings */}
        <Ellipse cx={36} cy={130} rx={14} ry={36} fill="url(#bodyG)" transform="rotate(-12 36 130)" />
        <Ellipse cx={164} cy={130} rx={14} ry={36} fill="url(#bodyG)" transform="rotate(12 164 130)" />

        {/* head */}
        <Circle cx={100} cy={72} r={56} fill="url(#bodyG)" />
        {/* face circle */}
        <Ellipse cx={100} cy={84} rx={40} ry={34} fill="url(#bellyG)" />

        {/* accessory */}
        {ACCESSORY[mood]?.(accent)}

        {/* eyes (animated blink via scaleY around eye center) */}
        <EyePair mood={mood} blink={blink} />

        {/* beak / mouth */}
        {MOUTH[mood]?.() ?? defaultBeak()}

        {/* bowtie */}
        <Path d="M82 124 L100 116 L82 108 Z M118 124 L100 116 L118 108 Z" fill={Colors.brand} />
        <Circle cx={100} cy={116} r={4} fill={Colors.brandDark} />
      </Svg>
    </View>
  );
}

function EyePair({ mood, blink }: { mood: MascotMood; blink: Animated.Value }) {
  // Animated.Value can't drive raw SVG attrs, so we wrap each eye in an
  // Animated.View positioned absolutely and use scaleY to blink.
  const isClosed = mood === 'sleepy' || mood === 'wink';
  if (mood === 'sleepy') {
    return (
      <Svg width={0} height={0}>
        {/* drawn directly in SvgPenguin to keep the markup simple */}
      </Svg>
    );
  }
  // Render eyes as SVG circles; blink handled by overlaying an Animated lid.
  return (
    <>
      <Circle cx={84} cy={76} r={6} fill={Colors.ink900} />
      {mood !== 'wink' && <Circle cx={116} cy={76} r={6} fill={Colors.ink900} />}
      {mood === 'wink' && <Path d="M110 76 L122 76" stroke={Colors.ink900} strokeWidth={4} strokeLinecap="round" />}
      {/* eye sparkle */}
      <Circle cx={86} cy={74} r={1.5} fill="#FFFFFF" />
      {mood !== 'wink' && <Circle cx={118} cy={74} r={1.5} fill="#FFFFFF" />}
      {/* eyebrow for moods that need it */}
      {EYEBROW[mood]?.()}
      {/* blink: animated overlay lid */}
      <_BlinkLid blink={blink} closed={isClosed} />
    </>
  );
}

// Render a thin black bar across the eyes when blink == 0.
// (Implemented as an SVG <rect> with vector-effect; height grows as blink shrinks.)
function _BlinkLid({ blink, closed }: { blink: Animated.Value; closed: boolean }) {
  // We can't animate raw SVG with Animated.Value cheaply here. Use a quick
  // listener-based approach: when fully closed (sleepy/wink target eye), draw
  // a lid statically.
  if (closed) return null;
  // Static no-op fallback; the breathing scale plus mouth changes already
  // give plenty of life. (Per-frame eye-lid animation would need RN Skia.)
  void blink;
  return null;
}

const ACCENT: Partial<Record<MascotMood, string>> = {
  happy: Colors.brand, cheer: Colors.butter, love: '#FF7A9C', cool: '#5BB8E3',
  trophy: Colors.butter, wow: Colors.butter, shocked: Colors.error,
};

const ACCESSORY: Partial<Record<MascotMood, (accent: string) => React.ReactNode>> = {
  cool: () => (
    <>
      <Path d="M68 70 L132 70 L130 88 L102 92 L70 88 Z" fill="#0F1117" opacity={0.88} />
      <Path d="M70 88 L80 90" stroke="#0F1117" strokeWidth={3} />
    </>
  ),
  trophy: () => (
    <>
      <Path d="M88 32 L112 32 L110 42 Q100 50 90 42 Z" fill="#F5B800" />
      <Path d="M84 30 L116 30 L116 36 L84 36 Z" fill="#F5B800" />
    </>
  ),
  cheer: () => (
    <>
      <Circle cx={66} cy={42} r={5} fill="#FF7A9C" />
      <Circle cx={134} cy={42} r={5} fill="#5BB8E3" />
      <Circle cx={100} cy={28} r={4} fill="#F5B800" />
    </>
  ),
  love: () => (
    <Path d="M100 36 q-10 -12 -18 -4 q-8 8 18 22 q26 -14 18 -22 q-8 -8 -18 4 z" fill="#FF7A9C" />
  ),
};

const EYEBROW: Partial<Record<MascotMood, () => React.ReactNode>> = {
  thinking: () => (
    <>
      <Path d="M76 66 L92 64" stroke={Colors.ink900} strokeWidth={3} strokeLinecap="round" />
      <Path d="M108 64 L124 66" stroke={Colors.ink900} strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  shocked: () => (
    <>
      <Path d="M76 62 L94 60" stroke={Colors.ink900} strokeWidth={3} strokeLinecap="round" />
      <Path d="M106 60 L124 62" stroke={Colors.ink900} strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  sad: () => (
    <>
      <Path d="M74 70 L92 64" stroke={Colors.ink900} strokeWidth={3} strokeLinecap="round" />
      <Path d="M108 64 L126 70" stroke={Colors.ink900} strokeWidth={3} strokeLinecap="round" />
    </>
  ),
};

const MOUTH: Partial<Record<MascotMood, () => React.ReactNode>> = {
  happy:  () => <Path d="M90 102 Q100 112 110 102" stroke="#2A1D11" strokeWidth={3} fill="none" strokeLinecap="round" />,
  laugh:  () => <Path d="M85 100 Q100 116 115 100 Q100 110 85 100 Z" fill="#2A1D11" />,
  wow:    () => <Path d="M100 105 m -6 0 a 6 8 0 1 0 12 0 a 6 8 0 1 0 -12 0" fill="#2A1D11" />,
  sad:    () => <Path d="M90 108 Q100 100 110 108" stroke="#2A1D11" strokeWidth={3} fill="none" strokeLinecap="round" />,
  cheer:  () => <Path d="M88 100 Q100 116 112 100" stroke="#2A1D11" strokeWidth={3} fill="none" strokeLinecap="round" />,
  trophy: () => <Path d="M88 102 Q100 116 112 102" stroke="#2A1D11" strokeWidth={3} fill="none" strokeLinecap="round" />,
  cool:   () => <Path d="M88 104 Q100 110 112 104" stroke="#2A1D11" strokeWidth={3} fill="none" strokeLinecap="round" />,
};

function defaultBeak(): React.ReactNode {
  return <Path d="M88 92 L112 92 L100 108 Z" fill="url(#beakG)" />;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  inner: { alignItems: 'center', justifyContent: 'center' },
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
