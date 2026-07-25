// Piano Professor — landscape app shell: left nav rail + top HUD header.
// Wraps the four primary tab screens (Learn / Songs / Practice / Profile).
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useAppTheme } from '../theme/AppTheme';
import { useStage } from '../theme/responsive';
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

function RailButton({ icon, label, active, onPress, color, iconSize, padV, fontSize, width }: {
  icon: IconName; label: string; active?: boolean; onPress: () => void; color: string;
  iconSize: number; padV: number; fontSize: number; width: number;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width, alignItems: 'center', gap: 2, paddingVertical: padV, borderRadius: 14,
        backgroundColor: active ? colors.navActive : 'transparent',
      }}
    >
      <Icon name={icon} size={iconSize} color={active ? colors.skyDeep : color} />
      <Text numberOfLines={1} style={{ fontSize, fontFamily: Fonts.family.bold, color: active ? colors.skyDeep : color }}>
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
  const { activeProfile, premium, led } = useApp();
  const { isTablet } = useStage();
  const tr = useT();
  const p = activeProfile;
  // Compact metrics on the short phone canvas so logo + 4 tabs + 2 utilities all
  // fit (no overlap); roomier on the tall tablet canvas.
  const railW = isTablet ? 104 : 76;
  const logoSz = isTablet ? 46 : 40;
  const btnIcon = isTablet ? 26 : 22;
  const btnPadV = isTablet ? 10 : 6;
  const btnFont = isTablet ? 11 : 10;
  const railPadV = isTablet ? 14 : 8;
  const utilIcon = isTablet ? 24 : 22;
  const utilPad = isTablet ? 8 : 5;

  const Content = scroll ? ScrollView : View;
  const contentProps = scroll
    ? { contentContainerStyle: { padding: 20, paddingBottom: 40 }, showsVerticalScrollIndicator: false }
    : { style: { flex: 1 } };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      {/* nav rail */}
      <View style={{
        width: railW, backgroundColor: colors.surface, borderRightWidth: 2, borderRightColor: colors.line,
        alignItems: 'center', paddingVertical: railPadV,
      }}>
        <View style={{
          width: logoSz, height: logoSz, borderRadius: 14, backgroundColor: colors.sky,
          alignItems: 'center', justifyContent: 'center', marginBottom: isTablet ? 18 : 10,
        }}>
          <Icon name="music" size={isTablet ? 26 : 22} color="#fff" />
        </View>
        <View style={{ flex: 1, gap: isTablet ? 4 : 2, alignItems: 'center' }}>
          {TABS.map((t) => (
            <RailButton
              key={t.key} icon={t.icon} label={tr(t.labelKey)} active={active === t.key}
              color={colors.inkFaint} onPress={() => go(t.key)}
              iconSize={btnIcon} padV={btnPadV} fontSize={btnFont} width={railW - 10}
            />
          ))}
        </View>
        <View style={{ gap: isTablet ? 8 : 6, alignItems: 'center' }}>
          {/* green only when a real board is linked (see Pair) */}
          <Pressable onPress={() => go('pair')} style={{ padding: utilPad }}>
            <Icon name="bluetooth" size={utilIcon} color={led.connected ? colors.green : colors.inkFaint} />
          </Pressable>
          <Pressable onPress={() => go('settings')} style={{ padding: utilPad }}>
            <Icon name="gear" size={utilIcon} color={colors.inkFaint} />
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
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 20, color: colors.ink }}>
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
                <Text style={{ fontFamily: Fonts.family.black, fontSize: 13, color: '#5a3d00' }}>PRO</Text>
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
