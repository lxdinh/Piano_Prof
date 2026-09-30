// Does a generated song course actually RUN in the real engine?
//
// songLessonGenerator.test.ts proves the course LOOKS right — known segment
// types, sharps-only notes, the XP adds up. That is a static check. This one
// hands the course to the real LessonEngine, plays every "your turn" moment
// through the SimulatorPiano exactly as a learner on the on-screen keys would,
// and asserts the engine reaches `completeScreen` with the full reward — with
// no wrong-key flashes, no segment failures and a dark LED strip at the end.
//
// The fixture is the generator test's 8-bar C → Am → F → G song, so any stall
// can be traced back to a segment we can read.
import { parseMusicXmlScore } from '../omr/musicxmlScore';
import { generateSongLesson, GeneratedCourse } from '../omr/songLessonGenerator';
import { ImportedSong } from '../omr/importedSongs';
import { Segment, noteToMidi } from '../lesson1/data';
import { LessonEngine, EngineUI, SongCtl } from '../lesson1/engine';
import { HwFacade, SimulatorPiano } from '../lesson1/hal';

// Real expo-speech calls onDone when the line finishes; calling it at once
// makes every spoken line resolve in microtasks so the run is bounded by the
// engine's own pauses, not by speech length.
jest.mock('expo-speech', () => ({
  speak: jest.fn((_text: string, opts?: { onDone?: () => void }) => { opts?.onDone?.(); }),
  stop: jest.fn(),
  getAvailableVoicesAsync: jest.fn(async () => []),
}));
jest.mock('../audio/pianoEngine', () => ({
  playMidi: jest.fn(async () => {}), stopAll: jest.fn(async () => {}),
  initAudio: jest.fn(async () => {}), preloadCore: jest.fn(async () => {}),
  setPianoEnabled: jest.fn(),
}));
jest.mock('../feedback/haptics', () => ({
  tap: jest.fn(), success: jest.fn(), error: jest.fn(), star: jest.fn(),
}));

// ── fixture builders (the songLessonGenerator.test.ts score) ────────────────

const CHORD_NOTES: Record<string, [string, string][]> = {
  C: [['C', '3'], ['E', '3'], ['G', '3']],
  Am: [['A', '2'], ['C', '3'], ['E', '3']],
  F: [['F', '2'], ['A', '2'], ['C', '3']],
  G: [['G', '2'], ['B', '2'], ['D', '3']],
};

function lhChord(label: string): string {
  const [first, ...rest] = CHORD_NOTES[label];
  const note = (s: string, o: string, chord: boolean) =>
    `<note>${chord ? '<chord/>' : ''}<pitch><step>${s}</step><octave>${o}</octave></pitch>` +
    `<duration>8</duration><staff>2</staff></note>`;
  return note(first[0], first[1], false) + rest.map(([s, o]) => note(s, o, true)).join('');
}

function rhMelody(notes: [string, string][]): string {
  return notes.map(([s, o]) =>
    `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>2</duration><staff>1</staff></note>`).join('');
}

const PHRASE: [string, string][][] = [
  [['E', '4'], ['G', '4'], ['C', '5'], ['G', '4']],
  [['A', '4'], ['E', '4'], ['C', '4'], ['E', '4']],
  [['F', '4'], ['A', '4'], ['C', '5'], ['A', '4']],
  [['G', '4'], ['B', '4'], ['D', '5'], ['B', '4']],
];

/** 8 bars, C → Am → F → G twice in the left hand, a 4-bar phrase repeated on top. */
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

const songFrom = (id: string, xml: string): ImportedSong =>
  ({ id, title: 'Test Song', xml, score: parseMusicXmlScore(xml), pageCount: 1 });

// ── the harness ─────────────────────────────────────────────────────────────

const TICK_MS = 100;                 // simulated time advanced per driver loop
const BUDGET_MS = 10 * 60_000;       // a course that needs more than this has stalled

interface Run {
  ui: EngineUI;
  engine: LessonEngine;
  hw: HwFacade;
  /** Latest (step, seg) the engine reported through ui.progress. */
  at: { step: number; seg: number };
  visitedSteps: Set<number>;
  /** Chart bars a play-along is gating on, in the order the engine asked. */
  gates: number[];
  songTitles: string[];
  trace: string[];
  /** Simulated milliseconds the course took. */
  elapsedMs: number;
}

