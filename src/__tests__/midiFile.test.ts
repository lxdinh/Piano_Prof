import { parseMidiFile } from '../omr/midiFile';
import { buildMusicXml } from '../omr/musicxmlWriter';
import { parseMusicXmlScore } from '../omr/musicxmlScore';

// ---- tiny SMF builder -------------------------------------------------------

const vlq = (n: number): number[] => {
  const out = [n & 0x7f];
  let v = n >> 7;
  while (v > 0) {
    out.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return out;
};
const u32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const u16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
const chunk = (id: string, body: number[]) => [...id.split('').map((c) => c.charCodeAt(0)), ...u32(body.length), ...body];

/** A track is a list of [deltaTicks, ...messageBytes]; end-of-track is appended. */
const track = (events: number[][]) =>
  chunk('MTrk', [...events.flatMap(([delta, ...msg]) => [...vlq(delta), ...msg]), 0x00, 0xff, 0x2f, 0x00]);

const smf = (format: number, division: number, tracks: number[][][]) =>
  new Uint8Array([
    ...chunk('MThd', [...u16(format), ...u16(tracks.length), ...u16(division)]),
    ...tracks.flatMap(track),
  ]);

const meta = (type: number, data: number[]) => [0xff, type, ...vlq(data.length), ...data];
const tempoMeta = (bpm: number) => {
  const mpq = Math.round(60_000_000 / bpm);
  return meta(0x51, [(mpq >> 16) & 0xff, (mpq >> 8) & 0xff, mpq & 0xff]);
};
const timeMeta = (nn: number, ddPow: number) => meta(0x58, [nn, ddPow, 24, 8]);
const keyMeta = (sf: number, minor = 0) => meta(0x59, [sf & 0xff, minor]);
const nameMeta = (s: string) => meta(0x03, s.split('').map((c) => c.charCodeAt(0)));
const on = (ch: number, key: number, vel = 90) => [0x90 | ch, key, vel];
const off = (ch: number, key: number) => [0x80 | ch, key, 0];

const TPQ = 480;
const q = TPQ; // one quarter in ticks

// ---- tests ------------------------------------------------------------------

describe('parseMidiFile', () => {
  it('rejects bytes that are not a MIDI file', () => {
    expect(() => parseMidiFile(new Uint8Array([1, 2, 3]))).toThrow('Not a MIDI file');
    expect(() => parseMidiFile(new Uint8Array('RIFF............'.split('').map((c) => c.charCodeAt(0))))).toThrow(
      'Not a MIDI file',
    );
  });

  it('reads a format 0 file: tempo, time and key meta, notes split by pitch', () => {
    const bytes = smf(0, TPQ, [
      [
        [0, ...nameMeta('Minuet')],
        [0, ...tempoMeta(96)],
        [0, ...timeMeta(3, 2)],
        [0, ...keyMeta(-1)],
        [0, ...on(0, 72)],
        [0, ...on(0, 48)],
        [q, ...off(0, 72)],
        [0, ...on(0, 74)],
        [q, ...off(0, 74)],
        [q, ...off(0, 48)],
      ],
    ]);
    const s = parseMidiFile(bytes);
    expect(s.title).toBe('Minuet');
    expect(s.tempoBpm).toBe(96);
    expect(s.beatsPerMeasure).toBe(3);
    expect(s.beatType).toBe(4);
    expect(s.fifths).toBe(-1);
    expect(s.rh).toEqual([
      { midi: 72, startBeats: 0, durBeats: 1 },
      { midi: 74, startBeats: 1, durBeats: 1 },
    ]);
    expect(s.lh).toEqual([{ midi: 48, startBeats: 0, durBeats: 3 }]);
  });

  it('prefers an explicit fallback title over the track name, and defaults when neither exists', () => {
    const bytes = smf(0, TPQ, [[[0, ...nameMeta('From file')], [0, ...on(0, 60)], [q, ...off(0, 60)]]]);
    expect(parseMidiFile(bytes, 'My song').title).toBe('My song');
    const noName = smf(0, TPQ, [[[0, ...on(0, 60)], [q, ...off(0, 60)]]]);
    expect(parseMidiFile(noName).title).toBe('MIDI import');
    expect(parseMidiFile(noName).tempoBpm).toBe(120);
    expect(parseMidiFile(noName).beatsPerMeasure).toBe(4);
    expect(parseMidiFile(noName).fifths).toBe(0);
  });

  it('reads a format 1 file with two melodic tracks, using the higher track as the right hand', () => {
    const bytes = smf(1, 96, [
      [[0, ...tempoMeta(72)], [0, ...timeMeta(6, 3)], [0, ...keyMeta(2)]],
      // low track first on purpose: hand assignment is by average pitch, not order
      [[0, ...on(1, 40)], [96 * 3, ...off(1, 40)], [0, ...on(1, 47)], [96 * 3, ...off(1, 47)]],
      [[0, ...on(0, 76)], [48, ...off(0, 76)], [0, ...on(0, 79)], [48, ...off(0, 79)]],
    ]);
    const s = parseMidiFile(bytes);
    expect(s.tempoBpm).toBe(72);
    expect(s.beatsPerMeasure).toBe(6);
    expect(s.beatType).toBe(8);
    expect(s.fifths).toBe(2);
    expect(s.rh).toEqual([
      { midi: 76, startBeats: 0, durBeats: 0.5 },
      { midi: 79, startBeats: 0.5, durBeats: 0.5 },
    ]);
    expect(s.lh).toEqual([
      { midi: 40, startBeats: 0, durBeats: 3 },
      { midi: 47, startBeats: 3, durBeats: 3 },
    ]);
  });

  it('handles running status and note-on with velocity 0 as note-off', () => {
    const bytes = smf(0, TPQ, [
      [
        [0, 0x90, 60, 100], // C4 on
        [0, 64, 100], // E4 on (running status)
        [q, 60, 0], // C4 off via vel 0 (running status)
        [q, 64, 0], // E4 off
        [0, 67, 80], // G4 on
        [q / 2, 0x80, 67, 0], // explicit off
      ],
    ]);
    const s = parseMidiFile(bytes);
    expect(s.rh).toEqual([
      { midi: 60, startBeats: 0, durBeats: 1 },
      { midi: 64, startBeats: 0, durBeats: 2 },
      { midi: 67, startBeats: 2, durBeats: 0.5 },
    ]);
    expect(s.lh).toEqual([]);
  });

  it('skips a channel-10 percussion track and sysex, and does not count it as a hand', () => {
    const bytes = smf(1, TPQ, [
      [[0, ...tempoMeta(120)]],
      [[0, ...on(9, 36)], [q, ...off(9, 36)], [0, ...on(9, 38)], [q, ...off(9, 38)]],
      [
        [0, 0xf0, 3, 0x7e, 0x09, 0xf7], // sysex, length 3
        [0, ...on(0, 55)],
        [q, ...off(0, 55)],
        [0, ...on(0, 67)],
        [q, ...off(0, 67)],
        [0, 0xb0, 64, 127], // controller, ignored
        [0, 0xc0, 1], // program change (1 data byte), ignored
        [0, 0xe0, 0, 64], // pitch bend, ignored
      ],
    ]);
    const s = parseMidiFile(bytes);
    // Only one melodic track → split by pitch, not by track.
    expect(s.rh).toEqual([{ midi: 67, startBeats: 1, durBeats: 1 }]);
    expect(s.lh).toEqual([{ midi: 55, startBeats: 0, durBeats: 1 }]);
  });

  it('reports SMPTE division as unsupported instead of producing garbage', () => {
    const bytes = smf(0, 0xe728, [[[0, ...on(0, 60)], [10, ...off(0, 60)]]]);
    expect(() => parseMidiFile(bytes)).toThrow(/SMPTE/);
  });

  it('closes notes still sounding at end of track and uses the earliest tempo', () => {
    const bytes = smf(1, TPQ, [
      [[q * 4, ...tempoMeta(60)], [0, ...tempoMeta(180)]],
      [[0, ...tempoMeta(140)], [0, ...on(0, 62)], [q * 2, ...on(0, 65)], [q, ...off(0, 65)]],
    ]);
    const s = parseMidiFile(bytes);
    expect(s.tempoBpm).toBe(140);
    expect(s.rh).toEqual([
      { midi: 62, startBeats: 0, durBeats: 3 },
      { midi: 65, startBeats: 2, durBeats: 1 },
    ]);
  });

  it('round-trips MIDI → MusicXML → parsed score with the same events', () => {
    const bytes = smf(1, TPQ, [
      [[0, ...nameMeta('Roundtrip')], [0, ...tempoMeta(110)], [0, ...timeMeta(4, 2)], [0, ...keyMeta(-2)]],
      [
        [0, ...on(0, 70)],
        [0, ...on(0, 74)],
        [q, ...off(0, 70)],
        [0, ...off(0, 74)],
        [0, ...on(0, 75)],
        [q / 2, ...off(0, 75)],
        [0, ...on(0, 77)],
        [q / 2, ...off(0, 77)],
        [0, ...on(0, 79)],
        [q * 3, ...off(0, 79)], // 2 beats → crosses the barline
      ],
      [[0, ...on(1, 46)], [q * 4, ...off(1, 46)], [0, ...on(1, 51)], [q * 2, ...off(1, 51)]],
    ]);
    const input = parseMidiFile(bytes);
    const xml = buildMusicXml(input);
    const score = parseMusicXmlScore(xml);
    expect(score.tempoBpm).toBe(110);
    expect(score.fifths).toBe(-2);
    expect(score.beatsPerMeasure).toBe(4);
    expect(score.measureCount).toBe(2);
    expect(xml).toContain('<work-title>Roundtrip</work-title>');
    const got = score.events
      .map((e) => ({ midi: e.midi, staff: e.staff, start: e.startBeats, dur: e.durBeats }))
      .sort((a, b) => a.start - b.start || a.staff - b.staff || a.midi - b.midi);
    const want = [
      ...input.rh.map((n) => ({ midi: n.midi, staff: 1, start: n.startBeats, dur: n.durBeats })),
      ...input.lh.map((n) => ({ midi: n.midi, staff: 2, start: n.startBeats, dur: n.durBeats })),
    ].sort((a, b) => a.start - b.start || a.staff - b.staff || a.midi - b.midi);
    expect(got).toEqual(want);
    expect(score.events.find((e) => e.midi === 70)?.note).toBe('Bb4');
    expect(score.events.find((e) => e.midi === 75)?.note).toBe('Eb5');
  });
});
