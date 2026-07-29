// Piano Professor — Lesson 1 player ("Lesson 1.html" ported to RN).
// Topbar (close · section progress · skip · hearts/XP · hardware pill),
// mascot + typewriter speech bubble + line controls, stage widgets
// (ticks / quiz / follow-the-light / song strip / next), 61-key keyboard
// with LED strip. Start + complete overlays. Sim or BLE board backend.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { useStage } from '../theme/responsive';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import Piano from '../ui/Piano';
import { Segmented } from '../ui/atoms';
import { LESSON_1, SongConfig, noteToMidi, KEY_LOW_MIDI, KEY_HIGH_MIDI, SHOW_LYRICS } from '../lesson1/data';
import { HwStatus, SimulatorPiano, HwMode } from '../lesson1/hal';
import { useHardware } from '../state/HardwareProvider';
import { LessonEngine, EngineUI, Speech, Cues, LS_NS, SongCtl } from '../lesson1/engine';
import * as pianoEngine from '../audio/pianoEngine';

type Stage =
  | { kind: 'ticks'; count: number; filled: number; success: boolean }
  | { kind: 'quiz'; options: string[]; correct: number | null; wrong: { i: number; label: string } | null }
  | { kind: 'follow'; n: number; cur: number; name: string; done: boolean[] }
  | { kind: 'song'; title: string; showLyrics: boolean; chart: { chord: string; lyric: string }[]; leftHand: boolean; statuses: string[]; beat: number }
  | null;

const CARD_W = 104;

