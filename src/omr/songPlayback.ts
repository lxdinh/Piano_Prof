// Piano Professor — pure helpers behind the song player (falling notes,
// audio/LED scheduling, metronome). No React, no react-native: everything
// here is unit-tested in the node "logic" project.
//
// Geometry note: the on-screen keyboard is src/ui/Piano.tsx. Its white keys
// are a flex row with a 2px gap and its black keys are absolutely positioned
// from a measured width; `keyLayout` below is a transcription of that file's
// `keyGeometry` (kw / boundaryCenter) and its `blackW = kw * 0.62`, so a note
// bar computed here lands exactly on the key it belongs to. If Piano.tsx's
// constants ever change, change them here too (the test pins the numbers).
import { NoteEvent, SongScore } from './musicxmlScore';
import { midiToNote, isBlackKey, LED_LOW_MIDI, LED_HIGH_MIDI } from '../lesson1/data';
import { handColor } from '../theme/handColors';

/** Piano.tsx `KEY_GAP` — px between white keys. */
export const KEY_GAP = 2;
/** Piano.tsx `blackW = kw * 0.62`. */
export const BLACK_KEY_RATIO = 0.62;
/** Lowest / highest key the on-screen keyboard and the LED strip cover (C2..C7). */
export const KEYBOARD_LOW_MIDI = 36;
export const KEYBOARD_HIGH_MIDI = 96;
/** Widest keyboard the player shows: five octaves (C..B) of white keys. */
export const MAX_WHITE_KEYS = 35;
/** A note bar never draws thinner than this, so grace-short notes stay visible. */
export const MIN_NOTE_HEIGHT = 6;

const MIN_SPAN_SEMITONES = 24; // at least two octaves on screen
const BEAT_EPS = 1e-6; // floating-point guard on beat boundaries (0.3 / 0.1 → 2.999…)

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function whiteKeyCount(low: number, high: number): number {
  let n = 0;
  for (let m = low; m <= high; m++) if (!isBlackKey(m)) n++;
  return n;
}

/**
 * Which keys the player's keyboard shows for a song: the song's range rounded
 * down to a C and up to a B, widened to at least two octaves, kept inside
 * C2..C7, and — when it would exceed `maxWhiteKeys` white keys — trimmed an
 * octave at a time from whichever side is farther from the song's centre
 * (a lone C7 on top goes first: it has no LED anyway).
 */
export function keyboardRange(score: SongScore, maxWhiteKeys = MAX_WHITE_KEYS): { low: number; high: number } {
  const lo = clamp(Math.min(score.minMidi, score.maxMidi), KEYBOARD_LOW_MIDI, KEYBOARD_HIGH_MIDI);
  const hi = clamp(Math.max(score.minMidi, score.maxMidi), KEYBOARD_LOW_MIDI, KEYBOARD_HIGH_MIDI);
  let low = Math.floor(lo / 12) * 12; // round down to a C
  let high = Math.ceil((hi + 1) / 12) * 12 - 1; // round up to a B
  low = Math.max(KEYBOARD_LOW_MIDI, low);
  high = Math.min(KEYBOARD_HIGH_MIDI, high);

  // At least two octaves: grow upward first, then downward, an octave at a
  // time, never past the keyboard's ends.
  let growUp = true;
  while (high - low + 1 < MIN_SPAN_SEMITONES) {
    const canUp = high + 12 <= KEYBOARD_HIGH_MIDI - 1; // stay on a B (95), not C7
    const canDown = low - 12 >= KEYBOARD_LOW_MIDI;
    if (!canUp && !canDown) break;
    if ((growUp && canUp) || !canDown) high += 12;
    else low -= 12;
    growUp = !growUp;
  }

  // Too wide for the component: trim symmetrically around the song's centre.
  const centre = (lo + hi) / 2;
  const maxWhite = Math.max(14, Math.floor(maxWhiteKeys));
  while (whiteKeyCount(low, high) > maxWhite && high - low + 1 > MIN_SPAN_SEMITONES) {
    if (high === KEYBOARD_HIGH_MIDI) { high = KEYBOARD_HIGH_MIDI - 1; continue; }
    if (high - centre >= centre - low) high -= 12;
    else low += 12;
  }
  return { low, high };
}

export interface KeyRect {
  /** left edge, px from the left of the key area */
  x: number;
  /** key width, px */
  w: number;
  black: boolean;
}