function makeRun(course: GeneratedCourse): Run {
  const hw = new HwFacade();
  const at = { step: -1, seg: -1 };
  const visitedSteps = new Set<number>();
  const gates: number[] = [];
  const songTitles: string[] = [];
  const trace: string[] = [];
  const ui: EngineUI = {
    KB: { setDown: jest.fn(), clearDowns: jest.fn() },
    progress: jest.fn((step: number, seg: number) => {
      at.step = step; at.seg = seg;
      visitedSteps.add(step);
      const s = course.lesson.steps[step]?.segments[seg];
      trace.push(`${step}:${seg} ${s ? s.type : 'end'}`);
    }),
    mood: jest.fn(),
    mascotTalking: jest.fn(),
    mascotAppear: jest.fn(),
    typeText: jest.fn(async () => {}),
    typeTextInstant: jest.fn(),
    setPaused: jest.fn(),
    setTypePaused: jest.fn(),
    clearStage: jest.fn(),
    clearStageSoon: jest.fn(),
    showTicks: jest.fn(() => ({ fill: jest.fn(), success: jest.fn() })),
    showQuiz: jest.fn(() => ({ wrong: jest.fn(), correct: jest.fn() })),
    // The learner taps "Next" as soon as it appears.
    showNext: jest.fn((cb: () => void) => { cb(); }),
    showFollow: jest.fn(() => ({ current: jest.fn(), done: jest.fn(), all: jest.fn() })),
    showSong: jest.fn((seg, title): SongCtl => {
      songTitles.push(title);
      // Only a play-along waits on its gates; the demo's gates are just the
      // cursor moving, so pressing on those would be playing over the demo.
      const gating = (seg as unknown as Segment).type === 'playAlong';
      return {
        gate: jest.fn((i: number) => { if (gating) gates.push(i); }),
        hit: jest.fn(), preview: jest.fn(), beat: jest.fn(), end: jest.fn(),
      };
    }),
    awardXP: jest.fn(),
    wrongAnswer: jest.fn(),
    completeScreen: jest.fn(),
    hideComplete: jest.fn(),
    prefLyrics: () => false,
  };
  const engine = new LessonEngine(course.lesson, hw, ui, `test_${course.id}_step`);
  return { ui, engine, hw, at, visitedSteps, gates, songTitles, trace, elapsedMs: 0 };
}

/** Everything queued on the microtask queue, however deep the promise chain. */
const flush = () => new Promise<void>((r) => { setImmediate(r); });

/**
 * A learner on the simulator keys. Every "your turn" is answered by pressing
 * exactly the notes the segment names, the way the engine's waiter expects
 * them; nothing is ever pressed that the segment did not ask for.
 */
class Player {
  private sim: SimulatorPiano;
  private down = new Set<number>();
  constructor(hw: HwFacade) { this.sim = hw.backend as SimulatorPiano; }

  /** Lift every key first — a stale hold blocks the chord waiters until released. */
  releaseAll() {
    for (const m of this.down) this.sim.release(m);
    this.down.clear();
  }
  private keyDown(note: string) {
    const m = noteToMidi(note);
    this.sim.keyDown(m);
    this.down.add(m);
  }
  private keyUp(note: string) { this.sim.keyUp(noteToMidi(note)); }

  /** A tap: down, then straight back up (so a repeated note re-triggers). */
  tap(note: string) {
    this.releaseAll();
    this.keyDown(note);
    this.sim.release(noteToMidi(note));
    this.down.delete(noteToMidi(note));
  }
  /** All keys down in the same instant (spread 0 ms), then lifted. */
  chord(notes: string[]) {
    this.releaseAll();
    notes.forEach((n) => this.keyDown(n));
    notes.forEach((n) => this.keyUp(n));
  }
}

/**
 * Drives the engine from step 0 until it shows the complete screen, answering
 * each wait segment as it comes up. Throws — naming the segment — if the run
 * spends the whole budget without completing.
 */
async function runCourse(course: GeneratedCourse): Promise<Run> {
  const run = makeRun(course);
  const { engine, ui, at, gates } = run;
  const player = new Player(run.hw);
  const handled = new Set<string>();
  const complete = ui.completeScreen as jest.Mock;

  engine.start(0);
  for (; run.elapsedMs < BUDGET_MS && !complete.mock.calls.length; run.elapsedMs += TICK_MS) {
    // eslint-disable-next-line no-await-in-loop
    await flush();
    const seg = course.lesson.steps[at.step]?.segments[at.seg];
    const key = `${at.step}:${at.seg}`;
    if (seg && seg.type === 'playAlong') {
      // Each gate(i) is the engine waiting for chart bar i's chord.
      while (gates.length) {
        const i = gates.shift()!;
        player.chord(seg.chordMap[seg.chart[i].chord]);
      }
    } else if (seg && !handled.has(key)) {
      switch (seg.type) {
        case 'waitPressCount':
          for (let n = 0; n < seg.count; n++) player.tap(seg.note);
          handled.add(key);
          break;
        case 'waitPressAll':
        case 'waitChord':
          player.chord(seg.notes);
          handled.add(key);
          break;
        case 'waitPressOrdered':
          for (const n of seg.notes) player.tap(n);
          handled.add(key);
          break;
        case 'waitPressAny':
        case 'waitNote':
        case 'waitChordCount':
        case 'followLight':
        case 'quiz':
          throw new Error(`driver has no answer for a ${seg.type} segment at ${key}: ${JSON.stringify(seg)}`);
        default:
          break; // speech, LEDs, pauses, demos: the engine moves on by itself
      }
    }
    jest.advanceTimersByTime(TICK_MS);
  }
  if (!complete.mock.calls.length) {
    const seg = course.lesson.steps[at.step]?.segments[at.seg];
    throw new Error(
      `course never completed — stuck at step ${at.step} ("${course.lesson.steps[at.step]?.title}") ` +
      `segment ${at.seg}: ${JSON.stringify(seg)}\ntrace tail: ${run.trace.slice(-12).join(' | ')}`,
    );
  }
  return run;
}

