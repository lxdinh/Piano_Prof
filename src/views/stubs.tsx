// Piano Professor — placeholder screens for routes not yet built in Phase 1.
// These keep navigation whole; each is replaced by a real screen incrementally.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Shell from '../nav/Shell';
import Maestro from '../ui/Maestro';
import Icon from '../ui/Icon';

function Placeholder({ title }: { title: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 }}>
      <Maestro mood="idea" size={120} bg={colors.surface2} float />
      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 26, color: colors.ink }}>{title}</Text>
      <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 15, color: colors.inkSoft }}>Coming together next.</Text>
    </View>
  );
}

function tabStub(active: 'songs' | 'practice' | 'profile', title: string) {
  return function TabStub() {
    return <Shell active={active}><Placeholder title={title} /></Shell>;
  };
}

function modalStub(title: string) {
  return function ModalStub() {
    const { colors } = useAppTheme();
    const { back } = useRouter();
    const insets = useSafeAreaInsets();
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <Pressable onPress={back} style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="chevronLeft" size={26} color={colors.ink} />
          <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 16, color: colors.ink }}>Back</Text>
        </Pressable>
        <Placeholder title={title} />
      </View>
    );
  };
}

// tabs
export const Songs = tabStub('songs', 'Songs');
export const Practice = tabStub('practice', 'Practice');
export const ProfileScreen = tabStub('profile', 'Profile');

// standalone / modal flow screens (filled in next)
export const CreateProfile = modalStub('Create profile');
export const Onboarding = modalStub('Onboarding');
export const Placement = modalStub('Placement test');
export const PlacementResult = modalStub('Your level');
export const CoursePath = modalStub('Choose your path');
export const Lesson = modalStub('Lesson');
export const LessonComplete = modalStub('Lesson complete');
export const Paywall = modalStub('Go Premium');
export const Pair = modalStub('Connect LED strip');
export const Settings = modalStub('Settings');
