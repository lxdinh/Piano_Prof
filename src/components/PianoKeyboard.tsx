import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '../theme/tokens';
import LedStripArt from './LedStripArt';
import * as haptics from '../feedback/haptics';
import { playMidi } from '../audio/pianoEngine';

interface Props {
  /** MIDI notes currently lit (e.g. [60, 64, 67] = C E G) */
  litNotes?: number[];
  /** Default highlight color */
  litColor?: string;
  /** Override per-note color */
  noteColors?: Record<number, string>;
  /** Show the LED strip above the keys */
  showLeds?: boolean;
  /** Lowest MIDI note (default 48 = C3) */
  startMidi?: number;
  /** Number of white keys to draw (default 15 — 2 octaves + bit) */
  whiteKeys?: number;
  width?: number;
  height?: number;
  /** Optional tap handler — receives MIDI note. */
  onKeyPress?: (midi: number) => void;
  /** Play a piano sample on tap (default false). */
  playSound?: boolean;
  /** Draw C-octave labels (C2, C3, …) at the foot of each C key. */
  octaveLabels?: boolean;
  /** Highlight color used for a freshly-tapped key. */
  pressColor?: string;
}

const WHITE_KEY_PATTERN = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEY_OFFSETS = [1, 3, 6, 8, 10];
const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function whiteIndexToMidi(start: number, idx: number): number {
  const baseC = start - (start % 12);
  return baseC + Math.floor(idx / 7) * 12 + WHITE_KEY_PATTERN[idx % 7];
}

function midiToOctaveLabel(midi: number): string {
  const octave = Math.floor(midi / 12) - 1; // MIDI 60 = C4
  return `C${octave}`;
}

// A lit-key glow is rendered as an Animated.View positioned exactly over the
// key, with backgroundColor=glow + an iOS shadow / Android elevation tuned
// for color. This produces a "the LED inside the key is shining" effect that
// flat SVG fills can't fake.
function KeyGlow({
  x, y, w, h, color, on, isBlack,
}: { x: number; y: number; w: number; h: number; color: string; on: boolean; isBlack: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: on ? 1 : 0,
      duration: on ? 140 : 320,
      useNativeDriver: true,
    }).start();
  }, [on, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glow,
        {
          left: x,
          top: y,
          width: w,
          height: h,
          backgroundColor: color,
          borderRadius: isBlack ? 3 : 4,
          // Sharp inner edge stays visible on top of the colored key
          opacity,
          shadowColor: color,
          shadowOpacity: 0.95,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 0 },
          elevation: 14,
        },
      ]}
    />
  );
}

