import { useCallback, useEffect, useRef, useState } from 'react';
import { Lesson, LessonSegment, QuizSegment, LedColorName, HandName } from './schema';
import { notesToMidi } from './noteToMidi';
import { gradeNote } from './quizGrading';
import { COLOR_HEX, hexToRgb } from './colors';
import { playChord, playSequence, stopAll } from '../audio/pianoEngine';
import { speak, stopSpeaking } from '../audio/instructorVoice';
import { useBLEContext } from '../ble/BLEContext';
import { useMidiToLed } from './midiToLed';
import {
  cmdSetMulti, cmdClearAll, cmdCommit, cmdSuccessBurst,
} from '../ble/protocol';

export type EngineStatus =
  | 'idle' | 'playing' | 'awaiting-quiz' | 'awaiting-continue' | 'complete';

export interface EngineState {
  status: EngineStatus;
  stepIndex: number;
  totalSteps: number;
  caption: string;
  litNotes: number[];          // MIDI notes currently highlighted on the keyboard
  litColor: string;            // hex for highlighted keys
  /** Quiz notes the learner has already played correctly (shown green). */
  playedCorrect: number[];
  quiz: QuizSegment | null;
  hearts: number;
  earnedXp: number;
  /** Increments on each wrong note — drives the shake/"oops" reaction. */
  wrongTick: number;
  /** Increments on each correct note in a quiz — drives a positive blip. */
  correctTick: number;
}

export interface UseLessonEngine extends EngineState {
  start: () => void;
  /**
   * Feed a played MIDI note into the engine. During a quiz this grades the
   * learner's playing (correct notes advance, wrong notes cost a heart).
   * Outside a quiz it's a no-op. Called from on-screen key taps AND live BLE
   * key presses from the real piano.
   */
  notePlayed: (midi: number) => void;
  /** Advance past the between-steps gate to the next step. */
  continueLesson: () => void;
  /** Re-run the current step (replays its narration + demo). */
  replayStep: () => void;
  stop: () => void;
}

const START_HEARTS = 5;

// Hand-aware color: when a segment sets no explicit color, tint by hand
// (left = violet, right = cyan, both = green) so the two hands read distinctly.
function hexForSeg(seg: { color?: LedColorName; hand?: HandName }): string {
  if (seg.color) return COLOR_HEX[seg.color];
  if (seg.hand === 'left') return COLOR_HEX.violet;
  if (seg.hand === 'right') return COLOR_HEX.cyan;
  if (seg.hand === 'both') return COLOR_HEX.green;
  return COLOR_HEX.cyan;
}

// "1, 2, 3 ... 1, 2, 3" for the requested beats/bars.
function countLine(beats: number, bars: number): string {
  const one = Array.from({ length: Math.max(1, beats) }, (_, i) => i + 1).join(', ');
  return Array.from({ length: Math.max(1, bars) }, () => one).join(' ... ');
}

