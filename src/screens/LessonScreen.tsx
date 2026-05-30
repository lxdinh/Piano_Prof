import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, Animated, Image, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing, Elevation } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import PianoKeyboard from '../components/PianoKeyboard';
import MascotImage, { MascotMood } from '../components/MascotImage';
import { getLesson } from '../lessons/loader';
import { getImportedLesson } from '../lessons/importedLessons';
import { useLessonEngine } from '../lessons/engine';
import { useUser } from '../gamification/UserProvider';
import { notesToMidi } from '../lessons/noteToMidi';
import { useShake } from '../feedback/motion';
import { useLandscapeWhileFocused } from '../feedback/useOrientation';
import { preloadCore } from '../audio/pianoEngine';
import * as haptics from '../feedback/haptics';
import { logEvent, Events } from '../services/analytics';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Lesson'>;
type Rt = RouteProp<RootStackParamList, 'Lesson'>;

function starsFromHearts(hearts: number): number {
  if (hearts >= 5) return 3;
  if (hearts >= 3) return 2;
  return 1;
}

function moodForStatus(status: string): MascotMood {
  if (status === 'awaiting-quiz') return 'thinking';
  if (status === 'complete') return 'trophy';
  return 'happy';
}

export default function LessonScreen() {
  useLandscapeWhileFocused();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { width, height } = useWindowDimensions();
  const { completeLesson, loseHeart } = useUser();
  const shake = useShake();

  const lesson = useMemo(
    () => (params.gradeId === 0 ? getImportedLesson(params.lessonId) : getLesson(params.gradeId, params.lessonId)),
    [params.gradeId, params.lessonId],
  );

  const heartsAtCompleteRef = useRef(5);

  // Transient mascot reaction (cheer/shocked/wow), auto-clears.
  const [reaction, setReaction] = useState<MascotMood | null>(null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashReaction = useCallback((mood: MascotMood, ms = 1300) => {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    setReaction(mood);
    reactionTimer.current = setTimeout(() => setReaction(null), ms);
  }, []);
  useEffect(() => () => { if (reactionTimer.current) clearTimeout(reactionTimer.current); }, []);

  useEffect(() => { void preloadCore(); }, []);

  const engine = useLessonEngine(lesson, {
    onComplete: (xp) => {
      const stars = starsFromHearts(heartsAtCompleteRef.current);
      haptics.success();
      completeLesson({
        lessonId: params.lessonId,
        stars,
        accuracy: heartsAtCompleteRef.current / 5,
        xp,
      });
      nav.replace('LessonComplete', {
        gradeId: params.gradeId,
        lessonId: params.lessonId,
        xp,
        stars,
        message: lesson?.complete ?? 'Great work!',
      });
    },
    onOutOfHearts: () => {
      haptics.error();
      Alert.alert('Out of hearts', 'Take a break and let your hearts refill, then try again.', [
        { text: 'OK', onPress: () => nav.goBack() },
      ]);
    },
  });

  useEffect(() => { heartsAtCompleteRef.current = engine.hearts; }, [engine.hearts]);

  useEffect(() => {
    if (lesson) {
      logEvent(Events.lessonStart, { lessonId: params.lessonId });
      engine.start();
    }
    return () => engine.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson]);

  // "Wow" the moment a fresh 3+ note chord lights up.
  const prevChordSize = useRef(0);
  useEffect(() => {
    const size = engine.litNotes.length;
    if (engine.status === 'playing' && size >= 3 && prevChordSize.current < 3) {
      flashReaction('wow', 900);
    }
    prevChordSize.current = size;
  }, [engine.litNotes, engine.status, flashReaction]);

  if (!lesson) {
    return (
      <SafeAreaView style={styles.missingWrap}>
        <Text style={styles.missing}>Lesson not found.</Text>
        <ChunkyButton label="Back" variant="ghost" onPress={() => nav.goBack()} />
      </SafeAreaView>
    );
  }

  const litMidi = engine.litNotes;
  const quizMidi = engine.quiz ? notesToMidi(engine.quiz.expect) : [];
  const progress = engine.totalSteps > 0 ? (engine.stepIndex + 1) / engine.totalSteps : 0;

  const onQuizAnswer = (correct: boolean) => {
    if (correct) {
      haptics.success();
      flashReaction('cheer', 1600);
      logEvent(Events.quizCorrect, { lessonId: params.lessonId });
    } else {
      haptics.error();
      shake.play();
      flashReaction('shocked', 1400);
      loseHeart();
    }
    engine.submitQuiz(correct);
  };

  const mascotMood = reaction ?? moodForStatus(engine.status);

  // Full keyboard sized to the landscape viewport. C2..B6 = 35 white keys (matches legacy).
  const pianoW = Math.min(width - Spacing.lg * 2, 1200);
  const pianoH = Math.min(Math.max(height * 0.42, 150), 230);

  // Primary action adapts to engine state.
  const awaitingQuiz = engine.status === 'awaiting-quiz';
  const awaitingContinue = engine.status === 'awaiting-continue';
  const primaryLabel = awaitingQuiz ? '✓  I played it' : 'CONTINUE';
  const primaryEnabled = awaitingQuiz || awaitingContinue;
  const onPrimary = () => {
    if (awaitingQuiz) onQuizAnswer(true);
    else if (awaitingContinue) { haptics.tap(); engine.continueLesson(); }
  };

  return (
    <View style={styles.bg}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        {/* Top bar: close · progress · hearts */}
        <View style={styles.topbar}>
          <Pressable onPress={() => { haptics.tap(); nav.goBack(); }} hitSlop={14} style={styles.closeBtn}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(4, progress * 100)}%` }]} />
          </View>
          <View style={styles.heartsWrap}>
            <Text style={styles.heart}>❤️</Text>
            <Text style={styles.heartCount}>{engine.hearts}</Text>
          </View>
        </View>

        {/* Teacher row: mascot + speech bubble */}
        <View style={styles.teacherRow}>
          <View style={styles.mascotSlot}>
            <MascotImage mood={mascotMood} size={96} />
          </View>
          <Animated.View style={[styles.bubble, { transform: [{ translateX: shake.translateX }] }]}>
            <Text style={styles.bubbleName}>MAESTRO PENGUINI</Text>
            <Text style={styles.bubbleText} numberOfLines={2}>
              {engine.caption || lesson.title}
            </Text>
          </Animated.View>
        </View>

        {/* Full piano */}
        <View style={styles.pianoWrap}>
          <PianoKeyboard
            litNotes={awaitingQuiz ? quizMidi : litMidi}
            litColor={engine.litColor}
            pressColor={Colors.brand}
            playSound
            octaveLabels
            showLeds
            startMidi={36}
            whiteKeys={35}
            width={pianoW}
            height={pianoH}
          />
        </View>

        {/* Controls: REPLAY · CONTINUE */}
        <View style={styles.controls}>
          <Pressable
            onPress={() => { haptics.tap(); engine.replayStep(); }}
            style={({ pressed }) => [styles.replayBtn, pressed && { transform: [{ scale: 0.97 }] }]}
          >
            <Text style={styles.replayText}>↻  REPLAY</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <ChunkyButton
              label={primaryLabel}
              fullWidth
              disabled={!primaryEnabled}
              haptic={awaitingQuiz ? 'bump' : 'tap'}
              onPress={onPrimary}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.cream50 },
  safe: { flex: 1, paddingHorizontal: Spacing.lg },
  missingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, backgroundColor: Colors.cream50 },
  missing: { fontSize: Fonts.lg, color: Colors.ink900, textAlign: 'center' },

  // Top bar
  topbar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingTop: Spacing.sm, paddingBottom: Spacing.sm,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, borderColor: Colors.inkLine, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  close: { fontSize: Fonts.lg, color: Colors.ink500, fontWeight: Fonts.weight.black },
  progressTrack: { flex: 1, height: 16, backgroundColor: Colors.inkLine, borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: 16, backgroundColor: Colors.brand, borderRadius: 8 },
  heartsWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heart: { fontSize: 18 },
  heartCount: { fontSize: Fonts.lg, fontWeight: Fonts.weight.black, color: Colors.error },

  // Teacher row
  teacherRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md, marginBottom: Spacing.xs },
  mascotSlot: { width: 96, height: 96, alignItems: 'center', justifyContent: 'flex-end' },
  bubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: Colors.inkLine,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    minHeight: 64,
    justifyContent: 'center',
    ...Elevation.sm,
  },
  bubbleName: { fontSize: Fonts.xs, fontWeight: Fonts.weight.black, color: Colors.rust, letterSpacing: 1.5, marginBottom: 3 },
  bubbleText: { fontSize: Fonts.md, color: Colors.ink900, fontWeight: Fonts.weight.heavy, lineHeight: 22 },

  // Piano
  pianoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Controls
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingBottom: Spacing.sm, paddingTop: Spacing.xs },
  replayBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: 14,
    borderRadius: Radii.lg, borderWidth: 2, borderColor: Colors.inkLine,
    backgroundColor: '#F0E5C8',
    alignItems: 'center', justifyContent: 'center',
  },
  replayText: { fontSize: Fonts.md, fontWeight: Fonts.weight.black, color: Colors.ink700, letterSpacing: 0.5 },
});
