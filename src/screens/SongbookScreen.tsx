import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing, Elevation, Gradients } from '../theme/tokens';
import TopStatsBar from '../components/TopStatsBar';
import PpCard from '../components/PpCard';
import ChunkyButton from '../components/ChunkyButton';
import { useEntrance } from '../feedback/motion';
import * as haptics from '../feedback/haptics';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TRENDING = [
  { title: 'River Flows in You', artist: 'Yiruma', level: 3, chords: ['Am', 'F', 'C', 'G'], hue: 0 },
  { title: 'Let It Be', artist: 'The Beatles', level: 2, chords: ['C', 'G', 'Am', 'F'], hue: 1 },
  { title: 'Canon in D', artist: 'Pachelbel', level: 4, chords: ['D', 'A', 'Bm', 'G'], hue: 2 },
  { title: 'Clair de Lune', artist: 'Debussy', level: 5, chords: ['Db', 'Ab', 'Bbm', 'Gb'], hue: 3 },
];

const COVER_GRADIENTS: readonly [string, string][] = [
  [Gradients.brand[0], Gradients.brand[1]],
  [Gradients.sky[0], Gradients.sky[1]],
  [Gradients.butter[0], Gradients.butter[1]],
  [Gradients.violet[0], Gradients.violet[1]],
];

function LevelDots({ level }: { level: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={[styles.dot, i < level && styles.dotOn]} />
      ))}
    </View>
  );
}

export default function SongbookScreen() {
  const nav = useNavigation<Nav>();
  const importEntrance = useEntrance(0);
  const listEntrance = useEntrance(150);

  return (
    <View style={styles.bg}>
      <LinearGradient colors={[Gradients.paper[0], Gradients.paper[1]]} style={styles.headerBg} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TopStatsBar title="Songbook" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={{ opacity: importEntrance.opacity, transform: [{ translateY: importEntrance.translateY }] }}
          >
            <PpCard variant="warm" style={styles.importCard} elevation="md">
              <Text style={styles.importEmoji}>📄</Text>
              <Text style={styles.importTitle}>Import sheet music</Text>
              <Text style={styles.importBody}>
                Snap a photo or pick a PDF — we turn it into a playable, chord-annotated preview.
              </Text>
              <ChunkyButton label="Import a score" variant="sky" fullWidth haptic="bump" onPress={() => nav.navigate('OmrImport')} />
            </PpCard>
          </Animated.View>

          <Animated.View
            style={{ opacity: listEntrance.opacity, transform: [{ translateY: listEntrance.translateY }] }}
          >
            <Text style={styles.sectionTitle}>Trending</Text>
            {TRENDING.map((s) => (
              <Pressable
                key={s.title}
                onPress={() => haptics.tap()}
                style={({ pressed }) => [styles.songRow, pressed && { transform: [{ scale: 0.98 }] }]}
              >
                <LinearGradient
                  colors={COVER_GRADIENTS[s.hue]}
                  style={styles.cover}
                >
                  <Text style={styles.coverText}>♪</Text>
                </LinearGradient>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.songTitle} numberOfLines={1}>{s.title}</Text>
                  <Text style={styles.songMeta} numberOfLines={1}>{s.artist} · {s.chords.join(' · ')}</Text>
                  <LevelDots level={s.level} />
                </View>
              </Pressable>
            ))}
          </Animated.View>

          <View style={{ height: Spacing['2xl'] }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.cream50 },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg, gap: Spacing.lg },

  importCard: { gap: Spacing.sm, alignItems: 'center' },
  importEmoji: { fontSize: 44 },
  importTitle: { fontSize: Fonts.xl, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  importBody: { fontSize: Fonts.base, color: Colors.ink700, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },

  sectionTitle: {
    fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink500,
    textTransform: 'uppercase', letterSpacing: 1.5,
    marginTop: Spacing.sm, marginBottom: Spacing.sm,
  },

  songRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: '#FFFFFF', borderRadius: Radii.lg, padding: Spacing.md,
    marginBottom: Spacing.sm, ...Elevation.sm,
  },
  cover: {
    width: 56, height: 56, borderRadius: Radii.md,
    alignItems: 'center', justifyContent: 'center',
    ...Elevation.sm,
  },
  coverText: { fontSize: Fonts['2xl'], color: '#FFFFFF', fontWeight: '900' },
  songTitle: { fontSize: Fonts.md, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  songMeta: { fontSize: Fonts.sm, color: Colors.ink500 },
  dots: { flexDirection: 'row', gap: 4, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.inkLine },
  dotOn: { backgroundColor: Colors.brand },
});
