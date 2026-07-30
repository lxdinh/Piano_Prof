import { NoteEvent, SongScore } from './musicxmlScore';

// Music-theory analysis of an imported song — everything the A→Z lesson
// generator teaches comes from here: what key it's in (and where that sits on
// the circle of fifths), the chord under every measure, the repeating chord
// loop, the song's sections (verse/chorus-style repetition map), the rhythm
// profile, where the right hand needs a finger crossing, and any dynamics /
// pedal marks the OMR engine captured. Pure functions, no framework.

export interface KeyInfo {
  /** tonic pitch class 0..11 (C = 0) */
  tonicPc: number;
  mode: 'major' | 'minor';
  /** e.g. "C major" */
  name: string;
  /** key signature as fifths (-7..7) */
  fifths: number;
  /** relative key, e.g. "A minor" for C major */
  relative: string;
  /** circle-of-fifths neighbors: one step counter-clockwise / clockwise */
  neighborFlat: string;
  neighborSharp: string;
  /** the primary chords in this key: I, IV, V, vi (or i, iv, V, VI in minor) */
  primaryChords: string[];
}

export interface MeasureChord {
  measure: number;
  /** e.g. "C", "Am", "G" — null when the measure has too little to judge */
  label: string | null;
  /** chord tones as note names for the left hand, e.g. ["C3","E3","G3"] */
  lhNotes: string[];
  /** scale-degree shape, e.g. "1-3-5" */
  shape: string;
  quality: 'major' | 'minor' | 'dim' | null;
}

export interface SongSection {
  /** A, B, C… by order of first appearance */
  letter: string;
  /** human label, e.g. "Theme A — repeats 3×, likely the chorus" */
  label: string;
  startMeasure: number;
  endMeasure: number; // inclusive
}

export interface Crossing {
  measure: number;
  note: string;
  direction: 'up' | 'down';
  advice: string;
}

export interface SongAnalysis {
  key: KeyInfo;
  tempoBpm: number;
  beatsPerMeasure: number;
  measureCount: number;
  chords: MeasureChord[];
  /** repeating chord loop, if one dominates the song */
  loop: { labels: string[]; repeats: number } | null;
  sections: SongSection[];
  rhythm: { dominant: string; hasEighths: boolean; hasDotted: boolean; summary: string };
  hands: { hasLeft: boolean; hasRight: boolean };
  crossings: Crossing[];
  dynamics: { measure: number; mark: string }[];
  pedals: { measure: number }[];
}

const PC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const PC_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
// fifths value → major tonic pitch class (0 fifths = C, 1 = G, -1 = F, …)
const MAJOR_TONIC_BY_FIFTHS: Record<number, number> = {
  [-7]: 11, [-6]: 6, [-5]: 1, [-4]: 8, [-3]: 3, [-2]: 10, [-1]: 5,
  0: 0, 1: 7, 2: 2, 3: 9, 4: 4, 5: 11, 6: 6, 7: 1,
};

function pcName(pc: number, fifths: number): string {
  return (fifths < 0 ? PC_FLAT : PC_SHARP)[((pc % 12) + 12) % 12];
}

export function analyzeSong(score: SongScore, xml?: string): SongAnalysis {
  const key = detectKey(score);
  const left = score.events.filter((e) => e.staff === 2);
  const right = score.events.filter((e) => e.staff !== 2);
  const chords = detectChords(score, key, left.length ? left : right);
  return {
    key,
    tempoBpm: score.tempoBpm,
    beatsPerMeasure: score.beatsPerMeasure,
    measureCount: score.measureCount,
    chords,
    loop: findLoop(chords),
    sections: findSections(score, right.length ? right : score.events),
    rhythm: rhythmProfile(score),
    hands: { hasLeft: left.length > 0, hasRight: right.length > 0 },
    crossings: findCrossings(right.length ? right : score.events),
    dynamics: xml ? findDynamics(xml) : [],
    pedals: xml ? findPedals(xml) : [],
  };
}

// ── Key + circle of fifths ───────────────────────────────────────────────────

