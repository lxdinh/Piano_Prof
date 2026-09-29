// Piano Professor — Song Player: the imported song falls as note bars onto the
// on-screen keyboard (right hand warm, left hand cool), sounds as each bar
// reaches the keys, and lights the SAME keys on the real LED strip through the
// shared hardware facade. Speed, metronome, seek, and a jump into the A→Z
// lesson. Route: go('songPlayer', { songId }); the song comes from importedSongs.
//
// Clock: one requestAnimationFrame loop held in a ref, started by Play and
// cancelled by Pause / end / unmount. Time advances by dt × speed. Each frame:
// audio for onsets crossed since the last frame, a metronome click when the
// beat index changes, and an LED diff (newly sounding → ledSet, ended →
// ledOffMany) so the strip is only told about changes.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Line } from 'react-native-svg';

import { useAppTheme } from '../theme/AppTheme';
import { useRouter } from '../nav/Router';
import { useStage } from '../theme/responsive';
import { useT } from '../i18n/useT';
import { Fonts } from '../theme/tokens';
import { handColor, rgbCss } from '../theme/handColors';
import Icon from '../ui/Icon';
import PPButton from '../ui/PPButton';
import Piano from '../ui/Piano';
import { useHardware } from '../state/HardwareProvider';
import { midiToNote, LED_LOW_MIDI, LED_HIGH_MIDI } from '../lesson1/data';
import { playMidi, stopAll } from '../audio/pianoEngine';
import { getImportedSong } from '../omr/importedSongs';
import { NoteEvent } from '../omr/musicxmlScore';
import { detectKey } from '../omr/analyzeSong';
import { generateSongLesson } from '../omr/songLessonGenerator';
import {
  keyboardRange, keyLayout, soundingAt, startedBetween, ledEntriesFor, beatInfo, fallingRects,
} from '../omr/songPlayback';

