// The A→Z course generator has to produce something the Lesson 1 engine can
// run blind: only known segment types, sharps-only notes inside the LED range,
// LED_RGB colours, and an ending the engine recognises (awardXP →
// lessonCompleteScreen). The fixture is the analyzeSong one — 8 bars,
// C → Am → F → G twice in the left hand, a 4-bar right-hand phrase repeated —
// so every expectation below traces back to notes we can see.
import { parseMusicXmlScore } from '../omr/musicxmlScore';
import { generateSongLesson, pitchToMidi } from '../omr/songLessonGenerator';
import { ImportedSong } from '../omr/importedSongs';
import { LED_RGB, Segment, SongConfig, noteToMidi } from '../lesson1/data';

// ── fixture builders (copied from analyzeSong.test.ts) ──────────────────────

const CHORD_NOTES: Record<string, [string, string][]> = {
  C: [['C', '3'], ['E', '3'], ['G', '3']],
  Am: [['A', '2'], ['C', '3'], ['E', '3']],
  F: [['F', '2'], ['A', '2'], ['C', '3']],
  G: [['G', '2'], ['B', '2'], ['D', '3']],
  // F major: the IV chord carries the key's one flat
  Bb: [['B', '2'], ['D', '3'], ['F', '3']],
};

function lhChord(label: string, alterFor: Record<string, number> = {}): string {
  const [first, ...rest] = CHORD_NOTES[label];
  const note = (s: string, o: string, chord: boolean) => {
    const alter = alterFor[s] ? `<alter>${alterFor[s]}</alter>` : '';
    return `<note>${chord ? '<chord/>' : ''}<pitch><step>${s}</step>${alter}<octave>${o}</octave></pitch>` +
      `<duration>8</duration><staff>2</staff></note>`;
  };
  return note(first[0], first[1], false) + rest.map(([s, o]) => note(s, o, true)).join('');
}

function rhMelody(notes: [string, string][], alterFor: Record<string, number> = {}, staff = 1): string {
  return notes.map(([s, o]) => {
    const alter = alterFor[s] ? `<alter>${alterFor[s]}</alter>` : '';
    return `<note><pitch><step>${s}</step>${alter}<octave>${o}</octave></pitch><duration>2</duration><staff>${staff}</staff></note>`;
  }).join('');
}

const PHRASE: [string, string][][] = [
  [['E', '4'], ['G', '4'], ['C', '5'], ['G', '4']],
  [['A', '4'], ['E', '4'], ['C', '4'], ['E', '4']],
  [['F', '4'], ['A', '4'], ['C', '5'], ['A', '4']],
  [['G', '4'], ['B', '4'], ['D', '5'], ['B', '4']],
];

function buildSong(): string {
  const loop = ['C', 'Am', 'F', 'G'];
  let out = '<score-partwise><part-list><score-part id="P1"/></part-list><part id="P1">';
  for (let m = 0; m < 8; m++) {
    const attrs = m === 0
      ? '<attributes><divisions>2</divisions><key><fifths>0</fifths></key>' +
        '<time><beats>4</beats><beat-type>4</beat-type></time></attributes><sound tempo="100"/>'
      : '';
    out += `<measure number="${m + 1}">${attrs}${rhMelody(PHRASE[m % 4])}` +
      `<backup><duration>8</duration></backup>${lhChord(loop[m % 4])}</measure>`;
  }
  return out + '</part></score-partwise>';
}

/** Right hand only — one staff, no <staff> element at all. */
function buildSingleStaff(): string {
  let out = '<score-partwise><part-list><score-part id="P1"/></part-list><part id="P1">';
  for (let m = 0; m < 4; m++) {
    const attrs = m === 0 ? '<attributes><divisions>2</divisions><key><fifths>0</fifths></key></attributes>' : '';
    const bar = PHRASE[m].map(([s, o]) =>
      `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>2</duration></note>`).join('');
    out += `<measure number="${m + 1}">${attrs}${bar}</measure>`;
  }
  return out + '</part></score-partwise>';
}

/** F major (one flat): F → Bb → C → F, melody leaning on F, with a Bb4 in it. */
function buildFlatKey(): string {
  const FLAT = { B: -1 };
  const loop = ['F', 'Bb', 'C', 'F'];
  const bars: [string, string][][] = [
    [['F', '4'], ['A', '4'], ['C', '5'], ['A', '4']],
    [['B', '4'], ['D', '5'], ['F', '5'], ['D', '5']],
    [['C', '5'], ['E', '5'], ['G', '5'], ['E', '5']],
    [['F', '4'], ['A', '4'], ['C', '5'], ['F', '4']],
  ];
  let out = '<score-partwise><part-list><score-part id="P1"/></part-list><part id="P1">';
  for (let m = 0; m < 4; m++) {
    const attrs = m === 0
      ? '<attributes><divisions>2</divisions><key><fifths>-1</fifths></key>' +
        '<time><beats>4</beats><beat-type>4</beat-type></time></attributes><sound tempo="90"/>'
      : '';
    out += `<measure number="${m + 1}">${attrs}${rhMelody(bars[m], FLAT)}` +
      `<backup><duration>8</duration></backup>${lhChord(loop[m], FLAT)}</measure>`;
  }
  return out + '</part></score-partwise>';
}

