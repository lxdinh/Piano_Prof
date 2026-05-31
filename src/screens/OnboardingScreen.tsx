import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, ScrollView,
  NativeScrollEvent, NativeSyntheticEvent, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Spacing, LedColors, Gradients, Radii, Elevation } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import LedStripArt from '../components/LedStripArt';
import PianoKeyboard from '../components/PianoKeyboard';
import MascotImage from '../components/MascotImage';
import HeroHalo from '../components/HeroHalo';
import FloatingNotes from '../components/FloatingNotes';
import Sparkles from '../components/Sparkles';
import { useEntrance, useBreathing } from '../feedback/motion';
import { setBool } from '../storage/settings';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

// Hero scene for the welcome page — Maestro at the keys, background removed.
const WELCOME_SCENE = require('../../assets/mascots/welcome-piano.png');

const { width: SCREEN_W } = Dimensions.get('window');
const PAGES = 3;
const SCENE_W = Math.min(SCREEN_W - 56, 320);
const SCENE_H = SCENE_W * (781 / 1199); // preserve source aspect ratio

const SWEEP_NOTES = [60, 64, 67, 72, 76, 79, 84];

function useLightSweep(count: number, active: boolean): string[] {
  const [colors, setColors] = useState<string[]>(() => new Array(count).fill('#2A1D11'));
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const id = setInterval(() => {
      const head = i % count;
      setColors(
        Array.from({ length: count }, (_, k) => {
          const dist = (k - head + count) % count;
          if (dist === 0) return LedColors[i % LedColors.length];
          if (dist === 1) return LedColors[(i + 3) % LedColors.length];
          if (dist === 2) return LedColors[(i + 5) % LedColors.length];
          return '#2A1D11';
        }),
      );
      i++;
    }, 220);
    return () => clearInterval(id);
  }, [count, active]);
  return colors;
}

function useChordLoop(active: boolean): number[] {
  const [lit, setLit] = useState<number[]>([]);
  useEffect(() => {
    if (!active) { setLit([]); return; }
    let phase = 0;
    const id = setInterval(() => {
      if (phase === 0) setLit([60]);
      else if (phase === 1) setLit([60, 64]);
      else if (phase === 2) setLit([60, 64, 67]);
      else if (phase === 3) setLit([60, 64, 67, 72]);
      else setLit([]);
      phase = (phase + 1) % 6;
    }, 500);
    return () => clearInterval(id);
  }, [active]);
  return lit;
}

interface PageProps {
  active: boolean;
  pageIndex: number;
}

// ── Page 1: meet the teacher ───────────────────────────────────
function Page1({ active }: PageProps) {
  const sweep = useLightSweep(24, active);
  const entrance = useEntrance(active ? 100 : 0);
  const breath = useBreathing(0.985, 1.015, 3400);

  return (
    <View style={styles.page}>
      <Animated.View
        style={[
          styles.pageInner,
          { opacity: entrance.opacity, transform: [{ translateY: entrance.translateY }] },
        ]}
      >
        <View style={styles.sceneBox}>
          <HeroHalo size={SCENE_W + 70} color="#FFD86B">
            <Animated.Image
              source={WELCOME_SCENE}
              style={[styles.sceneImg, { transform: [{ scale: breath }] }]}
              resizeMode="contain"
            />
          </HeroHalo>
          <Sparkles />
        </View>

        <View style={styles.copyBlock}>
          <Text style={styles.kicker}>WELCOME</Text>
          <Text style={styles.title}>Meet your{'\n'}AI piano teacher</Text>
          <Text style={styles.subtitle}>
            Real songs, fast. Chords first. No sheet music required.
          </Text>
        </View>

        <View style={styles.demoCard}>
          <Text style={styles.demoLabel}>YOUR LED STRIP</Text>
          <LedStripArt count={24} width={Math.min(SCREEN_W - 88, 300)} height={56} ledColors={sweep} />
        </View>
      </Animated.View>
    </View>
  );
}

// ── Page 2: keys light up ──────────────────────────────────────
function Page2({ active }: PageProps) {
  const lit = useChordLoop(active);
  const entrance = useEntrance(active ? 100 : 0);

  return (
    <View style={styles.page}>
      <Animated.View
        style={[
          styles.pageInner,
          { opacity: entrance.opacity, transform: [{ translateY: entrance.translateY }] },
        ]}
      >
        <View style={styles.heroBoxSmall}>
          <HeroHalo size={240} color="#A3D8F0">
            <MascotImage mood="thinking" size={140} />
          </HeroHalo>
        </View>

        <View style={styles.copyBlock}>
          <Text style={[styles.kicker, { color: Colors.sky }]}>STEP 2</Text>
          <Text style={styles.title}>Your keys{'\n'}light up</Text>
          <Text style={styles.subtitle}>
            Pair your LED strip. Watch which keys to play — then play them.
          </Text>
        </View>

        <View style={styles.demoCard}>
          <PianoKeyboard
            litNotes={lit}
            colorByHand
            showLeds
            width={Math.min(SCREEN_W - 80, 320)}
            height={160}
            startMidi={60}
            whiteKeys={11}
          />
        </View>
      </Animated.View>
    </View>
  );
}

