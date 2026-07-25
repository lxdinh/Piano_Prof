// Piano Professor — "Who's playing?" family profile picker.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp, MAX_PROFILES } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Maestro from '../ui/Maestro';
import Icon from '../ui/Icon';
import { useT } from '../i18n/useT';
import { NEW_PROFILE_GIFTS } from '../data/content';
import { todayKey } from '../services/dateKey';

export default function Who() {
  const { colors, isDark } = useAppTheme();
  const { profiles, setActive, addProfile, removeProfile } = useApp();
  const { go } = useRouter();
  const insets = useSafeAreaInsets();
  const tr = useT();
  const [manage, setManage] = useState(false);

  const pick = (id: string, placed: boolean) => {
    if (manage) { setActive(id); go('editProfile'); return; }
    setActive(id);
    go(placed ? 'home' : 'onboarding');
  };

  const add = () => {
    // seed a fresh profile then jump to onboarding (create screen refines it).
    // New learners start ENDOWED (streak already alive, gems in the bank) —
    // see NEW_PROFILE_GIFTS for why.
    const id = addProfile({
      name: 'New', avatar: 'cool', bg: '#FFE38A', color: colors.green,
      ...NEW_PROFILE_GIFTS,
      xp: 0, levelId: 'kg', grade: 1,
      placed: false, path: 'chords', lastUnit: 'First 3 Notes', lang: 'en',
      lastActiveDate: todayKey(), // makes day 1 of the streak genuine
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
      <Pressable
        onPress={() => setManage((m) => !m)}
        style={{ position: 'absolute', top: insets.top + 24, right: 24, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.surface }}
      >
        <Icon name={manage ? 'check' : 'pencil'} size={16} color={colors.inkSoft} />
        <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 14, color: colors.inkSoft }}>{manage ? tr('who.done') : tr('who.manage')}</Text>
      </Pressable>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 30, paddingVertical: 40, gap: 22, alignItems: 'center' }}
        style={{ flexGrow: 0, marginTop: 20 }}
      >
        {profiles.map((p) => (
          <Pressable key={p.id} onPress={() => pick(p.id, p.placed)} style={{ alignItems: 'center', gap: 12, opacity: manage ? 0.9 : 1 }}>
            <View>
              <Maestro mood={p.avatar} size={132} bg={p.bg} ring={4} ringColor={manage ? colors.line : p.color} fit="head" />
              {manage ? (
                <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' } as any}>
                  <Icon name="pencil" size={30} color={colors.ink} />
                </View>
              ) : (
                <View style={{
                  position: 'absolute', bottom: -4, right: -4, flexDirection: 'row', alignItems: 'center', gap: 3,
                  backgroundColor: colors.surface, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9,
                  borderWidth: 2, borderColor: colors.line,
                }}>
                  <Text style={{ fontSize: 13 }}>🔥</Text>
                  <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 14, color: '#C2410C' }}>{p.streak}</Text>
                </View>
              )}
              {manage && profiles.length > 1 && (
                <Pressable
                  onPress={() => Alert.alert('Remove profile', `Delete ${p.name}'s profile and progress?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => removeProfile(p.id) },
                  ])}
                  style={{ position: 'absolute', top: -6, right: -6, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface }}
                >
                  <Icon name="close" size={18} color="#fff" />
                </Pressable>
              )}
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
