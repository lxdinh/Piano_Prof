import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Colors } from '../theme/tokens';
import LedStripArt from './LedStripArt';

interface Props {
  /** MIDI notes currently lit (e.g. [60, 64, 67] = C E G) */
  litNotes?: number[];
  /** Color for lit notes */
  litColor?: string;
  /** Highlight color per midi note overrides litColor */
  noteColors?: Record<number, string>;
  /** Show the LED strip above the keys */
  showLeds?: boolean;
  /** Lowest MIDI note (default 48 = C3) */
  startMidi?: number;
  /** Number of white keys to draw (default 15 — 2 octaves + bit) */
  whiteKeys?: number;
  width?: number;
  height?: number;
}

const WHITE_KEY_PATTERN = [0, 2, 4, 5, 7, 9, 11]; // semitone offsets for C D E F G A B
const BLACK_KEY_OFFSETS = [1, 3, 6, 8, 10];        // C# D# F# G# A#

function whiteIndexToMidi(start: number, idx: number): number {
  const octave = Math.floor(idx / 7);
  const within = idx % 7;
  // Find C-aligned start
  const baseC = start - (start % 12);
  return baseC + octave * 12 + WHITE_KEY_PATTERN[within];
}

export default function PianoKeyboard({
  litNotes = [],
  litColor = Colors.brand,
  noteColors,
  showLeds = true,
  startMidi = 48,
  whiteKeys = 15,
  width = 360,
  height = 140,
}: Props) {
  const stripH = showLeds ? 24 : 0;
  const keyAreaH = height - stripH;
  const whiteW = width / whiteKeys;
  const blackW = whiteW * 0.6;
  const blackH = keyAreaH * 0.62;

  const litSet = new Set(litNotes);
  const colorFor = (midi: number): string | null => {
    if (noteColors?.[midi]) return noteColors[midi];
    if (litSet.has(midi)) return litColor;
    return null;
  };

  // LED row colors mapped to white keys
  const ledColors = Array.from({ length: whiteKeys }, (_, i) => {
    const midi = whiteIndexToMidi(startMidi, i);
    return colorFor(midi) ?? Colors.ink900;
  });

  // Build keys
  const whiteRects: { midi: number; x: number }[] = [];
  for (let i = 0; i < whiteKeys; i++) {
    const midi = whiteIndexToMidi(startMidi, i);
    whiteRects.push({ midi, x: i * whiteW });
  }

  const blackRects: { midi: number; x: number }[] = [];
  for (let i = 0; i < whiteKeys - 1; i++) {
    const midi = whiteIndexToMidi(startMidi, i);
    const semi = midi % 12;
    const hasBlackAfter = BLACK_KEY_OFFSETS.includes(semi + 1);
    if (hasBlackAfter) {
      blackRects.push({ midi: midi + 1, x: (i + 1) * whiteW - blackW / 2 });
    }
  }

  return (
    <View style={{ width, height }}>
      {showLeds && (
        <View style={styles.ledWrap}>
          <LedStripArt count={whiteKeys} width={width} height={stripH} ledColors={ledColors} />
        </View>
      )}
      <Svg width={width} height={keyAreaH} viewBox={`0 0 ${width} ${keyAreaH}`}>
        {whiteRects.map(({ midi, x }) => {
          const hl = colorFor(midi);
          return (
            <Rect
              key={`w${midi}`}
              x={x + 1}
              y={0}
              width={whiteW - 2}
              height={keyAreaH}
              rx={3}
              fill={hl ?? '#FFFFFF'}
              stroke={Colors.ink900}
              strokeWidth={1}
            />
          );
        })}
        {blackRects.map(({ midi, x }) => {
          const hl = colorFor(midi);
          return (
            <Rect
              key={`b${midi}`}
              x={x}
              y={0}
              width={blackW}
              height={blackH}
              rx={2}
              fill={hl ?? Colors.ink900}
              stroke={Colors.ink900}
              strokeWidth={1}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  ledWrap: { alignItems: 'center' },
});