const SPEEDS = [0.5, 0.75, 1, 1.25] as const;
const RH_CSS = rgbCss(handColor('R'));
const LH_CSS = rgbCss(handColor('L'));
const LANE_BG = '#1C1712'; // dark like the Piano frame, so the coloured bars pop in both themes
const LANE_GUIDE = 'rgba(255,255,255,0.07)';
const PAD = 12; // screen side padding — the Piano adds its own 5px inside this
const MAX_FRAME_DT = 0.1; // s — a stalled frame (app backgrounded) must not skip ahead
const NOTE_VOLUME = 0.85;
const CLICK_ACCENT_MIDI = 96;
const CLICK_MIDI = 91;
const EMPTY: NoteEvent[] = [];

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function SongPlayer() {
  const { colors } = useAppTheme();
  const { params, go, back } = useRouter();
  const { isTablet } = useStage();
  const insets = useSafeAreaInsets();
  const tr = useT();
  const { hw } = useHardware();

  const songId = String(params.songId ?? '');
  const song = useMemo(() => getImportedSong(songId), [songId]);
  const events = song?.score.events ?? EMPTY;
  const durationSec = song?.score.durationSec ?? 0;
  const tempoBpm = song?.score.tempoBpm ?? 90;
  const beatsPerMeasure = song?.score.beatsPerMeasure ?? 4;
  const keyName = useMemo(() => (song ? detectKey(song.score).name : ''), [song]);
  const range = useMemo(() => (song ? keyboardRange(song.score) : { low: 48, high: 83 }), [song]);
  const kbH = isTablet ? 220 : 150;

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(2); // ×1
  const [metronome, setMetronome] = useState(false);
  const [ledSnap, setLedSnap] = useState<Record<number, string>>({});
  const [lane, setLane] = useState({ w: 0, h: 0 });
  const [trackW, setTrackW] = useState(1);

  // Everything the frame loop reads lives in refs so the loop never closes
  // over stale state and never has to be rebuilt mid-playback.
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0); // previous frame timestamp (ms); 0 = no previous frame
  const tRef = useRef(0);
  const playingRef = useRef(false);
  const speedRef = useRef<number>(SPEEDS[2]);
  const metroRef = useRef(false);
  const lastBeatRef = useRef(-1);
  const litRef = useRef<Set<number>>(new Set()); // midis the strip currently shows for this song
  const tickRef = useRef<(now: number) => void>(() => {});

  useEffect(() => { speedRef.current = SPEEDS[speedIdx]; }, [speedIdx]);
  useEffect(() => { metroRef.current = metronome; }, [metronome]);

  const clearLeds = useCallback(() => {
    hw.ledClear();
    litRef.current = new Set();
  }, [hw]);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastRef.current = 0;
  }, []);

  const schedule = useCallback(() => {
    rafRef.current = requestAnimationFrame((now) => tickRef.current(now));
  }, []);

  const tick = useCallback((now: number) => {
    rafRef.current = null;
    if (!playingRef.current) return;
    const dt = lastRef.current ? Math.min((now - lastRef.current) / 1000, MAX_FRAME_DT) : 0;
    lastRef.current = now;
    const prev = tRef.current;
    const t = Math.min(prev + dt * speedRef.current, durationSec);
    tRef.current = t;

    // Audio: every onset crossed since the previous frame, exactly once.
    for (const e of startedBetween(events, prev, t)) void playMidi(e.midi, NOTE_VOLUME);

    // Metronome: the beat grid is tracked even while the click is off, so
    // switching it on mid-bar does not click immediately.
    const { beat, accent } = beatInfo(t, tempoBpm, beatsPerMeasure);
    if (beat !== lastBeatRef.current) {
      lastBeatRef.current = beat;
      if (metroRef.current) void playMidi(accent ? CLICK_ACCENT_MIDI : CLICK_MIDI, accent ? 0.35 : 0.2);
    }

    if (t >= durationSec) {
      // End of the song: stay parked here with the strip dark.
      playingRef.current = false;
      lastRef.current = 0;
      clearLeds();
      setPlaying(false);
      setTime(t);
      return;
    }

    // LEDs: diff the sounding set against what the strip already shows.
    const cur = new Set<number>();
    const fresh: NoteEvent[] = [];
    for (const e of soundingAt(events, t)) {
      if (cur.has(e.midi)) continue;
      cur.add(e.midi);
      if (!litRef.current.has(e.midi)) fresh.push(e);
    }
    const ended: string[] = [];
    litRef.current.forEach((m) => {
      if (!cur.has(m) && m >= LED_LOW_MIDI && m <= LED_HIGH_MIDI) ended.push(midiToNote(m));
    });
    if (fresh.length) hw.ledSet(ledEntriesFor(fresh));
    if (ended.length) hw.ledOffMany(ended);
    litRef.current = cur;

    setTime(t);
    schedule();
  }, [events, durationSec, tempoBpm, beatsPerMeasure, hw, clearLeds, schedule]);
  useEffect(() => { tickRef.current = tick; }, [tick]);

  const seekTo = useCallback((sec: number) => {
    const t = Math.max(0, Math.min(sec, durationSec));
    tRef.current = t;
    // From the top the first downbeat should click; elsewhere skip the beat we land in.
    lastBeatRef.current = t === 0 ? -1 : beatInfo(t, tempoBpm, beatsPerMeasure).beat;
    clearLeds(); // the next frame re-lights whatever sounds at the new position
    setTime(t);
  }, [durationSec, tempoBpm, beatsPerMeasure, clearLeds]);

  const play = useCallback(() => {
    if (!song || durationSec <= 0) return;
    if (tRef.current >= durationSec) seekTo(0);
    playingRef.current = true;
    lastRef.current = 0;
    setPlaying(true);
    if (rafRef.current == null) schedule();
  }, [song, durationSec, seekTo, schedule]);

  const pause = useCallback(() => {
    playingRef.current = false;
    stopLoop();
    clearLeds();
    setPlaying(false);
  }, [stopLoop, clearLeds]);

  const restart = useCallback(() => seekTo(0), [seekTo]);
  const cycleSpeed = useCallback(() => setSpeedIdx((i) => (i + 1) % SPEEDS.length), []);
  const toggleMetronome = useCallback(() => setMetronome((m) => !m), []);

  const learn = useCallback(() => {
    if (!song) return;
    pause();
    const c = generateSongLesson(song);
    go('lesson', { item: { id: c.id, title: c.title, sub: c.subtitle, kind: 'song' }, lesson: c.lesson });
  }, [song, pause, go]);

  // The strip belongs to HardwareProvider: subscribe here, detach + darken on
  // the way out, and never dispose it.
  useEffect(() => {
    const off = hw.onLed((snap) => {
      const rec: Record<number, string> = {};
      snap.forEach((c, m) => { rec[m] = c; });
      setLedSnap(rec);
    });
    return () => {
      off();
      playingRef.current = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      hw.ledClear();
      stopAll().catch(() => {});
    };
  }, [hw]);

  // ── geometry ──
  const layout = useMemo(() => keyLayout(range.low, range.high, lane.w), [range, lane.w]);
  // ~2.2 s of look-ahead in the lane, within a readable fall speed.
  const pxPerSec = Math.max(60, Math.min(160, lane.h / 2.2));
  const rects = useMemo(
    () => fallingRects(events, time, layout, lane.h, pxPerSec),
    [events, time, layout, lane.h, pxPerSec],
  );
  const guides = useMemo(() => {
    const xs: number[] = [];
    layout.forEach((k, m) => { if (m % 12 === 0 && k.x > 0) xs.push(k.x - 1); });
    return xs;
  }, [layout]);

  const onLaneLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLane((l) => (l.w === width && l.h === height ? l : { w: width, h: height }));
  }, []);
  const onTrackLayout = useCallback((e: LayoutChangeEvent) => setTrackW(Math.max(1, e.nativeEvent.layout.width)), []);
  const onSeek = useCallback((e: GestureResponderEvent) => {
    const frac = Math.max(0, Math.min(1, e.nativeEvent.locationX / trackW));
    seekTo(frac * durationSec);
  }, [trackW, durationSec, seekTo]);
  const shouldRespond = useCallback(() => true, []);

  // The keyboard's props change rarely (LED frames, not every rAF tick), so the
  // element is memoised and React skips it on the 60 fps time updates.
  const piano = useMemo(() => (
    <Piano low={range.low} high={range.high} lit={ledSnap} height={kbH} led interactive={false} octaveLabels />
  ), [range, ledSnap, kbH]);

  if (!song) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
          <Icon name="chevronLeft" size={28} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 24, color: colors.ink }}>{tr('player.notFound')}</Text>
          <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: colors.inkSoft, textAlign: 'center' }}>
            {tr('player.notFoundHint')}
          </Text>
        </View>
      </View>
    );
  }

  const progress = durationSec > 0 ? Math.min(100, (time / durationSec) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {/* ── top bar: back · title / key · bpm · legend · seek ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: PAD, paddingVertical: 6 }}>
        <Pressable onPress={back} hitSlop={10} style={{ padding: 4 }}>
          <Icon name="chevronLeft" size={26} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontFamily: Fonts.family.black, fontSize: 18, color: colors.ink }}>{song.title}</Text>
          <Text numberOfLines={1} style={{ fontFamily: Fonts.family.bold, fontSize: 12, color: colors.inkSoft }}>
            {keyName} · {Math.round(tempoBpm)} BPM
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: RH_CSS }} />
          <Text style={{ fontFamily: Fonts.family.bold, fontSize: 11, color: colors.inkFaint }}>RH</Text>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: LH_CSS, marginLeft: 6 }} />
          <Text style={{ fontFamily: Fonts.family.bold, fontSize: 11, color: colors.inkFaint }}>LH</Text>
        </View>
        <Text style={{ fontFamily: Fonts.family.bold, fontSize: 12, color: colors.inkSoft, width: 36, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
          {fmt(time)}
        </Text>
        <View
          onLayout={onTrackLayout}
          onStartShouldSetResponder={shouldRespond}
          onMoveShouldSetResponder={shouldRespond}
          onResponderGrant={onSeek}
          onResponderMove={onSeek}
          style={{ width: isTablet ? 320 : 190, height: 30, justifyContent: 'center' }}
        >
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' }}>
            <View style={{ width: `${progress}%`, height: '100%', backgroundColor: colors.gold }} />
          </View>
        </View>
        <Text style={{ fontFamily: Fonts.family.bold, fontSize: 12, color: colors.inkSoft, width: 36, fontVariant: ['tabular-nums'] }}>
          {fmt(durationSec)}
        </Text>
      </View>

      {/* ── falling-note lane: exactly as wide as the Piano's key area, sitting on it ── */}
      <View
        onLayout={onLaneLayout}
        style={{ flex: 1, marginHorizontal: PAD + 5, backgroundColor: LANE_BG, borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: 'hidden' }}
      >
        {lane.w > 0 && lane.h > 0 && (
          <Svg width={lane.w} height={lane.h}>
            {guides.map((x) => (
              <Line key={`g${x}`} x1={x} y1={0} x2={x} y2={lane.h} stroke={LANE_GUIDE} strokeWidth={1} />
            ))}
            {rects.map((r) => (
              <Rect
                key={r.index}
                x={r.x + 1}
                y={r.y + 1}
                width={Math.max(1, r.w - 2)}
                height={Math.max(2, r.h - 2)}
                rx={3}
                fill={r.staff === 2 ? LH_CSS : RH_CSS}
                opacity={r.sounding ? 1 : 0.85}
                stroke={r.sounding ? '#FFFFFF' : 'none'}
                strokeWidth={r.sounding ? 1.5 : 0}
              />
            ))}
            <Line x1={0} y1={lane.h - 1} x2={lane.w} y2={lane.h - 1} stroke={colors.gold} strokeWidth={2} />
          </Svg>
        )}
      </View>

      {/* ── keyboard: lit from the strip's own frames, so screen and LEDs agree ── */}
      <View style={{ paddingHorizontal: PAD }}>{piano}</View>

      {/* ── controls ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: PAD, paddingVertical: 6, paddingBottom: insets.bottom + 6 }}>
        <PPButton
          label={tr('player.restart')} size="sm" variant="ghost" onPress={restart}
          icon={<Icon name="refresh" size={16} color={colors.inkSoft} />}
        />
        <PPButton
          label={playing ? tr('player.pause') : tr('player.play')} size="sm" variant="green"
          onPress={playing ? pause : play} style={{ minWidth: 124 }}
          icon={<Icon name={playing ? 'pause' : 'play'} size={16} color="#fff" />}
        />
        <PPButton label={`×${SPEEDS[speedIdx]}`} size="sm" variant="white" onPress={cycleSpeed} />
        <PPButton label={tr('player.metronome')} size="sm" variant={metronome ? 'sky' : 'ghost'} onPress={toggleMetronome} />
        <View style={{ flex: 1 }} />
        <PPButton
          label={tr('player.learn')} size="sm" variant="gold" onPress={learn}
          icon={<Icon name="grad" size={16} color="#5a3d00" />}
        />
      </View>
    </View>
  );
}
