// Pitch helpers. A semitone difference maps to an audio playback-rate factor
// of 2^(semitones/12). Used to pitch-shift a single base piano sample to any
// note, and to pitch-shift the sung instructor voice to each key.

export function semitonesToRate(semitones: number): number {
  return Math.pow(2, semitones / 12);
}

/** Rate to play `baseMidi` sample so it sounds like `targetMidi`. */
export function rateForNote(targetMidi: number, baseMidi: number): number {
  return semitonesToRate(targetMidi - baseMidi);
}
