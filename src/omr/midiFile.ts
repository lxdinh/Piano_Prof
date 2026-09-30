// Piano Professor — read a Standard MIDI File into the writer's ScoreInput.
//
// SCAFFOLD (Phase 2): contract only; the real parser replaces the body.
import { ScoreInput } from './musicxmlWriter';

/**
 * Parse SMF bytes (format 0 or 1). Tempo, time signature and key signature come
 * from meta events (defaults 120 BPM, 4/4, C). Notes are split into hands by
 * track when two melodic tracks exist, otherwise by pitch (below C4 = left).
 * Throws an Error with a learner-readable message when the file is not MIDI.
 */
export function parseMidiFile(bytes: Uint8Array, fallbackTitle = 'MIDI import'): ScoreInput {
  void bytes; void fallbackTitle;
  throw new Error('midiFile: not implemented (scaffold)');
}
