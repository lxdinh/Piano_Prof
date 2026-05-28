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
import { Colors, Fonts, Spacing, LedColors, Gradients } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import LedStripArt from '../components/LedStripArt';
import PianoKeyboard from '../components/PianoKeyboard';
import MascotImage from '../components/MascotImage';
import { useEntrance } from '../feedback/motion';
import { setBool } from '../storage/settings';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const { width: SCREEN_W } = Dimensions.get('window');
const PAGES = 3;

// Canon-in-D sweep — the C major arpeggio rotated through the strip.
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
    if (!active) {
      setLit([]);
      return;
    }
    let phase = 0;
    const id = setInterval(() => {
      // Cycle: single note → chord → release
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

function Page1({ active }: PageProps) {
  const sweep = useLightSweep(24, active);
  const entrance = useEntrance(active ? 100 : 0);

  return (
    <View style={styles.page}>
      <Animated.View style={[styles.pageInner, { opacity: entrance.opacity, transform: [{ translateY: entrance.translateY }] }]}>
        <MascotImage mood="wave" size={170} />
        <Text style={styles.title}>Meet your AI piano teacher</Text>
        <Text style={styles.subtitle}>Learn real songs, fast. Chords first. No sheet music required.</Text>
        <View style={styles.demoBox}>
          <LedStripArt count={24} width={300} height={70} ledColors={sweep} />
        </View>
      </Animated.View>
    </View>
  );
}

function Page2({ active }: PageProps) {
  const lit = useChordLoop(active);
  const entrance = useEntrance(active ? 100 : 0);

  return (
    <View style={styles.page}>
      <Animated.View style={[styles.pageInner, { opacity: entrance.opacity, transform: [{ translateY: entrance.translateY }] }]}>
        <MascotImage mood="thinking" size={130} />
        <Text style={styles.title}>Your keys light up</Text>
        <Text style={styles.subtitle}>Pair the LED strip above your piano. Watch which keys to play — and play them.</Text>
        <View style={styles.demoBox}>
          <PianoKeyboard
            litNotes={lit}
            litColor={Colors.brand}
            showLeds
            width={320}
            height={170}
            startMidi={60}
            whiteKeys={11}
          />
        </View>
      </Animated.View>
    </View>
  );
}

function Page3({ active }: PageProps) {
  const entrance = useEntrance(active ? 100 : 0);
  return (
    <View style={styles.page}>
      <Animated.View style={[styles.pageInner, { opacity: entrance.opacity, transform: [{ translateY: entrance.translateY }] }]}>
        <MascotImage mood="cheer" size={170} />
        <Text style={styles.title}>A streak a day</Text>
        <Text style={styles.subtitle}>5 minutes, every day. Earn XP, climb the path, never stop a streak.</Text>
        <View style={styles.statRow}>
          <View style={styles.statBlob}><Text style={styles.statIcon}>🔥</Text><Text style={styles.statLabel}>Streak</Text></View>
          <View style={styles.statBlob}><Text style={styles.statIcon}>⭐</Text><Text style={styles.statLabel}>XP</Text></View>
          <View style={styles.statBlob}><Text style={styles.statIcon}>💎</Text><Text style={styles.statLabel}>Gems</Text></View>
          <View style={styles.statBlob}><Text style={styles.statIcon}>🏆</Text><Text style={styles.statLabel}>Badges</Text></View>
        </View>
      </Animated.View>
    </View>
  );
}

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
    <LinearGradient colors={[Gradients.paper[0], Gradients.paper[1]]} style={styles.bg}>
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
                style={[
                  styles.dot,
                  i === page && styles.dotActive,
                ]}
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  page: { width: SCREEN_W, flex: 1 },
  pageInner: { flex: 1, padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  title: { fontSize: Fonts['2xl'], fontWeight: Fonts.weight.black, color: Colors.ink900, textAlign: 'center', paddingHorizontal: Spacing.lg },
  subtitle: { fontSize: Fonts.md, color: Colors.ink700, textAlign: 'center', paddingHorizontal: Spacing.xl, lineHeight: 24 },
  demoBox: { marginTop: Spacing.lg, alignItems: 'center' },
  statRow: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md },
  statBlob: { alignItems: 'center', gap: 4 },
  statIcon: { fontSize: 32 },
  statLabel: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink700 },
  footer: { padding: Spacing.xl, gap: Spacing.md, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.inkLine },
  dotActive: { backgroundColor: Colors.brand, width: 24 },
});
