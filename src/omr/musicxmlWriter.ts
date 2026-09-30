// Piano Professor — write a two-staff piano score as MusicXML from timed notes.
//
// SCAFFOLD (Phase 2): contract only. The real writer replaces the body; the
// exported types and signature are frozen so file import (MIDI) and the built-in
// catalog can build on it concurrently.

/** A note in quarter-note beats from the start of the piece. */
export interface NoteIn {
  midi: number;
  startBeats: number;
  durBeats: number;
}

export interface ScoreInput {
  title: string;
  composer?: string;
  tempoBpm: number;
  /** time signature numerator, e.g. 4 in 4/4, 3 in 3/4 */
  beatsPerMeasure: number;
  /** time signature denominator, e.g. 4 */
  beatType: number;
  /** key signature as MusicXML fifths (-7..7) */
  fifths: number;
  /** right hand (staff 1) and left hand (staff 2) */
  rh: NoteIn[];
  lh: NoteIn[];
}

/**
 * Serialise to a `<score-partwise>` document with one part and two staves
 * (staff 1 = right hand, staff 2 = left hand) that parseMusicXmlScore() reads
 * back with the same timing. Onsets and durations are snapped to a 16th grid.
 */
export function buildMusicXml(input: ScoreInput): string {
  void input;
  throw new Error('musicxmlWriter: not implemented (scaffold)');
}
