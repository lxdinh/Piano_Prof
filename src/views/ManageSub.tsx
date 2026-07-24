// Piano Professor — Manage subscription.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import PPButton from '../ui/PPButton';
import ScrollFit from '../ui/ScrollFit';
import { Card } from '../ui/atoms';

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1.5, borderBottomColor: colors.line }}>
      <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 15, color: colors.inkSoft }}>{label}</Text>
      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 15, color: colors.ink }}>{value}</Text>
    </View>
  );
}

export default function ManageSub() {
  const { colors } = useAppTheme();
  const { premium, setPremium } = useApp();
  const { go, back, toast } = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
        <Icon name="chevronLeft" size={28} color={colors.ink} />
      </Pressable>
      <ScrollFit pad={26}>
        <View style={{ width: 520, maxWidth: '100%', gap: 16 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 28, color: colors.ink }}>Subscription</Text>
          {premium ? (
            <>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Icon name="crown" size={22} color={colors.gold} />
                  <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 20, color: colors.ink }}>Family · Annual</Text>
                </View>
                <Row label="Profiles" value="3 of 5 used" />
                <Row label="Next billing date" value="Aug 22, 2026" />
                <Row label="Payment" value="•••• 4242" />
              </Card>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <PPButton label="Change plan" size="md" variant="sky" onPress={() => go('paywall')} />
                <PPButton
                  label="Cancel" size="md" variant="ghost"
                  onPress={() => { setPremium(false); toast('Subscription cancelled'); back(); }}
                />
              </View>
            </>
          ) : (
            <Card>
              <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 16, color: colors.inkSoft, marginBottom: 14 }}>
                You're on the free plan. Hearts refill over time and some content is locked.
              </Text>
              <PPButton label="See Premium plans" size="md" variant="gold" onPress={() => go('paywall')} />
            </Card>
          )}
        </View>
      </ScrollFit>
    </View>
  );
}
