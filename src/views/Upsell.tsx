// Piano Professor — Upsell (out of hearts / locked content / trial ending).
import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import ScrollFit from '../ui/ScrollFit';
import { shopItem, canBuy } from '../data/shop';

const REASONS: Record<string, { emoji: string; mood: string; title: string; body: string }> = {
  hearts: { emoji: '💔', mood: 'sad', title: 'Out of hearts!', body: 'Refill with gems, wait for them to come back, or go Premium for unlimited hearts.' },
  locked: { emoji: '🔒', mood: 'confused', title: 'That one is Premium', body: 'Unlock every song, lesson and exercise for the whole family.' },
  trial: { emoji: '⏰', mood: 'nervous', title: 'Your trial is ending', body: 'Keep unlimited hearts and every unlock — pick a plan before the trial runs out.' },
};

export default function Upsell() {
  const { colors } = useAppTheme();
  const { activeProfile, buyShopItem } = useApp();
  const { params, go, back, toast } = useRouter();
  const reason = params.reason ?? 'hearts';
  const r = REASONS[reason] ?? REASONS.hearts;
  const heartCost = shopItem('hearts').cost;
  const canRefill = reason === 'hearts' && activeProfile ? canBuy(activeProfile, 'hearts') : false;

  return (
    <View style={{ flex: 1, backgroundColor: '#14100acc' }}>
      <ScrollFit pad={30}>
      <View style={{ width: 520, maxWidth: '94%', backgroundColor: colors.surface, borderRadius: 26, borderWidth: 2, borderColor: colors.line, padding: 28, alignItems: 'center', gap: 10 }}>
        <Maestro mood={r.mood} size={110} bg={colors.surface2} ring={5} ringColor={colors.surface} float />
        <Text style={{ fontSize: 34 }}>{r.emoji}</Text>
        <Text style={{ fontFamily: Fonts.family.black, fontSize: 26, color: colors.ink, textAlign: 'center' }}>{r.title}</Text>
        <Text style={{ fontFamily: Fonts.family.bold, fontSize: 15, color: colors.inkSoft, textAlign: 'center', lineHeight: 21 }}>{r.body}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <PPButton label="Maybe later" size="md" variant="ghost" onPress={back} />
          {canRefill ? (
            <PPButton
              label={`Refill · ${heartCost} 💎`} size="md" variant="sky"
              onPress={() => { if (buyShopItem('hearts')) { toast('Hearts refilled ❤️'); back(); } }}
            />
          ) : null}
          <PPButton label="Go Premium" size="md" variant="gold" onPress={() => go('paywall')} />
        </View>
      </View>
      </ScrollFit>
    </View>
  );
}
