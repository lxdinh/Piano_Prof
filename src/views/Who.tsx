// Piano Professor — "Who's playing?" family profile picker.
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp, MAX_PROFILES } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Maestro from '../ui/Maestro';
import Icon from '../ui/Icon';
import { useT } from '../i18n/useT';

export default function Who() {
  const { colors, isDark } = useAppTheme();
  const { profiles, setActive, addProfile } = useApp();
  const { go } = useRouter();
  const insets = useSafeAreaInsets();
  const tr = useT();

  const pick = (id: string, placed: boolean) => {
    setActive(id);
    go(placed ? 'home' : 'onboarding');
  };

  const add = () => {
    // seed a fresh profile then jump to onboarding (create screen refines it)
    const id = addProfile({
      name: 'New', avatar: 'cool', bg: '#FFE38A', color: colors.green,
      streak: 0, xp: 0, gems: 0, hearts: 5, levelId: 'kg', grade: 1,
      placed: false, path: 'chords', lastUnit: 'First 3 Notes', lang: 'en',
    });
    setActive(id);
    go('createProfile');
  };

  return (
    <LinearGradient
      colors={isDark ? ['#0E2136', '#0A1424'] : ['#EAF9DA', '#FFFAEC']}
      style={{ flex: 1, paddingTop: insets.top + 30 }}
    >
      <Text style={{ textAlign: 'center', fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 32, color: colors.ink }}>
        {tr('who.title')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 30, paddingVertical: 40, gap: 22, alignItems: 'center' }}
        style={{ flexGrow: 0, marginTop: 20 }}
      >
        {profiles.map((p) => (
          <Pressable key={p.id} onPress={() => pick(p.id, p.placed)} style={{ alignItems: 'center', gap: 12 }}>
            <View>
              <Maestro mood={p.avatar} size={132} bg={p.bg} ring={4} ringColor={p.color} fit="head" />
              <View style={{
                position: 'absolute', bottom: -4, right: -4, flexDirection: 'row', alignItems: 'center', gap: 3,
                backgroundColor: colors.surface, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9,
                borderWidth: 2, borderColor: colors.line,
              }}>
                <Text style={{ fontSize: 13 }}>🔥</Text>
                <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 14, color: '#C2410C' }}>{p.streak}</Text>
              </View>
            </View>
            <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 20, color: colors.ink }}>{p.name}</Text>
          </Pressable>
        ))}

        {profiles.length < MAX_PROFILES && (
          <Pressable onPress={add} style={{ alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 132, height: 132, borderRadius: 66, borderWidth: 3, borderColor: colors.line,
              borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
            }}>
              <Icon name="plus" size={48} color={colors.inkFaint} />
            </View>
            <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 18, color: colors.inkSoft }}>{tr('who.add')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