export default function Lesson() {
  const { colors } = useAppTheme();
  const { completeItem } = useApp();
  const { params, go, back } = useRouter();
  const { isTablet } = useStage();
  const insets = useSafeAreaInsets();
  const kbH = isTablet ? 300 : 168; // keyboard grows on the roomy tablet canvas
  const awardedRef = useRef(false);
  const itemId: string = params.item?.id ?? 'e1'; // "Pop Chords I" — Lesson 1 default

  const [phase, setPhase] = useState<'start' | 'run' | 'complete'>('start');
  const [savedStep, setSavedStep] = useState(0);
  // The facade is app-wide, so it may already be on a paired board — seed the
  // toggle from it rather than assuming the simulator.
  const { hw, connect } = useHardware();
  const [mode, setMode] = useState<HwMode>(() => hw.mode);
  const [status, setStatus] = useState<HwStatus>(() => hw.backend.status);
  const [bubble, setBubble] = useState('');
  const [talking, setTalking] = useState(false);
  const [mood, setMood] = useState('teach');
  const [paused, setPaused] = useState(false);
  const [progressSt, setProgressSt] = useState({ step: 0, seg: 0, total: 1 });
  const [stage, setStage] = useState<Stage>(null);
  const [nextVisible, setNextVisible] = useState(false);
  const [ledSnap, setLedSnap] = useState<Record<number, string>>({});
  const [downs, setDowns] = useState<Record<number, boolean>>({});
  const [xpTotal, setXpTotal] = useState(0);
  const [completeXp, setCompleteXp] = useState(0);
  const [starsIn, setStarsIn] = useState(0);

  const engineRef = useRef<LessonEngine | null>(null);
  const typeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const typePausedRef = useRef(false);
  const moodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseMood = useRef('teach');
  const nextCbRef = useRef<(() => void) | null>(null);
  const quizPickRef = useRef<((i: number) => void) | null>(null);
  const stageTokenRef = useRef(0);
  const songScrollRef = useRef<ScrollView | null>(null);

  const typeText = useCallback((text: string) => new Promise<void>((res) => {
    if (typeTimer.current) clearInterval(typeTimer.current);
    let i = 0;
    setBubble('');
    typeTimer.current = setInterval(() => {
      if (typePausedRef.current) return;
      i++;
      setBubble(text.slice(0, i));
      if (i >= text.length) { if (typeTimer.current) clearInterval(typeTimer.current); res(); }
    }, 26);
  }), []);

  // ── subscribe to the shared hardware + build the engine once ──
  // The facade belongs to HardwareProvider; this screen only attaches listeners
  // and must detach them on unmount, never dispose the radio.
  useEffect(() => {
    const offs = [
      hw.onLed((snap) => {
        const rec: Record<number, string> = {};
        snap.forEach((c, m) => { rec[m] = c; });
        setLedSnap(rec);
      }),
      hw.onStatus((s) => setStatus(s)),
      hw.onNoteOn((n) => {
        setDowns((d) => ({ ...d, [noteToMidi(n)]: true }));
        if (hw.mode === 'sim') pianoEngine.playMidi(noteToMidi(n), 0.5).catch(() => {});
      }),
      hw.onNoteOff((n) => setDowns((d) => { const nd = { ...d }; delete nd[noteToMidi(n)]; return nd; })),
    ];

    const ui: EngineUI = {
      KB: {
        setDown: (note, on) => setDowns((d) => {
          const nd = { ...d };
          if (on) nd[noteToMidi(note)] = true; else delete nd[noteToMidi(note)];
          return nd;
        }),
        clearDowns: () => setDowns({}),
      },
      progress: (step, seg, total) => setProgressSt({ step, seg, total }),
      mood: (m, revertMs) => {
        setMood(m);
        if (moodTimer.current) clearTimeout(moodTimer.current);
        if (revertMs) moodTimer.current = setTimeout(() => setMood(baseMood.current), revertMs);
        else baseMood.current = m;
      },
      mascotTalking: (on) => setTalking(on),
      mascotAppear: () => {},
      typeText,
      typeTextInstant: (text) => { if (typeTimer.current) clearInterval(typeTimer.current); setBubble(text); },
      setPaused: (on) => setPaused(on),
      setTypePaused: (on) => { typePausedRef.current = on; },
      clearStage: () => { stageTokenRef.current++; setStage(null); setNextVisible(false); },
      clearStageSoon: (ms) => {
        const tk = stageTokenRef.current;
        setTimeout(() => { if (tk === stageTokenRef.current) { setStage(null); } }, ms);
      },
      showTicks: (count) => {
        stageTokenRef.current++;
        setStage({ kind: 'ticks', count, filled: 0, success: false });
        return {
          fill: (n) => setStage((s) => (s?.kind === 'ticks' ? { ...s, filled: n } : s)),
          success: () => setStage((s) => (s?.kind === 'ticks' ? { ...s, success: true } : s)),
        };
      },
      showQuiz: (options, onPick) => {
        stageTokenRef.current++;
        quizPickRef.current = onPick;
        setStage({ kind: 'quiz', options, correct: null, wrong: null });
        return {
          wrong: (i, label) => setStage((s) => (s?.kind === 'quiz' ? { ...s, wrong: { i, label } } : s)),
          correct: (i) => setStage((s) => (s?.kind === 'quiz' ? { ...s, correct: i, wrong: null } : s)),
        };
      },
      showNext: (cb) => { stageTokenRef.current++; nextCbRef.current = cb; setNextVisible(true); },
      showFollow: (n) => {
        stageTokenRef.current++;
        setStage({ kind: 'follow', n, cur: -1, name: '—', done: Array(n).fill(false) });
        return {
          current: (i, name) => setStage((s) => (s?.kind === 'follow' ? { ...s, cur: i, name } : s)),
          done: (i) => setStage((s) => {
            if (s?.kind !== 'follow') return s;
            const done = [...s.done]; done[i] = true;
            return { ...s, done, cur: s.cur === i ? -1 : s.cur };
          }),
          all: () => setStage((s) => (s?.kind === 'follow' ? { ...s, done: s.done.map(() => true), cur: -1, name: '✓' } : s)),
        };
      },
      showSong: (seg: SongConfig, title: string, showLyrics: boolean): SongCtl => {
        stageTokenRef.current++;
        const n = seg.chart.length;
        setStage({ kind: 'song', title, showLyrics, chart: seg.chart, leftHand: !!seg.leftHandColor, statuses: Array(n).fill('idle'), beat: -1 });
        const setSt = (i: number, st: string, doneBefore = false) => setStage((s) => {
          if (s?.kind !== 'song') return s;
          const statuses = s.statuses.map((cur, j) =>
            (j === i ? st : doneBefore && j < i ? 'done' : cur === 'gate' || cur === 'playing' || cur === 'preview' ? 'idle' : cur));
          return { ...s, statuses };
        });
        return {
          gate: (i) => { setSt(i, 'gate', true); songScrollRef.current?.scrollTo({ x: Math.max(0, i * CARD_W - 120), animated: true }); },
          hit: (i) => setStage((s) => {
            if (s?.kind !== 'song') return s;
            const statuses = [...s.statuses]; statuses[i] = 'playing';
            return { ...s, statuses };
          }),
          preview: (i) => setStage((s) => {
            if (s?.kind !== 'song') return s;
            const statuses = [...s.statuses]; if (statuses[i] === 'idle') statuses[i] = 'preview';
            return { ...s, statuses };
          }),
          beat: (b) => setStage((s) => (s?.kind === 'song' ? { ...s, beat: b } : s)),
          end: () => setStage((s) => (s?.kind === 'song' ? { ...s, statuses: s.statuses.map(() => 'done'), beat: -1 } : s)),
        };
      },
      awardXP: (amount, total) => setXpTotal(total),
      completeScreen: (xp) => { setCompleteXp(xp); setPhase('complete'); },
      hideComplete: () => setPhase((p) => (p === 'complete' ? 'run' : p)),
      prefLyrics: () => SHOW_LYRICS,
    };

    engineRef.current = new LessonEngine(LESSON_1, hw, ui);

    AsyncStorage.getItem(LS_NS + 'step').then((v) => {
      const s = Math.min(Math.max(parseInt(v ?? '0', 10) || 0, 0), LESSON_1.steps.length - 1);
      setSavedStep(s);
    }).catch(() => {});

    return () => {
      engineRef.current?.stop();
      offs.forEach((off) => off());
      hw.ledClear();
      Speech.cancel();
      if (typeTimer.current) clearInterval(typeTimer.current);
      pianoEngine.stopAll().catch(() => {});
    };
  }, [typeText, hw]);

  // complete: staggered stars + write rewards to the profile (once per finish)
  useEffect(() => {
    if (phase !== 'complete') { setStarsIn(0); return; }
    if (!awardedRef.current) {
      awardedRef.current = true;
      completeItem(itemId, 3, completeXp); // Lesson 1 is heart-safe → 3 stars
    }
    const ts = [0, 1, 2].map((i) => setTimeout(() => { setStarsIn(i + 1); Cues.star(i); }, 500 + i * 360));
    return () => ts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const switchMode = (m: HwMode) => {
    setMode(m);
    hw.setMode(m);
    setDowns({});
  };

  const startLesson = (from: number) => {
    setPhase('run');
    engineRef.current?.start(from);
  };

  const sim = hw.backend as SimulatorPiano | undefined;
  const isSim = mode === 'sim';

  const pillColor = isSim || status.state === 'connected' ? colors.green : status.state === 'connecting' ? colors.gold : colors.streak;
  const pillLabel = isSim ? 'Simulator' : status.state === 'connected' ? (status.detail || 'Connected') : status.state === 'connecting' ? 'Connecting…' : 'Not connected';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {/* ── topbar ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
        <Pressable onPress={back} hitSlop={10}><Icon name="close" size={24} color={colors.inkFaint} /></Pressable>
        <View style={{ flex: 1, flexDirection: 'row', gap: 5 }}>
          {LESSON_1.steps.map((s, i) => {
            const fill = i < progressSt.step ? 1 : i === progressSt.step ? progressSt.seg / Math.max(1, progressSt.total) : 0;
            return (
              <Pressable key={i} onPress={() => engineRef.current?.gotoStep(i)} style={{ flex: 1, height: 12, borderRadius: 999, backgroundColor: colors.line, overflow: 'hidden' }}>
                <View style={{ width: `${Math.round(fill * 100)}%`, height: '100%', borderRadius: 999, backgroundColor: colors.green }} />
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={() => engineRef.current?.skip()} hitSlop={8}><Icon name="play" size={18} color={colors.inkFaint} /></Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 2, borderColor: 'rgba(0,0,0,0.06)' }}>
          <Text style={{ fontSize: 14 }}>❤️</Text>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 14, color: '#C81E1E' }}>5</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 2, borderColor: 'rgba(0,0,0,0.06)' }}>
          <Text style={{ fontSize: 14 }}>⚡</Text>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 14, color: '#9A6E00' }}>{xpTotal}</Text>
        </View>
        <Pressable
          onPress={() => switchMode(isSim ? 'ble' : 'sim')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11 }}
        >
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: pillColor }} />
          <Text style={{ fontFamily: Fonts.family.bold, fontSize: 12, color: colors.inkSoft }}>{pillLabel}</Text>
        </Pressable>
      </View>

      {/* ── talk row ── */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 18 }}>
        <View>
          <Maestro mood={mood} size={78} bg="#FFF0CE" ring={talking ? 4 : 0} ringColor="#58CC0266" float />
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 2, borderColor: colors.line, borderBottomWidth: 5, paddingVertical: 10, paddingHorizontal: 14, minHeight: 62, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1, fontFamily: Fonts.family.bold, fontSize: 17, lineHeight: 23, color: colors.ink }}>{bubble}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginLeft: 8 }}>
            <Pressable onPress={() => engineRef.current?.prevLine()} style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chevronLeft" size={17} color={colors.inkSoft} />
            </Pressable>
            <Pressable onPress={() => engineRef.current?.replayLine()} style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="refresh" size={16} color={colors.inkSoft} />
            </Pressable>
            <Pressable onPress={() => engineRef.current?.pauseToggle()} style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: paused ? '#E08600' : colors.line, backgroundColor: paused ? '#FF9600' : colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={paused ? 'play' : 'pause'} size={15} color={paused ? '#fff' : colors.inkSoft} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* ── stage ── */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 }}>
        {stage?.kind === 'ticks' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {Array.from({ length: stage.count }, (_, i) => {
              const done = i < stage.filled;
              return (
                <View key={i} style={{
                  width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: done ? colors.green : colors.surface,
                  borderWidth: 3, borderColor: done ? colors.greenDark : colors.line,
                  borderStyle: done ? 'solid' : 'dashed',
                }}>
                  {done ? <Icon name="check" size={20} color="#fff" /> : <Text style={{ fontFamily: Fonts.family.black, fontSize: 16, color: colors.inkFaint }}>{i + 1}</Text>}
                </View>
              );
            })}
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 14, color: colors.inkFaint, marginLeft: 6 }}>
              {Math.min(stage.filled, stage.count)}/{stage.count}{stage.success ? ' ✓' : ''}
            </Text>
          </View>
        )}

        {stage?.kind === 'quiz' && (
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {stage.options.map((o, i) => {
              const isC = stage.correct === i;
              const isW = stage.wrong?.i === i;
              return (
                <Pressable key={i} onPress={() => { if (stage.correct === null) quizPickRef.current?.(i); }}
                  style={{
                    width: 110, paddingVertical: 18, borderRadius: 18, alignItems: 'center',
                    backgroundColor: isC ? colors.selGreen : isW ? '#FFF5F5' : colors.surface,
                    borderWidth: 2.5, borderColor: isC ? colors.green : isW ? '#FFB3B3' : colors.line, borderBottomWidth: 5,
                    opacity: stage.correct !== null && !isC ? 0.45 : 1,
                  }}>
                  <Text style={{ fontFamily: Fonts.family.black, fontSize: 36, color: isW ? '#E05252' : colors.ink }}>{o}</Text>
                  {isW && (
                    <View style={{ position: 'absolute', bottom: -12, backgroundColor: colors.error, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 }}>
                      <Text style={{ fontFamily: Fonts.family.black, fontSize: 11, color: '#fff' }}>{stage.wrong?.label}</Text>
                    </View>
                  )}
                  {isC && (
                    <View style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="check" size={18} color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {stage?.kind === 'follow' && (
          <View style={{ alignItems: 'center', gap: 12 }}>
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 48, color: colors.greenDark }}>{stage.name}</Text>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              {stage.done.map((d, i) => (
                <View key={i} style={{
                  width: 14, height: 14, borderRadius: 7,
                  backgroundColor: d || stage.cur === i ? colors.green : colors.line,
                  transform: stage.cur === i ? [{ scale: 1.25 }] : undefined,
                }} />
              ))}
            </View>
          </View>
        )}

        {stage?.kind === 'song' && (
          <View style={{ width: '100%', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Text style={{ fontFamily: Fonts.family.black, fontSize: 12, color: colors.inkFaint, textTransform: 'uppercase', letterSpacing: 1 }}>{stage.title}</Text>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                {[0, 1, 2, 3].map((b) => (
                  <View key={b} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: stage.beat === b ? colors.gold : colors.line }} />
                ))}
              </View>
            </View>
            <ScrollView ref={songScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 12, paddingHorizontal: 4 }}>
              {stage.chart.map((bar, i) => {
                const st = stage.statuses[i];
                const active = st === 'gate' || st === 'playing';
                return (
                  <View key={i} style={{
                    width: CARD_W - 10, borderRadius: 14, paddingVertical: 10, alignItems: 'center',
                    backgroundColor: st === 'playing' ? colors.selGreen : colors.surface,
                    borderWidth: 2.5, borderColor: active ? colors.green : st === 'preview' ? '#B5E48A' : colors.line,
                    borderStyle: st === 'preview' ? 'dashed' : 'solid', borderBottomWidth: 4,
                    opacity: st === 'done' ? 0.4 : st === 'idle' ? 0.55 : 1,
                    transform: active ? [{ scale: 1.06 }] : undefined,
                  }}>
                    {active && (
                      <Text style={{ position: 'absolute', top: -9, fontSize: 8, fontFamily: Fonts.family.black, color: '#B45309', backgroundColor: '#FFF3E4', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1, overflow: 'hidden' }}>
                        {stage.leftHand ? 'LEFT + RIGHT' : 'RIGHT HAND'}
                      </Text>
                    )}
                    <Text style={{ fontFamily: Fonts.family.black, fontSize: 30, color: active ? colors.greenDark : colors.inkFaint }}>{bar.chord}</Text>
                    {stage.showLyrics && (
                      <Text numberOfLines={2} style={{ fontFamily: Fonts.family.heavy, fontSize: 10, color: colors.inkFaint, textAlign: 'center', minHeight: 26, paddingHorizontal: 4 }}>{bar.lyric || ' '}</Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {nextVisible && (
          <View style={{ position: 'absolute', right: 16, bottom: 4 }}>
            <PPButton label="Next" size="sm" variant="green" icon={<Icon name="arrowRight" size={16} color="#fff" />}
              onPress={() => { const cb = nextCbRef.current; nextCbRef.current = null; setNextVisible(false); cb?.(); }} />
          </View>
        )}
      </View>

      {/* ── keyboard (C2–C7, 61 keys) ── */}
      <View style={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 8 }}>
        <Piano
          low={KEY_LOW_MIDI} high={KEY_HIGH_MIDI}
          lit={ledSnap} downs={downs} octaveLabels
          interactive={isSim}
          onPressIn={(m) => sim?.keyDown(m)}
          onPressOut={(m) => sim?.keyUp(m)}
          height={kbH} hideNoteNames={false}
        />
      </View>

      {/* ── start overlay ── */}
      {phase === 'start' && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,16,10,0.5)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 520, maxWidth: '92%', backgroundColor: colors.surface, borderRadius: 26, borderWidth: 2, borderColor: colors.line, padding: 24, alignItems: 'center', gap: 8 }}>
            <Maestro mood="welcome-piano" size={100} bg="#EAF8DC" ring={5} ringColor="#fff" float />
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 12, color: colors.gold, textTransform: 'uppercase', letterSpacing: 2 }}>Lesson 1</Text>
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 26, color: colors.ink }}>First Touch → First Songs</Text>
            <Text style={{ fontFamily: Fonts.family.heavy, fontSize: 14, color: colors.inkSoft }}>Middle C · the 7 notes · 4 chords · 3 real songs</Text>
            <Segmented
              value={mode}
              onChange={(v) => switchMode(v as HwMode)}
              options={[{ value: 'ble', label: 'Bluetooth board' }, { value: 'sim', label: 'Simulator' }]}
            />
            {mode === 'ble' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: status.state === 'connected' ? colors.green : status.state === 'connecting' ? colors.gold : colors.inkFaint }} />
                <Text style={{ fontFamily: Fonts.family.bold, fontSize: 13, color: colors.inkSoft }}>
                  {status.state === 'connected' ? (status.detail || 'Connected') : status.state === 'connecting' ? 'Connecting…' : status.state === 'error' ? status.detail : 'Board not connected'}
                </Text>
                <PPButton label={status.state === 'connected' ? 'Reconnect' : 'Connect board'} size="sm" variant="sky"
                  onPress={() => connect().catch(() => {})} />
              </View>
            ) : (
              <Text style={{ fontFamily: Fonts.family.heavy, fontSize: 12, color: colors.inkFaint, textAlign: 'center' }}>
                No board needed — press and hold the on-screen keys; multi-touch plays chords.
              </Text>
            )}
            <PPButton label={savedStep > 0 ? `Resume · Section ${savedStep + 1}` : 'Start lesson'} size="lg" variant="green"
              onPress={() => startLesson(savedStep)} style={{ marginTop: 6 }} />
            <Text style={{ fontFamily: Fonts.family.heavy, fontSize: 11, color: colors.inkFaint }}>🔊 Sound on — the professor talks you through it.</Text>
          </View>
        </View>
      )}

      {/* ── complete overlay ── */}
      {phase === 'complete' && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 16, color: colors.gold, letterSpacing: 2, textTransform: 'uppercase' }}>Lesson complete</Text>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 32, color: colors.ink }}>Lesson 1 · First Songs</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginVertical: 6 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ marginTop: i === 1 ? -10 : 4, opacity: starsIn > i ? 1 : 0, transform: [{ scale: starsIn > i ? 1 : 0.2 }] }}>
                <Icon name="star" size={i === 1 ? 72 : 56} color="#F5B800" />
              </View>
            ))}
          </View>
          <Maestro mood="trophy" size={104} bg="#FFE38A" ring={5} ringColor="#fff" float />
          <View style={{ flexDirection: 'row', gap: 12, marginVertical: 12 }}>
            {[['⚡', `+${completeXp} XP`, 'Earned', '#F5B800'], ['🎵', '3', 'Songs played', '#2E84AD'], ['🎹', '4', 'Chords learned', '#58CC02']].map(([e, v, l, c], i) => (
              <View key={i} style={{ minWidth: 110, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, borderWidth: 2, borderColor: colors.line, borderBottomWidth: 5, paddingVertical: 12, paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 22 }}>{e}</Text>
                <Text style={{ fontFamily: Fonts.family.black, fontSize: 20, color: c as string }}>{v}</Text>
                <Text style={{ fontFamily: Fonts.family.bold, fontSize: 11, color: colors.inkFaint, textTransform: 'uppercase' }}>{l}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <PPButton label="Replay lesson" size="md" variant="ghost" onPress={() => { setXpTotal(0); if (engineRef.current) { engineRef.current.xp = 0; } startLesson(0); }} />
            <PPButton label="Back to home" size="md" variant="gold" onPress={() => go('home')} />
          </View>
        </View>
      )}
    </View>
  );
}
