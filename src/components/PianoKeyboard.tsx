import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import Svg, {
  Rect, Defs, RadialGradient, Stop, Circle, Text as SvgText,
} from 'react-native-svg';
import { Colors } from '../theme/tokens';
import { handColorForMidi } from '../theme/handColors';
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
  /**
   * Color every lit/pressed key by the hand that plays it — left hand (below
   * Middle C) cyan, right hand orange. Overrides litColor/pressColor but NOT an
   * explicit `noteColors` entry (so quiz "correct = green" feedback still wins).
   */
  colorByHand?: boolean;
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
  colorByHand = false,
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

  const litSet = useMemo(() => new Set(litNotes), [litNotes]);
  const colorFor = useCallback((midi: number): string | null => {
    if (noteColors?.[midi]) return noteColors[midi];
    const isLit = litSet.has(midi);
    const isPressed = pressedNotes.has(midi);
    // Left/right-hand color scheme takes over for anything lit or freshly tapped.
    if (colorByHand && (isLit || isPressed)) return handColorForMidi(midi);
    if (isLit) return litColor;
    if (isPressed) return pressColor ?? litColor;
    return null;
  }, [noteColors, litSet, litColor, pressedNotes, pressColor, colorByHand]);

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

  // ── Multi-touch input ───────────────────────────────────────────────────────
  // Rendering dozens of overlapping <Pressable>s broke polyphony: React Native's
  // gesture-responder system only hands the responder to one or two views at a
  // time, so chords past two notes were dropped and many keys never fired their
  // press handler at all (no sound, no haptic). Instead we make the whole
  // keyboard ONE responder and read every active finger out of
  // nativeEvent.touches, hit-testing each touch to a key. That gives true
  // polyphony, glissando, and a reliable tap → sound + haptic on every key.

  // Map a local touch point to a MIDI note. Black keys win in the upper region
  // since they sit on top of and between the white keys.
  const keyAt = useCallback(
    (x: number, y: number): number | null => {
      if (y <= ledH + blackH) {
        for (const m of blacks) {
          const bx = blackX(m);
          if (x >= bx && x <= bx + blackW) return m;
        }
      }
      if (y <= ledH + keyH) {
        const i = Math.floor(x / whiteW);
        if (i >= 0 && i < whites.length) return whites[i];
      }
      return null;
    },
    [blacks, whites, blackX, blackW, ledH, blackH, keyH, whiteW],
  );

  // MIDI notes currently held across all fingers. Kept in a ref so note-on /
  // note-off diffing doesn't depend on React state-update timing.
  const activeRef = useRef<Set<number>>(new Set());

  // Absolute (window) origin of the keyboard, measured on layout. We hit-test
  // each finger from its absolute pageX/pageY MINUS this origin rather than from
  // touch.locationX/locationY. On Android, locationX is reported relative to
  // whichever native sub-view (e.g. a react-native-svg shape) actually received
  // the touch, so taps over the right portion of the SVG came back with the
  // wrong x and never resolved to a key — that whole region played no sound.
  // pageX/pageY are always window-absolute, so this is reliable edge to edge.
  const containerRef = useRef<View>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const measureOrigin = useCallback(() => {
    containerRef.current?.measureInWindow((x, y) => {
      originRef.current = { x, y };
    });
  }, []);
  const onLayout = useCallback((_e: LayoutChangeEvent) => measureOrigin(), [measureOrigin]);

  const handleTouches = useCallback(
    (evt: GestureResponderEvent) => {
      const ne = evt.nativeEvent;
      // Prefer live touches; fall back to changedTouches (covers mouse/web).
      const touches = ne.touches?.length ? ne.touches : (ne.changedTouches ?? []);
      const origin = originRef.current;
      const now = new Set<number>();
      for (const t of touches) {
        const x = origin && t.pageX != null ? t.pageX - origin.x : t.locationX;
        const y = origin && t.pageY != null ? t.pageY - origin.y : t.locationY;
        const m = keyAt(x, y);
        if (m != null) now.add(m);
      }
      const prev = activeRef.current;
      let changed = now.size !== prev.size;
      // Note-on for newly pressed keys.
      for (const m of now) {
        if (!prev.has(m)) {
          changed = true;
          haptics.tap();
          if (playSound) void playMidi(m);
          onKeyPress?.(m);
        }
      }
      if (!changed) {
        for (const m of prev) if (!now.has(m)) { changed = true; break; }
      }
      activeRef.current = now;
      if (changed) setPressedNotes(now);
    },
    [keyAt, playSound, onKeyPress],
  );

  const handleRelease = useCallback(() => {
    if (activeRef.current.size === 0) return;
    activeRef.current = new Set();
    setPressedNotes(new Set());
  }, []);

  const handleGrant = useCallback((evt: GestureResponderEvent) => {
    // Re-measure on every touch start so a mid-session orientation change or
    // scroll can't leave us hit-testing against a stale origin.
    measureOrigin();
    handleTouches(evt);
  }, [measureOrigin, handleTouches]);

  return (
    <View
      ref={containerRef}
      onLayout={onLayout}
      style={{ width, height }}
      pointerEvents={interactive ? 'box-only' : 'auto'}
      onStartShouldSetResponder={() => interactive}
      onMoveShouldSetResponder={() => interactive}
      onResponderGrant={handleGrant}
      onResponderStart={handleTouches}
      onResponderMove={handleTouches}
      onResponderEnd={handleTouches}
      onResponderRelease={handleRelease}
      onResponderTerminate={handleRelease}
      onResponderTerminationRequest={() => false}
    >
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
    </View>
  );
}
