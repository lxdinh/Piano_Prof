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

/**
 * Rail tab. On the phone canvas the prototype (app/phone-main.jsx PhRail) uses
 * a compact 44x40 ICON-ONLY button — no label — which is what keeps the 58px
 * rail readable at that size. The tablet canvas has room for the label.
 */
function RailButton({ icon, label, active, onPress, color, iconSize, showLabel, width, height }: {
  icon: IconName; label: string; active?: boolean; onPress: () => void; color: string;
  iconSize: number; showLabel: boolean; width: number; height: number;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={{
        width, minHeight: height, alignItems: 'center', justifyContent: 'center',
        gap: 2, borderRadius: 12, paddingVertical: showLabel ? 8 : 0,
        backgroundColor: active ? colors.navActive : 'transparent',
      }}
    >
      <Icon name={icon} size={iconSize} color={active ? colors.skyDeep : color} />
      {showLabel && (
        <Text numberOfLines={1} style={{ fontSize: 11, fontFamily: Fonts.family.bold, color: active ? colors.skyDeep : color }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** 3480 → "3.5k", matching the prototype's compact phone header. */
function shortXp(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function Shell({ active, children, scroll = true, title, sub }: {
  active: TabKey; children: React.ReactNode; scroll?: boolean;
  /** Header title/subtitle — defaults to the "Hi <name>!" greeting. */
  title?: string; sub?: string;
}) {
  const { colors } = useAppTheme();
  const { go } = useRouter();
  const { activeProfile, premium, led } = useApp();
  const { isTablet } = useStage();
  const tr = useT();
  const p = activeProfile;
  // Metrics per canvas, from the prototype: PhRail/PhHeader (app/phone-main.jsx)
  // on the 852x394 phone canvas, the roomier standalone mockup on tablet. The
  // phone rail is icon-only at 58px — labels are what made it feel cramped.
  const railW = isTablet ? 104 : 58;
  const logoSz = isTablet ? 46 : 38;
  const btnIcon = isTablet ? 26 : 22;
  const btnW = isTablet ? railW - 10 : 44;
  const btnH = isTablet ? 52 : 40;
  const railPadV = isTablet ? 14 : 8;
  const utilIcon = isTablet ? 24 : 20;
  const avatarSz = isTablet ? 44 : 38;
  const titleSz = isTablet ? 20 : 18;
  const headPadH = isTablet ? 20 : 18;
  const headPadV = isTablet ? 12 : 8;
  const chipGap = isTablet ? 8 : 7;

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
        <View style={{ flex: 1, gap: 4, alignItems: 'center' }}>
          {TABS.map((t) => (
            <RailButton
              key={t.key} icon={t.icon} label={tr(t.labelKey)} active={active === t.key}
              color={colors.inkFaint} onPress={() => go(t.key)}
              iconSize={btnIcon} showLabel={isTablet} width={btnW} height={btnH}
            />
          ))}
        </View>
        <View style={{ gap: 4, alignItems: 'center' }}>
          {/* Bluetooth carries a green dot when a real board is linked (see Pair). */}
          <Pressable onPress={() => go('pair')} style={{ width: btnW, height: btnH, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
            <Icon name="bluetooth" size={utilIcon} color={led.connected ? colors.sky : colors.inkFaint} />
            {led.connected && (
              <View style={{
                position: 'absolute', top: 4, right: 8, width: 8, height: 8, borderRadius: 4,
                backgroundColor: colors.green, borderWidth: 1.5, borderColor: colors.surface,
              }} />
            )}
          </Pressable>
          <Pressable onPress={() => go('settings')} style={{ width: btnW, height: btnH, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
            <Icon name="gear" size={utilIcon} color={colors.inkFaint} />
          </Pressable>
        </View>
      </View>

      {/* main column */}
      <View style={{ flex: 1 }}>
        {/* header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: headPadH, paddingVertical: headPadV,
          gap: 10, borderBottomWidth: 2, borderBottomColor: colors.line,
        }}>
          <Maestro mood={p?.avatar ?? 'cool'} size={avatarSz} bg={p?.bg ?? colors.surface2} fit="head" ring={2.5} ringColor={colors.sky} onPress={() => go('who')} />
          <View>
            <Text numberOfLines={1} style={{ fontFamily: Fonts.family.black, fontSize: titleSz, color: colors.ink }}>
              {title ?? (p ? `${tr('home.hi')} ${p.name}!` : 'Piano Professor')}
            </Text>
            <Text numberOfLines={1} style={{ fontFamily: Fonts.family.bold, fontSize: 11.5, color: colors.inkFaint, marginTop: 2 }}>
              {sub ?? tr('home.ready')}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: chipGap }}>
            <StatChip kind="streak" value={p?.streak ?? 0} onPress={() => go('streak')} />
            {/* XP is abbreviated on the phone canvas so four-digit totals don't
                crowd the header (prototype PhHeader). */}
            <StatChip kind="xp" value={isTablet ? (p?.xp ?? 0) : shortXp(p?.xp ?? 0)} />
            {/* The prototype's phone header carries streak/XP/hearts only —
                gems live one tap away in the shop. */}
            {isTablet && <StatChip kind="gems" value={p?.gems ?? 0} onPress={() => go('shop')} />}
            <StatChip
              kind="hearts" value={premium ? '∞' : (p?.hearts ?? 5)}
              onPress={() => ((p?.hearts ?? 5) <= 0 && !premium ? go('upsell', { reason: 'hearts' }) : go('shop'))}
            />
            {!premium && (
              <Pressable
                onPress={() => go('paywall')}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 12,
                  borderRadius: 999, backgroundColor: colors.gold,
                }}
              >
                <Icon name="crown" size={15} color="#5a3d00" />
                <Text style={{ fontFamily: Fonts.family.black, fontSize: 12, color: '#5a3d00' }}>PRO</Text>
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
