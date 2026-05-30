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
import { useUser } from '../gamification/UserProvider';
import { useEntrance } from '../feedback/motion';
import {
  resolvePathway, ResolvedLevel, ResolvedItem, KIND_ICON, PATH_ITEMS,
} from '../lessons/pathway';
import * as haptics from '../feedback/haptics';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const AVATAR = require('../../assets/mascots/classical.png');

// ── Top header: avatar + pathway title + stat pills + XP bar ─────
function PathwayHeader() {
  const nav = useNavigation<Nav>();
  const { profile, todayActivity } = useUser();
  const goal = profile?.settings.dailyGoalXp ?? 50;
  const earned = todayActivity?.xpEarned ?? 0;
  const pct = Math.max(0, Math.min(1, earned / goal));

  // Smoothly tween the XP bar width when XP changes (e.g. on return from a
  // lesson) instead of snapping — Duolingo-style.
  const fillAnim = useRef(new Animated.Value(pct)).current;
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: pct, duration: 600, useNativeDriver: false,
    }).start();
  }, [pct, fillAnim]);
  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });

  const stats = [
    { icon: '🔥', value: profile?.streakCount ?? 0, color: Colors.rust },
    { icon: '⚡', value: profile?.totalXp ?? 0,     color: Colors.butter },
    { icon: '💎', value: profile?.gems ?? 0,        color: Colors.sky },
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

// ── Level intro card (orange number badge + objective + duration) ─
function LevelCard({ level }: { level: ResolvedLevel }) {
  return (
    <View style={styles.levelCard}>
      <View style={styles.levelHead}>
        <View style={styles.levelNum}>
          <Text style={styles.levelNumText}>{level.index}</Text>
        </View>
        <Text style={styles.levelName}>{level.name}</Text>
      </View>
      <Text style={styles.levelObjective}>{level.objective}</Text>
      <View style={styles.durationChip}>
        <Text style={styles.durationText}>⏱  {level.duration}</Text>
      </View>
    </View>
  );
}

// ── A single path item (grade / song / exercise / concept) ───────
function ItemCard({ item, onStart }: { item: ResolvedItem; onStart: (it: ResolvedItem) => void }) {
  if (item.state === 'active') {
    return (
      <View style={styles.activeCard}>
        <View style={styles.activeIcon}>
          <Text style={styles.activeIconText}>{KIND_ICON[item.kind]}</Text>
        </View>
        <Text style={styles.activeTitle} numberOfLines={2}>{item.title}</Text>
        <ChunkyButton label="START" haptic="bump" onPress={() => onStart(item)} />
      </View>
    );
  }

  const done = item.state === 'done';
  const soon = item.state === 'soon';
  return (
    <Pressable
      disabled={!done}
      onPress={() => done && onStart(item)}
      style={({ pressed }) => [styles.lockedCard, pressed && done && { transform: [{ scale: 0.99 }] }]}
    >
      <View style={[styles.lockedIcon, done && styles.doneIcon]}>
        <Text style={styles.lockedIconText}>{done ? '✓' : soon ? '🕗' : '🔒'}</Text>
      </View>
      <Text style={[styles.lockedTitle, done && styles.doneTitle]} numberOfLines={2}>
        {item.title}
      </Text>
      {soon && (
        <View style={styles.soonChip}><Text style={styles.soonText}>SOON</Text></View>
      )}
    </Pressable>
  );
}

export default function LearnScreen() {
  const nav = useNavigation<Nav>();
  const { lessonProgress } = useUser();
  const entrance = useEntrance(0);

  // An item is "done" when the lesson it links to is completed.
  const { levels } = useMemo(() => {
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
          {levels.map((level) => (
            <View key={level.id} style={styles.levelBlock}>
              <LevelCard level={level} />
              {level.items.map((item) => (
                <ItemCard key={item.id} item={item} onStart={onStart} />
              ))}
            </View>
          ))}
          <Text style={styles.mastery}>~ MASTERY ~</Text>
          <View style={{ height: Spacing['2xl'] }} />
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

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
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  levelBlock: { gap: Spacing.sm, marginBottom: Spacing.sm },

  // Level card
  levelCard: {
    backgroundColor: Colors.butterBg,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  levelHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  levelNum: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.rust, alignItems: 'center', justifyContent: 'center',
  },
  levelNumText: { color: '#FFFFFF', fontSize: Fonts.lg, fontWeight: Fonts.weight.black },
  levelName: { flex: 1, fontSize: Fonts.xl, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  levelObjective: { fontSize: Fonts.md, color: Colors.ink700, lineHeight: 22, fontWeight: Fonts.weight.heavy },
  durationChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: Radii.pill, paddingHorizontal: Spacing.md, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.inkLine,
  },
  durationText: { fontSize: Fonts.sm, color: Colors.ink700, fontWeight: Fonts.weight.bold },

  // Active item (START)
  activeCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: '#FFFFFF', borderRadius: Radii.lg, padding: Spacing.md,
    borderWidth: 3, borderColor: Colors.butter,
    ...Elevation.md,
  },
  activeIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.brand,
    alignItems: 'center', justifyContent: 'center', ...Elevation.sm,
  },
  activeIconText: { fontSize: 24 },
  activeTitle: { flex: 1, fontSize: Fonts.md, fontWeight: Fonts.weight.black, color: Colors.ink900 },

  // Locked / soon / done item
  lockedCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: Radii.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.inkLine,
  },
  lockedIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#E1D2A8',
    alignItems: 'center', justifyContent: 'center',
  },
  doneIcon: { backgroundColor: Colors.brand },
  lockedIconText: { fontSize: 18, color: '#FFFFFF', fontWeight: Fonts.weight.black },
  lockedTitle: { flex: 1, fontSize: Fonts.md, fontWeight: Fonts.weight.bold, color: Colors.ink500 },
  doneTitle: { color: Colors.ink900 },
  soonChip: {
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: Colors.inkLine,
  },
  soonText: { fontSize: Fonts.xs, fontWeight: Fonts.weight.black, color: Colors.ink500, letterSpacing: 1 },

  mastery: {
    textAlign: 'center', fontSize: Fonts.md, fontWeight: Fonts.weight.black,
    color: Colors.ink300, letterSpacing: 3, marginTop: Spacing.lg,
  },
});
