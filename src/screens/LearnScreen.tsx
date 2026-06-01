import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing, Elevation, Gradients } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import AnimatedCounter from '../components/AnimatedCounter';
import Shelf from '../components/Shelf';
import PosterCard, { PosterState } from '../components/PosterCard';
import { useUser } from '../gamification/UserProvider';
import { useEntrance } from '../feedback/motion';
import {
  resolvePathway, ResolvedItem, KIND_ICON, PATH_ITEMS, PathItemKind,
} from '../lessons/pathway';
import * as haptics from '../feedback/haptics';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const AVATAR = require('../../assets/mascots/classical.png');

// Cover gradient per item kind — keeps the path colourful like a song library.
const KIND_COVER: Record<PathItemKind, readonly [string, string]> = {
  grade: Gradients.brand,
  concept: Gradients.violet,
  song: Gradients.sky,
  exercise: Gradients.butter,
};

// ── Top header: avatar + pathway title + stat pills + XP bar ─────
function PathwayHeader() {
  const nav = useNavigation<Nav>();
  const { profile, todayActivity } = useUser();
  const goal = profile?.settings.dailyGoalXp ?? 50;
  const earned = todayActivity?.xpEarned ?? 0;
  const pct = Math.max(0, Math.min(1, earned / goal));

  const fillAnim = useRef(new Animated.Value(pct)).current;
  useEffect(() => {
    Animated.timing(fillAnim, { toValue: pct, duration: 600, useNativeDriver: false }).start();
  }, [pct, fillAnim]);
  const fillWidth = fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const stats = [
    { icon: '🔥', value: profile?.streakCount ?? 0, color: Colors.rust },
    { icon: '⚡', value: profile?.totalXp ?? 0, color: Colors.butter },
    { icon: '💎', value: profile?.gems ?? 0, color: Colors.sky },
    { icon: '❤️', value: profile?.hearts.count ?? 5, color: Colors.error },
  ];

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Image source={AVATAR} style={styles.avatar} resizeMode="cover" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerKicker}>PATHWAY</Text>
          <Text style={styles.headerTitle}>Kindergarten → Master</Text>
        </View>
        <Pressable onPress={() => { haptics.tap(); nav.navigate('BLEPairing'); }} hitSlop={12}>
          <Text style={styles.bt}>❖</Text>
        </Pressable>
      </View>

      <View style={styles.statRow}>
        {stats.map((s) => (
          <View key={s.icon} style={styles.statPill}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <AnimatedCounter value={s.value} style={[styles.statValue, { color: s.color }]} />
          </View>
        ))}
      </View>

      <View style={styles.xpRow}>
        <Text style={styles.flag}>🚩</Text>
        <View style={styles.xpTrack}>
          <Animated.View style={[styles.xpFill, { width: fillWidth }]} />
        </View>
        <Text style={styles.xpLabel}>{earned}/{goal} XP</Text>
      </View>
    </View>
  );
}

// ── "Continue learning" hero — the single next item to play ──────
function ContinueHero({ item, onStart }: { item: ResolvedItem; onStart: (it: ResolvedItem) => void }) {
  return (
    <LinearGradient colors={Gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View style={styles.heroIcon}>
        <Text style={styles.heroIconText}>{KIND_ICON[item.kind]}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.heroKicker}>CONTINUE LEARNING</Text>
        <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>
      </View>
      <ChunkyButton label="START" variant="secondary" haptic="bump" onPress={() => onStart(item)} />
    </LinearGradient>
  );
}

function posterState(item: ResolvedItem): PosterState {
  if (item.state === 'active') return 'active';
  if (item.state === 'done') return 'done';
  if (item.state === 'soon') return 'soon';
  return 'locked';
}

