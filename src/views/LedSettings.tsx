// Piano Professor — LED settings: color theme picker + brightness.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Piano from '../ui/Piano';
import ScrollFit from '../ui/ScrollFit';

const LED_THEMES: { id: string; name: string; colors: string[] }[] = [
  { id: 'rainbow', name: 'Rainbow', colors: ['#FF4B4B', '#FF9600', '#F5B800', '#58CC02', '#5BB8E3', '#8B5CF6'] },
  { id: 'grass', name: 'Grass', colors: ['#58CC02', '#7CE62A', '#46A302', '#58CC02', '#7CE62A', '#46A302'] },
  { id: 'ocean', name: 'Ocean', colors: ['#5BB8E3', '#2E84AD', '#7FD4F0', '#5BB8E3', '#2E84AD', '#7FD4F0'] },
  { id: 'sunset', name: 'Sunset', colors: ['#FF7A52', '#F5B800', '#FF4B7A', '#FF7A52', '#F5B800', '#FF4B7A'] },
  { id: 'mono', name: 'Mono', colors: ['#FFFFFF', '#EAEAEA', '#FFFFFF', '#EAEAEA', '#FFFFFF', '#EAEAEA'] },
];

const BRIGHTNESS = [25, 50, 75, 100];

export default function LedSettings() {
  const { colors } = useAppTheme();
  const { led, setLed } = useApp();
  const { back } = useRouter();
  const insets = useSafeAreaInsets();
  const theme = LED_THEMES.find((t) => t.id === led.theme) ?? LED_THEMES[0];

  // live preview: paint the theme across the visible keys
  const [lit, setLit] = useState<Record<number, string>>({});
  useEffect(() => {
    const next: Record<number, string> = {};
    for (let m = 60; m <= 84; m++) next[m] = theme.colors[(m - 60) % theme.colors.length];
    setLit(next);
  }, [led.theme]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
        <Icon name="chevronLeft" size={28} color={colors.ink} />
      </Pressable>

      <ScrollFit pad={26} style={{ gap: 18 }}>
        <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 28, color: colors.ink }}>LED settings</Text>

        <View style={{ width: 560, maxWidth: '100%' }}>
          <Piano low={60} high={84} lit={lit} height={130} interactive={false} hideNoteNames />
        </View>

        {/* theme picker */}
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {LED_THEMES.map((t) => {
            const on = led.theme === t.id;
            return (
              <Pressable key={t.id} onPress={() => setLed({ theme: t.id })}
                style={{ alignItems: 'center', gap: 6, padding: 12, borderRadius: 16, backgroundColor: on ? colors.selSky : colors.surface, borderWidth: 2.5, borderColor: on ? colors.sky : colors.line }}>
                <View style={{ flexDirection: 'row', gap: 3 }}>
                  {t.colors.slice(0, 6).map((c, i) => (
                    <View key={i} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c, borderWidth: c === '#FFFFFF' ? 1 : 0, borderColor: colors.line }} />
                  ))}
                </View>
                <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 13, color: colors.ink }}>{t.name}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* brightness */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 13, color: colors.inkFaint, textTransform: 'uppercase' }}>Brightness</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {BRIGHTNESS.map((b) => {
              const on = led.brightness === b;
              return (
                <Pressable key={b} onPress={() => setLed({ brightness: b })}
                  style={{ paddingVertical: 9, paddingHorizontal: 18, borderRadius: 999, backgroundColor: on ? colors.gold : colors.surface, borderWidth: 2, borderColor: on ? colors.goldDeep : colors.line }}>
                  <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 15, color: on ? '#5a3d00' : colors.inkSoft }}>{b}%</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollFit>
    </View>
  );
}
