import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, useWindowDimensions, GestureResponderEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Rect, Line } from 'react-native-svg';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import PianoKeyboard from '../components/PianoKeyboard';
import { getImportedSong } from '../omr/importedSongs';
import { NoteEvent } from '../omr/musicxmlScore';
import { playMidi, stopAll } from '../audio/pianoEngine';
import { generateSongLesson } from '../omr/songLessonGenerator';
import { registerImportedLesson } from '../lessons/importedLessons';

// Synthesia-style "piano drop" player: the whole imported song scrolls down
// the screen as note bars (right hand green, left hand sky-blue) and lights
// the matching piano keys + samples the moment each bar reaches the keyboard.

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SongPlayer'>;

const PX_PER_SEC = 110;          // fall speed at 1× tempo
const SPEEDS = [0.5, 0.75, 1, 1.25] as const;
const RIGHT_HAND = Colors.brand; // staff 1
const LEFT_HAND = Colors.sky;    // staff 2

function isBlack(m: number): boolean {
  return [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
}

export default function SongPlayerScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { width } = useWindowDimensions();
  const song = useMemo(() => getImportedSong(route.params.songId), [route.params.songId]);

  // ── Keyboard geometry: span the song's range (min 2 octaves, max legacy 35) ──
  const { startMidi, whiteKeys, keyX } = useMemo(() => {
    const lo = song ? Math.min(song.score.minMidi, 60) : 48;
    const hi = song ? Math.max(song.score.maxMidi, 72) : 72;
    let start = Math.floor(lo / 12) * 12;          // round down to a C
    let end = Math.ceil((hi + 1) / 12) * 12 - 1;   // round up to a B
    let whites: number[] = [];
    const collect = () => {
      whites = [];
      for (let m = start; m <= end; m++) if (!isBlack(m)) whites.push(m);
    };
    collect();
    while (whites.length > 35) { // too wide for the component — trim octaves
      if (end - hi >= start - lo) end -= 12; else start += 12;
      collect();
    }
    const whiteW = width / whites.length;
    const idx: Record<number, number> = {};
    whites.forEach((m, i) => { idx[m] = i; });
    const blackW = whiteW * 0.62;
    const xOf = (midi: number): { x: number; w: number } | null => {
      if (!isBlack(midi)) {
        const i = idx[midi];
        return i === undefined ? null : { x: i * whiteW, w: whiteW };
      }
      const below = idx[midi - 1];
      if (below === undefined) return null;
      return { x: (below + 1) * whiteW - blackW / 2, w: blackW };
    };
    return { startMidi: start, whiteKeys: whites.length, keyX: xOf };
  }, [song, width]);

  // ── Playback clock (requestAnimationFrame) ──────────────────────────────────
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(2); // 1×
  const [metronome, setMetronome] = useState(false);
  const timeRef = useRef(0);
  const playingRef = useRef(false);
  const speedRef = useRef(1);
  const metronomeRef = useRef(false);
  const audioIdxRef = useRef(0); // next event to sound (events sorted by start)

  const events: NoteEvent[] = song?.score.events ?? [];
  const durationSec = song?.score.durationSec ?? 0;

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!last) { last = now; return; }
      const dt = (now - last) / 1000;
      last = now;
      if (!playingRef.current) return;
      const prev = timeRef.current;
      const t = Math.min(prev + dt * speedRef.current, durationSec + 0.75);
      timeRef.current = t;
      // metronome: click on every beat we just crossed; accent beat 1 of a bar
      if (metronomeRef.current && song) {
        const spb = 60 / song.score.tempoBpm;
        const beat = Math.floor(t / spb);
        if (beat > Math.floor(prev / spb)) {
          const accent = beat % song.score.beatsPerMeasure === 0;
          void playMidi(accent ? 103 : 96, accent ? 0.5 : 0.28);
        }
      }
      // sound every event whose onset we just crossed
      while (audioIdxRef.current < events.length && events[audioIdxRef.current].start <= t) {
        void playMidi(events[audioIdxRef.current].midi, 0.85);
        audioIdxRef.current += 1;
      }
      if (t >= durationSec + 0.7) {
        playingRef.current = false;
        setPlaying(false);
      }
      setTime(t);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [events, durationSec, song]);

  useEffect(() => () => { void stopAll(); }, []);

  const seekTo = useCallback((t: number) => {
    const clamped = Math.max(0, Math.min(t, durationSec));
    timeRef.current = clamped;
    audioIdxRef.current = events.findIndex((e) => e.start >= clamped);
    if (audioIdxRef.current < 0) audioIdxRef.current = events.length;
    setTime(clamped);
  }, [events, durationSec]);

  const togglePlay = useCallback(() => {
    if (!playingRef.current && timeRef.current >= durationSec) seekTo(0);
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  }, [durationSec, seekTo]);

  const cycleSpeed = useCallback(() => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    speedRef.current = SPEEDS[next];
  }, [speedIdx]);

  const learnAtoZ = useCallback(() => {
    if (!song) return;
    const lesson = generateSongLesson(song);
    registerImportedLesson(lesson);
    nav.navigate('Lesson', { gradeId: 0, lessonId: lesson.id });
  }, [song, nav]);

  const toggleMetronome = useCallback(() => {
    metronomeRef.current = !metronomeRef.current;
    setMetronome(metronomeRef.current);
  }, []);

  // ── Derived frame state ─────────────────────────────────────────────────────
  const keyboardH = 150;
  const [canvasH, setCanvasH] = useState(320);
  const lookahead = canvasH / PX_PER_SEC;

  const visible = useMemo(
    () => events.filter((e) => e.start < time + lookahead && e.start + e.duration > time - 0.25),
    [events, time, lookahead],
  );
  const litColors = useMemo(() => {
    const m: Record<number, string> = {};
    for (const e of visible) {
      if (e.start <= time && time < e.start + Math.min(e.duration, 2)) {
        m[e.midi] = e.staff === 2 ? LEFT_HAND : RIGHT_HAND;
      }
    }
    return m;
  }, [visible, time]);

  const onSeekBar = useCallback((evt: GestureResponderEvent) => {
    const frac = Math.max(0, Math.min(1, evt.nativeEvent.locationX / (width - Spacing.lg * 2)));
    seekTo(frac * durationSec);
  }, [width, durationSec, seekTo]);

  if (!song) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.missing}>
          <Text style={styles.title}>Song not found</Text>
          <Text style={styles.subtitle}>This import is no longer in memory. Re-open it from the Import screen.</Text>
          <ChunkyButton label="Back" variant="secondary" onPress={() => nav.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
          <Text style={styles.subtitle}>
            {song.pageCount} page{song.pageCount === 1 ? '' : 's'} · {song.score.events.length} notes · {Math.round(song.score.tempoBpm)} BPM
          </Text>
        </View>
        <Pressable
          onPress={toggleMetronome}
          style={[styles.speedChip, metronome && styles.chipOn]}
          hitSlop={8}
        >
          <Text style={styles.speedText}>🕰 {metronome ? 'on' : 'off'}</Text>
        </Pressable>
        <Pressable onPress={cycleSpeed} style={styles.speedChip} hitSlop={8}>
          <Text style={styles.speedText}>{SPEEDS[speedIdx]}×</Text>
        </Pressable>
      </View>

      {/* Falling-notes canvas — bars hit the keyboard at the bottom edge */}
      <View style={styles.canvas} onLayout={(e) => setCanvasH(e.nativeEvent.layout.height)}>
        <Svg width={width} height={canvasH}>
          {visible.map((e, i) => {
            const pos = keyX(e.midi);
            if (!pos) return null;
            const bottom = canvasH - (e.start - time) * PX_PER_SEC;
            const h = Math.max(e.duration * PX_PER_SEC - 3, 8);
            const color = e.staff === 2 ? LEFT_HAND : RIGHT_HAND;
            const sounding = e.start <= time;
            return (
              <Rect
                key={`${i}-${e.midi}-${e.start}`}
                x={pos.x + 1.5}
                y={bottom - h}
                width={pos.w - 3}
                height={h}
                rx={4}
                fill={color}
                opacity={sounding ? 1 : isBlack(e.midi) ? 0.75 : 0.9}
                stroke={sounding ? '#FFFFFF' : 'none'}
                strokeWidth={sounding ? 1.5 : 0}
              />
            );
          })}
          <Line x1={0} y1={canvasH - 1} x2={width} y2={canvasH - 1} stroke={Colors.butter} strokeWidth={2} />
        </Svg>
      </View>

      <PianoKeyboard
        width={width}
        height={keyboardH}
        startMidi={startMidi}
        whiteKeys={whiteKeys}
        noteColors={litColors}
        octaveLabels
        playSound
      />

      {/* Seek bar */}
      <View style={styles.seekRow}>
        <Text style={styles.time}>{fmt(time)}</Text>
        <View
          style={styles.seekTrack}
          onStartShouldSetResponder={() => true}
          onResponderGrant={onSeekBar}
          onResponderMove={onSeekBar}
        >
          <View style={styles.seekBg} />
          <View style={[styles.seekFill, { width: `${durationSec ? Math.min(100, (time / durationSec) * 100) : 0}%` }]} />
        </View>
        <Text style={styles.time}>{fmt(durationSec)}</Text>
      </View>

      <View style={styles.controls}>
        <ChunkyButton label="⏮ Restart" variant="secondary" onPress={() => seekTo(0)} style={{ flex: 1 }} />
        <ChunkyButton label={playing ? '⏸ Pause' : '▶ Play'} onPress={togglePlay} style={{ flex: 1.4 }} />
        <ChunkyButton label="🎓 Learn A→Z" variant="sky" onPress={learnAtoZ} style={{ flex: 1 }} />
      </View>

      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: RIGHT_HAND }]} /><Text style={styles.legendText}>Right hand</Text>
        <View style={[styles.dot, { backgroundColor: LEFT_HAND, marginLeft: Spacing.md }]} /><Text style={styles.legendText}>Left hand</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#14110D' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  close: { fontSize: Fonts.xl, color: Colors.cream100, fontWeight: Fonts.weight.black },
  title: { fontSize: Fonts.lg, fontWeight: Fonts.weight.black, color: '#FFFFFF' },
  subtitle: { fontSize: Fonts.sm, color: 'rgba(255,255,255,0.6)' },
  speedChip: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
  },
  speedText: { color: '#FFFFFF', fontWeight: Fonts.weight.bold, fontSize: Fonts.base },
  chipOn: { backgroundColor: Colors.brandDark },
  canvas: { flex: 1, backgroundColor: '#1A1612', overflow: 'hidden' },
  seekRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
  },
  time: { color: 'rgba(255,255,255,0.7)', fontSize: Fonts.sm, fontVariant: ['tabular-nums'], width: 36, textAlign: 'center' },
  seekTrack: { flex: 1, height: 18, justifyContent: 'center' },
  seekBg: { position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  seekFill: { height: 6, borderRadius: 3, backgroundColor: Colors.butter, minWidth: 6 },
  controls: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  legend: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.sm, gap: 6,
  },
  legendText: { color: 'rgba(255,255,255,0.6)', fontSize: Fonts.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
});
