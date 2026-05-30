import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radii, Spacing, Elevation, Gradients, LedColors } from '../theme/tokens';
import PianoKeyboard from '../components/PianoKeyboard';
import { useLandscapeWhileFocused } from '../feedback/useOrientation';
import { preloadCore, playChord } from '../audio/pianoEngine';
import { notesToMidi } from '../lessons/noteToMidi';
import * as haptics from '../feedback/haptics';

// Quick demo chords the user can fire to hear the engine's polyphony.
const DEMO_CHORDS: { label: string; notes: string[]; color: string }[] = [
  { label: 'C',  notes: ['C4', 'E4', 'G4'],  color: LedColors[3] },
  { label: 'G',  notes: ['G3', 'B3', 'D4'],  color: LedColors[4] },
  { label: 'Am', notes: ['A3', 'C4', 'E4'],  color: LedColors[5] },
  { label: 'F',  notes: ['F3', 'A3', 'C4'],  color: LedColors[1] },
];

export default function PracticeScreen() {
  useLandscapeWhileFocused();
  const { width, height } = useWindowDimensions();
  const [lit, setLit] = useState<number[]>([]);
  const [litColor, setLitColor] = useState<string>(Colors.brand);

  useEffect(() => { void preloadCore(); }, []);

  // In landscape, width is the long edge. Full C2..C6 = 29 white keys.
  const isLandscape = width > height;
  const pianoW = Math.min(width - Spacing.lg * 2, 1100);
  const pianoH = Math.min(
    isLandscape ? height - 150 : height - 260,
    260,
  );

  const fireChord = (notes: string[], color: string) => {
    haptics.bump();
    const midis = notesToMidi(notes);
    setLitColor(color);
    setLit(midis);
    void playChord(midis, 18);
    setTimeout(() => setLit([]), 900);
  };

  return (
    <View style={styles.bg}>
      <LinearGradient
        colors={['#FFFDF6', '#FFF3CC', '#FFE6BA']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <View>
            <Text style={styles.kicker}>FREE PLAY</Text>
            <Text style={styles.title}>Practice</Text>
          </View>
          <View style={styles.chordRow}>
            {DEMO_CHORDS.map((c) => (
              <Pressable
                key={c.label}
                onPress={() => fireChord(c.notes, c.color)}
                style={({ pressed }) => [
                  styles.chordChip,
                  { borderColor: c.color },
                  pressed && { transform: [{ scale: 0.94 }], backgroundColor: c.color + '22' },
                ]}
              >
                <Text style={[styles.chordText, { color: c.color }]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Full keyboard */}
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
          <Text style={styles.hint}>Tap any key — or fire a chord above. Rotate to fill the keyboard.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.cream50 },
  safe: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  kicker: { fontSize: Fonts.xs, fontWeight: Fonts.weight.black, color: Colors.butterDark, letterSpacing: 2 },
  title: { fontSize: Fonts['2xl'], fontWeight: Fonts.weight.black, color: Colors.ink900 },
  chordRow: { flexDirection: 'row', gap: Spacing.sm },
  chordChip: {
    width: 52, height: 44, borderRadius: Radii.md,
    borderWidth: 2, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    ...Elevation.sm,
  },
  chordText: { fontSize: Fonts.lg, fontWeight: Fonts.weight.black },
  pianoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  hint: { fontSize: Fonts.sm, color: Colors.ink500, fontWeight: Fonts.weight.heavy },
});
