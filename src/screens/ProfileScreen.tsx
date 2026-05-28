import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';
import PpCard from '../components/PpCard';
import MascotImage from '../components/MascotImage';
import { useUser } from '../gamification/UserProvider';
import { useAchievements } from '../gamification/UserProvider';
import { levelFor } from '../gamification/achievements';

export default function ProfileScreen() {
  const { profile } = useUser();
  const { defs, progress } = useAchievements();

  const stats = [
    { label: 'Day streak', value: profile?.streakCount ?? 0, icon: '🔥' },
    { label: 'Total XP', value: profile?.totalXp ?? 0, icon: '⭐' },
    { label: 'Gems', value: profile?.gems ?? 0, icon: '💎' },
    { label: 'Longest streak', value: profile?.longestStreak ?? 0, icon: '🏆' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <MascotImage mood="cool" size={110} />
          <Text style={styles.name}>{profile?.displayName ?? 'Pianist'}</Text>
          <Text style={styles.grade}>Grade {profile?.grade ?? 1}</Text>
        </View>

        <View style={styles.statGrid}>
          {stats.map((s) => (
            <PpCard key={s.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </PpCard>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.badgeGrid}>
          {defs.map((def) => {
            const prog = progress[def.id];
            const value = prog?.level ?? 0;
            const { progress: pct } = levelFor(def, valueForMetric(def.id, prog?.level ?? 0));
            const unlocked = value > 0;
            return (
              <View key={def.id} style={styles.badge}>
                <View style={[styles.badgeIcon, { backgroundColor: unlocked ? def.color : Colors.cream100 }]}>
                  <Text style={[styles.badgeEmoji, !unlocked && { opacity: 0.4 }]}>{def.icon}</Text>
                </View>
                <Text style={styles.badgeTitle}>{def.title}</Text>
                <Text style={styles.badgeLevel}>{unlocked ? `Lv ${value}` : 'Locked'}</Text>
              </View>
            );
          })}
        </View>
        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Levels are stored directly; the bar pct is illustrative here.
function valueForMetric(_id: string, level: number): number {
  return level;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream50 },
  scroll: { padding: Spacing.lg, gap: Spacing.lg },
  hero: { alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.md },
  name: { fontSize: Fonts['2xl'], fontWeight: Fonts.weight.black, color: Colors.ink900 },
  grade: { fontSize: Fonts.md, color: Colors.ink500, fontWeight: Fonts.weight.bold },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statCard: { width: '47%', alignItems: 'center', gap: 2 },
  statIcon: { fontSize: Fonts['2xl'] },
  statValue: { fontSize: Fonts.xl, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  statLabel: { fontSize: Fonts.sm, color: Colors.ink500, fontWeight: Fonts.weight.heavy },
  sectionTitle: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 1.5 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'space-between' },
  badge: { width: '22%', alignItems: 'center', gap: 4 },
  badgeIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  badgeEmoji: { fontSize: 28 },
  badgeTitle: { fontSize: Fonts.xs, fontWeight: Fonts.weight.bold, color: Colors.ink700, textAlign: 'center' },
  badgeLevel: { fontSize: Fonts.xs, color: Colors.ink300, fontWeight: Fonts.weight.heavy },
});
