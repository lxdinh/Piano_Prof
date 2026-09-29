// Does the lesson engine actually REPORT a graded mistake?
//
// hearts.test.tsx proves the economy works once something calls `loseHeart`.
// This proves the thing that calls it fires — the seam that was missing, and the
// one a refactor is most likely to quietly drop again.
//
// It also pins the deliberate asymmetry: a wrong QUIZ ANSWER costs a heart, a
// wrong KEY does not. Wrong keys arrive as a stream — feeling for a chord can
// produce four in a second — so charging for them would empty the bar in a bar.
import { LESSON_1 } from '../lesson1/data';
import { LessonEngine, EngineUI } from '../lesson1/engine';
import { HwFacade } from '../lesson1/hal';

// Real expo-speech invokes onDone when the line finishes, and Speech.speak
// clears its safety timeout on that callback. A speak() that never calls back
// leaves that ~1.6s timer pending after every line — which is what was holding
// the Jest worker open, not a leak in the engine.
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

/** Minimal EngineUI that records what the engine asks for. */
function makeUI() {
  const quizPick: { current: ((i: number) => void) | null } = { current: null };
  const ui: EngineUI = {
    KB: { setDown: jest.fn(), clearDowns: jest.fn() },
    progress: jest.fn(),
    mood: jest.fn(),
    mascotTalking: jest.fn(),
    mascotAppear: jest.fn(),
    typeText: jest.fn(async () => {}),
    typeTextInstant: jest.fn(),
    setPaused: jest.fn(),
    setTypePaused: jest.fn(),
    clearStage: jest.fn(),
    clearStageSoon: jest.fn(),
    showTicks: jest.fn(() => ({ fill: jest.fn(), done: jest.fn() })) as never,
    showQuiz: jest.fn((_options: string[], onPick: (i: number) => void) => {
      quizPick.current = onPick;
      return { wrong: jest.fn(), correct: jest.fn() };
    }),
    showNext: jest.fn(),
    showFollow: jest.fn(() => ({ set: jest.fn(), done: jest.fn() })) as never,
    showSong: jest.fn(() => ({ setBeat: jest.fn(), setStatus: jest.fn(), end: jest.fn() })) as never,
    awardXP: jest.fn(),
    wrongAnswer: jest.fn(),
    completeScreen: jest.fn(),
    hideComplete: jest.fn(),
    prefLyrics: () => false,
  };
  return { ui, quizPick };
}

// The engine schedules speech pauses and LED frames that outlive an assertion,
// so every run is torn down in afterEach rather than leaked into the next test.
const running: { engine: LessonEngine; hw: HwFacade }[] = [];

afterEach(() => {
  while (running.length) {
    const { engine, hw } = running.pop()!;
    engine.stop();   // cancels the run token, speech and backing track
    hw.dispose();    // clears the simulator's sustain timers and the LED loop
  }
});

/** Run the lesson from its quiz step until the quiz is on screen. */
async function reachQuiz() {
  const { ui, quizPick } = makeUI();
  const hw = new HwFacade();
  const engine = new LessonEngine(LESSON_1, hw, ui);
  running.push({ engine, hw });
  engine.start(1); // "The Keyboard & 7 Notes" — contains the first quiz
  const deadline = Date.now() + 8000;
  while (!quizPick.current && Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 20));
    engine.skip(); // step past the waits that need a real player
  }
  return { ui, quizPick, engine, hw };
}

describe('the engine reports graded mistakes', () => {
  it('reaches the quiz at all', async () => {
    const { quizPick } = await reachQuiz();
    expect(quizPick.current).toBeInstanceOf(Function);

  }, 15_000);

  it('reports a wrong quiz answer', async () => {
    const { ui, quizPick } = await reachQuiz();
    expect(ui.wrongAnswer).not.toHaveBeenCalled();

    quizPick.current!(0); // "E" — the answer is "B"
    expect(ui.wrongAnswer).toHaveBeenCalledTimes(1);

    quizPick.current!(1); // "G" — wrong again
    expect(ui.wrongAnswer).toHaveBeenCalledTimes(2);

  }, 15_000);

  it('says nothing when the answer is right', async () => {
    const { ui, quizPick } = await reachQuiz();
    quizPick.current!(2); // "B" — correct
    expect(ui.wrongAnswer).not.toHaveBeenCalled();

  }, 15_000);

  it('does NOT report a wrong key — those are free', async () => {
    const { ui, hw } = await reachQuiz();
    const before = (ui.wrongAnswer as jest.Mock).mock.calls.length;
    // Hammer keys that are not the target; the engine red-flashes but must not
    // treat fumbling for a note as a graded mistake.
    const sim = hw.backend as unknown as { press(m: number): void };
    for (const midi of [40, 41, 42, 43, 44]) sim.press(midi);
    expect((ui.wrongAnswer as jest.Mock).mock.calls.length).toBe(before);

  }, 15_000);
});
