import {
  LESSON_1, CHORDS, noteToMidi, midiToNote, noteToLedIndex, chordDisplayName,
  KEY_LOW_MIDI, KEY_HIGH_MIDI, LED_LOW_MIDI, LED_HIGH_MIDI,
  SONG_SMALL_TOWN_GIRL, SONG_LOVE_STORY, SONG_DSB_CHORUS, CHORD_WINDOW_MS,
} from '../lesson1/data';
import { bytesToB64, b64ToBytes } from '../lesson1/b64';

describe('note mapping (spec: C2=36 … C7=96)', () => {
  it('round-trips notes and midis', () => {
    expect(noteToMidi('C4')).toBe(60);
    expect(noteToMidi('C2')).toBe(KEY_LOW_MIDI);
    expect(noteToMidi('C7')).toBe(KEY_HIGH_MIDI);
    expect(midiToNote(60)).toBe('C4');
    expect(midiToNote(95)).toBe('B6');
  });
  it('ledIndex = midi − 36, C7 has NO LED', () => {
    expect(noteToLedIndex(LED_LOW_MIDI)).toBe(0);
    expect(noteToLedIndex(LED_HIGH_MIDI)).toBe(59);
    expect(noteToLedIndex(96)).toBe(-1); // C7 — never light
    expect(noteToLedIndex(35)).toBe(-1);
  });
});

describe('chords (compact voicing, F3–G4)', () => {
  it('has the 4 pop chords with left-hand roots', () => {
    expect(CHORDS.C.right).toEqual(['C4', 'E4', 'G4']);
    expect(CHORDS.G.right).toEqual(['G3', 'B3', 'D4']);
    expect(CHORDS.Am.right).toEqual(['A3', 'C4', 'E4']);
    expect(CHORDS.F.right).toEqual(['F3', 'A3', 'C4']);
    expect(CHORDS.C.left).toBe('C3');
  });
  it('all voiced notes sit inside the keyboard range', () => {
    Object.values(CHORDS).forEach((c) => {
      [...c.right, c.left].forEach((n) => {
        const m = noteToMidi(n);
        expect(m).toBeGreaterThanOrEqual(KEY_LOW_MIDI);
        expect(m).toBeLessThanOrEqual(KEY_HIGH_MIDI);
      });
    });
  });
  it('names chords with and without the left hand', () => {
    expect(chordDisplayName(CHORDS.Am.right)).toBe('Am');
    expect(chordDisplayName([CHORDS.F.left, ...CHORDS.F.right])).toBe('F');
  });
});

describe('LESSON_1 structure (First Touch → First Songs)', () => {
  it('has the 6 sections in order', () => {
    expect(LESSON_1.steps.map((s) => s.title)).toEqual([
      'First Touch', 'The Keyboard & 7 Notes', '4 Chords',
      'Follow the Light', 'Play Your First Songs', 'Add Your Left Hand',
    ]);
  });
  it('every referenced note is a valid key', () => {
    for (const step of LESSON_1.steps) {
      for (const seg of step.segments) {
        const notes: string[] =
          'notes' in seg && Array.isArray((seg as { notes?: unknown }).notes)
            ? ((seg as { notes: string[] }).notes)
            : 'note' in seg ? [(seg as { note: string }).note] : [];
        notes.forEach((n) => expect(noteToMidi(n)).toBeGreaterThanOrEqual(KEY_LOW_MIDI));
      }
    }
  });
  it('ends with celebration → XP → complete screen', () => {
    const last = LESSON_1.steps[LESSON_1.steps.length - 1].segments;
    const types = last.map((s) => s.type);
    expect(types).toContain('awardXP');
    expect(types[types.length - 1]).toBe('lessonCompleteScreen');
    const xp = last.find((s) => s.type === 'awardXP');
    expect(xp && 'amount' in xp && xp.amount).toBe(50);
  });
  it('song charts only use mapped chords and the strict window', () => {
    [SONG_SMALL_TOWN_GIRL, SONG_LOVE_STORY, SONG_DSB_CHORUS].forEach((song) => {
      expect(song.windowMs).toBe(CHORD_WINDOW_MS);
      song.chart.forEach((bar) => expect(song.chordMap[bar.chord]).toBeDefined());
    });
    // left-hand chorus maps put the left note first
    expect(SONG_DSB_CHORUS.chordMap.C[0]).toBe('C3');
  });
});

describe('BLE base64 codec', () => {
  it('round-trips LED packets', () => {
    const pkt = [0x01, 2, 24, 88, 204, 2, 31, 0, 205, 255];
    expect(b64ToBytes(bytesToB64(pkt))).toEqual(pkt);
    expect(b64ToBytes(bytesToB64([0x02]))).toEqual([0x02]);
    expect(b64ToBytes(bytesToB64([0x03, 1, 2, 24, 28]))).toEqual([0x03, 1, 2, 24, 28]);
  });
});