const songFrom = (id: string, xml: string): ImportedSong =>
  ({ id, title: 'Test Song', xml, score: parseMusicXmlScore(xml), pageCount: 1 });

// ── walking the generated course ────────────────────────────────────────────

const SEGMENT_TYPES = new Set<Segment['type']>([
  'mascot', 'typeSay', 'say', 'pause', 'ledOn', 'ledOff', 'sayWithSeq', 'waitPressCount', 'waitPressAll',
  'waitPressOrdered', 'waitPressAny', 'waitNote', 'waitChord', 'waitChordCount', 'followLight', 'songDemo',
  'playAlong', 'quiz', 'nextButton', 'awardXP', 'lessonCompleteScreen',
]);
const LIT_TYPES = new Set<string>(['ledOn', 'sayWithSeq', 'followLight', 'songDemo', 'playAlong']);

/** Every note-name string a segment carries, with whether it will be lit. */
function notesOf(seg: Segment): { note: string; lit: boolean }[] {
  const lit = LIT_TYPES.has(seg.type);
  const out: { note: string; lit: boolean }[] = [];
  const push = (n: unknown) => { if (typeof n === 'string') out.push({ note: n, lit }); };
  if ('note' in seg) push(seg.note);
  if ('notes' in seg && Array.isArray(seg.notes)) seg.notes.forEach(push);
  if (seg.type === 'followLight') seg.sequence.forEach((s) => s.chord.forEach(push));
  if (seg.type === 'songDemo' || seg.type === 'playAlong') {
    Object.values(seg.chordMap).forEach((ns) => ns.forEach(push));
  }
  return out;
}

function colorsOf(seg: Segment): string[] {
  const out: string[] = [];
  if ('color' in seg && typeof seg.color === 'string') out.push(seg.color);
  if (seg.type === 'songDemo' || seg.type === 'playAlong') {
    out.push(seg.ledColor);
    if (seg.leftHandColor) out.push(seg.leftHandColor);
  }
  return out;
}

const isSong = (s: Segment): s is Segment & SongConfig => s.type === 'songDemo' || s.type === 'playAlong';

