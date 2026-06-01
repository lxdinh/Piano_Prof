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
import Shelf from '../components/Shelf';
import PosterCard from '../components/PosterCard';
import { useEntrance } from '../feedback/motion';
import { LEVELS, PATH_ITEMS } from '../lessons/pathway';
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

const LEVEL_SHORT: Record<string, string> = Object.fromEntries(LEVELS.map((l) => [l.id, l.short]));

// Songs woven through the learning path — "songs you can play as you progress".
const PATH_SONGS = PATH_ITEMS.filter((it) => it.kind === 'song');

export default function SongbookScreen() {
  const nav = useNavigation<Nav>();
  const heroEntrance = useEntrance(0);
  const listEntrance = useEntrance(120);

  const featured = TRENDING[0];

  return (
    <View style={styles.bg}>
      <LinearGradient colors={[Gradients.paper[0], Gradients.paper[1]]} style={styles.headerBg} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TopStatsBar title="Songbook" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Featured hero */}
          <Animated.View
            style={[styles.heroWrap, { opacity: heroEntrance.opacity, transform: [{ translateY: heroEntrance.translateY }] }]}
          >
            <Pressable onPress={() => haptics.tap()}>
              <LinearGradient colors={COVER_GRADIENTS[featured.hue]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
                <Text style={styles.heroKicker}>FEATURED SONG</Text>
                <Text style={styles.heroTitle}>{featured.title}</Text>
                <Text style={styles.heroArtist}>{featured.artist} · {featured.chords.join(' · ')}</Text>
                <View style={styles.heroPlay}><Text style={styles.heroPlayText}>▶  Preview</Text></View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Animated.View
            style={{ opacity: listEntrance.opacity, transform: [{ translateY: listEntrance.translateY }], gap: Spacing.xl }}
          >
            {/* Trending shelf */}
            <Shelf title="Trending" subtitle="Popular with families right now">
              {TRENDING.map((s) => (
                <PosterCard
                  key={s.title}
                  title={s.title}
                  subtitle={s.artist}
                  icon="🎵"
                  cover={COVER_GRADIENTS[s.hue]}
                  onPress={() => haptics.tap()}
                />
              ))}
            </Shelf>

            {/* Songs from the learning path */}
            <Shelf title="Songs you'll learn" subtitle="Unlocked as you climb the path">
              {PATH_SONGS.map((s, i) => (
                <PosterCard
                  key={s.id}
                  title={s.title}
                  subtitle={LEVEL_SHORT[s.levelId]}
                  icon="🎹"
                  cover={COVER_GRADIENTS[i % COVER_GRADIENTS.length]}
                  state={s.soon ? 'soon' : 'active'}
                  onPress={() => haptics.tap()}
                />
              ))}
            </Shelf>
          </Animated.View>

          {/* Import sheet music */}
          <PpCard variant="warm" style={styles.importCard} elevation="md">
            <Text style={styles.importEmoji}>📄</Text>
            <Text style={styles.importTitle}>Import sheet music</Text>
            <Text style={styles.importBody}>
              Snap a photo or pick a PDF — we turn it into a playable, chord-annotated preview.
            </Text>
            <ChunkyButton label="Import a score" variant="sky" fullWidth haptic="bump" onPress={() => nav.navigate('OmrImport')} />
          </PpCard>

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
  scroll: { paddingVertical: Spacing.lg, gap: Spacing.xl },

  heroWrap: { paddingHorizontal: Spacing.lg },
  hero: { borderRadius: Radii.xl, padding: Spacing.xl, gap: 4, ...Elevation.md },
  heroKicker: { fontSize: Fonts.xs, fontWeight: Fonts.weight.black, color: 'rgba(255,255,255,0.85)', letterSpacing: 2 },
  heroTitle: { fontSize: Fonts['2xl'], fontWeight: Fonts.weight.black, color: '#FFFFFF' },
  heroArtist: { fontSize: Fonts.sm, color: 'rgba(255,255,255,0.9)', fontWeight: Fonts.weight.heavy },
  heroPlay: {
    alignSelf: 'flex-start', marginTop: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: Radii.pill,
    paddingHorizontal: Spacing.lg, paddingVertical: 8,
  },
  heroPlayText: { color: '#FFFFFF', fontSize: Fonts.md, fontWeight: Fonts.weight.black },

  importCard: { gap: Spacing.sm, alignItems: 'center', marginHorizontal: Spacing.lg },
  importEmoji: { fontSize: 44 },
  importTitle: { fontSize: Fonts.xl, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  importBody: { fontSize: Fonts.base, color: Colors.ink700, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
});
