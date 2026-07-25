// Piano Professor — Splash / brand screen.
//
// The prototype ships TWO layouts for this screen and we honour both, because
// the canvases are shaped very differently:
//  · PHONE  (852x394, app/phone-spine.jsx `PhSplash`) — a landscape two-column
//    scene: brand stack left, lit demo keyboard right. ~244px tall. The old
//    vertical stack was ~466px in a 394px canvas, so it was cropped on device.
//  · TABLET (1280x800, app/screens-onboarding.jsx) — the roomy centred vertical
//    stack: big mascot, 60px wordmark, keyboard beneath. ~485px tall.
// Sizing one layout for both canvases is what broke it the first time.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../theme/AppTheme';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Maestro from '../ui/Maestro';
import Piano from '../ui/Piano';
import PPButton from '../ui/PPButton';
import { ProgressBar } from '../ui/atoms';
import { useStage } from '../theme/responsive';
import { t } from '../i18n';

/** Colour sweep across the demo keyboard, as in the prototype. */
const SWEEP_NOTES = [60, 62, 64, 65, 67, 69, 71, 72];
const SWEEP_COLORS = ['#58CC02', '#F5B800', '#5BB8E3', '#FF7A52'];

function useSweep(): Record<number, string> {
  const [lit, setLit] = useState<Record<number, string>>({});
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      const note = SWEEP_NOTES[i % SWEEP_NOTES.length];
      setLit({ [note]: SWEEP_COLORS[i % SWEEP_COLORS.length] });
      i++;
    }, 200);
    return () => clearInterval(id);
  }, []);
  return lit;
}

/** Drifting music notes in the background (prototype's pp-float decorations). */
function FloatingNote({ emoji, size, left, top, delay }: {
  emoji: string; size: number; left: string; top: string; delay: number;
}) {
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(drift, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(drift, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [drift, delay]);
  return (
    <Animated.Text style={{
      position: 'absolute', left: left as never, top: top as never,
      fontSize: size, opacity: 0.5,
      transform: [{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }],
    }}>
      {emoji}
    </Animated.Text>
  );
}

export default function Splash() {
  const { colors, isDark } = useAppTheme();
  const { go } = useRouter();
  const { isTablet } = useStage();
  const [ready, setReady] = useState(false);
  const lit = useSweep();

  useEffect(() => {
    const id = setTimeout(() => setReady(true), 1300);
    return () => clearTimeout(id);
  }, []);

  const gradient: [string, string] = isDark ? ['#16273F', '#0A1424'] : ['#FFFDF6', '#FFE9B8'];
  const tagline = (size: number, marginTop: number, marginBottom = 0) => (
    <Text style={{
      fontFamily: Fonts.family.bold, fontSize: size,
      color: isDark ? colors.inkSoft : '#A98B2E', marginTop, marginBottom,
    }}>
      {t('splash.tagline')}
    </Text>
  );
  const cta = (width: number) => (ready ? (
    <PPButton label={t('splash.play')} size="lg" variant="sky" onPress={() => go('who')} />
  ) : (
    <View style={{ width }}>
      <ProgressBar value={70} color={colors.gold} height={9} />
      <Text style={{
        fontFamily: Fonts.family.bold, fontSize: 12,
        color: colors.inkFaint, marginTop: 6,
      }}>
        {t('splash.tuning')}
      </Text>
    </View>
  ));

  // ── tablet: roomy centred stack (prototype's standalone mockup) ──
  if (isTablet) {
    return (
      <LinearGradient colors={gradient} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <FloatingNote emoji="🎵" size={34} left="10%" top="20%" delay={0} />
        <FloatingNote emoji="🎶" size={26} left="82%" top="26%" delay={300} />
        <FloatingNote emoji="♪" size={30} left="18%" top="74%" delay={600} />
        <FloatingNote emoji="🎹" size={28} left="88%" top="70%" delay={900} />
        <FloatingNote emoji="✨" size={22} left="50%" top="12%" delay={1200} />

        <Maestro mood="conduct" size={132} ring={6} ringColor="#fff" bg={colors.sky} float />
        <View style={{ height: 22 }} />
        <Text style={{
          fontFamily: Fonts.family.black, fontSize: 60,
          color: colors.skyDeep, letterSpacing: -1.5, textAlign: 'center',
        }} numberOfLines={1}>
          Piano<Text style={{ color: colors.ink }}> Professor</Text>
        </Text>
        {tagline(21, 14)}
        <View style={{ width: 360, marginTop: 30, opacity: 0.96 }}>
          <Piano low={60} high={72} lit={lit} led interactive={false} hideNoteNames height={120} />
        </View>
        <View style={{ marginTop: 28, alignItems: 'center' }}>{cta(220)}</View>
      </LinearGradient>
    );
  }

  // ── phone: landscape two-column scene (prototype's phone spine) ──
  return (
    <LinearGradient
      colors={gradient}
      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 30, paddingHorizontal: 46 }}
    >
      <FloatingNote emoji="🎵" size={22} left="8%" top="16%" delay={0} />
      <FloatingNote emoji="🎶" size={18} left="88%" top="20%" delay={300} />
      <FloatingNote emoji="✨" size={16} left="60%" top="10%" delay={600} />

      {/* left: brand */}
      <View style={{ flex: 1, alignItems: 'flex-start' }}>
        <Maestro mood="conduct" size={76} ring={4} ringColor="#fff" bg={colors.sky} float />
        <Text style={{
          fontFamily: Fonts.family.black, fontSize: 40,
          color: colors.skyDeep, marginTop: 12, letterSpacing: -1,
        }} numberOfLines={1}>
          Piano<Text style={{ color: colors.ink }}> Professor</Text>
        </Text>
        {tagline(15, 8, 16)}
        {cta(180)}
      </View>

      {/* right: lit demo keyboard */}
      <View style={{ width: 360, flexShrink: 0 }}>
        <Piano low={60} high={72} lit={lit} led interactive={false} hideNoteNames height={120} />
      </View>
    </LinearGradient>
  );
}
