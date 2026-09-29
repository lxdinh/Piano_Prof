import { parseMidiPackets } from '../lesson1/midi';

describe('parseMidiPackets', () => {
  it('decodes a note-on with velocity', () => {
    expect(parseMidiPackets([0x90, 60, 100])).toEqual([{ type: 'on', note: 60, vel: 100 }]);
  });

  it('treats note-on velocity 0 as a note-off', () => {
    expect(parseMidiPackets([0x90, 60, 0])).toEqual([{ type: 'off', note: 60, vel: 0 }]);
  });

  it('decodes an explicit note-off with release velocity', () => {
    expect(parseMidiPackets([0x80, 64, 40])).toEqual([{ type: 'off', note: 64, vel: 40 }]);
  });

  it('decodes the sustain pedal (CC64) down and up', () => {
    expect(parseMidiPackets([0xb0, 0x40, 127])).toEqual([{ type: 'pedal', down: true }]);
    expect(parseMidiPackets([0xb0, 0x40, 0])).toEqual([{ type: 'pedal', down: false }]);
  });

  it('masks the MIDI channel (note-on on channel 3)', () => {
    expect(parseMidiPackets([0x92, 67, 80])).toEqual([{ type: 'on', note: 67, vel: 80 }]);
  });

  it('parses several messages packed in one notify', () => {
    expect(parseMidiPackets([0x90, 60, 90, 0x90, 64, 90, 0x80, 60, 0])).toEqual([
      { type: 'on', note: 60, vel: 90 },
      { type: 'on', note: 64, vel: 90 },
      { type: 'off', note: 60, vel: 0 },
    ]);
  });

  it('ignores unrelated control changes and trailing bytes', () => {
    expect(parseMidiPackets([0xb0, 0x07, 100, 0x90, 60])).toEqual([]); // CC7 volume + a truncated msg
  });
});