/**
 * Where each key of a `Piano` sits horizontally. `width` is the key AREA
 * width — what Piano.tsx measures minus its 10px of horizontal padding (it
 * calls that `innerW`). Transcribed from Piano.tsx `keyGeometry`:
 *   kw             = (width − (whites − 1) × gap) / whites
 *   white i        → x = i × (kw + gap)
 *   boundaryCenter = (leftWhite + 1) × (kw + gap) − gap / 2
 *   black          → w = kw × 0.62, x = boundaryCenter − w / 2
 * where `leftWhite` is the index of the white key one semitone below.
 */
export function keyLayout(low: number, high: number, width: number, keyGap = KEY_GAP): Map<number, KeyRect> {
  const out = new Map<number, KeyRect>();
  const whites: number[] = [];
  const blacks: number[] = [];
  for (let m = low; m <= high; m++) (isBlackKey(m) ? blacks : whites).push(m);
  if (whites.length === 0 || width <= 0) return out;
  const kw = (width - (whites.length - 1) * keyGap) / whites.length;
  whites.forEach((m, i) => out.set(m, { x: i * (kw + keyGap), w: kw, black: false }));
  const blackW = kw * BLACK_KEY_RATIO;
  for (const m of blacks) {
    const leftWhite = whites.indexOf(m - 1);
    const center = (leftWhite + 1) * (kw + keyGap) - keyGap / 2;
    out.set(m, { x: center - blackW / 2, w: blackW, black: true });
  }
  return out;
}

/** Events sounding at time `t` (start inclusive, end exclusive). */
export function soundingAt(events: NoteEvent[], t: number): NoteEvent[] {
  return events.filter((e) => e.start <= t && t < e.start + e.duration);
}

/**
 * Events whose onset lies in [t0, t1). Consecutive frames [a,b) then [b,c)
 * therefore trigger every note exactly once — this is what the player's audio
 * uses. Empty when t1 <= t0.
 */
export function startedBetween(events: NoteEvent[], t0: number, t1: number): NoteEvent[] {
  if (t1 <= t0) return [];
  return events.filter((e) => e.start >= t0 && e.start < t1);
}

export interface LedEntryRgb { note: string; r: number; g: number; b: number; }

/**
 * LED commands for a set of sounding events: right hand (staff 1) in the warm
 * hand colour, left hand (staff 2) in the cool one, sharps-only note names via
 * midiToNote. Notes outside the strip (C2..B6) are skipped — C7 has no LED.
 */
export function ledEntriesFor(events: NoteEvent[]): LedEntryRgb[] {
  const out: LedEntryRgb[] = [];
  for (const e of events) {
    if (e.midi < LED_LOW_MIDI || e.midi > LED_HIGH_MIDI) continue;
    const [r, g, b] = handColor(e.staff === 2 ? 'L' : 'R');
    out.push({ note: midiToNote(e.midi), r, g, b });
  }
  return out;
}

/** Beat index at time `t` (0-based from the song start) and whether it is the downbeat of a bar. */
export function beatInfo(t: number, tempoBpm: number, beatsPerMeasure: number): { beat: number; accent: boolean } {
  const bpm = tempoBpm > 0 ? tempoBpm : 90;
  const perBar = Math.max(1, Math.floor(beatsPerMeasure) || 4);
  const beat = Math.max(0, Math.floor((t * bpm) / 60 + BEAT_EPS));
  return { beat, accent: beat % perBar === 0 };
}

export interface FallingRect {
  x: number;
  /** top edge; y grows downward, the key line is at y = laneHeight */
  y: number;
  w: number;
  h: number;
  midi: number;
  staff: number;
  /** index of the event in the input array — a stable React key */
  index: number;
  /** the note has reached the key line and is still held */
  sounding: boolean;
}

/**
 * Note bars visible in the lane above the keys at time `t`. A bar's bottom
 * edge is its onset: it sits at laneHeight − (start − t) × pxPerSec, so it
 * meets the key line exactly when t === start, and its height is the note's
 * duration in px. Bars entirely above the lane or already past the key line
 * are omitted (a sounding bar's tail is still above the line, so it stays).
 */
export function fallingRects(
  events: NoteEvent[], t: number, layout: Map<number, KeyRect>, laneHeight: number, pxPerSec: number,
): FallingRect[] {
  const out: FallingRect[] = [];
  if (laneHeight <= 0 || pxPerSec <= 0) return out;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const key = layout.get(e.midi);
    if (!key) continue;
    const bottom = laneHeight - (e.start - t) * pxPerSec;
    const h = Math.max(e.duration * pxPerSec, MIN_NOTE_HEIGHT);
    const y = bottom - h;
    if (y >= laneHeight || bottom <= 0) continue;
    out.push({
      x: key.x, y, w: key.w, h, midi: e.midi, staff: e.staff, index: i,
      sounding: e.start <= t && t < e.start + e.duration,
    });
  }
  return out;
}
