// Piano Professor — Lesson player (teach / quiz steps, hearts, TTS, lit piano).
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import Piano from '../ui/Piano';
import { SAMPLE_LESSON, LessonStep, starsFromHearts } from '../data/content';
import * as pianoEngine from '../audio/pianoEngine';
import * as instructorVoice from '../audio/instructorVoice';
import * as haptics from '../feedback/haptics';

const XP_REWARD = 40;

export default function Lesson() {
  const { colors } = useAppTheme();
  const { activeProfile, loseHeart, updateActive, premium } = useApp();
  const { go, back } = useRouter();
  const insets = useSafeAreaInsets();

  const steps = SAMPLE_LESSON.steps;
  const [idx, setIdx] = useState(0);
  const [mood, setMood] = useState('teach');
  const [hearts, setHearts] = useState(activeProfile?.hearts ?? 5);
  const got = useRef<Set<number>>(new Set());
  const seqPtr = useRef(0);
  const step: LessonStep = steps[idx];

  const litKeys = step.type === 'teach' ? (step.notes ?? {}) : (step.lit ?? {});
  const uniqueTargets = step.target ? Array.from(new Set(step.target)) : [];

  // On entering a teach step: light + play + narrate.
  useEffect(() => {
    got.current = new Set();
    seqPtr.current = 0;
    if (step.type === 'teach') {
      setMood('teach');
      const notes = Object.keys(step.notes ?? {}).map(Number);
      if (notes.length) pianoEngine.playChord(notes, 90).catch(() => {});
      if (step.say) instructorVoice.speak(step.say).catch(() => {});
    } else {
      setMood('conduct');
      if (step.text) instructorVoice.speak(step.text).catch(() => {});
    }
  }, [idx]);

  const finish = useCallback((finalHearts: number) => {
    const stars = starsFromHearts(finalHearts);
    if (activeProfile) {
      updateActive({
        xp: activeProfile.xp + XP_REWARD,
        gems: activeProfile.gems + stars,
      });
    }
    go('complete', { title: SAMPLE_LESSON.title, stars, xp: XP_REWARD });
  }, [activeProfile, updateActive, go]);

  const advance = useCallback(() => {
    if (idx + 1 >= steps.length) finish(hearts);
    else setIdx(idx + 1);
  }, [idx, steps.length, hearts, finish]);

  const onCorrect = useCallback(() => {
    haptics.success();
    setMood('cheer');
    setTimeout(advance, 650);
  }, [advance]);

  const onWrong = useCallback(() => {
    haptics.error();
    setMood('sad');
    if (premium) return; // unlimited hearts
    const next = Math.max(0, hearts - 1);
    setHearts(next);
    loseHeart();
    if (next <= 0) setTimeout(() => go('upsell', { reason: 'hearts' }), 700);
  }, [hearts, loseHeart, premium, go]);

  const onPlay = useCallback((midi: number) => {
    pianoEngine.playMidi(midi).catch(() => {});
    if (step.type !== 'quiz' || !step.target) return;

    if (step.seq) {
      if (midi === step.target[seqPtr.current]) {
        seqPtr.current += 1;
        if (seqPtr.current >= step.target.length) onCorrect();
      } else {
        onWrong();
      }
    } else {
      if (uniqueTargets.includes(midi)) {
        got.current.add(midi);
        if (got.current.size >= uniqueTargets.length) onCorrect();
      } else {
        onWrong();
      }
    }
  }, [step, uniqueTargets, onCorrect, onWrong]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {/* top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
        <Pressable onPress={back} hitSlop={10}><Icon name="close" size={26} color={colors.inkSoft} /></Pressable>
        <View style={{ flex: 1, flexDirection: 'row', gap: 5 }}>
          {steps.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 10, borderRadius: 999, backgroundColor: i <= idx ? colors.green : colors.line }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Icon key={i} name="heart" size={20} color={i < hearts ? colors.error : colors.line} />
          ))}
        </View>
      </View>

      {/* teacher + prompt */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingVertical: 8 }}>
        <Maestro mood={mood} size={92} bg={colors.surface2} float />
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 2, borderColor: colors.line, padding: 14 }}>
          {step.type === 'quiz' && step.prompt && (
            <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 18, color: colors.green, marginBottom: 4 }}>{step.prompt}</Text>
          )}
          <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 16, color: colors.ink }}>{step.text}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <PPButton
              label="Hear it again" size="sm" variant="white"
              icon={<Icon name="sound" size={16} color={colors.skyDeep} />}
              onPress={() => {
                const notes = Object.keys(litKeys).map(Number);
                if (notes.length) pianoEngine.playChord(notes, 90).catch(() => {});
                instructorVoice.speak(step.say ?? step.text).catch(() => {});
              }}
            />
            {step.type === 'teach' && <PPButton label="Got it" size="sm" variant="green" onPress={advance} />}
          </View>
        </View>
      </View>

      {/* piano */}
      <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: insets.bottom + 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green }} />
          <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 12, color: colors.inkFaint }}>LED strip lit</Text>
        </View>
        <Piano low={55} high={84} lit={litKeys} labels={step.labels ?? {}} onPlay={onPlay} height={200} />
      </View>
    </View>
  );
}
