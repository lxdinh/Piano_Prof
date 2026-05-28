import { noteToMidi, notesToMidi } from '../lessons/noteToMidi';

describe('noteToMidi', () => {
  it('maps middle C to 60', () => {
    expect(noteToMidi('C4')).toBe(60);
  });

  it('handles sharps and flats', () => {
    expect(noteToMidi('C#4')).toBe(61);
    expect(noteToMidi('Db4')).toBe(61);
    expect(noteToMidi('A4')).toBe(69); // concert pitch
  });

  it('handles octaves', () => {
    expect(noteToMidi('C2')).toBe(36);
    expect(noteToMidi('C6')).toBe(84);
  });

  it('rejects garbage', () => {
    expect(noteToMidi('H9')).toBeNull();
    expect(noteToMidi('')).toBeNull();
  });

  it('filters invalid notes in a list', () => {
    expect(notesToMidi(['C4', 'bad', 'E4'])).toEqual([60, 64]);
  });
});
