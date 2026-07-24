// Piano Professor — landscape app shell: left nav rail + top HUD header.
// Wraps the four primary tab screens (Learn / Songs / Practice / Profile).
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from './Router';
import { Fonts } from '../theme/tokens';
import Icon, { IconName } from '../ui/Icon';
import Maestro from '../ui/Maestro';
import { StatChip } from '../ui/atoms';
import { useT } from '../i18n/useT';

type TabKey = 'home' | 'songs' | 'practice' | 'profile';
const TABS: { key: TabKey; icon: IconName; labelKey: string }[] = [
  { key: 'home', icon: 'home', labelKey: 'nav.learn' },
  { key: 'songs', icon: 'library', labelKey: 'nav.songs' },
  { key: 'practice', icon: 'piano', labelKey: 'nav.practice' },
  { key: 'profile', icon: 'user', labelKey: 'nav.profile' },
];

function RailButton({ icon, label, active, onPress, color }: {
  icon: IconName; label: string; active?: boolean; onPress: () => void; color: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 68, alignItems: 'center', gap: 3, paddingVertical: 10, borderRadius: 16,
        backgroundColor: active ? colors.navActive : 'transparent',
      }}
    >
      <Icon name={icon} size={26} color={active ? colors.skyDeep : color} />
      <Text style={{ fontSize: 11, fontFamily: Fonts.family.bold, fontWeight: '800', color: active ? colors.skyDeep : color }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function Shell({ active, children, scroll = true }: {
  active: TabKey; children: React.ReactNode; scroll?: boolean;
}) {
  const { colors } = useAppTheme();
  const { go } = useRouter();
  const { activeProfile, premium } = useApp();
  const insets = useSafeAreaInsets();
  const tr = useT();
  const p = activeProfile;

  const Content = scroll ? ScrollView : View;
  const contentProps = scroll
    ? { contentContainerStyle: { padding: 20, paddingBottom: 40 }, showsVerticalScrollIndicator: false }
    : { style: { flex: 1 } };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg, paddingTop: insets.top }}>
      {/* nav rail */}
      <View style={{
        width: 84, backgroundColor: colors.surface, borderRightWidth: 2, borderRightColor: colors.line,
        alignItems: 'center', paddingVertical: 14, paddingBottom: insets.bottom + 14,
      }}>
        <View style={{
          width: 46, height: 46, borderRadius: 14, backgroundColor: colors.sky,
          alignItems: 'center', justifyContent: 'center', marginBottom: 18,
        }}>
          <Icon name="music" size={26} color="#fff" />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          {TABS.map((t) => (
            <RailButton
              key={t.key} icon={t.icon} label={tr(t.labelKey)} active={active === t.key}
              color={colors.inkFaint} onPress={() => go(t.key)}
            />
          ))}
        </View>
        <View style={{ gap: 8, alignItems: 'center' }}>
          <Pressable onPress={() => go('pair')} style={{ padding: 8 }}>
            <Icon name="bluetooth" size={24} color={colors.green} />
          </Pressable>
          <Pressable onPress={() => go('settings')} style={{ padding: 8 }}>
            <Icon name="gear" size={24} color={colors.inkFaint} />
          </Pressable>
        </View>
      </View>

      {/* main column */}
      <View style={{ flex: 1 }}>
        {/* header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12,
          gap: 12, borderBottomWidth: 2, borderBottomColor: colors.line,
        }}>
          <Maestro mood={p?.avatar ?? 'cool'} size={44} bg={p?.bg ?? colors.surface2} fit="head" onPress={() => go('who')} />
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 20, color: colors.ink }}>
            {p ? `${tr('home.hi')} ${p.name}!` : 'Piano Professor'}
          </Text>
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <StatChip kind="streak" value={p?.streak ?? 0} onPress={() => go('streak')} />
            <StatChip kind="xp" value={p?.xp ?? 0} />
            <StatChip kind="gems" value={p?.gems ?? 0} onPress={() => go('shop')} />
            <StatChip
              kind="hearts" value={p?.hearts ?? 5}
              onPress={() => ((p?.hearts ?? 5) <= 0 ? go('upsell', { reason: 'hearts' }) : go('shop'))}
            />
            {!premium && (
              <Pressable
                onPress={() => go('paywall')}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12,
                  borderRadius: 999, backgroundColor: colors.gold,
                }}
              >
                <Icon name="crown" size={16} color="#5a3d00" />
                <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 13, color: '#5a3d00' }}>PRO</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* body */}
        <Content {...(contentProps as any)}>{children}</Content>
      </View>
    </View>
  );
}
