// Piano Professor — piano keyboard + LED strip (RN port of ds-piano.jsx).
// White keys flex evenly; black keys are absolutely positioned by measured
// width. `lit` maps MIDI → glow color (LED guidance). onPlay fires per press.
import React, { useState } from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Fonts } from '../theme/tokens';
import * as haptics from '../feedback/haptics';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
export const midiName = (m: number) => NOTE_NAMES[((m % 12) + 12) % 12];

function buildKeys(low: number, high: number) {
  const all: number[] = [];
  for (let m = low; m <= high; m++) all.push(m);
  const whites = all.filter((m) => !isBlack(m));
  const blacks = all.filter(isBlack).map((m) => ({ midi: m, leftWhite: whites.indexOf(m - 1) }));
  return { whites, blacks };
}

export function LedStrip({ low, high, lit, width }: {
  low: number; high: number; lit: Record<number, string>; width: number;
}) {
  const { whites, blacks } = buildKeys(low, high);
  const whiteW = width / whites.length;
  const Dot = ({ x, c }: { x: number; c?: string }) => (
    <View style={{
      position: 'absolute', top: 6, left: x - 6,
      width: 12, height: 12, borderRadius: 6,
      backgroundColor: c || '#2a241c',
      shadowColor: c || '#000', shadowOpacity: c ? 0.9 : 0, shadowRadius: c ? 6 : 0, shadowOffset: { width: 0, height: 0 },
      elevation: c ? 6 : 0,
    }} />
  );
  return (
    <View style={{ height: 24, marginHorizontal: 6, marginBottom: 4, borderRadius: 8, backgroundColor: '#201a14', overflow: 'hidden' }}>
      {whites.map((m, i) => <Dot key={`w${m}`} x={(i + 0.5) * whiteW} c={lit[m]} />)}
      {blacks.map((b) => <Dot key={`b${b.midi}`} x={(b.leftWhite + 1) * whiteW} c={lit[b.midi]} />)}
    </View>
  );
}

interface Props {
  low?: number; high?: number;
  lit?: Record<number, string>;
  labels?: Record<number, string>;
  onPlay?: (midi: number) => void;
  height?: number;
  led?: boolean;
  interactive?: boolean;
  hideNoteNames?: boolean;
}

export default function Piano({
  low = 55, high = 84, lit = {}, labels = {}, onPlay,
  height = 200, led = true, interactive = true, hideNoteNames = false,
}: Props) {
  const { whites, blacks } = buildKeys(low, high);
  const [w, setW] = useState(0);
  const [pressed, setPressed] = useState<Record<number, boolean>>({});
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const whiteW = w > 0 ? w / whites.length : 0;
  const blackW = whiteW * 0.62;
  const keyH = height - (led ? 28 : 0) - 8;

  const hit = (m: number) => {
    if (!interactive) return;
    haptics.tap();
    setPressed((p) => ({ ...p, [m]: true }));
    setTimeout(() => setPressed((p) => { const n = { ...p }; delete n[m]; return n; }), 200);
    onPlay?.(m);
  };

  return (
    <View style={{ width: '100%' }}>
      {led && w > 0 && <LedStrip low={low} high={high} lit={lit} width={w - 12} />}
      <View onLayout={onLayout} style={{
        height: keyH + 8, borderRadius: 16, overflow: 'hidden',
        backgroundColor: '#2f271e', paddingHorizontal: 5, paddingBottom: 6,
      }}>
        {/* felt */}
        <View style={{ height: 6, backgroundColor: '#a52a2a', borderBottomLeftRadius: 3, borderBottomRightRadius: 3, marginBottom: 2 }} />
        <View style={{ height: keyH, position: 'relative' }}>
          {/* white keys */}
          <View style={{ flexDirection: 'row', height: '100%', gap: 2 }}>
            {whites.map((m) => {
              const c = lit[m]; const isP = pressed[m];
              return (
                <Pressable key={m} onPress={() => hit(m)} style={{
                  flex: 1, borderTopLeftRadius: 3, borderTopRightRadius: 3, borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
                  backgroundColor: c ? c : isP ? '#e4dcc0' : '#fffef9', overflow: 'hidden',
                  justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 8,
                  shadowColor: c || '#000', shadowOpacity: c ? 0.7 : 0, shadowRadius: c ? 10 : 0, elevation: c ? 5 : 0,
                }}>
                  {c ? <LinearGradient colors={['#ffffff', c]} style={{ position: 'absolute', inset: 0 } as any} /> : null}
                  {(labels[m] || (c && !hideNoteNames)) && (
                    <Text style={{ fontSize: 13, fontFamily: Fonts.family.black, fontWeight: '900', color: c ? '#2a6b00' : '#B6AC8C' }}>
                      {labels[m] ?? midiName(m)}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
          {/* black keys */}
          {w > 0 && blacks.map((b) => {
            const c = lit[b.midi]; const isP = pressed[b.midi];
            const center = (b.leftWhite + 1) * whiteW;
            return (
              <Pressable key={b.midi} onPress={() => hit(b.midi)} style={{
                position: 'absolute', top: 0, height: '62%',
                left: center - blackW / 2, width: blackW,
                borderTopLeftRadius: 2, borderTopRightRadius: 2, borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
                backgroundColor: c ? c : isP ? '#111' : '#161616', overflow: 'hidden',
                justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 6,
                shadowColor: c || '#000', shadowOpacity: c ? 0.8 : 0.5, shadowRadius: c ? 8 : 3, elevation: 6,
              }}>
                {c && !hideNoteNames && (
                  <Text style={{ fontSize: 9, fontFamily: Fonts.family.black, fontWeight: '900', color: '#fff' }}>{midiName(b.midi)}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