export default function PianoKeyboard({
  litNotes = [],
  litColor = Colors.brand,
  noteColors,
  showLeds = true,
  startMidi = 48,
  whiteKeys = 15,
  width = 360,
  height = 160,
  onKeyPress,
  playSound = false,
  octaveLabels = false,
  pressColor,
}: Props) {
  const stripH = showLeds ? 26 : 0;
  const fallboardH = showLeds ? 8 : 0;
  const keyAreaH = height - stripH - fallboardH;
  const whiteW = width / whiteKeys;
  const blackW = whiteW * 0.62;
  const blackH = keyAreaH * 0.62;

  // Notes the user is actively touching — gives instant visual feedback even
  // when no external `litNotes` are supplied (free-play / practice).
  const [pressedNotes, setPressedNotes] = useState<Set<number>>(() => new Set());
  const pressTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => () => { pressTimers.current.forEach((t) => clearTimeout(t)); }, []);

  const litSet = useMemo(() => new Set(litNotes), [litNotes]);
  const colorFor = (midi: number): string | null => {
    if (noteColors?.[midi]) return noteColors[midi];
    if (litSet.has(midi)) return litColor;
    if (pressedNotes.has(midi)) return pressColor ?? litColor;
    return null;
  };

  const interactive = !!onKeyPress || playSound;

  const handlePressIn = useCallback((midi: number) => {
    haptics.tap();
    if (playSound) void playMidi(midi);
    onKeyPress?.(midi);
    // flash the key for ~260ms
    setPressedNotes((prev) => {
      const next = new Set(prev);
      next.add(midi);
      return next;
    });
    const existing = pressTimers.current.get(midi);
    if (existing) clearTimeout(existing);
    pressTimers.current.set(
      midi,
      setTimeout(() => {
        setPressedNotes((prev) => {
          const next = new Set(prev);
          next.delete(midi);
          return next;
        });
        pressTimers.current.delete(midi);
      }, 260),
    );
  }, [onKeyPress, playSound]);

  const whites = useMemo(() => {
    const arr: { midi: number; x: number }[] = [];
    for (let i = 0; i < whiteKeys; i++) {
      arr.push({ midi: whiteIndexToMidi(startMidi, i), x: i * whiteW });
    }
    return arr;
  }, [startMidi, whiteKeys, whiteW]);

  const blacks = useMemo(() => {
    const arr: { midi: number; x: number }[] = [];
    for (let i = 0; i < whiteKeys - 1; i++) {
      const midi = whiteIndexToMidi(startMidi, i);
      const semi = midi % 12;
      if (BLACK_KEY_OFFSETS.includes(semi + 1)) {
        arr.push({ midi: midi + 1, x: (i + 1) * whiteW - blackW / 2 });
      }
    }
    return arr;
  }, [startMidi, whiteKeys, whiteW, blackW]);

  // LED row colors (one per white key)
  const ledColors = useMemo(
    () =>
      Array.from({ length: whiteKeys }, (_, i) => {
        const midi = whiteIndexToMidi(startMidi, i);
        return colorFor(midi) ?? '#2A1D11';
      }),
    // colorFor is identity-stable enough for this memo via its inputs:
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startMidi, whiteKeys, litColor, litSet, noteColors, pressedNotes, pressColor],
  );

  return (
    <View style={{ width, height }}>
      {showLeds && (
        <>
          <LedStripArt count={whiteKeys} width={width} height={stripH} ledColors={ledColors} />
          {/* Fallboard — the wooden lip beneath the LED strip on a real piano */}
          <View style={[styles.fallboard, { height: fallboardH }]} />
        </>
      )}

      <View style={{ width, height: keyAreaH }}>
        {/* Static key geometry */}
        <Svg width={width} height={keyAreaH} viewBox={`0 0 ${width} ${keyAreaH}`}>
          <Defs>
            <LinearGradient id="white-key" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFEF8" />
              <Stop offset="0.85" stopColor="#FCF5E0" />
              <Stop offset="1" stopColor="#E8D9BC" />
            </LinearGradient>
            <LinearGradient id="white-key-shadow" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000000" stopOpacity={0.16} />
              <Stop offset="1" stopColor="#000000" stopOpacity={0} />
            </LinearGradient>
            <LinearGradient id="black-key" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#3F3025" />
              <Stop offset="0.18" stopColor="#1F1612" />
              <Stop offset="1" stopColor="#0A0605" />
            </LinearGradient>
            <LinearGradient id="black-key-top" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.18} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* White keys */}
          {whites.map(({ midi, x }) => (
            <React.Fragment key={`w${midi}`}>
              <Rect
                x={x + 1}
                y={0}
                width={whiteW - 2}
                height={keyAreaH}
                rx={4}
                ry={4}
                fill="url(#white-key)"
                stroke={Colors.ink900}
                strokeWidth={0.6}
                strokeOpacity={0.55}
              />
              {/* Inner shadow at top — sells the recessed look under the LED bar */}
              <Rect
                x={x + 2}
                y={0}
                width={whiteW - 4}
                height={10}
                fill="url(#white-key-shadow)"
                pointerEvents="none"
              />
            </React.Fragment>
          ))}

          {/* Gap shadow lines between white keys */}
          {whites.slice(0, -1).map(({ x }, i) => (
            <Line
              key={`gap${i}`}
              x1={x + whiteW}
              y1={4}
              x2={x + whiteW}
              y2={keyAreaH - 6}
              stroke={Colors.ink900}
              strokeWidth={0.5}
              strokeOpacity={0.35}
            />
          ))}

          {/* Octave labels at the foot of each C key */}
          {octaveLabels && whites.map(({ midi, x }) =>
            midi % 12 === 0 ? (
              <SvgText
                key={`lbl${midi}`}
                x={x + whiteW / 2}
                y={keyAreaH - 8}
                fontSize={Math.min(11, whiteW * 0.42)}
                fontWeight="900"
                fill={midi === 60 ? Colors.rust : Colors.ink500}
                textAnchor="middle"
              >
                {midiToOctaveLabel(midi)}
              </SvgText>
            ) : null,
          )}

          {/* Black keys */}
          {blacks.map(({ midi, x }) => (
            <React.Fragment key={`b${midi}`}>
              <Rect
                x={x}
                y={0}
                width={blackW}
                height={blackH}
                rx={3}
                ry={3}
                fill="url(#black-key)"
                stroke={'#000000'}
                strokeWidth={0.5}
              />
              {/* Top highlight */}
              <Rect
                x={x + 1}
                y={1}
                width={blackW - 2}
                height={blackH * 0.35}
                rx={3}
                ry={3}
                fill="url(#black-key-top)"
                pointerEvents="none"
              />
            </React.Fragment>
          ))}
        </Svg>

        {/* Animated glow overlays — render UNDER white keys to bleed up through them,
            OVER black keys to color them. White-key glow sits at the bottom 40% so
            it looks like the LED is shining out the front of the key. */}
        {whites.map(({ midi, x }) => {
          const c = colorFor(midi);
          if (!c) return null;
          return (
            <KeyGlow
              key={`wg${midi}`}
              x={x + 2}
              y={keyAreaH * 0.55}
              w={whiteW - 4}
              h={keyAreaH * 0.42}
              color={c}
              on={true}
              isBlack={false}
            />
          );
        })}
        {blacks.map(({ midi, x }) => {
          const c = colorFor(midi);
          if (!c) return null;
          return (
            <KeyGlow
              key={`bg${midi}`}
              x={x + 1}
              y={1}
              w={blackW - 2}
              h={blackH - 2}
              color={c}
              on={true}
              isBlack={true}
            />
          );
        })}

        {/* Tap targets (transparent Pressables) sit on top of everything.
            onPressIn fires immediately for a responsive, instrument-like feel.
            Black keys render after whites so their hit area wins the overlap. */}
        {interactive && (
          <>
            {whites.map(({ midi, x }) => (
              <Pressable
                key={`wp${midi}`}
                onPressIn={() => handlePressIn(midi)}
                style={[styles.tap, { left: x, width: whiteW, height: keyAreaH, top: 0 }]}
              />
            ))}
            {blacks.map(({ midi, x }) => (
              <Pressable
                key={`bp${midi}`}
                onPressIn={() => handlePressIn(midi)}
                style={[styles.tap, { left: x, width: blackW, height: blackH, top: 0 }]}
              />
            ))}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
  },
  tap: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  fallboard: {
    width: '100%',
    backgroundColor: '#2A1D11',
    borderBottomWidth: 1,
    borderBottomColor: '#0E0907',
  },
});