export function detectKey(score: SongScore): KeyInfo {
  // Prefer the engraved key signature; fall back to a duration-weighted
  // pitch-class histogram matched against all 24 keys.
  let fifths = score.fifths;
  if (fifths == null || fifths < -7 || fifths > 7) fifths = estimateFifths(score);
  const majorPc = MAJOR_TONIC_BY_FIFTHS[fifths] ?? 0;
  const minorPc = (majorPc + 9) % 12;

  // Same signature fits the major key and its relative minor — decide by where
  // the music "lands": last bass note and overall tonic emphasis.
  const weight = new Array(12).fill(0);
  for (const e of score.events) weight[e.midi % 12] += e.durBeats;
  const last = [...score.events].sort((a, b) => b.start - a.start)[0];
  let minorScore = (weight[minorPc] || 0) - (weight[majorPc] || 0);
  if (last && last.midi % 12 === minorPc) minorScore += 4;
  if (last && last.midi % 12 === majorPc) minorScore -= 4;
  const mode: 'major' | 'minor' = minorScore > 0 ? 'minor' : 'major';
  const tonicPc = mode === 'major' ? majorPc : minorPc;

  const name = `${pcName(tonicPc, fifths)} ${mode}`;
  const relative = mode === 'major'
    ? `${pcName(minorPc, fifths)} minor`
    : `${pcName(majorPc, fifths)} major`;
  const neighborFlat = `${pcName(MAJOR_TONIC_BY_FIFTHS[Math.max(-7, fifths - 1)], fifths - 1)} major`;
  const neighborSharp = `${pcName(MAJOR_TONIC_BY_FIFTHS[Math.min(7, fifths + 1)], fifths + 1)} major`;

  const deg = (semi: number) => pcName((tonicPc + semi) % 12, fifths);
  const primaryChords = mode === 'major'
    ? [deg(0), deg(5), deg(7), `${deg(9)}m`]          // I IV V vi
    : [`${deg(0)}m`, `${deg(5)}m`, deg(7), deg(8)];   // i iv V VI
  return { tonicPc, mode, name, fifths, relative, neighborFlat, neighborSharp, primaryChords };
}

function estimateFifths(score: SongScore): number {
  // Count accidentals implied by each candidate major scale; pick the
  // signature whose scale covers the most played duration.
  const weight = new Array(12).fill(0);
  for (const e of score.events) weight[e.midi % 12] += e.durBeats;
  const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
  let best = 0;
  let bestCover = -1;
  for (let f = -6; f <= 6; f++) {
    const tonic = MAJOR_TONIC_BY_FIFTHS[f];
    const cover = MAJOR_STEPS.reduce((s, st) => s + weight[(tonic + st) % 12], 0);
    if (cover > bestCover) { bestCover = cover; best = f; }
  }
  return best;
}

// ── Chords per measure ───────────────────────────────────────────────────────

const TRIADS: { quality: MeasureChord['quality']; intervals: number[]; suffix: string }[] = [
  { quality: 'major', intervals: [0, 4, 7], suffix: '' },
  { quality: 'minor', intervals: [0, 3, 7], suffix: 'm' },
  { quality: 'dim', intervals: [0, 3, 6], suffix: 'dim' },
];

export function detectChords(score: SongScore, key: KeyInfo, source: NoteEvent[]): MeasureChord[] {
  const out: MeasureChord[] = [];
  for (let m = 0; m < score.measureCount; m++) {
    const notes = source.filter((e) => e.measure === m);
    if (!notes.length) {
      out.push({ measure: m, label: null, lhNotes: [], shape: '', quality: null });
      continue;
    }
    const weight = new Array(12).fill(0);
    for (const e of notes) weight[e.midi % 12] += e.durBeats || 0.25;
    const bassPc = notes.reduce((lo, e) => (e.midi < lo.midi ? e : lo), notes[0]).midi % 12;

    let best: { root: number; t: (typeof TRIADS)[number]; score: number } | null = null;
    for (let root = 0; root < 12; root++) {
      for (const t of TRIADS) {
        const tones = t.intervals.map((iv) => (root + iv) % 12);
        const inTone = tones.reduce((s, pc) => s + weight[pc], 0);
        const total = weight.reduce((a: number, b: number) => a + b, 0);
        let s = inTone - 0.6 * (total - inTone);
        if (root === bassPc) s += 1.5;           // bass note is usually the root
        if (tones.every((pc) => weight[pc] > 0)) s += 1; // complete triad present
        if (!best || s > best.score) best = { root, t, score: s };
      }
    }
    if (!best || best.score <= 0) {
      out.push({ measure: m, label: null, lhNotes: [], shape: '', quality: null });
      continue;
    }
    const rootName = pcName(best.root, key.fifths);
    // Voice the triad stacked UP from a root near C3 — the exact keys a left
    // hand plays with 5-3-1, and the exact notes the chord quiz expects.
    const rootMidi = 48 + ((best.root + 12) % 12); // C3..B3
    const lhNotes = best.t.intervals.map((iv) => {
      const midi = rootMidi + iv;
      return `${pcName(midi % 12, key.fifths)}${Math.floor(midi / 12) - 1}`;
    });
    out.push({
      measure: m,
      label: `${rootName}${best.t.suffix}`,
      lhNotes,
      shape: best.t.quality === 'major' ? '1-3-5' : best.t.quality === 'minor' ? '1-♭3-5' : '1-♭3-♭5',
      quality: best.t.quality,
    });
  }
  return out;
}

