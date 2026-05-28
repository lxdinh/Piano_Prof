import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';
import TopStatsBar from '../components/TopStatsBar';
import PpCard from '../components/PpCard';
import ChunkyButton from '../components/ChunkyButton';
import DailyGoalBar from '../components/DailyGoalBar';
import MascotImage from '../components/MascotImage';
import { listGrades } from '../lessons/loader';
import { useUser } from '../gamification/UserProvider';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LearnScreen() {
  const nav = useNavigation<Nav>();
  const { profile, lessonProgress, todayActivity } = useUser();
  const grades = useMemo(() => listGrades(), []);

  // pick the first not-completed lesson as "current"
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopStatsBar title="Learn" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <PpCard style={styles.goalCard}>
          <DailyGoalBar earnedToday={todayActivity?.xpEarned ?? 0} goal={goal} />
        </PpCard>

        {current && (
          <PpCard style={styles.currentCard}>
            <View style={styles.currentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>Up next · Grade {current.grade.id}</Text>
                <Text style={styles.lessonTitle}>{current.lesson.title}</Text>
                {current.lesson.subtitle && (
                  <Text style={styles.lessonSub}>{current.lesson.subtitle}</Text>
                )}
              </View>
              <MascotImage mood="happy" size={84} />
            </View>
            <ChunkyButton
              label="Start lesson"
              fullWidth
              onPress={() => nav.navigate('Lesson', { gradeId: current.grade.id, lessonId: current.lesson.id })}
            />
          </PpCard>
        )}

        <Text style={styles.sectionTitle}>Your journey</Text>
        {grades.map((g) => {
          const total = g.lessons.length;
          const done = g.lessons.filter((l) => lessonProgress[l.id]?.status === 'completed').length;
          const locked = total === 0;
          return (
            <Pressable
              key={g.id}
              disabled={locked}
              onPress={() => {
                const next = g.lessons.find((l) => lessonProgress[l.id]?.status !== 'completed') ?? g.lessons[0];
                if (next) nav.navigate('Lesson', { gradeId: g.id, lessonId: next.id });
              }}
              style={({ pressed }) => [styles.gradeRow, pressed && { opacity: 0.7 }]}
            >
              <View style={[styles.gradeNum, locked && { backgroundColor: Colors.cream100 }]}>
                <Text style={styles.gradeNumText}>{g.id}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gradeTitle}>{g.title}</Text>
                <Text style={styles.gradeMeta}>
                  {locked ? 'Coming soon' : `${done}/${total} lessons`}
                </Text>
              </View>
              {!locked && done === total && <Text style={styles.check}>✓</Text>}
            </Pressable>
          );
        })}
        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream50 },
  scroll: { padding: Spacing.lg, gap: Spacing.lg },
  goalCard: {},
  currentCard: { gap: Spacing.lg },
  currentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  kicker: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.brand, textTransform: 'uppercase', letterSpacing: 1 },
  lessonTitle: { fontSize: Fonts.xl, fontWeight: Fonts.weight.black, color: Colors.ink900, marginTop: 2 },
  lessonSub: { fontSize: Fonts.base, color: Colors.ink500, marginTop: 2 },
  sectionTitle: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: Spacing.sm },
  gradeRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: '#FFFFFF', borderRadius: Radii.lg, padding: Spacing.md,
    borderWidth: 2, borderColor: Colors.inkLine,
  },
  gradeNum: { width: 40, height: 40, borderRadius: Radii.md, backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center' },
  gradeNumText: { color: '#FFFFFF', fontWeight: Fonts.weight.black, fontSize: Fonts.md },
  gradeTitle: { fontSize: Fonts.md, fontWeight: Fonts.weight.bold, color: Colors.ink900 },
  gradeMeta: { fontSize: Fonts.sm, color: Colors.ink500 },
  check: { color: Colors.brand, fontSize: Fonts.xl, fontWeight: Fonts.weight.black },
});
