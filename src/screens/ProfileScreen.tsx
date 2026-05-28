import React from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Big landscape "scene" banner behind the profile header.
const HERO_BANNER = require('../../assets/mascots/hero-happy.png');
import { Colors, Fonts, Radii, Spacing, Elevation, Gradients } from '../theme/tokens';
import PpCard from '../components/PpCard';
import MascotImage from '../components/MascotImage';
import AnimatedCounter from '../components/AnimatedCounter';
import { useUser } from '../gamification/UserProvider';
import { useAchievements } from '../gamification/UserProvider';
import { useEntrance } from '../feedback/motion';

export default function ProfileScreen() {
  const { profile } = useUser();
  const { defs, progress } = useAchievements();
  const heroEntrance = useEntrance(0);
  const statsEntrance = useEntrance(100);
  const badgesEntrance = useEntrance(220);

  const stats = [
    { label: 'Day streak', value: profile?.streakCount ?? 0, icon: '🔥', color: Colors.rust },
    { label: 'Total XP', value: profile?.totalXp ?? 0, icon: '⭐', color: Colors.butter },
    { label: 'Gems', value: profile?.gems ?? 0, icon: '💎', color: Colors.sky },
    { label: 'Longest streak', value: profile?.longestStreak ?? 0, icon: '🏆', color: Colors.brand },
  ];

  return (
    <View style={styles.bg}>
      {/* Hero scene banner — full-bleed, bleeds under the status bar */}
      <View style={styles.headerBg}>
        <Image source={HERO_BANNER} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(15,17,23,0.05)', 'rgba(15,17,23,0.45)']}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <Animated.View
            style={[
              styles.heroWrap,
              { opacity: heroEntrance.opacity, transform: [{ translateY: heroEntrance.translateY }] },
            ]}
          >
            <View style={styles.mascotRing}>
              <MascotImage mood="cool" size={120} />
            </View>
            <Text style={styles.name}>{profile?.displayName ?? 'Pianist'}</Text>
            <View style={styles.gradePill}>
              <Text style={styles.gradePillText}>Grade {profile?.grade ?? 1}</Text>
            </View>
          </Animated.View>

          {/* Stat grid */}
          <Animated.View
            style={[
              styles.statGrid,
              { opacity: statsEntrance.opacity, transform: [{ translateY: statsEntrance.translateY }] },
            ]}
          >
            {stats.map((s) => (
              <PpCard key={s.label} style={styles.statCard} elevation="sm">
                <Text style={styles.statIcon}>{s.icon}</Text>
                <AnimatedCounter value={s.value} style={[styles.statValue, { color: s.color }]} />
                <Text style={styles.statLabel}>{s.label}</Text>
              </PpCard>
            ))}
          </Animated.View>

          {/* Achievements */}
          <Animated.View
            style={{ opacity: badgesEntrance.opacity, transform: [{ translateY: badgesEntrance.translateY }] }}
          >
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.badgeGrid}>
              {defs.map((def) => {
                const prog = progress[def.id];
                const level = prog?.level ?? 0;
                const maxLevel = def.thresholds.length;
                const unlocked = level > 0;
                return (
                  <View key={def.id} style={styles.badge}>
                    <View
                      style={[
                        styles.badgeIcon,
                        { backgroundColor: unlocked ? def.color : Colors.cream100 },
                        unlocked && Elevation.sm,
                      ]}
                    >
                      <Text style={[styles.badgeEmoji, !unlocked && { opacity: 0.35 }]}>{def.icon}</Text>
                    </View>
                    <Text style={styles.badgeTitle} numberOfLines={1}>{def.title}</Text>
                    {/* Level dots */}
                    <View style={styles.levelDots}>
                      {Array.from({ length: maxLevel }).map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.levelDot,
                            { backgroundColor: i < level ? def.color : Colors.inkLine },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          <View style={{ height: Spacing['2xl'] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.cream50 },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 210, overflow: 'hidden' },
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg, gap: Spacing.lg },

  heroWrap: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 96,            // push the avatar down so it overlaps the banner's lower edge
    paddingBottom: Spacing.md,
  },
  mascotRing: {
    width: 132, height: 132, borderRadius: 66,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    ...Elevation.lg,
    borderWidth: 5, borderColor: '#FFFFFF',
  },
  name: { fontSize: Fonts['2xl'], fontWeight: Fonts.weight.black, color: Colors.ink900, marginTop: Spacing.sm },
  gradePill: {
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    backgroundColor: Colors.brand,
    borderRadius: 999,
    ...Elevation.sm,
  },
  gradePillText: { color: '#FFFFFF', fontSize: Fonts.sm, fontWeight: Fonts.weight.bold },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statCard: { width: '47%', alignItems: 'center', gap: 2 },
  statIcon: { fontSize: Fonts['2xl'] },
  statValue: { fontSize: Fonts.xl, fontWeight: Fonts.weight.black },
  statLabel: { fontSize: Fonts.sm, color: Colors.ink500, fontWeight: Fonts.weight.heavy },

  sectionTitle: {
    fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink500,
    textTransform: 'uppercase', letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'space-between' },
  badge: { width: '22%', alignItems: 'center', gap: 4 },
  badgeIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  badgeEmoji: { fontSize: 30 },
  badgeTitle: { fontSize: Fonts.xs, fontWeight: Fonts.weight.bold, color: Colors.ink700, textAlign: 'center' },
  levelDots: { flexDirection: 'row', gap: 3, marginTop: 2 },
  levelDot: { width: 6, height: 6, borderRadius: 3 },
});
