// Piano Professor — Gem shop. Spend gems on heart refills and streak freezes.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import { StatChip } from '../ui/atoms';
import ScrollFit from '../ui/ScrollFit';
import * as haptics from '../feedback/haptics';
import { SHOP_ITEMS, ShopItem, canBuy, buyBlockedReason, MAX_FREEZES } from '../data/shop';

function ShopRow({ item }: { item: ShopItem }) {
  const { colors } = useAppTheme();
  const { activeProfile, buyShopItem } = useApp();
  const { toast } = useRouter();
  const p = activeProfile;
  const buyable = p ? canBuy(p, item.id) : false;
  const blocked = p ? buyBlockedReason(p, item.id) : null;
  const owned = item.id === 'freeze' ? (p?.streakFreezes ?? 0) : null;

  const buy = () => {
    if (buyShopItem(item.id)) { haptics.success(); toast(item.id === 'hearts' ? 'Hearts refilled ❤️' : 'Streak freeze ready 🧊'); }
  };

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20,
      backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.line, borderBottomWidth: 5,
    }}>
      <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 17, color: colors.ink }}>{item.title}</Text>
          {owned !== null && (
            <View style={{ backgroundColor: colors.selSky, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 }}>
              <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 11, color: colors.skyDeep }}>{owned}/{MAX_FREEZES} owned</Text>
            </View>
          )}
        </View>
        <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 13, color: colors.inkSoft }}>{item.desc}</Text>
      </View>
      <Pressable
        onPress={buy} disabled={!buyable}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 15,
          backgroundColor: buyable ? colors.sky : colors.surface2, borderBottomWidth: 3, borderBottomColor: buyable ? colors.skyDeep : 'transparent',
          minWidth: 92, justifyContent: 'center',
        }}>
        {buyable ? (
          <>
            <Text style={{ fontSize: 14 }}>💎</Text>
            <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 16, color: '#fff' }}>{item.cost}</Text>
          </>
        ) : (
          <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 12, color: colors.inkFaint, textAlign: 'center' }}>{blocked}</Text>
        )}
      </Pressable>
    </View>
  );
}

export default function Shop() {
  const { colors } = useAppTheme();
  const { activeProfile } = useApp();
  const { go, back } = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <Pressable onPress={back} style={{ padding: 12 }}>
          <Icon name="chevronLeft" size={28} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 24, color: colors.ink }}>Gem Shop</Text>
        <View style={{ flex: 1 }} />
        <View style={{ paddingRight: 16 }}>
          <StatChip kind="gems" value={activeProfile?.gems ?? 0} big />
        </View>
      </View>

      <ScrollFit>
        <View style={{ width: 560, maxWidth: '100%', gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 }}>
            <Maestro mood="magician" size={72} bg={colors.surface2} float />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 20, color: colors.ink }}>Spend your gems</Text>
              <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 14, color: colors.inkSoft }}>Earn more from lessons and Daily Quests</Text>
            </View>
          </View>

          {SHOP_ITEMS.map((item) => <ShopRow key={item.id} item={item} />)}

          <Pressable onPress={() => go('paywall')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, marginTop: 4 }}>
            <Icon name="crown" size={18} color={colors.gold} />
            <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 14, color: colors.inkSoft }}>Go Premium for unlimited hearts</Text>
          </Pressable>
        </View>
      </ScrollFit>
    </View>
  );
}
