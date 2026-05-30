import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing } from '../theme/tokens';
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
  const [litColor, setLitColor] = useState<string>(Colors.brand);

  useEffect(() => { void preloadCore(); }, []);

  const isLandscape = width > height;
  const pianoW = Math.min(width - Spacing.lg * 2, 1100);
  // Keep the keyboard compact so the chord library has room above it.
  const pianoH = Math.min(isLandscape ? 168 : 150, height * 0.34);

  const showChord = (chord: BuiltChord, color: string) => {
    setLitColor(color);
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

        {/* Chord library (penguin-guided root → quality tree) */}
        <View style={styles.libraryWrap}>
          <ChordLibrary onPlayChord={showChord} accent={litColor} />
        </View>

        {/* Full keyboard — the selected chord lights up; tap any key to play */}
        <View style={styles.pianoWrap}>
          <PianoKeyboard
            litNotes={lit}
            litColor={litColor}
            pressColor={Colors.brand}
            playSound
            octaveLabels
            showLeds
            startMidi={36}     // C2
            whiteKeys={35}     // C2..B6 (matches legacy)
            width={pianoW}
            height={pianoH}
          />
          <Text style={styles.hint}>Lit keys show the chord — tap them to play it yourself.</Text>
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
  libraryWrap: { flex: 1, minHeight: 0 },
  pianoWrap: { alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.xs, paddingBottom: Spacing.xs },
  hint: { fontSize: Fonts.sm, color: Colors.ink500, fontWeight: Fonts.weight.heavy },
});
