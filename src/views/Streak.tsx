// Piano Professor — Streak screen: headline count, next milestone, calendar.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import { Card, ProgressBar } from '../ui/atoms';
import {
  MILESTONES, nextMilestone, milestoneProgress, earnedMilestones, monthCalendar,
} from '../data/streak';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Streak() {
  const { colors } = useAppTheme();
  const { activeProfile } = useApp();
  const { back, go } = useRouter();
  const insets = useSafeAreaInsets();
  const p = activeProfile;
  const streak = p?.streak ?? 0;
  const freezes = p?.streakFreezes ?? 0;
  const next = nextMilestone(streak);
  const earned = new Set(earnedMilestones(streak).map((m) => m.days));
  const cells = p ? monthCalendar(p) : [];
  const now = new Date();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <Pressable onPress={back} style={{ padding: 12 }}>
          <Icon name="chevronLeft" size={28} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 24, color: colors.ink }}>Your Streak</Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center' }}>
        <View style={{ width: 620, maxWidth: '100%', padding: 20, gap: 16, flexDirection: 'row', flexWrap: 'wrap' }}>
          {/* left column: headline + milestone */}
          <View style={{ flex: 1, minWidth: 260, gap: 16 }}>
            <Card style={{ alignItems: 'center', gap: 6, paddingVertical: 22 }}>
              <Text style={{ fontSize: 64 }}>🔥</Text>
              <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 52, color: colors.streak }}>{streak}</Text>
              <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 16, color: colors.inkSoft }}>
                {streak === 1 ? 'day streak' : 'day streak'}
              </Text>
              {freezes > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.selSky, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12, marginTop: 6 }}>
                  <Text style={{ fontSize: 15 }}>🧊</Text>
                  <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 13, color: colors.skyDeep }}>{freezes} streak freeze{freezes > 1 ? 's' : ''} ready</Text>
                </View>
              )}
            </Card>

            <Card style={{ gap: 10 }}>
              {next ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 24 }}>{next.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 15, color: colors.ink }}>Next: {next.name}</Text>
                      <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 12, color: colors.inkFaint }}>{next.days - streak} more day{next.days - streak > 1 ? 's' : ''} to go</Text>
                    </View>
                    <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 14, color: colors.streak }}>{streak}/{next.days}</Text>
                  </View>
                  <ProgressBar value={milestoneProgress(streak) * 100} height={12} color={colors.streak} />
                </>
              ) : (
                <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 15, color: colors.ink, textAlign: 'center' }}>🏆 Every milestone earned — legendary!</Text>
              )}
              <Pressable onPress={() => go('shop')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 4 }}>
                <Text style={{ fontSize: 14 }}>🧊</Text>
                <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 13, color: colors.skyDeep }}>Get a streak freeze in the shop</Text>
              </Pressable>
            </Card>
          </View>

          {/* right column: calendar + badges */}
          <View style={{ flex: 1, minWidth: 260, gap: 16 }}>
            <Card style={{ gap: 10 }}>
              <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 16, color: colors.ink }}>{MONTHS[now.getMonth()]} {now.getFullYear()}</Text>
              <View style={{ flexDirection: 'row' }}>
                {DOW.map((d, i) => (
                  <Text key={i} style={{ flex: 1, textAlign: 'center', fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 11, color: colors.inkFaint }}>{d}</Text>
                ))}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {cells.map((c, i) => (
                  <View key={i} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 }}>
                    {c && (
                      <View style={{
                        width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: c.active ? colors.streak : 'transparent',
                        borderWidth: c.today && !c.active ? 2 : 0, borderColor: colors.streak,
                      }}>
                        <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 12, color: c.active ? '#fff' : colors.inkSoft }}>{c.day}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </Card>

            <Card style={{ gap: 10 }}>
              <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 16, color: colors.ink }}>Milestones</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {MILESTONES.map((m) => {
                  const on = earned.has(m.days);
                  return (
                    <View key={m.days} style={{ alignItems: 'center', width: 62, gap: 2, opacity: on ? 1 : 0.4 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: on ? colors.selGold : colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                      </View>
                      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 11, color: on ? colors.ink : colors.inkFaint }}>{m.days}d</Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          </View>
        </View>
      </View>
    </View>
  );
}
