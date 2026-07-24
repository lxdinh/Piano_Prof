// Piano Professor — onboarding carousel (4 slides → placement test).
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import Piano from '../ui/Piano';
import ScrollFit from '../ui/ScrollFit';
import { StatChip } from '../ui/atoms';

interface Slide { mood: string; title: string; body: string; kind: 'plain' | 'piano' | 'stats' | 'mic'; }
const SLIDES: Slide[] = [
  { mood: 'teach', title: 'Meet Maestro', body: 'Your personal piano professor guides every step.', kind: 'plain' },
  { mood: 'conduct', title: 'Your keys light up', body: 'The LED strip shows exactly which keys to play.', kind: 'piano' },
  { mood: 'star', title: 'Streaks keep you going', body: 'Earn XP, keep your streak, and collect gems.', kind: 'stats' },
  { mood: 'idea', title: 'Maestro listens', body: 'Play on a real piano and get instant feedback.', kind: 'mic' },
];

export default function Onboarding() {
  const { colors, isDark } = useAppTheme();
  const { go } = useRouter();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const last = i === SLIDES.length - 1;

  return (
    <LinearGradient colors={isDark ? ['#16273F', '#0A1424'] : ['#FFFDF6', '#FFF3D6']} style={{ flex: 1, paddingTop: insets.top }}>
      <ScrollFit pad={32} style={{ gap: 12 }}>
        <Maestro mood={s.mood} size={150} bg={colors.surface} ring={5} ringColor="#fff" float />
        <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 30, color: colors.ink, marginTop: 8 }}>{s.title}</Text>
        <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 17, color: colors.inkSoft, textAlign: 'center', maxWidth: 440 }}>{s.body}</Text>

        {s.kind === 'piano' && (
          <View style={{ width: 360, marginTop: 8 }}>
            <Piano low={60} high={72} lit={{ 60: '#58CC02', 64: '#F5B800', 67: '#5BB8E3' }} height={120} interactive={false} />
          </View>
        )}
        {s.kind === 'stats' && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <StatChip kind="streak" value={7} big />
            <StatChip kind="xp" value={250} big />
            <StatChip kind="gems" value={40} big />
          </View>
        )}
      </ScrollFit>

      <View style={{ alignItems: 'center', paddingBottom: insets.bottom + 24, gap: 18 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {SLIDES.map((_, k) => (
            <View key={k} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 999, backgroundColor: k === i ? colors.green : colors.line }} />
          ))}
        </View>
        <PPButton
          label={last ? 'Start placement' : 'Continue'} size="lg" variant="green"
          onPress={() => (last ? go('placement') : setI(i + 1))}
        />
      </View>
    </LinearGradient>
  );
}
