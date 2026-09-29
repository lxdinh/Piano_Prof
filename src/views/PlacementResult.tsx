// Piano Professor — placement result (assigned level reveal).
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../theme/AppTheme';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import ScrollFit from '../ui/ScrollFit';
import { levelFromScore } from '../data/content';
import { useT } from '../i18n/useT';

export default function PlacementResult() {
  const { colors, isDark } = useAppTheme();
  const { params, go } = useRouter();
  const tr = useT();
  const level = levelFromScore(params.score ?? 0);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={isDark ? ['#16273F', '#0A1320'] : ['#FFFDF6', '#FFF3D6']} style={StyleSheet.absoluteFill} />
      <ScrollFit pad={32} style={{ gap: 12 }}>
      <Maestro mood="trophy" size={140} bg={colors.surface} ring={5} ringColor="#fff" float />
      <Text style={{ fontFamily: Fonts.family.bold, fontSize: 17, color: colors.inkSoft, marginTop: 8 }}>{tr('placement.placed')}</Text>

      <View style={{ alignItems: 'center', gap: 6, marginVertical: 6 }}>
        <View style={{ width: 96, height: 96, borderRadius: 24, backgroundColor: level.color, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 34, color: '#fff' }}>{level.short}</Text>
        </View>
        <Text style={{ fontFamily: Fonts.family.black, fontSize: 30, color: colors.ink }}>{tr(`level.${level.id}`)}</Text>
        <Text style={{ fontFamily: Fonts.family.bold, fontSize: 15, color: colors.inkFaint }}>{tr('grade')} {level.grade}</Text>
      </View>

      <Text style={{ fontFamily: Fonts.family.bold, fontSize: 16, color: colors.inkSoft, textAlign: 'center', maxWidth: 440 }}>{level.blurb}</Text>
      <PPButton label={tr('home.continue')} size="lg" variant="green" onPress={() => go('coursePath', { levelId: level.id })} style={{ marginTop: 12 }} />
      </ScrollFit>
    </View>
  );
}
