import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import HeartsRow from '../components/HeartsRow';
import PianoKeyboard from '../components/PianoKeyboard';
import XpBar from '../components/XpBar';
import MascotImage from '../components/MascotImage';
import { getLesson } from '../lessons/loader';
import { getImportedLesson } from '../lessons/importedLessons';
import { useLessonEngine } from '../lessons/engine';
import { useUser } from '../gamification/UserProvider';
import { notesToMidi } from '../lessons/noteToMidi';
import { logEvent, Events } from '../services/analytics';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Lesson'>;
type Rt = RouteProp<RootStackParamList, 'Lesson'>;

function starsFromHearts(hearts: number): number {
  if (hearts >= 5) return 3;
  if (hearts >= 3) return 2;
  return 1;
}

export default function LessonScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { completeLesson, loseHeart } = useUser();

  const lesson = useMemo(
    () => (params.gradeId === 0 ? getImportedLesson(params.lessonId) : getLesson(params.gradeId, params.lessonId)),
    [params.gradeId, params.lessonId],
  );

  const heartsAtCompleteRef = useRef(5);

  const engine = useLessonEngine(lesson, {
    onComplete: (xp) => {
      const stars = starsFromHearts(heartsAtCompleteRef.current);
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
      Alert.alert('Out of hearts', 'Take a break and let your hearts refill, then try again.', [
        { text: 'OK', onPress: () => nav.goBack() },
      ]);
    },
  });

  // keep a live mirror of hearts for star calculation at completion time
  useEffect(() => { heartsAtCompleteRef.current = engine.hearts; }, [engine.hearts]);

  // start once the lesson is resolved
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
    if (correct) logEvent(Events.quizCorrect, { lessonId: params.lessonId });
    else loseHeart();
    engine.submitQuiz(correct);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* top bar */}
      <View style={styles.topbar}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View style={styles.progressWrap}><XpBar progress={progress} /></View>
        <HeartsRow hearts={engine.hearts} />
      </View>

      {/* caption / instructor */}
      <View style={styles.stage}>
        <MascotImage mood={engine.status === 'awaiting-quiz' ? 'thinking' : 'happy'} size={96} />
        <Text style={styles.caption}>{engine.caption || lesson.title}</Text>
      </View>

      {/* keyboard */}
      <View style={styles.keyboardWrap}>
        <PianoKeyboard
          litNotes={engine.status === 'awaiting-quiz' ? quizMidi : litMidi}
          litColor={engine.litColor}
          width={340}
          height={150}
          startMidi={48}
          whiteKeys={15}
        />
      </View>

      {/* controls */}
      <View style={styles.controls}>
        {engine.status === 'awaiting-quiz' ? (
          <>
            <Text style={styles.quizPrompt}>{engine.quiz?.prompt}</Text>
            <ChunkyButton label="I played it! ✓" fullWidth onPress={() => onQuizAnswer(true)} />
            <ChunkyButton label="Skip" variant="ghost" fullWidth onPress={() => onQuizAnswer(false)} />
          </>
        ) : (
          <Text style={styles.playingHint}>
            {engine.status === 'complete' ? 'Finishing…' : 'Listen and watch the keys light up…'}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream50 },
  missing: { fontSize: Fonts.lg, color: Colors.ink700, textAlign: 'center', marginTop: Spacing['2xl'] },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  close: { fontSize: Fonts.xl, color: Colors.ink500, fontWeight: Fonts.weight.black },
  progressWrap: { flex: 1 },
  stage: { alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, flex: 1, justifyContent: 'center' },
  caption: { fontSize: Fonts.lg, color: Colors.ink900, fontWeight: Fonts.weight.bold, textAlign: 'center', lineHeight: 26, minHeight: 60 },
  keyboardWrap: { alignItems: 'center', paddingVertical: Spacing.lg },
  controls: { padding: Spacing.lg, gap: Spacing.md, minHeight: 160, justifyContent: 'flex-end' },
  quizPrompt: { fontSize: Fonts.md, color: Colors.ink700, fontWeight: Fonts.weight.heavy, textAlign: 'center', marginBottom: Spacing.sm },
  playingHint: { fontSize: Fonts.base, color: Colors.ink300, textAlign: 'center', fontStyle: 'italic' },
});
