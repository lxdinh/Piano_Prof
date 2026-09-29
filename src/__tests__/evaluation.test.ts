import { evaluateNote, DYN_VELOCITY, PlayedNote, TargetNote } from '../lesson1/evaluation';

const played = (p: Partial<PlayedNote> = {}): PlayedNote => ({ note: 'C4', vel: 88, onset: 1000, durationMs: 500, ...p });

describe('evaluateNote', () => {
  it('scores a perfect note 100', () => {
    const e = evaluateNote(played(), { note: 'C4' });
    expect(e.pitchOk).toBe(true);
    expect(e.score).toBe(100);
    expect(e.cue).toBe('Nice!');
  });

  it('fails on wrong pitch (score 0)', () => {
    const e = evaluateNote(played({ note: 'D4' }), { note: 'C4' });
    expect(e.pitchOk).toBe(false);
    expect(e.score).toBe(0);
    expect(e.cue).toMatch(/again/i);
  });

  it('flags late timing against an expected onset', () => {
    const e = evaluateNote(played({ onset: 1300 }), { note: 'C4' }, { expectedOnset: 1000 });
    expect(e.timing).toBe('late');
    expect(e.timingMs).toBe(300);
    expect(e.score).toBe(80);
    expect(e.cue).toBe('A touch late');
  });

  it('accepts small timing errors as on time', () => {
    const e = evaluateNote(played({ onset: 1050 }), { note: 'C4' }, { expectedOnset: 1000 });
    expect(e.timing).toBe('onTime');
  });

  it('flags a note held too short', () => {
    const e = evaluateNote(played({ durationMs: 200 }), { note: 'C4', durationBeats: 1 }, { msPerBeat: 600 });
    expect(e.duration).toBe('short');
    expect(e.cue).toBe('Hold it a little longer');
  });

  it('flags playing too soft for a forte target', () => {
    const e = evaluateNote(played({ vel: 50 }), { note: 'C4', dynamic: 'f' });
    expect(e.dynamics).toBe('soft');
    expect(e.cue).toBe('Press a bit firmer');
    expect(DYN_VELOCITY.f).toBeGreaterThan(DYN_VELOCITY.p);
  });

  it('prioritizes the pitch cue over timing/dynamics', () => {
    const t: TargetNote = { note: 'C4', dynamic: 'f' };
    const e = evaluateNote(played({ note: 'E4', vel: 30, onset: 1400 }), t, { expectedOnset: 1000 });
    expect(e.cue).toMatch(/again/i);
  });
});
