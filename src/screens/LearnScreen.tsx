import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing, Elevation, Gradients } from '../theme/tokens';
import TopStatsBar from '../components/TopStatsBar';
import PpCard from '../components/PpCard';
import ChunkyButton from '../components/ChunkyButton';
import DailyGoalRing from '../components/DailyGoalRing';
import MascotImage from '../components/MascotImage';
import { listGrades } from '../lessons/loader';
import { useUser } from '../gamification/UserProvider';
import { useEntrance } from '../feedback/motion';
import { Animated } from 'react-native';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LearnScreen() {
  const nav = useNavigation<Nav>();
  const { profile, lessonProgress, todayActivity } = useUser();
  const grades = useMemo(() => listGrades(), []);
  const heroEntrance = useEntrance(0);
  const listEntrance = useEntrance(150);

  const current = useMemo(() => {
    for (const g of grades) {
      for (const l of g.lessons) {
        if (lessonProgress[l.id]?.status !== 'completed') {
          return { grade: g, lesson: l };
        }
      }
    }
    const g = grades[0];
    return g?.lessons[0] ? { grade: g, lesson: g.lessons[0] } : null;
  }, [grades, lessonProgress]);

  const goal = profile?.settings.dailyGoalXp ?? 50;
  const earnedToday = todayActivity?.xpEarned ?? 0;

  return (
    <View style={styles.bg}>
      {/* Warm paper gradient header backdrop */}
      <LinearGradient
        colors={[Gradients.paper[0], Gradients.paper[1]]}
        style={styles.headerBg}
      />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TopStatsBar title="Learn" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero — daily ring + greeting */}
          <Animated.View
            style={[
              styles.hero,
              { opacity: heroEntrance.opacity, transform: [{ translateY: heroEntrance.translateY }] },
            ]}
          >
            <DailyGoalRing earnedToday={earnedToday} goal={goal} size={140} />
            <View style={styles.heroText}>
              <Text style={styles.heroKicker}>Good to see you</Text>
              <Text style={styles.heroTitle}>
                {earnedToday >= goal ? 'Goal hit. Keep going?' : 'Ready to play?'}
              </Text>
              <Text style={styles.heroSub}>
                {earnedToday >= goal
                  ? 'Bonus XP from here, plus a longer streak.'
                  : `${Math.max(0, goal - earnedToday)} XP to keep the streak.`}
              </Text>
            </View>
          </Animated.View>

          {/* Up next */}
          {current && (
            <Animated.View
              style={{ opacity: heroEntrance.opacity, transform: [{ translateY: heroEntrance.translateY }] }}
            >
              <PpCard variant="warm" style={styles.upNext} elevation="lg">
                <View style={styles.upNextHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>Up next · Grade {current.grade.id}</Text>
                    <Text style={styles.lessonTitle}>{current.lesson.title}</Text>
                    {current.lesson.subtitle && (
                      <Text style={styles.lessonSub}>{current.lesson.subtitle}</Text>
                    )}
                  </View>
                  <MascotImage mood="happy" size={88} static />
                </View>
                <ChunkyButton
                  label="Start lesson"
                  fullWidth
                  haptic="bump"
                  onPress={() =>
                    nav.navigate('Lesson', { gradeId: current.grade.id, lessonId: current.lesson.id })
                  }
                />
              </PpCard>
            </Animated.View>
          )}

          {/* Journey */}
          <Animated.View
            style={{ opacity: listEntrance.opacity, transform: [{ translateY: listEntrance.translateY }] }}
          >
            <Text style={styles.sectionTitle}>Your journey</Text>
            {grades.map((g) => {
              const total = g.lessons.length;
              const done = g.lessons.filter((l) => lessonProgress[l.id]?.status === 'completed').length;
              const locked = total === 0;
              const complete = !locked && done === total;
              const pct = total === 0 ? 0 : done / total;
              return (
                <Pressable
                  key={g.id}
                  disabled={locked}
                  onPress={() => {
                    const next = g.lessons.find((l) => lessonProgress[l.id]?.status !== 'completed') ?? g.lessons[0];
                    if (next) nav.navigate('Lesson', { gradeId: g.id, lessonId: next.id });
                  }}
                  style={({ pressed }) => [
                    styles.gradeRow,
                    pressed && { transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <LinearGradient
                    colors={
                      complete ? [Gradients.brand[0], Gradients.brand[1]] :
                      locked ? ['#F0E5C8', '#E1D2A8'] :
                      [Gradients.sky[0], Gradients.sky[1]]
                    }
                    style={styles.gradeNum}
                  >
                    <Text style={[styles.gradeNumText, locked && { color: Colors.ink500 }]}>{g.id}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.gradeTitle}>{g.title}</Text>
                    <Text style={styles.gradeMeta}>
                      {locked ? 'Coming soon' : complete ? 'Complete' : `${done}/${total} lessons`}
                    </Text>
                    {!locked && (
                      <View style={styles.miniBar}>
                        <View style={[styles.miniFill, { width: `${pct * 100}%` }]} />
                      </View>
                    )}
                  </View>
                  {complete && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            })}
          </Animated.View>

          <View style={{ height: Spacing['2xl'] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.cream50 },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 380 },
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg, gap: Spacing.lg },

  hero: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  heroText: { flex: 1, gap: 2 },
  heroKicker: {
    color: Colors.brand,
    fontSize: Fonts.sm,
    fontWeight: Fonts.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  heroTitle: { color: Colors.ink900, fontSize: Fonts.xl, fontWeight: Fonts.weight.black, marginTop: 2 },
  heroSub: { color: Colors.ink500, fontSize: Fonts.base, marginTop: 4, lineHeight: 20 },

  upNext: { gap: Spacing.md },
  upNextHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  kicker: {
    fontSize: Fonts.sm,
    fontWeight: Fonts.weight.bold,
    color: Colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lessonTitle: { fontSize: Fonts.xl, fontWeight: Fonts.weight.black, color: Colors.ink900, marginTop: 2 },
  lessonSub: { fontSize: Fonts.base, color: Colors.ink500, marginTop: 4, lineHeight: 20 },

  sectionTitle: {
    fontSize: Fonts.sm,
    fontWeight: Fonts.weight.bold,
    color: Colors.ink500,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },

  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Elevation.sm,
  },
  gradeNum: {
    width: 48, height: 48, borderRadius: Radii.md,
    alignItems: 'center', justifyContent: 'center',
    ...Elevation.sm,
  },
  gradeNumText: { color: '#FFFFFF', fontWeight: Fonts.weight.black, fontSize: Fonts.lg },
  gradeTitle: { fontSize: Fonts.md, fontWeight: Fonts.weight.bold, color: Colors.ink900 },
  gradeMeta: { fontSize: Fonts.sm, color: Colors.ink500 },
  miniBar: { height: 4, backgroundColor: Colors.inkLine, borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  miniFill: { height: 4, backgroundColor: Colors.brand, borderRadius: 2 },
  check: { color: Colors.brand, fontSize: Fonts.xl, fontWeight: Fonts.weight.black },
});