// ── Page 3: streak, XP, gems, badges ───────────────────────────
function Page3({ active }: PageProps) {
  const entrance = useEntrance(active ? 100 : 0);

  return (
    <View style={styles.page}>
      <Animated.View
        style={[
          styles.pageInner,
          { opacity: entrance.opacity, transform: [{ translateY: entrance.translateY }] },
        ]}
      >
        <View style={styles.heroBox}>
          <HeroHalo size={340} color="#7CE62A">
            <View style={styles.mascotPlate}>
              <MascotImage mood="cheer" size={200} />
            </View>
          </HeroHalo>
          <Sparkles />
        </View>

        <View style={styles.copyBlock}>
          <Text style={[styles.kicker, { color: Colors.brand }]}>EVERY DAY</Text>
          <Text style={styles.title}>5 minutes.{'\n'}Don't break the streak.</Text>
          <Text style={styles.subtitle}>
            Earn XP, climb the path, unlock songs.
          </Text>
        </View>

        <View style={styles.statRow}>
          {[
            { icon: '🔥', label: 'Streak',  tint: '#FF7A52' },
            { icon: '⭐', label: 'XP',     tint: '#F5B800' },
            { icon: '💎', label: 'Gems',   tint: '#5BB8E3' },
            { icon: '🏆', label: 'Badges', tint: '#58CC02' },
          ].map((s) => (
            <View key={s.label} style={styles.statBlob}>
              <View style={[styles.statBubble, { backgroundColor: s.tint + '22', borderColor: s.tint }]}>
                <Text style={styles.statIcon}>{s.icon}</Text>
              </View>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// ── Container ──────────────────────────────────────────────────
export default function OnboardingScreen() {
  const nav = useNavigation<Nav>();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SCREEN_W);
    if (idx !== page) setPage(idx);
  };

  const goNext = () => {
    if (page < PAGES - 1) {
      scrollRef.current?.scrollTo({ x: (page + 1) * SCREEN_W, animated: true });
    } else {
      finish();
    }
  };

  const finish = async () => {
    await setBool('onboarded', true);
    nav.replace('MainTabs');
  };

  return (
    <View style={styles.bg}>
      {/* Cream paper base */}
      <LinearGradient
        colors={['#FFFDF6', '#FFF3CC', '#FFE6BA']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Ambient music notes drifting up across the whole stack */}
      <FloatingNotes active count={5} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={styles.scroll}
        >
          <Page1 active={page === 0} pageIndex={0} />
          <Page2 active={page === 1} pageIndex={1} />
          <Page3 active={page === 2} pageIndex={2} />
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {Array.from({ length: PAGES }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === page && styles.dotActive]}
              />
            ))}
          </View>
          <ChunkyButton
            label={page < PAGES - 1 ? 'Continue' : "Let's go"}
            onPress={goNext}
            fullWidth
            haptic="bump"
          />
          {page < PAGES - 1 && (
            <ChunkyButton label="Skip" variant="ghost" onPress={finish} fullWidth haptic="tap" />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.cream50 },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  page: { width: SCREEN_W, flex: 1 },
  pageInner: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },

  // Hero
  heroBox: {
    width: 340, height: 340,
    alignItems: 'center', justifyContent: 'center',
  },
  heroBoxSmall: {
    width: 240, height: 240,
    alignItems: 'center', justifyContent: 'center',
  },
  mascotPlate: {
    alignItems: 'center', justifyContent: 'center',
  },
  // Wide piano scene (welcome page)
  sceneBox: {
    width: SCENE_W + 70, height: SCENE_W + 70,
    alignItems: 'center', justifyContent: 'center',
  },
  sceneImg: {
    width: SCENE_W, height: SCENE_H,
  },

  // Copy
  copyBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  kicker: {
    fontSize: Fonts.sm,
    fontWeight: Fonts.weight.black,
    color: Colors.butterDark,
    letterSpacing: 2.5,
  },
  title: {
    fontSize: Fonts['3xl'],
    fontWeight: Fonts.weight.black,
    color: Colors.ink900,
    textAlign: 'center',
    lineHeight: 38,
    paddingHorizontal: Spacing.sm,
  },
  subtitle: {
    fontSize: Fonts.md,
    color: Colors.ink700,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    lineHeight: 24,
    fontWeight: Fonts.weight.heavy,
  },

  // Demo
  demoCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: Radii.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.inkLine,
    ...Elevation.md,
  },
  demoLabel: {
    fontSize: Fonts.xs,
    fontWeight: Fonts.weight.black,
    color: Colors.ink500,
    letterSpacing: 1.8,
  },

  // Stats (page 3)
  statRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  statBlob: { alignItems: 'center', gap: 6 },
  statBubble: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    ...Elevation.sm,
  },
  statIcon: { fontSize: 28 },
  statLabel: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink700 },

  // Footer
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    alignItems: 'center',
  },
  dots: { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.inkLine },
  dotActive: { backgroundColor: Colors.brand, width: 24 },
});
