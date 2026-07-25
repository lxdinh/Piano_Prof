// Piano Professor — Circle of Fifths trainer (learn mode).
// SVG wheel: outer ring = major keys, inner ring = relative minors.
// Tap a wedge to hear the key; IV/V neighbours highlight.
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Text as SvgText, Circle } from 'react-native-svg';
import { useAppTheme } from '../../theme/AppTheme';
import { Fonts } from '../../theme/tokens';
import FitBox from '../../ui/FitBox';
import PPButton from '../../ui/PPButton';
import {
  COF_KEYS, cofSigText, majTriad, minTriad, majScaleMidi,
} from '../../data/theory';
import * as pianoEngine from '../../audio/pianoEngine';

const pol = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

function annular(cx: number, cy: number, ri: number, ro: number, a0: number, a1: number): string {
  const [x0, y0] = pol(cx, cy, ro, a0); const [x1, y1] = pol(cx, cy, ro, a1);
  const [x2, y2] = pol(cx, cy, ri, a1); const [x3, y3] = pol(cx, cy, ri, a0);
  return `M${x0} ${y0} A${ro} ${ro} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${ri} ${ri} 0 0 0 ${x3} ${y3} Z`;
}

export default function CircleTrainer() {
  const { colors } = useAppTheme();
  const [sel, setSel] = useState<number>(0);
  const [mode, setMode] = useState<'maj' | 'min'>('maj');
  const size = 380;
  const cx = size / 2; const cy = size / 2;
  const RO = size * 0.477; const R1 = size * 0.30; const RI = size * 0.172;
  const k = COF_KEYS[sel];

  const pick = (i: number, ring: 'maj' | 'min') => {
    setSel(i); setMode(ring);
    const key = COF_KEYS[i];
    pianoEngine.playChord(ring === 'maj' ? majTriad(key.root) : minTriad(key.minRoot), 60).catch(() => {});
  };

  const fillFor = (i: number, ring: 'maj' | 'min') => {
    const isSel = sel === i;
    if (ring === 'maj') {
      if (isSel && mode === 'maj') return { f: '#58CC02', s: '#46A302', c: '#fff' };
      if (i === (sel + 1) % 12) return { f: 'rgba(245,184,0,.24)', s: '#F5B800', c: colors.ink };
      if (i === (sel + 11) % 12) return { f: 'rgba(91,184,227,.24)', s: '#5BB8E3', c: colors.ink };
      return { f: colors.surface, s: colors.line, c: colors.ink };
    }
    if (isSel && mode === 'min') return { f: '#8B5CF6', s: '#6D28D9', c: '#fff' };
    if (isSel) return { f: 'rgba(139,92,246,.22)', s: '#8B5CF6', c: colors.ink };
    return { f: colors.surface2, s: colors.line, c: colors.inkSoft };
  };

  return (
    // Fixed 2-up layout scaled to fit the Practice body — never scrolls.
    <FitBox design={{ w: 724, h: 400 }}>
      <View style={{ flex: 1, flexDirection: 'row', gap: 20, alignItems: 'center', justifyContent: 'center' }}>
        {/* wheel */}
        <Svg width={size} height={size}>
          {COF_KEYS.map((key, i) => {
            const a0 = i * 30 - 15; const a1 = i * 30 + 15;
            const oMid = (RO + R1) / 2; const iMid = (R1 + RI) / 2;
            const [olx, oly] = pol(cx, cy, oMid, i * 30);
            const [ilx, ily] = pol(cx, cy, iMid, i * 30);
            const fo = fillFor(i, 'maj'); const fi = fillFor(i, 'min');
            return (
              <React.Fragment key={key.maj}>
                <Path d={annular(cx, cy, R1, RO, a0, a1)} fill={fo.f} stroke={fo.s} strokeWidth={2} onPress={() => pick(i, 'maj')} />
                <Path d={annular(cx, cy, RI, R1, a0, a1)} fill={fi.f} stroke={fi.s} strokeWidth={2} onPress={() => pick(i, 'min')} />
                <SvgText x={olx} y={oly + 7} fontSize={20} fontWeight="900" fill={fo.c} textAnchor="middle" onPress={() => pick(i, 'maj')}>{key.maj}</SvgText>
                <SvgText x={ilx} y={ily + 5} fontSize={13} fontWeight="800" fill={fi.c} textAnchor="middle" onPress={() => pick(i, 'min')}>{key.min}</SvgText>
              </React.Fragment>
            );
          })}
          <Circle cx={cx} cy={cy} r={RI - 6} fill={colors.surface} stroke={colors.line} strokeWidth={2} />
          <SvgText x={cx} y={cy - 4} fontSize={22} fontWeight="900" fill={colors.ink} textAnchor="middle">{mode === 'maj' ? k.maj : k.min}</SvgText>
          <SvgText x={cx} y={cy + 16} fontSize={11} fontWeight="800" fill={colors.inkFaint} textAnchor="middle">{mode === 'maj' ? 'major' : 'minor'}</SvgText>
        </Svg>

        {/* detail card */}
        <View style={{ width: 300, gap: 10 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 2, borderColor: colors.line, padding: 16, gap: 8 }}>
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 24, color: colors.ink }}>
              {k.maj} major {mode === 'min' ? `· ${k.min}` : ''}
            </Text>
            <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: colors.inkSoft }}>{cofSigText(k)}</Text>
            <Text style={{ fontFamily: Fonts.family.bold, fontSize: 13, color: colors.inkFaint }}>Relative minor: {k.min}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {k.scale.map((n, i) => (
                <View key={i} style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: i === 0 ? colors.green : colors.surface2 }}>
                  <Text style={{ fontFamily: Fonts.family.black, fontSize: 13, color: i === 0 ? '#fff' : colors.ink }}>{n}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 2, borderColor: colors.line, padding: 16, gap: 10 }}>
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 13, color: colors.inkFaint, textTransform: 'uppercase' }}>Song-builder neighbours</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <PPButton label={`I · ${k.maj}`} size="sm" variant="green" onPress={() => pianoEngine.playChord(majTriad(k.root), 60).catch(() => {})} />
              <PPButton label={`IV · ${COF_KEYS[(sel + 11) % 12].maj}`} size="sm" variant="sky" onPress={() => pianoEngine.playChord(majTriad(COF_KEYS[(sel + 11) % 12].root), 60).catch(() => {})} />
              <PPButton label={`V · ${COF_KEYS[(sel + 1) % 12].maj}`} size="sm" variant="gold" onPress={() => pianoEngine.playChord(majTriad(COF_KEYS[(sel + 1) % 12].root), 60).catch(() => {})} />
            </View>
            <PPButton label="Play scale" size="sm" variant="white" onPress={() => pianoEngine.playSequence(majScaleMidi(k.root), 180).catch(() => {})} />
          </View>
        </View>
      </View>
    </FitBox>
  );
}
