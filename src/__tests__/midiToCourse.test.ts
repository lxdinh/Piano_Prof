// End to end for the "copy before you scan" path: a MIDI file in, a runnable
// A-to-Z course out, with nothing recognised along the way. Exercises the MIDI
// reader → MusicXML writer → parser → analysis → course generator chain on a
// two-hand C→G→Am→F loop the way a MuseScore export would arrive.
import { detectKind, scoreFileToMusicXml } from '../omr/importFile';
import { parseMusicXmlScore } from '../omr/musicxmlScore';
import { analyzeSong } from '../omr/analyzeSong';
import { generateSongLesson } from '../omr/songLessonGenerator';
import { LED_RGB, noteToMidi } from '../lesson1/data';

// expo-file-system ships ESM; the logic project never touches it here (jest hoists this above the imports).
jest.mock('expo-file-system', () => ({}));

// ── minimal Standard MIDI File builder ───────────────────────────────────────
const vlq = (n: number): number[] => {
  const out = [n & 0x7f];
  n >>= 7;
  while (n > 0) { out.unshift((n & 0x7f) | 0x80); n >>= 7; }
  return out;
};
const u32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const u16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
const chunk = (id: string, body: number[]) => [...id.split('').map((c) => c.charCodeAt(0)), ...u32(body.length), ...body];
const meta = (type: number, data: number[]) => [0xff, type, ...vlq(data.length), ...data];
const TPQ = 480;

/** events: [deltaTicks, ...bytes][] */
const track = (events: number[][]) => chunk('MTrk', [...events.flatMap(([dt, ...b]) => [...vlq(dt), ...b]), ...vlq(0), ...meta(0x2f, [])]);

function twoHandMidi(): Uint8Array {
  const chords: [number, number[], number][] = [
    // bar: melody note (RH), triad (LH root position octave 3)
    [72, [48, 52, 55], 0], [71, [43, 47, 50], 0], [69, [45, 48, 52], 0], [65, [41, 45, 48], 0],
    [72, [48, 52, 55], 0], [71, [43, 47, 50], 0], [69, [45, 48, 52], 0], [65, [41, 45, 48], 0],
  ];
  const rh: number[][] = [[0, ...meta(0x03, 'Loop in C'.split('').map((c) => c.charCodeAt(0)))]];
  const lh: number[][] = [];
  for (const [mel, triad] of chords) {
    // RH: four quarter notes per bar walking the melody note and its neighbours
    const steps = [mel, mel + 2, mel + 4, mel + 2];
    for (const n of steps) { rh.push([0, 0x90, n, 90]); rh.push([TPQ, 0x80, n, 0]); }
    // LH: block triad held for the bar
    triad.forEach((n) => lh.push([0, 0x90, n, 80]));
    triad.forEach((n, i) => lh.push([i === 0 ? TPQ * 4 : 0, 0x80, n, 0]));
  }
  const tempo = 100;
  const us = Math.round(60_000_000 / tempo);
  const conductor = [[0, ...meta(0x51, [(us >> 16) & 0xff, (us >> 8) & 0xff, us & 0xff])], [0, ...meta(0x58, [4, 2, 24, 8])], [0, ...meta(0x59, [0, 0])]];
  const header = chunk('MThd', [...u16(1), ...u16(3), ...u16(TPQ)]);
  return Uint8Array.from([...header, ...track(conductor), ...track(rh), ...track(lh)]);
}

describe('MIDI file → course, no scanning', () => {
  const bytes = twoHandMidi();

  it('is recognised as MIDI by its bytes alone', () => {
    expect(detectKind('song.bin', 'application/octet-stream', bytes.slice(0, 8))).toBe('midi');
  });

  it('round-trips into a two-hand score with the right key, tempo and chords', () => {
    const xml = scoreFileToMusicXml('midi', bytes, 'fallback');
    expect(xml).toContain('<score-partwise');
    const score = parseMusicXmlScore(xml);
    expect(score.measureCount).toBe(8);
    expect(Math.round(score.tempoBpm)).toBe(100);
    expect(score.events.some((e) => e.staff === 2)).toBe(true);
    expect(score.events.some((e) => e.staff === 1)).toBe(true);
    const a = analyzeSong(score, xml);
    expect(a.key.name).toBe('C major');
    expect(a.chords.map((c) => c.label)).toEqual(['C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F']);
    expect(a.loop).toEqual({ labels: ['C', 'G', 'Am', 'F'], repeats: 2 });
  });

  it('generates a course the lesson engine can run, with sharps-only lit notes', () => {
    const xml = scoreFileToMusicXml('midi', bytes, 'fallback');
    const score = parseMusicXmlScore(xml);
    const course = generateSongLesson({ id: 'midi-1', title: 'Loop in C', xml, score, pageCount: 1 });
    expect(course.id).toBe('course-midi-1');
    expect(course.lesson.steps.length).toBeGreaterThanOrEqual(6);
    const segs = course.lesson.steps.flatMap((s) => s.segments);
    const last = segs[segs.length - 1];
    expect(last.type).toBe('lessonCompleteScreen');
    let xp = 0;
    for (const seg of segs) {
      if (seg.type === 'awardXP') xp += seg.amount;
      if ('notes' in seg && Array.isArray(seg.notes)) {
        for (const n of seg.notes) {
          expect(n).toMatch(/^[A-G]#?\d$/);
          expect(noteToMidi(n)).toBeGreaterThanOrEqual(36);
          expect(noteToMidi(n)).toBeLessThanOrEqual(96);
        }
      }
      if ('color' in seg && typeof seg.color === 'string') expect(Object.keys(LED_RGB)).toContain(seg.color);
    }
    expect(xp).toBe(50);
    expect(segs.some((s) => s.type === 'waitPressAll' && s.notes.join() === 'C3,E3,G3')).toBe(true);
  });
});
