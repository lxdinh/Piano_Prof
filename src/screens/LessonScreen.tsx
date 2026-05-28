import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing, Elevation, Gradients, Motion } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import HeartsRow from '../components/HeartsRow';
import PianoKeyboard from '../components/PianoKeyboard';
import XpBar from '../components/XpBar';
import MascotImage, { MascotMood } from '../components/MascotImage';
import { getLesson } from '../lessons/loader';
import { getImportedLesson } from '../lessons/importedLessons';
import { useLessonEngine } from '../lessons/engine';
import { useUser } from '../gamification/UserProvider';
import { notesToMidi } from '../lessons/noteToMidi';
import { useShake } from '../feedback/motion';
import * as haptics from '../feedback/haptics';
import { logEvent, Events } from '../services/analytics';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Lesson'>;
type Rt = RouteProp<RootStackParamList, 'Lesson'>;

function starsFromHearts(hearts: number): number {
  if (hearts >= 5) return 3;
  if (hearts >= 3) return 2;
  return 1;
}

function moodForStatus(status: string, captionLen: number): MascotMood {
  if (status === 'awaiting-quiz') return 'thinking';
  if (status === 'complete') return 'trophy';
  if (captionLen > 80) return 'wave';
  return 'happy';
}

export default function LessonScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { completeLesson, loseHeart } = useUser();
  const shake = useShake();
  const heartFlash = useRef(new Animated.Value(0)).current;

  const lesson = useMemo(
    () => (params.gradeId === 0 ? getImportedLesson(params.lessonId) : getLesson(params.gradeId, params.lessonId)),
    [params.gradeId, params.lessonId],
  );

  const heartsAtCompleteRef = useRef(5);

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

  // Flash the heart row red briefly when a heart is lost.
  const prevHearts = useRef(5);
  useEffect(() => {
    if (engine.hearts < prevHearts.current) {
      Animated.sequence([
        Animated.timing(heartFlash, { toValue: 1, duration: 120, useNativeDriver: false }),
        Animated.timing(heartFlash, { toValue: 0, duration: 400, useNativeDriver: false }),
      ]).start();
    }
    prevHearts.current = engine.hearts;
  }, [engine.hearts, heartFlash]);

  useEffect(() => {
    if (lesson) {
      logEvent(Events.lessonStart, { lessonId: params.lessonId });
      engine.start();
    }
    return () => engine.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson]);

  if (!lesson) {
    return (
      <SafeAreaView style={styles.safe}>
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
      logEvent(Events.quizCorrect, { lessonId: params.lessonId });
    } else {
      haptics.error();
      shake.play();
      loseHeart();
    }
    engine.submitQuiz(correct);
  };

  const headerBg = heartFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,75,75,0)', 'rgba(255,75,75,0.18)'],
  });

  const mascotMood = moodForStatus(engine.status, engine.caption.length);

  return (
    <View style={styles.bg}>
      <LinearGradient colors={[Gradients.dark[0], Gradients.dark[1]]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Top bar */}
        <Animated.View style={[styles.topbar, { backgroundColor: headerBg }]}>
          <Pressable onPress={() => { haptics.tap(); nav.goBack(); }} hitSlop={16}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
          <View style={styles.progressWrap}>
            <XpBar progress={progress} height={14} shimmer={engine.status === 'playing'} />
          </View>
          <HeartsRow hearts={engine.hearts} />
        </Animated.View>

        {/* Stage: mascot + caption card */}
        <View style={styles.stage}>
          <MascotImage mood={mascotMood} size={108} />
          <Animated.View style={[styles.captionCard, { transform: [{ translateX: shake.translateX }] }]}>
            <Text style={styles.caption}>{engine.caption || lesson.title}</Text>
          </Animated.View>
        </View>

        {/* Piano locked to bottom */}
        <View style={styles.pianoWrap}>
          <PianoKeyboard
            litNotes={engine.status === 'awaiting-quiz' ? quizMidi : litMidi}
            litColor={engine.litColor}
            showLeds
            width={360}
            height={170}
            startMidi={48}
            whiteKeys={15}
          />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {engine.status === 'awaiting-quiz' ? (
            <>
              <Text style={styles.quizPrompt}>{engine.quiz?.prompt}</Text>
              <ChunkyButton
                label="✓ I played it"
                fullWidth
                haptic="bump"
                onPress={() => onQuizAnswer(true)}
              />
              <ChunkyButton
                label="Skip"
                variant="ghost"
                fullWidth
                haptic="tap"
                onPress={() => onQuizAnswer(false)}
              />
            </>
          ) : (
            <Text style={styles.playingHint}>
              {engine.status === 'complete' ? 'Wrapping up…' : 'Listen — and watch your keys light up.'}
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0F1117' },
  safe: { flex: 1 },
  missing: { fontSize: Fonts.lg, color: '#FFFFFF', textAlign: 'center', marginTop: Spacing['2xl'] },

  topbar: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  close: { fontSize: Fonts.xl, color: '#FFFFFF', fontWeight: Fonts.weight.black, opacity: 0.7 },
  progressWrap: { flex: 1 },

  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  captionCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    minHeight: 90,
    maxWidth: 420,
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.md,
  },
  caption: {
    fontSize: Fonts.lg,
    color: '#FFFFFF',
    fontWeight: Fonts.weight.bold,
    textAlign: 'center',
    lineHeight: 26,
  },

  pianoWrap: { alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },

  controls: {
    padding: Spacing.lg,
    gap: Spacing.md,
    minHeight: 170,
    justifyContent: 'flex-end',
  },
  quizPrompt: {
    fontSize: Fonts.md,
    color: '#FFFFFF',
    fontWeight: Fonts.weight.heavy,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  playingHint: {
    fontSize: Fonts.base,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

// Motion / Easing are reserved for finer step-transition animations
// in a later phase. Keep the imports referenced.
void Motion; void Easing;