describe('generateSongLesson — the C → Am → F → G course', () => {
  const course = generateSongLesson(songFrom('test', buildSong()));
  const steps = course.lesson.steps;
  const all = steps.flatMap((s) => s.segments);
  const says = all.filter((s) => s.type === 'say' || s.type === 'typeSay').map((s) => s.text).join(' ');
  const pressAlls = all.filter((s): s is Segment & { type: 'waitPressAll' } => s.type === 'waitPressAll');

  it('carries the course metadata the Lesson screen shows', () => {
    expect(course.id).toBe('course-test');
    expect(course.title).toBe('Test Song');
    expect(course.subtitle).toBe('C major · 100 BPM · 8 bars');
    expect(course.xpReward).toBe(50);
    expect(steps.length).toBeGreaterThanOrEqual(8);
    expect(steps.length).toBeLessThanOrEqual(12);
  });

  it('gives every step a title and only emits segments the engine knows', () => {
    for (const step of steps) {
      expect(step.title.trim().length).toBeGreaterThan(0);
      expect(step.segments.length).toBeGreaterThan(0);
      for (const seg of step.segments) expect(SEGMENT_TYPES.has(seg.type)).toBe(true);
    }
  });

  it('spells every note as a sharps-only key on the board, never lighting C7', () => {
    const seen = all.flatMap(notesOf);
    expect(seen.length).toBeGreaterThan(0);
    for (const { note, lit } of seen) {
      expect(note).toMatch(/^[A-G]#?\d$/);
      const midi = noteToMidi(note);
      expect(midi).toBeGreaterThanOrEqual(36);
      expect(midi).toBeLessThanOrEqual(96);
      if (lit) expect(note).not.toBe('C7');
    }
  });

  it('only uses LED_RGB colours', () => {
    const colors = all.flatMap(colorsOf);
    expect(colors.length).toBeGreaterThan(0);
    for (const c of colors) expect(Object.keys(LED_RGB)).toContain(c);
  });

  it('ends with awardXP then lessonCompleteScreen, and the XP adds up to the reward', () => {
    const last = steps[steps.length - 1].segments;
    expect(last[last.length - 1].type).toBe('lessonCompleteScreen');
    expect(last[last.length - 2].type).toBe('awardXP');
    const total = all.reduce((sum, s) => sum + (s.type === 'awardXP' ? s.amount : 0), 0);
    expect(total).toBe(50);
    for (const s of all) if (s.type === 'awardXP') expect(s.amount).toBeGreaterThanOrEqual(0);
    expect(all.filter((s) => s.type === 'lessonCompleteScreen')).toHaveLength(1);
  });

  it('drills every left-hand chord as a play-it-all quiz on the analysed voicing', () => {
    expect(pressAlls.some((q) => q.notes.join() === 'C3,E3,G3')).toBe(true);
    expect(pressAlls.some((q) => q.notes.join() === 'A3,C4,E4')).toBe(true);
    expect(pressAlls.some((q) => q.notes.join() === 'F3,A3,C4')).toBe(true);
    expect(pressAlls.some((q) => q.notes.join() === 'G3,B3,D4')).toBe(true);
    for (const q of pressAlls) {
      expect(q.anyOrder).toBe(true);
      expect(q.turnOffOnPress).toBe(true);
      expect(q.onWrongKey).toEqual({ led: 'redFlash' });
    }
  });

  it('demos each chord cool, then hints it yellow, then waits, then pays 5 XP', () => {
    const lh = steps.find((s) => s.title === 'Left hand')!;
    const segs = lh.segments;
    const i = segs.findIndex((s) => s.type === 'ledOn' && s.notes !== 'all' && s.notes.join() === 'C3,E3,G3');
    expect(i).toBeGreaterThan(-1);
    expect(segs[i]).toMatchObject({ type: 'ledOn', color: 'cool' });
    expect(segs[i + 1]).toEqual({ type: 'pause', ms: 1500 });
    expect(segs[i + 2]).toEqual({ type: 'ledOff', notes: ['C3', 'E3', 'G3'] });
    expect(segs[i + 3].type).toBe('say');
    expect(segs[i + 4]).toEqual({ type: 'ledOn', notes: ['C3', 'E3', 'G3'], color: 'yellow' });
    expect(segs[i + 5].type).toBe('waitPressAll');
    expect(segs[i + 6]).toEqual({ type: 'awardXP', amount: 5 });
  });

  it('runs the chord loop on the real play-along: demo then play, left-hand root first', () => {
    const demoIdx = all.findIndex((s) => s.type === 'songDemo');
    const demo = all[demoIdx];
    const play = all[demoIdx + 2];
    expect(isSong(demo) && demo.chart.map((b) => b.chord)).toEqual(['C', 'Am', 'F', 'G']);
    expect(play.type).toBe('playAlong');
    if (!isSong(demo) || !isSong(play)) throw new Error('expected a song pair');
    expect(play.chart).toEqual(demo.chart);
    for (const bar of demo.chart) expect(demo.chordMap[bar.chord]).toBeDefined();
    expect(demo.chordMap.C).toEqual(['C3', 'C4', 'E4', 'G4']); // Lesson 1's own C voicing
    expect(demo.chordMap.G).toEqual(['G2', 'G3', 'B3', 'D4']);
    expect(demo.chordMap.Am).toEqual(['A2', 'A3', 'C4', 'E4']);
    expect(demo.chordMap.F).toEqual(['F2', 'F3', 'A3', 'C4']);
    expect(demo).toMatchObject({
      song: 'Test Song', displayMode: 'chords', gateMode: 'pauseUntilCorrect', ignoreWrongKeys: true,
      ledLookAheadMs: 600, ledColor: 'warm', leftHandColor: 'cool', windowMs: 250,
    });
    for (const bar of demo.chart) expect(bar.lyric).toBe('');
  });

  it('performs the whole song, one chart bar per measure', () => {
    const songs = all.filter(isSong);
    const perform = songs[songs.length - 1];
    expect(perform.type).toBe('playAlong');
    expect(perform.chart.map((b) => b.chord)).toEqual(['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G']);
  });

  it('teaches the WHY: key, circle of fifths, counting, metronome, pedal', () => {
    expect(says).toContain('C major');
    expect(says).toContain('circle of fifths');
    expect(says).toContain('F major');   // the circle neighbours
    expect(says).toContain('G major');
    expect(says).toContain('A minor');   // the relative key
    expect(says).toContain('4 beats per bar');
    expect(says).toContain('metronome');
    expect(says).toContain('pedal');
    expect(says).toContain('C → Am → F → G');
  });

  it('finds home base on a single key with a yellow hint', () => {
    const key = steps.find((s) => s.title === 'The key')!;
    const wait = key.segments.find((s) => s.type === 'waitPressCount');
    expect(wait).toMatchObject({ type: 'waitPressCount', note: 'C4', count: 1 });
    expect(key.segments).toContainEqual({ type: 'ledOn', notes: ['C4'], color: 'yellow' });
  });

  it('puts the left hand before the right hand, then hands together', () => {
    const titles = steps.map((s) => s.title);
    const lh = titles.findIndex((t) => t.startsWith('Left hand'));
    const rh = titles.findIndex((t) => t.startsWith('Right hand'));
    const both = titles.findIndex((t) => t.startsWith('Hands together'));
    expect(lh).toBeGreaterThan(-1);
    expect(rh).toBeGreaterThan(lh);
    expect(both).toBeGreaterThan(rh);
    expect(titles[0]).toBe('Overview');
    expect(titles[titles.length - 1]).toBe('Perform');
  });

  it('demos the melody phrase warm and waits for it in order', () => {
    const rh = steps.find((s) => s.title.startsWith('Right hand'))!;
    const demo = rh.segments.find((s) => s.type === 'sayWithSeq');
    expect(demo).toMatchObject({ type: 'sayWithSeq', color: 'warm', notes: ['E4', 'G4', 'C5', 'G4', 'A4', 'E4', 'C4', 'E4'] });
    const wait = rh.segments.find((s) => s.type === 'waitPressOrdered');
    expect(wait).toMatchObject({ type: 'waitPressOrdered', notes: ['E4', 'G4', 'C5', 'G4', 'A4', 'E4', 'C4', 'E4'], onWrongOrder: { led: 'redFlash' } });
    expect(demo && 'notes' in demo && demo.notes.length).toBeLessThanOrEqual(8);
  });

  it('asks for hands together as one chord per bar within a 400ms window', () => {
    const both = steps.find((s) => s.title === 'Hands together')!;
    const chords = both.segments.filter((s): s is Segment & { type: 'waitChord' } => s.type === 'waitChord');
    expect(chords.length).toBeGreaterThan(0);
    expect(chords.length).toBeLessThanOrEqual(4);
    expect(chords[0]).toMatchObject({ notes: ['C3', 'E3', 'G3', 'E4'], windowMs: 400 });
    // hinted first: the chord cool, the melody note warm
    const i = both.segments.indexOf(chords[0]);
    expect(both.segments[i - 2]).toEqual({ type: 'ledOn', notes: ['C3', 'E3', 'G3'], color: 'cool' });
    expect(both.segments[i - 1]).toEqual({ type: 'ledOn', notes: ['E4'], color: 'warm' });
  });

  it('lets the learner set the pace on the informational steps', () => {
    for (const title of ['Overview', 'Count it', 'Dynamics & pedal']) {
      const step = steps.find((s) => s.title === title)!;
      expect(step.segments[step.segments.length - 1]).toEqual({ type: 'nextButton' });
    }
  });
});

describe('generateSongLesson — other scores', () => {
  it('still generates for a right-hand-only score, without a hands-together step', () => {
    const course = generateSongLesson(songFrom('solo', buildSingleStaff()));
    const titles = course.lesson.steps.map((s) => s.title);
    expect(titles).not.toContain('Hands together');
    expect(titles.some((t) => t.startsWith('Right hand'))).toBe(true);
    const all = course.lesson.steps.flatMap((s) => s.segments);
    expect(all[all.length - 1].type).toBe('lessonCompleteScreen');
    expect(all.reduce((sum, s) => sum + (s.type === 'awardXP' ? s.amount : 0), 0)).toBe(50);
  });

  it('spells a flat key with sharps only', () => {
    const course = generateSongLesson(songFrom('flat', buildFlatKey()));
    expect(course.subtitle.startsWith('F major')).toBe(true);
    const all = course.lesson.steps.flatMap((s) => s.segments);
    const notes = all.flatMap(notesOf).map((n) => n.note);
    expect(notes.length).toBeGreaterThan(0);
    for (const n of notes) expect(n).toMatch(/^[A-G]#?\d$/);
    // the Bb chord became A#, and the analysis's "Bb3" spelling never leaked through
    expect(notes).toContain('A#3');
    const pressAlls = all.filter((s): s is Segment & { type: 'waitPressAll' } => s.type === 'waitPressAll');
    expect(pressAlls.some((q) => q.notes.join() === 'A#3,D4,F4')).toBe(true);
    const songs = all.filter(isSong);
    expect(songs[0].chordMap.Bb).toEqual(['A#2', 'A#3', 'D4', 'F4']);
  });

  it('understands every spelling the analysis or the parser can hand it', () => {
    expect(pitchToMidi('C4')).toBe(60);
    expect(pitchToMidi('Bb3')).toBe(58);
    expect(pitchToMidi('A#3')).toBe(58);
    expect(pitchToMidi('Cb4')).toBe(59);
    expect(pitchToMidi('F##4')).toBe(67);
    expect(pitchToMidi('H4')).toBe(-1);
  });
});