export default function LearnScreen() {
  const nav = useNavigation<Nav>();
  const { lessonProgress } = useUser();
  const entrance = useEntrance(0);

  const { levels, current } = useMemo(() => {
    const completed = new Set<string>();
    for (const it of PATH_ITEMS) {
      if (it.lessonRef && lessonProgress[it.lessonRef.lessonId]?.status === 'completed') {
        completed.add(it.id);
      }
    }
    return resolvePathway(completed);
  }, [lessonProgress]);

  const onStart = (item: ResolvedItem) => {
    if (item.lessonRef) {
      nav.navigate('Lesson', { gradeId: item.lessonRef.gradeId, lessonId: item.lessonRef.lessonId });
    } else {
      haptics.warning();
    }
  };

  const canStart = (item: ResolvedItem) => item.state === 'active' || item.state === 'done';

  return (
    <View style={styles.bg}>
      <LinearGradient colors={['#FFFDF6', '#FFF6DD']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <PathwayHeader />
        <Animated.ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          style={{ opacity: entrance.opacity }}
        >
          {current ? (
            <View style={styles.heroWrap}>
              <ContinueHero item={current} onStart={onStart} />
            </View>
          ) : (
            <View style={[styles.heroWrap, styles.allDone]}>
              <Text style={styles.allDoneEmoji}>🏆</Text>
              <Text style={styles.allDoneText}>You're all caught up — more lessons coming soon!</Text>
            </View>
          )}

          {levels.map((level) => (
            <Shelf key={level.id} title={level.short} subtitle={level.objective}>
              {level.items.map((item) => (
                <PosterCard
                  key={item.id}
                  title={item.title}
                  subtitle={KIND_LABEL[item.kind]}
                  icon={KIND_ICON[item.kind]}
                  cover={KIND_COVER[item.kind]}
                  state={posterState(item)}
                  onPress={() => (canStart(item) ? onStart(item) : haptics.warning())}
                />
              ))}
            </Shelf>
          ))}

          <Text style={styles.mastery}>~ MASTERY ~</Text>
          <View style={{ height: Spacing['2xl'] }} />
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

const KIND_LABEL: Record<PathItemKind, string> = {
  grade: 'Lesson', concept: 'Concept', song: 'Song', exercise: 'Exercise',
};

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.cream50 },
  safe: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.inkLine,
    gap: Spacing.sm,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FFFFFF',
    ...Elevation.sm,
  },
  headerKicker: { fontSize: Fonts.xs, fontWeight: Fonts.weight.bold, color: Colors.ink500, letterSpacing: 2 },
  headerTitle: { fontSize: Fonts.lg, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  bt: { fontSize: Fonts.xl, color: Colors.sky, fontWeight: Fonts.weight.black },

  statRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  statPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: '#FFFFFF', borderRadius: Radii.pill,
    paddingVertical: 7, borderWidth: 1, borderColor: Colors.inkLine,
  },
  statIcon: { fontSize: 15 },
  statValue: { fontSize: Fonts.md, fontWeight: Fonts.weight.black },

  xpRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  flag: { fontSize: 14 },
  xpTrack: { flex: 1, height: 12, backgroundColor: Colors.inkLine, borderRadius: 6, overflow: 'hidden' },
  xpFill: { height: 12, backgroundColor: Colors.butter, borderRadius: 6 },
  xpLabel: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink500 },

  // Scroll
  scroll: { paddingVertical: Spacing.lg, gap: Spacing.xl },

  // Hero
  heroWrap: { paddingHorizontal: Spacing.lg },
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderRadius: Radii.xl, padding: Spacing.lg, ...Elevation.md,
  },
  heroIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroIconText: { fontSize: 28 },
  heroKicker: { fontSize: Fonts.xs, fontWeight: Fonts.weight.black, color: 'rgba(255,255,255,0.85)', letterSpacing: 2 },
  heroTitle: { fontSize: Fonts.lg, fontWeight: Fonts.weight.black, color: '#FFFFFF' },

  allDone: {
    backgroundColor: '#FFFFFF', borderRadius: Radii.xl, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.inkLine,
  },
  allDoneEmoji: { fontSize: 44 },
  allDoneText: { fontSize: Fonts.md, fontWeight: Fonts.weight.heavy, color: Colors.ink700, textAlign: 'center' },

  mastery: {
    textAlign: 'center', fontSize: Fonts.md, fontWeight: Fonts.weight.black,
    color: Colors.ink300, letterSpacing: 3, marginTop: Spacing.sm,
  },
});
