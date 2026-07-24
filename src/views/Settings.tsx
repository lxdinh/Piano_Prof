// Piano Professor — Settings: language, goal, sound, appearance, hardware, account.
import React from 'react';
import { View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon, { IconName } from '../ui/Icon';
import LangDropdown from '../ui/LangDropdown';
import { Card } from '../ui/atoms';
import * as ambientAudio from '../audio/ambient';
import * as pianoEngine from '../audio/pianoEngine';

const GOALS = [
  { label: 'Casual', xp: 20 }, { label: 'Regular', xp: 50 },
  { label: 'Serious', xp: 100 }, { label: 'Intense', xp: 150 },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 13, color: colors.inkFaint, textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</Text>
      <Card pad={14}>{children}</Card>
    </View>
  );
}

function LinkRow({ icon, label, value, onPress }: { icon: IconName; label: string; value?: string; onPress?: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }}>
      <Icon name={icon} size={22} color={colors.skyDeep} />
      <Text style={{ flex: 1, fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 16, color: colors.ink }}>{label}</Text>
      {value && <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 14, color: colors.inkFaint }}>{value}</Text>}
      <Icon name="chevronRight" size={20} color={colors.inkFaint} />
    </Pressable>
  );
}

function ToggleRow({ icon, label, value, onChange }: { icon: IconName; label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
      <Icon name={icon} size={22} color={colors.skyDeep} />
      <Text style={{ flex: 1, fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 16, color: colors.ink }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.green, false: colors.line }} thumbColor="#fff" />
    </View>
  );
}

export default function Settings() {
  const { colors, isDark, toggle } = useAppTheme();
  const { activeProfile, updateActive, muted, setMuted, ambient: backgroundMusic, setAmbient, led } = useApp();
  const { go, back } = useRouter();
  const insets = useSafeAreaInsets();
  const goalXp = 50;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <Pressable onPress={back} style={{ padding: 12 }}>
          <Icon name="chevronLeft" size={28} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 24, color: colors.ink }}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 30 }}>
        <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
          <View style={{ flex: 1, minWidth: 320, gap: 18 }}>
            <Section title="Language">
              <LangDropdown value={activeProfile?.lang ?? 'en'} onChange={(lang) => updateActive({ lang })} />
            </Section>

            <Section title="Daily goal">
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {GOALS.map((g) => {
                  const on = g.xp === goalXp;
                  return (
                    <View key={g.xp} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: on ? colors.selGreen : colors.surface2, borderWidth: 2, borderColor: on ? colors.green : 'transparent' }}>
                      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 14, color: colors.ink }}>{g.label}</Text>
                      <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 12, color: colors.inkFaint }}>{g.xp} XP</Text>
                    </View>
                  );
                })}
              </View>
            </Section>

            <Section title="Lesson & sound">
              <ToggleRow icon="sound" label="Sound effects" value={!muted} onChange={(v) => { setMuted(!v); pianoEngine.setPianoEnabled(v); ambientAudio.setMuted(!v); }} />
              <ToggleRow icon="headphones" label="Background music" value={backgroundMusic} onChange={(v) => { setAmbient(v); ambientAudio.setEnabled(v); }} />
            </Section>

            <Section title="Appearance">
              <ToggleRow icon="moon" label="Dark mode" value={isDark} onChange={() => toggle()} />
            </Section>
          </View>

          <View style={{ flex: 1, minWidth: 320, gap: 18 }}>
            <Section title="Hardware">
              <LinkRow icon="bluetooth" label="LED strip" value={led.connected ? 'Connected' : 'Not connected'} onPress={() => go('pair')} />
              <LinkRow icon="sparkle" label="LED themes" value={led.theme} onPress={() => go('ledSettings')} />
              <LinkRow icon="target" label="Re-calibrate" onPress={() => go('calibration')} />
            </Section>

            <Section title="Account">
              <LinkRow icon="crown" label="Subscription" onPress={() => go('manageSub')} />
              <LinkRow icon="swap" label="Switch profile" onPress={() => go('who')} />
            </Section>

            <Section title="Privacy">
              <LinkRow icon="mic" label="Microphone" value="On-device only" />
            </Section>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