// ── Repeating chord loop ─────────────────────────────────────────────────────

export function findLoop(chords: MeasureChord[]): { labels: string[]; repeats: number } | null {
  const labels = chords.map((c) => c.label ?? '·');
  for (const len of [4, 2, 8]) {
    if (labels.length < len * 2) continue;
    let repeats = 1;
    while (
      (repeats + 1) * len <= labels.length &&
      labels.slice(repeats * len, (repeats + 1) * len).join() === labels.slice(0, len).join()
    ) repeats++;
    const loop = labels.slice(0, len);
    if (repeats >= 2 && new Set(loop).size > 1 && !loop.includes('·')) {
      return { labels: loop, repeats };
    }
  }
  return null;
}

// ── Sections (verse / chorus style repetition map) ──────────────────────────

export function findSections(score: SongScore, melody: NoteEvent[], phraseLen = 4): SongSection[] {
  if (!score.measureCount) return [];
  // Fingerprint each phrase (group of measures) by its melody pitch sequence,
  // then letter phrases by first appearance: repeats of A = the main theme.
  const prints: string[] = [];
  for (let start = 0; start < score.measureCount; start += phraseLen) {
    const ns = melody.filter((e) => e.measure >= start && e.measure < start + phraseLen);
    prints.push(ns.map((e) => e.midi).join(','));
  }
  const letterOf = new Map<string, string>();
  const phraseLetters = prints.map((p) => {
    if (!letterOf.has(p)) letterOf.set(p, String.fromCharCode(65 + letterOf.size));
    return letterOf.get(p)!;
  });
  // merge consecutive identical letters into sections
  const sections: SongSection[] = [];
  for (let i = 0; i < phraseLetters.length; i++) {
    const startMeasure = i * phraseLen;
    const endMeasure = Math.min(startMeasure + phraseLen, score.measureCount) - 1;
    const prev = sections[sections.length - 1];
    if (prev && prev.letter === phraseLetters[i]) {
      prev.endMeasure = endMeasure;
    } else {
      sections.push({ letter: phraseLetters[i], label: '', startMeasure, endMeasure });
    }
  }
  // label by repetition: most frequent letter = main theme/chorus, single
  // contrasting letter in the middle = bridge.
  const counts = new Map<string, number>();
  for (const l of phraseLetters) counts.set(l, (counts.get(l) ?? 0) + 1);
  const maxCount = Math.max(...counts.values());
  for (const s of sections) {
    const c = counts.get(s.letter) ?? 1;
    if (c === maxCount && maxCount > 1) s.label = `Theme ${s.letter} — repeats ${c}×, likely the chorus / main theme`;
    else if (c === 1 && sections.length > 2 && s !== sections[0] && s !== sections[sections.length - 1]) {
      s.label = `Section ${s.letter} — appears once in the middle: the bridge`;
    } else if (s === sections[0]) s.label = `Section ${s.letter} — the opening (intro / verse)`;
    else if (s === sections[sections.length - 1]) s.label = `Section ${s.letter} — the ending (outro)`;
    else s.label = `Section ${s.letter}`;
  }
  return sections;
}

// ── Rhythm profile ───────────────────────────────────────────────────────────

