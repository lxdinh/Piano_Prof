import { useCallback, useEffect, useRef, useState } from 'react';
import { Lesson, LessonSegment, QuizSegment } from './schema';
import { notesToMidi } from './noteToMidi';
import { COLOR_HEX, hexToRgb } from './colors';
import { playChord, playSequence, stopAll } from '../audio/pianoSamples';
import { speak, stopSpeaking } from '../audio/instructorVoice';
import { useBLEContext } from '../ble/BLEContext';
import { useMidiToLed } from './midiToLed';
import {
  cmdSetMulti, cmdClearAll, cmdCommit, cmdSuccessBurst,
} from '../ble/protocol';

export type EngineStatus = 'idle' | 'playing' | 'awaiting-quiz' | 'complete';

export interface EngineState {
  status: EngineStatus;
  stepIndex: number;
  totalSteps: number;
  caption: string;
  litNotes: number[];          // MIDI notes currently highlighted on the keyboard
  litColor: string;            // hex for highlighted keys
  quiz: QuizSegment | null;
  hearts: number;
  earnedXp: number;
}

export interface UseLessonEngine extends EngineState {
  start: () => void;
  /** Call when the learner has played the quiz target. */
  submitQuiz: (correct: boolean) => void;
  stop: () => void;
}

const START_HEARTS = 5;

export function useLessonEngine(
  lesson: Lesson | null,
  opts: { onComplete?: (xp: number) => void; onOutOfHearts?: () => void } = {},
): UseLessonEngine {
  const ble = useBLEContext();
  const midiToLed = useMidiToLed();

  const [state, setState] = useState<EngineState>({
    status: 'idle',
    stepIndex: 0,
    totalSteps: lesson?.steps.length ?? 0,
    caption: '',
    litNotes: [],
    litColor: COLOR_HEX.green,
    quiz: null,
    hearts: START_HEARTS,
    earnedXp: 0,
  });

  // Cancellation token: bumped on stop/unmount so the async runner bails out.
  const runToken = useRef(0);
  // Quiz resolver: the runner awaits this promise while status is awaiting-quiz.
  const quizResolver = useRef<((correct: boolean) => void) | null>(null);
  const heartsRef = useRef(START_HEARTS);
  const xpRef = useRef(0);

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
          const hex = COLOR_HEX[seg.color ?? 'cyan'];
          setState((s) => ({ ...s, litNotes: midi, litColor: hex }));
          await Promise.all([
            lightKeys(midi, hex),
            playChord(midi, seg.wait ?? 1500),
          ]);
          await delay(seg.wait ?? 1500);
          setState((s) => ({ ...s, litNotes: [] }));
          await clearKeys();
          return alive();
        }

        case 'seq':
        case 'seqAll': {
          const midi = notesToMidi(seg.notes);
          const hex = COLOR_HEX[seg.color ?? 'cyan'];
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

        case 'quiz': {
          const midi = notesToMidi(seg.expect);
          const hex = COLOR_HEX[seg.color ?? 'yellow'];
          setState((s) => ({
            ...s,
            status: 'awaiting-quiz',
            quiz: seg,
            caption: seg.prompt,
            litNotes: midi,
            litColor: hex,
          }));
          await lightKeys(midi, hex);

          const correct = await new Promise<boolean>((resolve) => {
            quizResolver.current = resolve;
          });
          quizResolver.current = null;
          if (!alive()) return false;

          if (correct) {
            xpRef.current += seg.xp ?? 0;
            if (ble.phase === 'CONNECTED') {
              try { await ble.sendLedCommand(cmdSuccessBurst()); } catch { /* ignore */ }
            }
          } else {
            heartsRef.current = Math.max(0, heartsRef.current - 1);
          }
          setState((s) => ({
            ...s,
            status: 'playing',
            quiz: null,
            litNotes: [],
            hearts: heartsRef.current,
            earnedXp: xpRef.current,
          }));
          await clearKeys();

          if (heartsRef.current <= 0) {
            opts.onOutOfHearts?.();
            return false;
          }
          return alive();
        }

        default:
          return alive();
      }
    },
    [lightKeys, clearKeys, ble, opts],
  );

  const start = useCallback(() => {
    if (!lesson) return;
    const token = ++runToken.current;
    heartsRef.current = START_HEARTS;
    xpRef.current = 0;
    setState((s) => ({
      ...s,
      status: 'playing',
      stepIndex: 0,
      totalSteps: lesson.steps.length,
      caption: '',
      litNotes: [],
      quiz: null,
      hearts: START_HEARTS,
      earnedXp: 0,
    }));

    (async () => {
      for (let si = 0; si < lesson.steps.length; si++) {
        if (token !== runToken.current) return;
        setState((s) => ({ ...s, stepIndex: si }));
        for (const seg of lesson.steps[si].segments) {
          const ok = await runSegment(seg, token);
          if (!ok) return;
        }
      }
      if (token !== runToken.current) return;
      const totalXp = lesson.xpReward + xpRef.current;
      xpRef.current = totalXp;
      setState((s) => ({ ...s, status: 'complete', earnedXp: totalXp, caption: lesson.complete }));
      opts.onComplete?.(totalXp);
    })();
  }, [lesson, runSegment, opts]);

  const submitQuiz = useCallback((correct: boolean) => {
    quizResolver.current?.(correct);
  }, []);

  const stop = useCallback(() => {
    runToken.current++;
    quizResolver.current?.(false);
    quizResolver.current = null;
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
      stopSpeaking();
      stopAll();
    };
  }, []);

  return { ...state, start, submitQuiz, stop };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
