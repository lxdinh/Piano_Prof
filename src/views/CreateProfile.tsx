// Piano Professor — Create / edit profile (name, language, Maestro avatar).
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import LangDropdown from '../ui/LangDropdown';
import { AVATARS } from '../data/content';
import { useT } from '../i18n/useT';
import { useStage } from '../theme/responsive';

export default function CreateProfile() {
  const { colors } = useAppTheme();
  const { activeProfile, updateActive } = useApp();
  const { go, back } = useRouter();
  const { isTablet } = useStage();
  const insets = useSafeAreaInsets();
  const tr = useT();

  const [name, setName] = useState(activeProfile?.name === 'New' ? '' : (activeProfile?.name ?? ''));
  const [lang, setLang] = useState(activeProfile?.lang ?? 'en');
  const [avatarIdx, setAvatarIdx] = useState(
    Math.max(0, AVATARS.findIndex((a) => a.mood === activeProfile?.avatar)),
  );
  const avatar = AVATARS[avatarIdx];

  const start = () => {
    updateActive({ name: name.trim() || 'Player', avatar: avatar.mood, bg: avatar.bg, color: colors.green, lang });
    // New profiles continue into onboarding; editing a placed profile just saves.
    if (activeProfile?.placed) back();
    else go('onboarding');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Pressable onPress={back} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="chevronLeft" size={26} color={colors.ink} />
      </Pressable>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 30, paddingBottom: insets.bottom + 30, alignItems: 'center' }}>
        {/* Sizes per canvas: phone-spine.jsx PhCreateProfile on the phone
            canvas, the roomier standalone mockup on the tablet canvas. */}
        <Maestro mood={avatar.mood} size={isTablet ? 120 : 104} bg={avatar.bg} ring={isTablet ? 5 : 4} ringColor={colors.green} fit="head" float />
        <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: isTablet ? 28 : 22, color: colors.ink, marginTop: 12 }}>{tr(activeProfile?.placed ? 'create.edit' : 'create.title')}</Text>

        <View style={{ width: '100%', maxWidth: 520, gap: 16, marginTop: 20 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 13, color: colors.inkFaint, textTransform: 'uppercase' }}>{tr('create.firstName')}</Text>
            <TextInput
              value={name} onChangeText={setName} placeholder="Type a name" placeholderTextColor={colors.inkFaint}
              style={{ borderWidth: 2.5, borderColor: colors.line, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 18, color: colors.ink, backgroundColor: colors.surface }}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 13, color: colors.inkFaint, textTransform: 'uppercase' }}>{tr('settings.language')}</Text>
            <LangDropdown value={lang} onChange={setLang} />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 13, color: colors.inkFaint, textTransform: 'uppercase' }}>{tr('create.pickMaestro')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {AVATARS.map((a, i) => (
                <Pressable key={a.mood} onPress={() => setAvatarIdx(i)}>
                  <Maestro mood={a.mood} size={62} bg={a.bg} fit="head" ring={i === avatarIdx ? 3 : 0} ringColor={colors.green} />
                </Pressable>
              ))}
            </View>
          </View>

          <PPButton label={tr(activeProfile?.placed ? 'common.save' : 'common.startLearning')} size="lg" variant="green" full onPress={start} style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    </View>
  );
}