export function useLessonEngine(
  lesson: Lesson | null,
  opts: {
    /** Starting hearts — the learner's real, persisted heart count. */
    initialHearts?: number;
    /** xp, hearts remaining, and accuracy (0..1) at completion. */
    onComplete?: (xp: number, heartsLeft: number, accuracy: number) => void;
    /** A wrong note was played — persist the lost heart (single source of truth). */
    onWrongNote?: () => void;
    onOutOfHearts?: () => void;
  } = {},
): UseLessonEngine {
  const ble = useBLEContext();
  const midiToLed = useMidiToLed();

  // Keep the latest callbacks in a ref so our memoised functions (notePlayed,
  // runSegment, start) stay stable across renders — otherwise the per-render
  // `opts` object literal would churn the BLE subscription and callback chain.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const startHearts = opts.initialHearts ?? START_HEARTS;

  const [state, setState] = useState<EngineState>({
    status: 'idle',
    stepIndex: 0,
    totalSteps: lesson?.steps.length ?? 0,
    caption: '',
    litNotes: [],
    litColor: COLOR_HEX.green,
    playedCorrect: [],
    quiz: null,
    hearts: startHearts,
    earnedXp: 0,
    wrongTick: 0,
    correctTick: 0,
  });

  // Cancellation token: bumped on stop/unmount so the async runner bails out.
  const runToken = useRef(0);
  // Quiz grader: the runner awaits this promise while status is awaiting-quiz.
  // Resolves true when every expected note has been played correctly.
  const quizResolver = useRef<((passed: boolean) => void) | null>(null);
  // Set of expected MIDI notes still un-played for the active quiz.
  const remainingNotes = useRef<Set<number>>(new Set());
  // Continue resolver: the runner awaits this between steps.
  const continueResolver = useRef<((action: 'next' | 'replay') => void) | null>(null);
  // The quiz currently on screen, so REPLAY can re-light/replay its target.
  const activeQuiz = useRef<QuizSegment | null>(null);
  const heartsRef = useRef(startHearts);
  const xpRef = useRef(0);
  // Accuracy bookkeeping: total quiz notes asked vs. wrong attempts.
  const notesAsked = useRef(0);
  const wrongAttempts = useRef(0);

  const lightKeys = useCallback(
    async (midiNotes: number[], hex: string) => {
      if (ble.phase !== 'CONNECTED') return;
      const entries = midiNotes
        .map((m) => midiToLed(m))
        .filter((i): i is number => i != null)
        .map((index) => ({
          index,
          rgb: hexToRgb(hex),
        }));
      if (entries.length === 0) return;
      try {
        await ble.sendLedCommand(cmdClearAll());
        await ble.sendLedCommand(cmdSetMulti(entries));
        await ble.sendLedCommand(cmdCommit());
      } catch {
        /* ignore hardware errors during a lesson */
      }
    },
    [ble, midiToLed],
  );

  const clearKeys = useCallback(async () => {
    if (ble.phase !== 'CONNECTED') return;
    try {
      await ble.sendLedCommand(cmdClearAll());
      await ble.sendLedCommand(cmdCommit());
    } catch {
      /* ignore */
    }
  }, [ble]);

  const runSegment = useCallback(
    async (seg: LessonSegment, token: number): Promise<boolean> => {
      const alive = () => token === runToken.current;

      switch (seg.type) {
        case 'say': {
          setState((s) => ({ ...s, caption: seg.text }));
          await speak(seg.text, { rate: seg.rate, pitch: seg.pitch });
          if (seg.gap) await delay(seg.gap);
          return alive();
        }
        case 'pause':
          await delay(seg.ms);
          return alive();

        case 'chord': {
          const midi = notesToMidi(seg.notes);
          const hex = hexForSeg(seg);
          setState((s) => ({ ...s, litNotes: midi, litColor: hex }));
          await Promise.all([
            lightKeys(midi, hex),
            playChord(midi, 16),
          ]);
          await delay(seg.wait ?? 1500);
          setState((s) => ({ ...s, litNotes: [] }));
          await clearKeys();
          return alive();
        }

        case 'seq':
        case 'seqAll': {
          const midi = notesToMidi(seg.notes);
          const hex = hexForSeg(seg);
          const gap = seg.delay ?? 400;
          for (const m of midi) {
            if (!alive()) return false;
            setState((s) => ({
              ...s,
              litNotes: seg.type === 'seqAll' ? [...s.litNotes, m] : [m],
              litColor: hex,
            }));
            await Promise.all([lightKeys([m], hex), playSequence([m], 0)]);
            await delay(gap);
          }
          setState((s) => ({ ...s, litNotes: [] }));
          await clearKeys();
          return alive();
        }

        case 'count': {
          const line = countLine(seg.beats, seg.bars ?? 1);
          const intro = `In ${seg.meter}, count: ${line}`;
          setState((s) => ({ ...s, caption: intro }));
          await speak(intro);
          if (seg.tempoBpm) {
            // One bar of silent pulse so the learner internalizes the tempo.
            const beatMs = 60000 / seg.tempoBpm;
            await delay(beatMs * Math.max(1, seg.beats));
          }
          return alive();
        }

        case 'arpeggio': {
          const midi = notesToMidi(seg.notes);
          const hex = hexForSeg(seg);
          const gap = seg.delay ?? 220;
          for (const m of midi) {
            if (!alive()) return false;
            setState((s) => ({ ...s, litNotes: [m], litColor: hex }));
            await Promise.all([lightKeys([m], hex), playSequence([m], 0)]);
            await delay(gap);
          }
          // Hold the whole rolled chord so it rings, then clear.
          setState((s) => ({ ...s, litNotes: midi, litColor: hex }));
          await lightKeys(midi, hex);
          await delay(seg.wait ?? 900);
          setState((s) => ({ ...s, litNotes: [] }));
          await clearKeys();
          return alive();
        }

        case 'quiz': {
          const midi = notesToMidi(seg.expect);
          const hex = COLOR_HEX[seg.color ?? 'yellow'];
          activeQuiz.current = seg;
          remainingNotes.current = new Set(midi);
          notesAsked.current += midi.length;
          setState((s) => ({
            ...s,
            status: 'awaiting-quiz',
            quiz: seg,
            caption: seg.prompt,
            litNotes: midi,
            litColor: hex,
            playedCorrect: [],
          }));
          await lightKeys(midi, hex);

          // The runner waits here while notePlayed() grades each key. It resolves
          // true once every expected note has been played (out-of-hearts resolves
          // false via stop()/notePlayed()).
          const passed = await new Promise<boolean>((resolve) => {
            quizResolver.current = resolve;
          });
          quizResolver.current = null;
          activeQuiz.current = null;
          remainingNotes.current = new Set();
          if (!alive()) return false;

          if (passed) {
            xpRef.current += seg.xp ?? 0;
            if (ble.phase === 'CONNECTED') {
              try { await ble.sendLedCommand(cmdSuccessBurst()); } catch { /* ignore */ }
            }
          }
          setState((s) => ({
            ...s,
            status: 'playing',
            quiz: null,
            litNotes: [],
            playedCorrect: [],
            hearts: heartsRef.current,
            earnedXp: xpRef.current,
          }));
          await clearKeys();

          if (heartsRef.current <= 0) {
            optsRef.current.onOutOfHearts?.();
            return false;
          }
          return alive();
        }

        default:
          return alive();
      }
    },
    [lightKeys, clearKeys, ble],
  );

  // Run one step's segments end-to-end. Returns false if cancelled/out-of-hearts.
  const runStep = useCallback(
    async (si: number, token: number): Promise<boolean> => {
      if (!lesson) return false;
      setState((s) => ({ ...s, stepIndex: si, status: 'playing', caption: '', litNotes: [] }));
      for (const seg of lesson.steps[si].segments) {
        const ok = await runSegment(seg, token);
        if (!ok) return false;
      }
      return true;
    },
    [lesson, runSegment],
  );

  const start = useCallback(() => {
    if (!lesson) return;
    const token = ++runToken.current;
    heartsRef.current = startHearts;
    xpRef.current = 0;
    notesAsked.current = 0;
    wrongAttempts.current = 0;
    setState((s) => ({
      ...s,
      status: 'playing',
      stepIndex: 0,
      totalSteps: lesson.steps.length,
      caption: '',
      litNotes: [],
      playedCorrect: [],
      quiz: null,
      hearts: startHearts,
      earnedXp: 0,
      wrongTick: 0,
      correctTick: 0,
    }));

    (async () => {
      let si = 0;
      while (si < lesson.steps.length) {
        if (token !== runToken.current) return;
        const ok = await runStep(si, token);
        if (!ok) return;

        // Last step → complete. Otherwise gate on CONTINUE / REPLAY.
        if (si + 1 >= lesson.steps.length) break;

        setState((s) => ({ ...s, status: 'awaiting-continue', litNotes: [] }));
        const action = await new Promise<'next' | 'replay'>((resolve) => {
          continueResolver.current = resolve;
        });
        continueResolver.current = null;
        if (token !== runToken.current) return;
        if (action === 'next') si += 1;
        // 'replay' keeps si unchanged so the same step runs again
      }

      if (token !== runToken.current) return;
      const totalXp = lesson.xpReward + xpRef.current;
      xpRef.current = totalXp;
      const accuracy = notesAsked.current > 0
        ? Math.max(0, (notesAsked.current - wrongAttempts.current) / notesAsked.current)
        : 1;
      setState((s) => ({ ...s, status: 'complete', earnedXp: totalXp, caption: lesson.complete }));
      optsRef.current.onComplete?.(totalXp, heartsRef.current, accuracy);
    })();
  }, [lesson, runStep, startHearts]);

  const notePlayed = useCallback((midi: number) => {
    // Only meaningful during a quiz.
    if (!quizResolver.current || !activeQuiz.current) return;
    const remaining = remainingNotes.current;
    const expected = new Set(notesToMidi(activeQuiz.current.expect));
    const result = gradeNote(midi, expected, remaining);

    if (result.kind === 'repeat') return; // harmless double-press, no penalty

    if (result.kind === 'correct') {
      remaining.delete(midi);
      setState((s) => ({
        ...s,
        playedCorrect: [...s.playedCorrect, midi],
        litColor: COLOR_HEX.green,
        correctTick: s.correctTick + 1,
      }));
      if (result.complete) {
        const resolve = quizResolver.current;
        quizResolver.current = null;
        resolve?.(true);
      }
      return;
    }

    // Wrong note → costs a heart (single source of truth via onWrongNote).
    heartsRef.current = Math.max(0, heartsRef.current - 1);
    wrongAttempts.current += 1;
    optsRef.current.onWrongNote?.();
    setState((s) => ({ ...s, hearts: heartsRef.current, wrongTick: s.wrongTick + 1 }));

    if (heartsRef.current <= 0) {
      const resolve = quizResolver.current;
      quizResolver.current = null;
      resolve?.(false);
    }
  }, []);

  const continueLesson = useCallback(() => {
    continueResolver.current?.('next');
  }, []);

  const replayStep = useCallback(() => {
    // Between steps: re-run the step. During a quiz: re-light + replay target.
    if (continueResolver.current) {
      continueResolver.current('replay');
      return;
    }
    const q = activeQuiz.current;
    if (q) {
      const midi = notesToMidi(q.expect);
      void playChord(midi, 16);
    }
  }, []);

  const stop = useCallback(() => {
    runToken.current++;
    quizResolver.current?.(false);
    quizResolver.current = null;
    continueResolver.current?.('next');
    continueResolver.current = null;
    stopSpeaking();
    stopAll();
    clearKeys();
    setState((s) => ({ ...s, status: 'idle', litNotes: [], quiz: null }));
  }, [clearKeys]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      runToken.current++;
      quizResolver.current?.(false);
      continueResolver.current?.('next');
      stopSpeaking();
      stopAll();
    };
  }, []);

  // Grade live key presses from the real piano (BLE) the same as on-screen taps.
  useEffect(() => {
    const unsub = ble.subscribeNotes((midi) => notePlayed(midi));
    return unsub;
  }, [ble, notePlayed]);

  return { ...state, start, notePlayed, continueLesson, replayStep, stop };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
