import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';
import TopStatsBar from '../components/TopStatsBar';
import PpCard from '../components/PpCard';
import ChunkyButton from '../components/ChunkyButton';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DEMO_SONGS = [
  { title: 'River Flows in You', artist: 'Yiruma', level: 3, chords: ['Am', 'F', 'C', 'G'] },
  { title: 'Let It Be', artist: 'The Beatles', level: 2, chords: ['C', 'G', 'Am', 'F'] },
  { title: 'Canon in D', artist: 'Pachelbel', level: 4, chords: ['D', 'A', 'Bm', 'G'] },
];

export default function SongbookScreen() {
  const nav = useNavigation<Nav>();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopStatsBar title="Songbook" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <PpCard style={styles.importCard}>
          <Text style={styles.importTitle}>📄 Import sheet music</Text>
          <Text style={styles.importBody}>
            Snap a photo or pick a PDF — we turn it into a playable, chord-annotated preview.
          </Text>
          <ChunkyButton label="Import" variant="sky" fullWidth onPress={() => nav.navigate('OmrImport')} />
        </PpCard>

        <Text style={styles.sectionTitle}>Trending</Text>
        {DEMO_SONGS.map((s) => (
          <View key={s.title} style={styles.songRow}>
            <View style={styles.cover}><Text style={styles.coverText}>♪</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.songTitle}>{s.title}</Text>
              <Text style={styles.songMeta}>{s.artist} · {s.chords.join(' · ')}</Text>
            </View>
            <View style={styles.levelPill}><Text style={styles.levelText}>Lv {s.level}</Text></View>
          </View>
        ))}
        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream50 },
  scroll: { padding: Spacing.lg, gap: Spacing.lg },
  importCard: { gap: Spacing.md },
  importTitle: { fontSize: Fonts.lg, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  importBody: { fontSize: Fonts.base, color: Colors.ink500, lineHeight: 20 },
  sectionTitle: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 1.5 },
  songRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: '#FFFFFF', borderRadius: Radii.lg, padding: Spacing.md,
    borderWidth: 2, borderColor: Colors.inkLine,
  },
  cover: { width: 48, height: 48, borderRadius: Radii.md, backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center' },
  coverText: { fontSize: Fonts.xl, color: '#FFFFFF' },
  songTitle: { fontSize: Fonts.md, fontWeight: Fonts.weight.bold, color: Colors.ink900 },
  songMeta: { fontSize: Fonts.sm, color: Colors.ink500 },
  levelPill: { backgroundColor: Colors.cream100, borderRadius: Radii.pill, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  levelText: { fontSize: Fonts.xs, fontWeight: Fonts.weight.bold, color: Colors.ink700 },
});
