import { LedColorName } from './schema';

// Maps the lesson data's named colors to hex for both the on-screen keyboard
// and (as RGB) the physical LED strip.
export const COLOR_HEX: Record<LedColorName, string> = {
  cyan:    '#00F0FF',
  magenta: '#D600FF',
  yellow:  '#F5B800',
  green:   '#58CC02',
  red:     '#FF4B4B',
  orange:  '#FF9600',
  sky:     '#5BB8E3',
  violet:  '#8B5CF6',
  pink:    '#FF7A9C',
};

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function colorToRgb(name: LedColorName | undefined): [number, number, number] {
  return hexToRgb(COLOR_HEX[name ?? 'green']);
}
