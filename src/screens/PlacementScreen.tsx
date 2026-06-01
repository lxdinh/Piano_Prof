import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing, Elevation } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import MascotImage from '../components/MascotImage';
import { useUser } from '../gamification/UserProvider';
import {
  PLACEMENT_QUESTIONS, computePlacement, PlacementResult,
} from '../lessons/placement';
import * as haptics from '../feedback/haptics';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Placement'>;

export default function PlacementScreen() {
  const nav = useNavigation<Nav>();
  const { applyPlacement } = useUser();
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [busy, setBusy] = useState(false);

  const total = PLACEMENT_QUESTIONS.length;
  const question = PLACEMENT_QUESTIONS[step];
  const progress = (step + (result ? 1 : 0)) / total;

  const pick = (score: number) => {
    haptics.tap();
    const nextScores = [...scores, score];
    if (step < total - 1) {
      setScores(nextScores);
      setStep(step + 1);
    } else {
      setResult(computePlacement(nextScores));
      setScores(nextScores);
    }
  };

  const finish = async () => {
    if (!result) return;
    setBusy(true);
    await applyPlacement(result.gradeNumber, result.completedLessonIds);
    haptics.success();
    nav.replace('MainTabs');
  };

  return (
    <View style={styles.bg}>
      <LinearGradient colors={['#FFFDF6', '#FFF3CC', '#FFE6BA']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>

        {result ? (
          <ResultView result={result} busy={busy} onFinish={finish} />
        ) : (
          <ScrollView contentContainerStyle={styles.qScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.kicker}>QUESTION {step + 1} OF {total}</Text>
            <Text style={styles.prompt}>{question.prompt}</Text>
            <View style={styles.options}>
              {question.options.map((opt) => (
                <Pressable
                  key={opt.label}
                  onPress={() => pick(opt.score)}
                  style={({ pressed }) => [styles.option, pressed && { transform: [{ scale: 0.98 }], borderColor: Colors.brand }]}
                >
                  <Text style={styles.optionText}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function ResultView({ result, busy, onFinish }: {
  result: PlacementResult; busy: boolean; onFinish: () => void;
}) {
  const mood = useMemo(() => (result.levelIndex >= 4 ? 'cool' : 'cheer'), [result.levelIndex]);
  return (
    <View style={styles.resultWrap}>
      <MascotImage mood={mood} size={150} />
      <Text style={styles.kicker}>YOU'RE PLACED IN</Text>
      <Text style={styles.levelName}>{result.levelName}</Text>
      <View style={styles.gradePill}>
        <Text style={styles.gradePillText}>Starting at Grade {result.gradeNumber}</Text>
      </View>
      <Text style={styles.resultBlurb}>
        We'll start you right where you belong. You can always revisit earlier
        lessons from the Learn tab.
      </Text>
      <ChunkyButton label="Start learning" onPress={onFinish} loading={busy} fullWidth haptic="bump" />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.cream50 },
  safe: { flex: 1, paddingHorizontal: Spacing.xl },

  progressTrack: {
    height: 12, borderRadius: 6, backgroundColor: Colors.inkLine,
    marginTop: Spacing.lg, overflow: 'hidden',
  },
  progressFill: { height: 12, borderRadius: 6, backgroundColor: Colors.brand },

  qScroll: { paddingTop: Spacing['2xl'], gap: Spacing.md },
  kicker: {
    fontSize: Fonts.sm, fontWeight: Fonts.weight.black, color: Colors.butterDark,
    letterSpacing: 2.5, textAlign: 'center',
  },
  prompt: {
    fontSize: Fonts['2xl'], fontWeight: Fonts.weight.black, color: Colors.ink900,
    textAlign: 'center', lineHeight: 34, marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  options: { gap: Spacing.md },
  option: {
    backgroundColor: '#FFFFFF', borderRadius: Radii.lg,
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
    borderWidth: 2, borderColor: Colors.inkLine, ...Elevation.sm,
  },
  optionText: { fontSize: Fonts.md, fontWeight: Fonts.weight.bold, color: Colors.ink900 },

  resultWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  levelName: { fontSize: Fonts['3xl'], fontWeight: Fonts.weight.black, color: Colors.ink900 },
  gradePill: {
    paddingHorizontal: Spacing.lg, paddingVertical: 6,
    backgroundColor: Colors.brand, borderRadius: 999, ...Elevation.sm,
  },
  gradePillText: { color: '#FFFFFF', fontSize: Fonts.md, fontWeight: Fonts.weight.bold },
  resultBlurb: {
    fontSize: Fonts.md, color: Colors.ink700, textAlign: 'center',
    lineHeight: 24, fontWeight: Fonts.weight.heavy, paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
});
