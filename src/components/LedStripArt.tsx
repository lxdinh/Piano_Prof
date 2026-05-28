import React from 'react';
import Svg, { Rect, Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { LedColors } from '../theme/tokens';

interface Props {
  ledColors?: string[];
  width?: number;
  height?: number;
  count?: number;
  /** When false, only LEDs whose color is non-dark are drawn with full halo. */
  showHalo?: boolean;
}

const DARK = '#1A1410';

function isLit(c: string): boolean {
  // Crude luma check — LEDs we mark as "off" come in as #2A1D11 / Colors.ink900.
  const hex = c.replace('#', '');
  if (hex.length < 6) return true;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return r + g + b > 120;
}

// A realistic WS2812B-style strip: dark PCB substrate with raised, glowing
// surface-mount LEDs. Lit LEDs render a soft radial halo to mimic the light
// bloom you'd see on real hardware in a dim room.
export default function LedStripArt({
  ledColors,
  width = 320,
  height = 80,
  count = 24,
  showHalo = true,
}: Props) {
  const leds = Array.from({ length: count }, (_, i) =>
    ledColors?.[i] ?? LedColors[i % LedColors.length],
  );

  const stripW = width - 16;
  const stripH = 14;
  const stripX = 8;
  const stripY = height / 2 - stripH / 2;
  const slotW = stripW / count;
  const cy = stripY + stripH / 2;
  const ledR = Math.min(4.5, slotW * 0.32);

  return (
    <Svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      <Defs>
        <LinearGradient id="strip-bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3A2818" />
          <Stop offset="0.45" stopColor="#1A1410" />
          <Stop offset="1" stopColor="#0E0907" />
        </LinearGradient>
        {leds.map((color, i) =>
          isLit(color) ? (
            <RadialGradient
              key={`g${i}`}
              id={`halo-${i}`}
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
            >
              <Stop offset="0" stopColor={color} stopOpacity={0.95} />
              <Stop offset="0.5" stopColor={color} stopOpacity={0.35} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          ) : null,
        )}
      </Defs>

      {/* PCB substrate */}
      <Rect x={stripX} y={stripY} width={stripW} height={stripH} rx={3} fill="url(#strip-bg)" />

      {/* Halo bloom for lit LEDs */}
      {showHalo &&
        leds.map((color, i) => {
          if (!isLit(color)) return null;
          const cx = stripX + slotW * (i + 0.5);
          return <Circle key={`h${i}`} cx={cx} cy={cy} r={ledR * 4} fill={`url(#halo-${i})`} />;
        })}

      {/* LED chips */}
      {leds.map((color, i) => {
        const cx = stripX + slotW * (i + 0.5);
        const lit = isLit(color);
        return (
          <React.Fragment key={`l${i}`}>
            <Circle cx={cx} cy={cy} r={ledR + 0.6} fill={DARK} />
            <Circle cx={cx} cy={cy} r={ledR} fill={lit ? color : '#2A1D11'} />
            {lit && (
              <Circle cx={cx - ledR * 0.3} cy={cy - ledR * 0.3} r={ledR * 0.35} fill="#FFFFFF" opacity={0.7} />
            )}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}
