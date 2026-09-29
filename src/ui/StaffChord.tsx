// Piano Professor — treble-clef staff renderer for a chord (SVG).
// Compact port of the prototype's StaffChord: 5 lines, whole-note heads,
// ledger lines and accidentals.
import React from 'react';
import Svg, { Line, Ellipse, Text as SvgText } from 'react-native-svg';
import { useAppTheme } from '../theme/AppTheme';
import { BuiltChord, spellChord } from '../data/theory';

const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];

export default function StaffChord({ chord, width = 230, height = 130 }: {
  chord: BuiltChord; width?: number; height?: number;
}) {
  const { colors } = useAppTheme();
  const gap = 13;                       // distance between staff lines
  const topY = height / 2 - 2 * gap;    // top staff line
  const bottomY = topY + 4 * gap;       // bottom line (E4)
  const noteX = width * 0.62;
  const spelled = spellChord(chord);

  // steps above E4 (diatonic); E4 index = 4*7 + 2 = 30
  const stepOf = (letterIdx: number, midi: number) => {
    const oct = Math.round((midi - LETTER_PC[letterIdx]) / 12) - 1;
    return (oct * 7 + letterIdx) - 30;
  };

  const yOf = (steps: number) => bottomY - steps * (gap / 2);

  // collect ledger line steps needed (even steps below 0 / above 8)
  const ledgers = new Set<number>();
  spelled.forEach((n) => {
    const s = stepOf(n.letterIdx, n.midi);
    for (let k = -2; k >= s; k -= 2) ledgers.add(k);
    for (let k = 10; k <= s; k += 2) ledgers.add(k);
  });

  return (
    <Svg width={width} height={height}>
      {/* staff lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Line key={i} x1={14} x2={width - 14} y1={topY + i * gap} y2={topY + i * gap} stroke={colors.inkFaint} strokeWidth={1.6} />
      ))}
      {/* treble clef */}
      <SvgText x={20} y={bottomY + gap * 0.9} fontSize={gap * 4.4} fill={colors.ink}>𝄞</SvgText>
      {/* ledger lines */}
      {Array.from(ledgers).map((s) => (
        <Line key={s} x1={noteX - 15} x2={noteX + 15} y1={yOf(s)} y2={yOf(s)} stroke={colors.inkFaint} strokeWidth={1.6} />
      ))}
      {/* note heads + accidentals */}
      {spelled.map((n, i) => {
        const s = stepOf(n.letterIdx, n.midi);
        const y = yOf(s);
        // stagger seconds (adjacent steps) so heads don't overlap
        const prev = i > 0 ? stepOf(spelled[i - 1].letterIdx, spelled[i - 1].midi) : null;
        const dx = prev !== null && Math.abs(s - prev) === 1 ? 13 : 0;
        return (
          <React.Fragment key={i}>
            {n.acc !== '' && (
              <SvgText x={noteX - 30 + dx} y={y + 5} fontSize={16} fontWeight="bold" fill={colors.ink}>{n.acc}</SvgText>
            )}
            <Ellipse cx={noteX + dx} cy={y} rx={8} ry={5.6} stroke={colors.ink} strokeWidth={2} fill="none" transform={`rotate(-14 ${noteX + dx} ${y})`} />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}
