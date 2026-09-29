// Piano Professor — hand & finger colour system (shared by the LED strip and
// the on-screen keyboard so they always match).
//
// Pedagogy: the two hands are OPPOSITE temperatures for instant hand ID and low
// cognitive load — RIGHT hand = warm ("advancing" colours on the melody hand),
// LEFT hand = cool ("receding" colours on the bass hand). Each finger keeps a
// CONSTANT hue thumb→pinky so learners build finger memory. Warm/cool families
// also differ in position + brightness, so they stay distinguishable under
// colour-vision deficiency.

export type Hand = 'L' | 'R';
export type Finger = 1 | 2 | 3 | 4 | 5; // 1 = thumb … 5 = pinky
export type RGB = [number, number, number];

// Right hand = warm, thumb→pinky.
const RIGHT: Record<Finger, RGB> = {
  1: [255, 64, 48], // thumb  — red
  2: [255, 126, 20], // index  — orange
  3: [255, 176, 24], // middle — amber
  4: [255, 214, 10], // ring   — yellow
  5: [214, 170, 0], // pinky  — gold
};
// Left hand = cool, thumb→pinky.
const LEFT: Record<Finger, RGB> = {
  1: [46, 110, 245], // thumb  — blue
  2: [0, 168, 168], // index  — teal
  3: [56, 196, 80], // middle — green
  4: [0, 196, 236], // ring   — cyan
  5: [124, 92, 236], // pinky  — indigo
};

export function fingerColor(hand: Hand, finger: Finger): RGB {
  return (hand === 'R' ? RIGHT : LEFT)[finger];
}

// One representative hue per hand — used when the finger is unknown (songs, etc.)
const HAND: Record<Hand, RGB> = {
  R: [255, 150, 20], // warm amber-orange
  L: [0, 184, 196], // cool teal
};
export function handColor(hand: Hand): RGB {
  return HAND[hand];
}

/** Colour for a target: the finger hue if known, else the hand hue, else brand green. */
export function targetColor(hand?: Hand, finger?: Finger): RGB {
  if (hand && finger) return fingerColor(hand, finger);
  if (hand) return handColor(hand);
  return [88, 204, 2];
}

export const rgbCss = ([r, g, b]: RGB): string => `rgb(${r | 0},${g | 0},${b | 0})`;

/** Scale an RGB toward black by a 0..1 factor — used to map dynamics → brightness. */
export function scaleRgb([r, g, b]: RGB, k: number): RGB {
  const f = Math.max(0, Math.min(1, k));
  return [Math.round(r * f), Math.round(g * f), Math.round(b * f)];
}
