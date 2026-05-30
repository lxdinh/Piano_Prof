import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, {
  Rect, Defs, RadialGradient, Stop, Circle, Text as SvgText,
} from 'react-native-svg';
import { Colors } from '../theme/tokens';
import * as haptics from '../feedback/haptics';
import { playMidi } from '../audio/pianoEngine';

interface Props {
  /** MIDI notes currently lit (e.g. [60, 64, 67] = C E G) */
  litNotes?: number[];
  /** Default highlight color */
  litColor?: string;
  /** Override per-note color */
  noteColors?: Record<number, string>;
  /** Show the LED dot strip above the keys */
  showLeds?: boolean;
  /** Lowest MIDI note (default 36 = C2, matching the legacy keyboard) */
  startMidi?: number;
  /** Number of white keys to draw (default 35 = C2..B6, matching legacy) */
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

// ── Legacy keyboard constants (mirror legacy/app.js drawPiano) ────────────────
const LED_STRIP_H = 18;        // matches PpKeyboard.ledStripH / legacy LED_H
const BG_DARK = '#1A1410';     // piano-black behind the LED strip + key gaps
const WHITE_FILL = '#FFFAEC';  // flat white-key colour
const DIM_DOT = '#2A2A2A';     // un-lit LED dot
const LABEL_MIDDLE = '#C2410C'; // middle-C (MIDI 60) label
const LABEL_OTHER = '#7C6446';  // other C labels

function isBlack(m: number): boolean {
  return [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
}

function midiToOctaveLabel(midi: number): string {
  return `C${Math.floor(midi / 12) - 1}`; // MIDI 60 = C4
}

/** Append an 8-bit alpha to a #RRGGBB colour; pass-through for anything else. */
function withAlpha(hex: string, alpha: number): string {
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
      .toString(16)
      .padStart(2, '0');
    return hex + a;
  }
  return hex;
}

export default function PianoKeyboard({
  litNotes = [],
  litColor = Colors.brand,
  noteColors,
  showLeds = true,
  startMidi = 36,
  whiteKeys = 35,
  width = 360,
  height = 160,
  onKeyPress,
  playSound = false,
  octaveLabels = false,
  pressColor,
}: Props) {
  const ledH = showLeds ? LED_STRIP_H : 0;
  const keyH = height - ledH;
  const whiteW = width / whiteKeys;
  const blackW = whiteW * 0.62;
  const blackH = keyH * 0.62;
  const ledCy = ledH / 2;
  const dotR = Math.max(2, Math.min(5, whiteW * 0.16));

  // Notes the user is actively touching — instant feedback during free play.
  const [pressedNotes, setPressedNotes] = useState<Set<number>>(() => new Set());
  const pressTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => () => { pressTimers.current.forEach((t) => clearTimeout(t)); }, []);

  const litSet = useMemo(() => new Set(litNotes), [litNotes]);
  const colorFor = useCallback((midi: number): string | null => {
    if (noteColors?.[midi]) return noteColors[midi];
    if (litSet.has(midi)) return litColor;
    if (pressedNotes.has(midi)) return pressColor ?? litColor;
    return null;
  }, [noteColors, litSet, litColor, pressedNotes, pressColor]);

  const interactive = !!onKeyPress || playSound;

  // White key MIDI list + black keys nestled between them (legacy layout).
  const { whites, blacks, indexOfWhite } = useMemo(() => {
    const w: number[] = [];
    let m = startMidi;
    while (w.length < whiteKeys) {
      if (!isBlack(m)) w.push(m);
      m++;
    }
    const idx: Record<number, number> = {};
    w.forEach((mm, i) => { idx[mm] = i; });
    const highMidi = w[w.length - 1];
    const b: number[] = [];
    for (let mm = startMidi; mm <= highMidi; mm++) {
      if (isBlack(mm) && idx[mm - 1] !== undefined) b.push(mm);
    }
    return { whites: w, blacks: b, indexOfWhite: idx };
  }, [startMidi, whiteKeys]);

  const blackX = useCallback(
    (m: number) => (indexOfWhite[m - 1] + 1) * whiteW - blackW / 2,
    [indexOfWhite, whiteW, blackW],
  );

  // Unique lit colours → one RadialGradient def each (for the LED-dot glow).
  const litColorList = useMemo(() => {
    const set = new Set<string>();
    whites.forEach((m) => { const c = colorFor(m); if (c) set.add(c); });
    blacks.forEach((m) => { const c = colorFor(m); if (c) set.add(c); });
    return [...set];
  }, [whites, blacks, colorFor]);
  const glowId = (c: string) => `glow-${litColorList.indexOf(c)}`;

  const handlePressIn = useCallback((midi: number) => {
    haptics.tap();
    if (playSound) void playMidi(midi);
    onKeyPress?.(midi);
    setPressedNotes((prev) => new Set(prev).add(midi));
  }, [onKeyPress, playSound]);

