// Quick chord library for the Practice tab. Maestro Penguini guides the learner
// through the "music tree": pick a root letter, then a quality (Cmaj? Cm7?
// C13?), and the chord lights up on the keyboard while the penguin explains how
// it's played. Every common chord lives in src/music/chords.ts.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Colors, Fonts, Radii, Spacing, Elevation, LedColors } from '../theme/tokens';
import MascotImage from './MascotImage';
import { haptics } from '../../../../core/contract';
import {
  Accidental, Root, BuiltChord, ChordQuality,
  ROOT_LETTERS, CHORD_TREE, makeRoot, buildChord,
} from '../../../../core/contract';

interface Props {
  /** Fires when a chord is chosen/replayed — parent lights + sounds it. */
  onPlayChord: (chord: BuiltChord, color: string) => void;
  /** Accent color for the highlighted chord (kept in sync with the keyboard). */
  accent?: string;
}

type Phase = 'root' | 'quality';

const ACCIDENTALS: { id: Accidental; label: string }[] = [
  { id: 'flat', label: '♭' },
  { id: 'natural', label: '♮' },
  { id: 'sharp', label: '♯' },
];

export default function ChordLibrary({ onPlayChord, accent = LedColors[3] }: Props) {
  const [phase, setPhase] = useState<Phase>('root');
  const [letter, setLetter] = useState<string>('C');
  const [accidental, setAccidental] = useState<Accidental>('natural');
  const [quality, setQuality] = useState<ChordQuality | null>(null);

  const root: Root = useMemo(() => makeRoot(letter, accidental), [letter, accidental]);
  const chord: BuiltChord | null = useMemo(
    () => (quality ? buildChord(root, quality) : null),
    [root, quality],
  );

  const pickRoot = (l: string) => {
    haptics.tap();
    setLetter(l);
    setQuality(null);
    setPhase('quality');
  };

  const pickAccidental = (a: Accidental) => {
    haptics.tap();
    setAccidental(a);
    setQuality(null);
  };

  const pickQuality = (qual: ChordQuality) => {
    haptics.press();
    setQuality(qual);
    onPlayChord(buildChord(root, qual), accent);
  };

  const back = () => {
    haptics.tap();
    setPhase('root');
    setQuality(null);
  };

  // Penguin commentary + mood follows the flow.
  const { caption, mood } = useMemo(() => {
    if (phase === 'root') {
      return { caption: 'Pick a root note to start building a chord!', mood: 'happy' as const };
    }
    if (chord) {
      return {
        caption: `${chord.name} = ${chord.noteNames.join(' · ')}. ${quality?.blurb ?? ''}`,
        mood: 'wow' as const,
      };
    }
    return { caption: `Great — ${root.label}. Now choose the chord type.`, mood: 'thinking' as const };
  }, [phase, chord, quality, root.label]);

  return (
    <View style={styles.wrap}>
      {/* Penguin teacher row */}
      <View style={styles.teacherRow}>
        <MascotImage mood={mood} size={56} static />
        <View style={styles.bubble}>
          <Text style={styles.bubbleName}>MAESTRO PENGUINI</Text>
          <Text style={styles.bubbleText} numberOfLines={2}>{caption}</Text>
        </View>
      </View>

      {phase === 'root' ? (
        // ── Step 1: root letter ────────────────────────────────────────────
        <View style={styles.rootGrid}>
          {ROOT_LETTERS.map((l) => (
            <Pressable
              key={l}
              onPress={() => pickRoot(l)}
              style={({ pressed }) => [
                styles.rootChip,
                pressed && styles.rootChipPressed,
              ]}
            >
              <Text style={styles.rootChipText}>{l}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        // ── Step 2: accidental + quality tree ──────────────────────────────
        <View style={styles.qualityArea}>
          <View style={styles.qualityHeader}>
            <Pressable onPress={back} hitSlop={10} style={styles.backBtn}>
              <Text style={styles.backText}>‹ Roots</Text>
            </Pressable>
            <View style={styles.accRow}>
              {ACCIDENTALS.map((a) => {
                const active = accidental === a.id;
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => pickAccidental(a.id)}
                    style={[styles.accChip, active && styles.accChipActive]}
                  >
                    <Text style={[styles.accText, active && styles.accTextActive]}>
                      {letter}{a.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ScrollView
            style={styles.qualityScroll}
            contentContainerStyle={styles.qualityScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {CHORD_TREE.map((cat) => (
              <View key={cat.id} style={styles.category}>
                <Text style={styles.categoryTitle}>{cat.title}</Text>
                <View style={styles.qualityGrid}>
                  {cat.qualities.map((qual) => {
                    const active = quality?.id === qual.id;
                    return (
                      <Pressable
                        key={qual.id}
                        onPress={() => pickQuality(qual)}
                        style={[
                          styles.qualityChip,
                          active && { borderColor: accent, backgroundColor: accent + '22' },
                        ]}
                      >
                        <Text style={[styles.qualityName, active && { color: accent }]}>
                          {root.label}{qual.suffix}
                        </Text>
                        <Text style={styles.qualitySub} numberOfLines={1}>{qual.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          {chord && (
            <Pressable
              onPress={() => { haptics.bump(); onPlayChord(chord, accent); }}
              style={({ pressed }) => [
                styles.playBar,
                { backgroundColor: accent },
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.playBarText}>▶  Play {chord.name}   ·   {chord.noteNames.join('  ')}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: Spacing.sm },

  // Teacher row
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  bubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: Colors.inkLine,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    minHeight: 54, justifyContent: 'center',
    ...Elevation.sm,
  },
  bubbleName: { fontSize: Fonts.xs, fontWeight: Fonts.weight.black, color: Colors.rust, letterSpacing: 1.2, marginBottom: 2 },
  bubbleText: { fontSize: Fonts.base, color: Colors.ink900, fontWeight: Fonts.weight.heavy, lineHeight: 18 },

  // Step 1: roots
  rootGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
  rootChip: {
    width: 52, height: 56, borderRadius: Radii.md,
    backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: Colors.inkLine,
    alignItems: 'center', justifyContent: 'center',
    ...Elevation.sm,
  },
  rootChipPressed: { transform: [{ scale: 0.94 }], borderColor: Colors.brand, backgroundColor: '#EAF7DD' },
  rootChipText: { fontSize: Fonts.xl, fontWeight: Fonts.weight.black, color: Colors.ink900 },

  // Step 2: quality tree
  qualityArea: { flex: 1, gap: Spacing.sm },
  qualityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radii.pill, borderWidth: 2, borderColor: Colors.inkLine, backgroundColor: '#FFFFFF',
  },
  backText: { fontSize: Fonts.base, fontWeight: Fonts.weight.black, color: Colors.ink700 },
  accRow: { flexDirection: 'row', gap: 6 },
  accChip: {
    minWidth: 44, paddingHorizontal: 10, height: 34, borderRadius: Radii.sm,
    borderWidth: 2, borderColor: Colors.inkLine, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  accChipActive: { borderColor: Colors.brand, backgroundColor: '#EAF7DD' },
  accText: { fontSize: Fonts.md, fontWeight: Fonts.weight.black, color: Colors.ink500 },
  accTextActive: { color: Colors.brandDark },

  qualityScroll: { flex: 1 },
  qualityScrollContent: { paddingBottom: Spacing.sm, gap: Spacing.sm },
  category: { gap: 6 },
  categoryTitle: {
    fontSize: Fonts.xs, fontWeight: Fonts.weight.black, color: Colors.butterDark,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  qualityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  qualityChip: {
    minWidth: 92, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radii.md, borderWidth: 2, borderColor: Colors.inkLine, backgroundColor: '#FFFFFF',
    ...Elevation.sm,
  },
  qualityName: { fontSize: Fonts.md, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  qualitySub: { fontSize: Fonts.xs, fontWeight: Fonts.weight.heavy, color: Colors.ink500, marginTop: 1 },

  // Play bar
  playBar: {
    height: 52, borderRadius: Radii.lg,
    alignItems: 'center', justifyContent: 'center',
    ...Elevation.md,
  },
  playBarText: { fontSize: Fonts.md, fontWeight: Fonts.weight.black, color: '#FFFFFF', letterSpacing: 0.3 },
});
