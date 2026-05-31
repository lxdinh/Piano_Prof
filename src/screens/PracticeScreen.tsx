import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing } from '../theme/tokens';
import { HandColors, handColors } from '../theme/handColors';
import PianoKeyboard from '../components/PianoKeyboard';
import ChordLibrary from '../components/ChordLibrary';
import { useLandscapeWhileFocused } from '../feedback/useOrientation';
import { preloadCore, playChord } from '../audio/pianoEngine';
import type { BuiltChord } from '../music/chords';

export default function PracticeScreen() {
  useLandscapeWhileFocused();
  const { width, height } = useWindowDimensions();
  // The chord the learner picked from the library stays lit on the keyboard so
  // they can study how it's played; free-play taps still work alongside it.
  const [lit, setLit] = useState<number[]>([]);
  // Each chord tone is colored by the hand that plays it (left = cyan,
  // right = orange) — the same scheme used in lessons.
  const noteColors = useMemo(() => handColors(lit), [lit]);

  useEffect(() => { void preloadCore(); }, []);

  const isLandscape = width > height;
  const pianoW = Math.min(width - Spacing.lg * 2, 1100);
  // Keep the keyboard short so the chord chooser ALWAYS has room above it and is
  // never covered by the keys (the old layout let the chips slip behind them).
  const pianoH = Math.round(Math.min(isLandscape ? 120 : 150, height * 0.28));

  const showChord = (chord: BuiltChord) => {
    setLit(chord.midi);
    // Gentle roll so the learner hears each note land in the chord.
    void playChord(chord.midi, 26);
  };

  return (
    <View style={styles.bg}>
      <LinearGradient
        colors={['#FFFDF6', '#FFF3CC', '#FFE6BA']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.kicker}>CHORD LIBRARY</Text>
          <Text style={styles.title}>Practice</Text>
        </View>

        {/* Chord library (penguin-guided root → quality tree). Clipped + scrollable
            so the chooser can never spill behind the keyboard. */}
        <View style={styles.libraryWrap}>
          <ChordLibrary onPlayChord={showChord} accent={HandColors.right} />
        </View>

        {/* Full keyboard — the selected chord lights up by hand; tap any key to play */}
        <View style={styles.pianoWrap}>
          <PianoKeyboard
            litNotes={lit}
            noteColors={noteColors}
            colorByHand
            playSound
            octaveLabels
            showLeds
            startMidi={36}     // C2
            whiteKeys={35}     // C2..B6 (matches legacy)
            width={pianoW}
            height={pianoH}
          />
          <Text style={styles.hint} numberOfLines={1}>
            <Text style={styles.hintLeft}>Cyan = left</Text> ·{' '}
            <Text style={styles.hintRight}>orange = right</Text> · tap any lit key to play it.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.cream50 },
  safe: { flex: 1, paddingHorizontal: Spacing.lg },
  header: { paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  kicker: { fontSize: Fonts.xs, fontWeight: Fonts.weight.black, color: Colors.butterDark, letterSpacing: 2 },
  title: { fontSize: Fonts['2xl'], fontWeight: Fonts.weight.black, color: Colors.ink900 },
  // overflow:hidden guarantees the chord chooser stays inside its own band and
  // can never render behind the keyboard.
  libraryWrap: { flex: 1, minHeight: 0, overflow: 'hidden' },
  pianoWrap: { alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.xs, paddingBottom: Spacing.xs },
  hint: { fontSize: Fonts.sm, color: Colors.ink500, fontWeight: Fonts.weight.heavy, textAlign: 'center' },
  // Readable on cream while still clearly cyan/orange (the keys use the vivid hues).
  hintLeft: { color: '#0A9CB8', fontWeight: Fonts.weight.black },
  hintRight: { color: '#E07A00', fontWeight: Fonts.weight.black },
});