function rhythmProfile(score: SongScore): SongAnalysis['rhythm'] {
  const buckets = new Map<string, number>();
  let hasEighths = false;
  let hasDotted = false;
  for (const e of score.events) {
    const b = e.durBeats;
    const name = b >= 3.5 ? 'whole notes' : b >= 1.75 ? 'half notes' : b >= 0.875 ? 'quarter notes'
      : b >= 0.4 ? 'eighth notes' : 'sixteenth notes';
    buckets.set(name, (buckets.get(name) ?? 0) + 1);
    if (name === 'eighth notes' || name === 'sixteenth notes') hasEighths = true;
    if (Math.abs(b - 1.5) < 0.05 || Math.abs(b - 0.75) < 0.03) hasDotted = true;
  }
  const dominant = [...buckets.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'quarter notes';
  const parts = [`mostly ${dominant}`];
  if (hasEighths && dominant !== 'eighth notes' && dominant !== 'sixteenth notes') parts.push('with faster runs');
  if (hasDotted) parts.push('and some dotted rhythms — hold those a touch longer');
  return { dominant, hasEighths, hasDotted, summary: parts.join(' ') };
}

// ── Finger crossings ─────────────────────────────────────────────────────────

export function findCrossings(melody: NoteEvent[]): Crossing[] {
  // A stepwise run longer than 5 notes outruns one hand position: going up,
  // the thumb tucks under after finger 3; coming down, finger 3 crosses over.
  const out: Crossing[] = [];
  const sorted = [...melody].sort((a, b) => a.start - b.start);
  let runStart = 0;
  let dir = 0;
  for (let i = 1; i <= sorted.length; i++) {
    const step = i < sorted.length ? sorted[i].midi - sorted[i - 1].midi : 0;
    const stepDir = step > 0 && step <= 2 ? 1 : step < 0 && step >= -2 ? -1 : 0;
    if (i < sorted.length && stepDir !== 0 && (dir === 0 || stepDir === dir)) {
      if (dir === 0) { dir = stepDir; runStart = i - 1; }
      continue;
    }
    const runLen = i - runStart;
    if (dir !== 0 && runLen > 5) {
      const at = sorted[runStart + 3]; // crossing happens around the 4th note
      out.push({
        measure: at.measure,
        note: at.note,
        direction: dir > 0 ? 'up' : 'down',
        advice: dir > 0
          ? `Long run up at bar ${at.measure + 1}: play 1-2-3, then tuck your thumb UNDER to ${at.note} and keep going.`
          : `Long run down at bar ${at.measure + 1}: when you run out of fingers, cross finger 3 OVER your thumb at ${at.note}.`,
      });
    }
    dir = i < sorted.length ? stepDir : 0;
    runStart = i;
  }
  return out;
}

// ── Dynamics + pedal (from the MusicXML the engine emitted) ─────────────────

const DYNAMIC_WORDS: Record<string, string> = {
  pp: 'very soft (pianissimo)', p: 'soft (piano)', mp: 'medium-soft (mezzo-piano)',
  mf: 'medium-loud (mezzo-forte)', f: 'loud (forte)', ff: 'very loud (fortissimo)',
};

export function findDynamics(xml: string): { measure: number; mark: string }[] {
  const out: { measure: number; mark: string }[] = [];
  const firstPart = /<part\s[^>]*>[\s\S]*?<\/part>/.exec(xml)?.[0] ?? xml;
  const measures = firstPart.match(/<measure[\s\S]*?<\/measure>/g) ?? [];
  measures.forEach((m, i) => {
    const dyn = /<dynamics>\s*<(pp|p|mp|mf|f|ff)\s*\/?\s*>/.exec(m)?.[1];
    if (dyn) out.push({ measure: i, mark: DYNAMIC_WORDS[dyn] ?? dyn });
    if (/<wedge[^>]*type="crescendo"/.test(m)) out.push({ measure: i, mark: 'grow louder (crescendo)' });
    if (/<wedge[^>]*type="diminuendo"/.test(m)) out.push({ measure: i, mark: 'fade softer (diminuendo)' });
  });
  return out;
}

export function findPedals(xml: string): { measure: number }[] {
  const out: { measure: number }[] = [];
  const firstPart = /<part\s[^>]*>[\s\S]*?<\/part>/.exec(xml)?.[0] ?? xml;
  const measures = firstPart.match(/<measure[\s\S]*?<\/measure>/g) ?? [];
  measures.forEach((m, i) => {
    if (/<pedal[^>]*type="start"/.test(m)) out.push({ measure: i });
  });
  return out;
}
