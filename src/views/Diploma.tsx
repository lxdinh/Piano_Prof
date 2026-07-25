// Piano Professor — graduation Diploma: paper certificate + share.
// The certificate keeps its warm paper look independent of app theme,
// matching the prototype's design.
import React from 'react';
import { View, Text, Pressable, Share, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import { levelById } from '../data/content';

const PAPER = '#FFFDF4';
const PAPER_INK = '#3A3226';
const GOLD = '#C9A227';

export default function Diploma() {
  const { colors } = useAppTheme();
  const { activeProfile } = useApp();
  const { back } = useRouter();
  const insets = useSafeAreaInsets();
  const p = activeProfile;
  const level = levelById(p?.levelId ?? 'el');

  const share = () => {
    Share.share({
      message: `🎓 ${p?.name ?? 'A student'} completed ${level.name} (Grade ${level.grade}) on Piano Professor — ${p?.xp ?? 0} XP and a ${p?.streak ?? 0}-day streak!`,
    }).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
        <Icon name="close" size={26} color={colors.inkSoft} />
      </Pressable>

      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 20, paddingBottom: insets.bottom + 30 }}>
        {/* certificate */}
        <View style={{
          width: 620, maxWidth: '100%', backgroundColor: PAPER, borderRadius: 14,
          borderWidth: 4, borderColor: GOLD, padding: 4,
        }}>
          <View style={{ borderWidth: 1.5, borderColor: GOLD, borderRadius: 10, padding: 26, alignItems: 'center', gap: 6 }}>
            {/* seal */}
            <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <Maestro mood="trophy" size={68} bg="transparent" />
            </View>
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 13, color: GOLD, letterSpacing: 3 }}>PIANO PROFESSOR ACADEMY</Text>
            <Text style={{ fontSize: 30, fontWeight: '400', color: PAPER_INK, fontStyle: 'italic' }}>Certificate of Achievement</Text>
            <Text style={{ fontFamily: Fonts.family.bold, fontSize: 13, color: '#8A806A', marginTop: 6 }}>proudly awarded to</Text>
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 38, color: PAPER_INK }}>{p?.name ?? 'Player'}</Text>
            <View style={{ height: 2, alignSelf: 'stretch', backgroundColor: GOLD, opacity: 0.4, marginVertical: 8 }} />
            <Text style={{ fontFamily: Fonts.family.bold, fontSize: 16, color: PAPER_INK, textAlign: 'center' }}>
              for completing <Text style={{ color: GOLD }}>{level.name} · Grade {level.grade}</Text>{'\n'}on the {p?.path === 'soloist' ? 'Soloist' : 'Chords'} path
            </Text>
            {/* stat strip */}
            <View style={{ flexDirection: 'row', gap: 26, marginTop: 12 }}>
              {[
                ['🔥', `${p?.streak ?? 0} days`], ['⚡', `${p?.xp ?? 0} XP`], ['💎', `${p?.gems ?? 0}`], ['🎓', new Date().getFullYear().toString()],
              ].map(([e, v], i) => (
                <View key={i} style={{ alignItems: 'center', gap: 2 }}>
                  <Text style={{ fontSize: 18 }}>{e}</Text>
                  <Text style={{ fontFamily: Fonts.family.black, fontSize: 14, color: PAPER_INK }}>{v}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 24, color: PAPER_INK, marginTop: 14, fontStyle: 'italic' }}>Maestro 🐧</Text>
            <Text style={{ fontFamily: Fonts.family.bold, fontSize: 11, color: '#8A806A' }}>Professor of Piano · Head Penguin</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <PPButton label="Share" size="md" variant="gold" icon={<Icon name="arrowRight" size={16} color="#5a3d00" />} onPress={share} />
          <PPButton label="Keep learning" size="md" variant="green" onPress={back} />
        </View>
      </ScrollView>
    </View>
  );
}