  const handlePressOut = useCallback((midi: number) => {
    const existing = pressTimers.current.get(midi);
    if (existing) clearTimeout(existing);
    pressTimers.current.set(midi, setTimeout(() => {
      setPressedNotes((prev) => {
        const next = new Set(prev);
        next.delete(midi);
        return next;
      });
      pressTimers.current.delete(midi);
    }, 120));
  }, []);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          {litColorList.map((c, i) => (
            <RadialGradient key={c} id={`glow-${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={c} stopOpacity={0.8} />
              <Stop offset="1" stopColor={c} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>

        {/* Piano-black background (shows through the LED strip + key gaps) */}
        <Rect x={0} y={0} width={width} height={height} rx={14} ry={14} fill={BG_DARK} />

        {/* White keys */}
        {whites.map((m, i) => {
          const x = i * whiteW;
          const lit = colorFor(m);
          return (
            <React.Fragment key={`w${m}`}>
              <Rect
                x={x}
                y={ledH}
                width={whiteW - 0.5}
                height={keyH}
                fill={WHITE_FILL}
                stroke={BG_DARK}
                strokeWidth={0.6}
              />
              {lit && (
                <Rect
                  x={x}
                  y={ledH}
                  width={whiteW - 0.5}
                  height={keyH}
                  fill={withAlpha(lit, 0.30)}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* C labels at the foot of each C key */}
        {octaveLabels && whites.map((m, i) =>
          m % 12 === 0 ? (
            <SvgText
              key={`lbl${m}`}
              x={i * whiteW + whiteW / 2}
              y={height - 5}
              fontSize={m === 60 ? 9.5 : 8.5}
              fontWeight={m === 60 ? '900' : '700'}
              fill={m === 60 ? LABEL_MIDDLE : LABEL_OTHER}
              textAnchor="middle"
            >
              {midiToOctaveLabel(m)}
            </SvgText>
          ) : null,
        )}

        {/* Black keys (on top of the white-key rects) */}
        {blacks.map((m) => {
          const x = blackX(m);
          const lit = colorFor(m);
          return (
            <React.Fragment key={`b${m}`}>
              <Rect x={x} y={ledH} width={blackW} height={blackH} fill={BG_DARK} />
              {lit && (
                <Rect x={x} y={ledH} width={blackW} height={blackH} fill={withAlpha(lit, 0.55)} />
              )}
            </React.Fragment>
          );
        })}

        {/* LED dot strip — one dot per white + black key */}
        {showLeds && (
          <>
            {whites.map((m, i) => {
              const cx = i * whiteW + whiteW / 2;
              const lit = colorFor(m);
              if (!lit) {
                return <Circle key={`wd${m}`} cx={cx} cy={ledCy} r={dotR * 0.8} fill={DIM_DOT} />;
              }
              return (
                <React.Fragment key={`wd${m}`}>
                  <Circle cx={cx} cy={ledCy} r={dotR * 2.5} fill={`url(#${glowId(lit)})`} />
                  <Circle cx={cx} cy={ledCy} r={dotR} fill={lit} />
                  <Circle cx={cx} cy={ledCy} r={dotR * 0.42} fill="#FFFFFF" />
                </React.Fragment>
              );
            })}
            {blacks.map((m) => {
              const cx = (indexOfWhite[m - 1] + 1) * whiteW;
              const lit = colorFor(m);
              if (!lit) {
                return <Circle key={`bd${m}`} cx={cx} cy={ledCy} r={dotR * 0.8} fill={DIM_DOT} />;
              }
              return (
                <React.Fragment key={`bd${m}`}>
                  <Circle cx={cx} cy={ledCy} r={dotR * 2.5} fill={`url(#${glowId(lit)})`} />
                  <Circle cx={cx} cy={ledCy} r={dotR} fill={lit} />
                  <Circle cx={cx} cy={ledCy} r={dotR * 0.42} fill="#FFFFFF" />
                </React.Fragment>
              );
            })}
          </>
        )}
      </Svg>

      {/* Tap targets — black keys render after whites so they win the overlap. */}
      {interactive && (
        <>
          {whites.map((m, i) => (
            <Pressable
              key={`wp${m}`}
              onPressIn={() => handlePressIn(m)}
              onPressOut={() => handlePressOut(m)}
              style={[styles.tap, { left: i * whiteW, top: ledH, width: whiteW, height: keyH }]}
            />
          ))}
          {blacks.map((m) => (
            <Pressable
              key={`bp${m}`}
              onPressIn={() => handlePressIn(m)}
              onPressOut={() => handlePressOut(m)}
              style={[styles.tap, { left: blackX(m), top: ledH, width: blackW, height: blackH }]}
            />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tap: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});
