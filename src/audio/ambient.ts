// Piano Professor — ambient relaxed piano (port of the prototype's PP_Audio
// ambient loop): a gentle C-pentatonic wander that plays everywhere except
// the lesson/practice players. Uses the sampled piano at low volume.
import * as pianoEngine from './pianoEngine';

const AMB = [60, 62, 64, 67, 69, 72, 64, 67]; // gentle C-pentatonic wander
let idx = 0;
let enabled = true;
let suppressed = false;
let muted = false;
let started = false;
let timer: ReturnType<typeof setInterval> | null = null;

function step() {
  if (muted || !enabled || suppressed) return;
  const n = AMB[idx % AMB.length];
  idx++;
  pianoEngine.playMidi(n, 0.07).catch(() => {});
  if (Math.random() > 0.5) {
    pianoEngine.playMidi(n + (Math.random() > 0.5 ? 4 : 7), 0.05).catch(() => {});
  }
}

function evaluate() {
  if (enabled && !suppressed && !muted && started) {
    if (!timer) { step(); timer = setInterval(step, 2600); }
  } else if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function kick() { started = true; evaluate(); }
export function setEnabled(on: boolean) { enabled = on; evaluate(); }
export function setSuppressed(s: boolean) { suppressed = s; evaluate(); }
export function setMuted(m: boolean) { muted = m; evaluate(); }
export function stop() { started = false; evaluate(); }
