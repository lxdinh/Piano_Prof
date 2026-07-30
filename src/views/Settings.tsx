// Piano Professor — Settings: language, goal, sound, appearance, hardware, account.
import React, { useEffect, useState } from 'react';
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
import {
  isReminderOn, setReminder, getReminderHour, formatHour, REMINDER_HOURS,
} from '../notifications/reminders';
import { Audio } from 'expo-av';
import { useAccount } from '../account/AccountProvider';
import { getOmrServer } from '../omr/omrConfig';
import { useT } from '../i18n/useT';

const GOALS = [
  { key: 'goal.casual', xp: 20 }, { key: 'goal.regular', xp: 50 },
  { key: 'goal.serious', xp: 100 }, { key: 'goal.intense', xp: 150 },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontFamily: Fonts.family.black, fontSize: 13, color: colors.inkFaint, textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</Text>
      <Card pad={14}>{children}</Card>
    </View>
  );
}

function LinkRow({ icon, label, value, onPress }: { icon: IconName; label: string; value?: string; onPress?: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }}>
      <Icon name={icon} size={22} color={colors.skyDeep} />
      <Text style={{ flex: 1, fontFamily: Fonts.family.bold, fontSize: 16, color: colors.ink }}>{label}</Text>
      {value && <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: colors.inkFaint }}>{value}</Text>}
      <Icon name="chevronRight" size={20} color={colors.inkFaint} />
    </Pressable>
  );
}

function ToggleRow({ icon, label, value, onChange }: { icon: IconName; label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
      <Icon name={icon} size={22} color={colors.skyDeep} />
      <Text style={{ flex: 1, fontFamily: Fonts.family.bold, fontSize: 16, color: colors.ink }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.green, false: colors.line }} thumbColor="#fff" />
    </View>
  );
}

export default function Settings() {
  const { colors, isDark, toggle } = useAppTheme();
  const { activeProfile, updateActive, muted, setMuted, ambient: backgroundMusic, setAmbient, led } = useApp();
  const { go, back, toast } = useRouter();
  const insets = useSafeAreaInsets();
  const tr = useT();
  const { account } = useAccount();
  const accountLabel = account && !account.isAnonymous ? (account.email ?? 'Signed in') : 'Sign in to sync';
  const goalXp = activeProfile?.dailyGoalXp ?? 50;
  const [reminders, setReminders] = useState(false);
  const [reminderHour, setReminderHour] = useState(18);
  const [omrServer, setOmrServerState] = useState<string | null>(null);
  useEffect(() => { getOmrServer().then(setOmrServerState).catch(() => {}); }, []);
  useEffect(() => {
    isReminderOn().then(setReminders);
    getReminderHour().then(setReminderHour);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <Pressable onPress={back} style={{ padding: 12 }}>
          <Icon name="chevronLeft" size={28} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: Fonts.family.black, fontSize: 24, color: colors.ink }}>{tr('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 30 }}>
        <View style={{ flexDirection: 'row', gap: 18, flexWrap: 'wrap' }}>
          <View style={{ flex: 1, minWidth: 320, gap: 18 }}>
            <Section title={tr('settings.language')}>
              <LangDropdown value={activeProfile?.lang ?? 'en'} onChange={(lang) => updateActive({ lang })} />
            </Section>

            <Section title={tr('settings.dailyGoal')}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {GOALS.map((g) => {
                  const on = g.xp === goalXp;
                  return (
                    <Pressable key={g.xp} onPress={() => updateActive({ dailyGoalXp: g.xp })} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: on ? colors.selGreen : colors.surface2, borderWidth: 2, borderColor: on ? colors.green : 'transparent' }}>
                      <Text style={{ fontFamily: Fonts.family.black, fontSize: 14, color: colors.ink }}>{tr(g.key)}</Text>
                      <Text style={{ fontFamily: Fonts.family.bold, fontSize: 12, color: colors.inkFaint }}>{g.xp} XP</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section title={tr('settings.lessonSound')}>
              <ToggleRow icon="sound" label="Sound effects" value={!muted} onChange={(v) => { setMuted(!v); pianoEngine.setPianoEnabled(v); ambientAudio.setMuted(!v); }} />
              <ToggleRow icon="headphones" label={tr('settings.bgMusic')} value={backgroundMusic} onChange={(v) => { setAmbient(v); ambientAudio.setEnabled(v); }} />
              <ToggleRow icon="bell" label={`${tr('settings.reminders')} · ${formatHour(reminderHour)}`} value={reminders} onChange={async (v) => { setReminders(v); const ok = await setReminder(v, reminderHour); setReminders(ok); }} />
              {/* Choosing the practice time is the point: a specific committed
                  time ("I practise at 5 PM") follows through far better than a
                  vague intention to practise. */}
              {reminders && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 12 }}>
                  {REMINDER_HOURS.map((h) => (
                    <Pressable
                      key={h}
                      onPress={async () => { setReminderHour(h); await setReminder(true, h); }}
                      style={{
                        paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999,
                        backgroundColor: h === reminderHour ? colors.green : colors.surface2,
                        borderWidth: 2, borderColor: h === reminderHour ? colors.green : colors.line,
                      }}
                    >
                      <Text style={{
                        fontFamily: Fonts.family.black, fontSize: 13,
                        color: h === reminderHour ? '#fff' : colors.inkSoft,
                      }}>
                        {formatHour(h)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </Section>

            <Section title="Appearance">
              <ToggleRow icon="moon" label="Dark mode" value={isDark} onChange={() => toggle()} />
            </Section>
          </View>

          <View style={{ flex: 1, minWidth: 320, gap: 18 }}>
            <Section title={tr('settings.hardware')}>
              <LinkRow icon="bluetooth" label={tr('set.ledStrip')} value={led.connected ? tr('set.connected') : tr('set.notConnected')} onPress={() => go('pair')} />
              <LinkRow icon="sparkle" label={tr('set.ledThemesShort')} value={led.theme} onPress={() => go('ledSettings')} />
              <LinkRow icon="target" label={tr('set.recalibrate')} onPress={() => go('calibration')} />
              {/* Empty is a valid, working state — importing falls back to the
                  bundled demo score — so this says "Demo", not "Not set". */}
              <LinkRow
                icon="camera" label="Scan server"
                value={omrServer ? 'Configured' : 'Demo'}
                onPress={() => go('omrServer')}
              />
            </Section>

            <Section title={tr('settings.account')}>
              <LinkRow icon="user" label={tr('set.cloudSync')} value={accountLabel} onPress={() => go('account')} />
              <LinkRow icon="crown" label={tr('settings.subscription')} onPress={() => go('manageSub')} />
              <LinkRow icon="swap" label={tr('settings.switchProfile')} onPress={() => go('who')} />
            </Section>

            <Section title="Privacy">
              <LinkRow
                icon="mic" label="Microphone" value="On-device only"
                onPress={async () => {
                  const res = await Audio.requestPermissionsAsync();
                  toast(res.granted ? 'Microphone enabled — Maestro can hear you play' : 'Microphone stays off — enable it in system settings');
                }}
              />
            </Section>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
