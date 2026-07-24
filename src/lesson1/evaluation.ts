// Piano Professor — professor-grade note evaluation (pure, unit-tested).
// Grades a played note the way a human teacher listens: right key, in time,
// held the right length, and the right dynamic. Returns per-dimension verdicts,
// a 0–100 score, and one short spoken cue (most important issue first).

export interface PlayedNote {
  note: string; // e.g. "C4"
  vel: number; // MIDI velocity 1..127 (how hard)
  onset: number; // note-on timestamp (ms)
  durationMs: number; // how long it was held
}

export type Dynamic = 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff';

export interface TargetNote {
  note: string;
  beat?: number; // expected onset in beats from phrase start
  durationBeats?: number; // intended note length (beats)
  dynamic?: Dynamic; // intended loudness
  hand?: 'L' | 'R';
  finger?: 1 | 2 | 3 | 4 | 5;
}

export interface NoteEval {
  pitchOk: boolean;
  timing: 'early' | 'late' | 'onTime';
  timingMs: number; // signed: negative = early, positive = late
  duration: 'short' | 'long' | 'ok';
  dynamics: 'soft' | 'loud' | 'ok';
  score: number; // 0..100
  cue: string; // short spoken feedback
}

// Tuning
export const TIMING_OK_MS = 90; // within ±90ms counts as on time
const DURATION_TOL = 0.35; // ±35% of the intended length
const DYN_TOL = 22; // velocity units of slack around the target dynamic
/** Representative MIDI velocity for each dynamic marking. */
export const DYN_VELOCITY: Record<Dynamic, number> = {
  pp: 24, p: 44, mp: 66, mf: 88, f: 108, ff: 124,
};

export function evaluateNote(
  played: PlayedNote,
  target: TargetNote,
  opts: { msPerBeat?: number; expectedOnset?: number } = {},
): NoteEval {
  const pitchOk = played.note === target.note;

  // timing vs the expected onset (if the caller supplies one)
  let timing: NoteEval['timing'] = 'onTime';
  let timingMs = 0;
  if (opts.expectedOnset != null) {
    timingMs = played.onset - opts.expectedOnset;
    timing = timingMs < -TIMING_OK_MS ? 'early' : timingMs > TIMING_OK_MS ? 'late' : 'onTime';
  }

  // note length vs the intended value
  let duration: NoteEval['duration'] = 'ok';
  if (target.durationBeats != null && opts.msPerBeat) {
    const want = target.durationBeats * opts.msPerBeat;
    const ratio = want > 0 ? played.durationMs / want : 1;
    duration = ratio < 1 - DURATION_TOL ? 'short' : ratio > 1 + DURATION_TOL ? 'long' : 'ok';
  }

  // dynamics vs the intended marking
  let dynamics: NoteEval['dynamics'] = 'ok';
  if (target.dynamic) {
    const d = played.vel - DYN_VELOCITY[target.dynamic];
    dynamics = d < -DYN_TOL ? 'soft' : d > DYN_TOL ? 'loud' : 'ok';
  }

  // score — pitch is the gate; each other lapse trims points
  let score = 0;
  if (pitchOk) {
    score = 100;
    if (timing !== 'onTime') score -= 20;
    if (duration !== 'ok') score -= 15;
    if (dynamics !== 'ok') score -= 15;
    score = Math.max(0, score);
  }

  // one concise cue, most important issue first
  let cue = 'Nice!';
  if (!pitchOk) cue = 'Not quite — try that key again';
  else if (timing === 'late') cue = 'A touch late';
  else if (timing === 'early') cue = 'A touch early';
  else if (duration === 'short') cue = 'Hold it a little longer';
  else if (duration === 'long') cue = 'Lift a little sooner';
  else if (dynamics === 'soft') cue = 'Press a bit firmer';
  else if (dynamics === 'loud') cue = 'A little gentler';

  return { pitchOk, timing, timingMs, duration, dynamics, score, cue };
}
