import React from 'react';
import Svg, { Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LedColors } from '../theme/tokens';

interface Props {
  ledColors?: string[];
  width?: number;
  height?: number;
  count?: number;
}

// Stand-alone version of the LED strip illustration used in onboarding and
// the BLE pairing flow. Mirrors the inline component in BLEPairingScreen.tsx
// so other screens can reuse it.
export default function LedStripArt({
  ledColors,
  width = 320,
  height = 80,
  count = 24,
}: Props) {
  const leds = Array.from({ length: count }, (_, i) =>
    ledColors?.[i] ?? LedColors[i % LedColors.length],
  );

  const stripW = 300;
  const stripH = 18;
  const stripX = 10;
  const stripY = 30;
  const slotW = stripW / count;

  return (
    <Svg viewBox="0 0 320 80" width={width} height={height}>
      <Defs>
        <LinearGradient id="strip-bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3A2818" />
          <Stop offset="1" stopColor="#1A1410" />
        </LinearGradient>
      </Defs>
      <Rect x={stripX} y={stripY} width={stripW} height={stripH} rx={4} fill="url(#strip-bg)" />
      {leds.map((color, i) => (
        <Circle
          key={i}
          cx={stripX + slotW * (i + 0.5)}
          cy={stripY + stripH / 2}
          r={4}
          fill={color}
          opacity={0.95}
        />
      ))}
    </Svg>
  );
}