// ── tests ───────────────────────────────────────────────────────────────────

const running: Run[] = [];
let consoleError: jest.SpyInstance;

beforeEach(() => {
  // setImmediate stays real so `flush()` can drain the microtask queue between
  // simulated ticks; everything the engine and simulator schedule is faked.
  jest.useFakeTimers({ doNotFake: ['setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask'] });
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  while (running.length) {
    const { engine, hw } = running.pop()!;
    engine.stop();
    hw.dispose();
  }
  consoleError.mockRestore();
  jest.useRealTimers();
});

/** The assertions every generated course has to satisfy once it has run. */
function expectCleanCompletion(run: Run, course: GeneratedCourse) {
  const { ui, engine, hw } = run;
  expect(ui.completeScreen).toHaveBeenCalledTimes(1);
  expect(ui.completeScreen).toHaveBeenCalledWith(50);
  expect(engine.xp).toBe(course.xpReward);

  const steps = course.lesson.steps.map((_, i) => i);
  expect([...run.visitedSteps].sort((a, b) => a - b)).toEqual(steps);
  // …and every segment of every step was executed, not just every step entered.
  const reached = new Set(run.trace);
  course.lesson.steps.forEach((step, i) => step.segments.forEach((seg, j) => {
    expect(reached.has(`${i}:${j} ${seg.type}`)).toBe(true);
  }));
  expect(run.elapsedMs).toBeGreaterThan(0);

  // The learner never picked a wrong answer and never hit a wrong key: the
  // engine's only reaction to a wrong key is the 'nervous' mood + red flash.
  expect(ui.wrongAnswer).not.toHaveBeenCalled();
  const moods = (ui.mood as jest.Mock).mock.calls.map((c) => c[0] as string);
  expect(moods).not.toContain('nervous');

  // gotoStep catches a throwing segment and logs it — a course that "completes"
  // by skipping over failures is not a course that runs.
  expect(consoleError).not.toHaveBeenCalled();

  engine.stop();
  expect(hw.backend.leds.snapshot().size).toBe(0);
}

describe('a generated song course runs to completion in the real engine', () => {
  it('plays the two-hand C → Am → F → G course from overview to the complete screen', async () => {
    const course = generateSongLesson(songFrom('engine', buildSong()));
    const run = await runCourse(course);
    running.push(run);

    expectCleanCompletion(run, course);

    // The play-alongs actually gated on every chart bar: the 4-bar loop, then
    // the 8-bar performance — and the engine titled them after the song, not
    // the built-in Lesson 1 titles.
    const songs = course.lesson.steps.flatMap((s) => s.segments).filter((s) => s.type === 'playAlong');
    expect(songs.length).toBe(2);
    const gateCalls = (run.ui.showSong as jest.Mock).mock.results
      .map((r) => (r.value as SongCtl).gate as jest.Mock)
      .map((g) => g.mock.calls.length);
    expect(gateCalls).toEqual([4, 4, 8, 8]); // demo, play, demo, play
    expect(run.songTitles).toEqual(['Demo · Test Song', 'Test Song', 'Demo · Test Song', 'Test Song']);
    expect(run.ui.awardXP).toHaveBeenLastCalledWith(expect.any(Number), 50);
  });

  it('plays a right-hand-only (single staff) course to the complete screen', async () => {
    const course = generateSongLesson(songFrom('solo', buildSingleStaff()));
    expect(course.lesson.steps.map((s) => s.title)).not.toContain('Hands together');
    const run = await runCourse(course);
    running.push(run);

    expectCleanCompletion(run, course);
    // The melody was really asked for and really played, in order.
    const ordered = course.lesson.steps.flatMap((s) => s.segments).filter((s) => s.type === 'waitPressOrdered');
    expect(ordered.length).toBeGreaterThan(0);
    expect(run.trace.some((t) => t.endsWith('waitPressOrdered'))).toBe(true);
  });
});
