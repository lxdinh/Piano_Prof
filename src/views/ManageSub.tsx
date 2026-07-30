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
import { PLANS } from '../data/content';
import { useBilling } from '../billing/BillingProvider';
import { daysRemaining } from '../billing/entitlement';
import * as trustedTime from '../services/trustedTime';

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1.5, borderBottomColor: colors.line }}>
      <Text style={{ fontFamily: Fonts.family.bold, fontSize: 15, color: colors.inkSoft }}>{label}</Text>
      <Text style={{ fontFamily: Fonts.family.black, fontSize: 15, color: colors.ink }}>{value}</Text>
    </View>
  );
}

export default function ManageSub() {
  const { colors } = useAppTheme();
  const { profiles, seatHolders } = useApp();
  const { entitlement, status, seats, live, restore } = useBilling();
  const { go, back, toast } = useRouter();
  const insets = useSafeAreaInsets();

  const now = trustedTime.now();
  const days = daysRemaining(entitlement, now);
  const plan = entitlement ? PLANS.find((p) => p.id === entitlement.planId) : null;

  // Everything shown here now comes from the store. It previously rendered a
  // fixed "Family · Annual", "Next billing date Aug 22, 2026" and a card number
  // "•••• 4242" — none of which were real, on a screen whose entire job is to
  // tell someone the truth about what they are paying.
  const renews = entitlement?.expiresAt != null
    ? new Date(entitlement.expiresAt).toLocaleDateString(undefined,
      { year: 'numeric', month: 'short', day: 'numeric' })
    : '—';

  const statusLabel: Record<typeof status, string> = {
    none: 'No subscription',
    trial: days != null ? `Free trial · ${days} day${days === 1 ? '' : 's'} left` : 'Free trial',
    active: 'Active',
    cancelling: `Cancelled · access until ${renews}`,
    expired: 'Expired',
  };

  const onRestore = async () => {
    const res = await restore();
    if (!res.ok) { toast(res.message); return; }
    toast(res.entitlement ? 'Subscription restored 🎉' : 'No previous purchase found.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
        <Icon name="chevronLeft" size={28} color={colors.ink} />
      </Pressable>
      <ScrollFit pad={26}>
        <View style={{ width: 520, maxWidth: '100%', gap: 16 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 28, color: colors.ink }}>Subscription</Text>
          {entitlement ? (
            <>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Icon name="crown" size={22} color={colors.gold} />
                  <Text style={{ fontFamily: Fonts.family.black, fontSize: 20, color: colors.ink }}>
                    {plan?.name ?? entitlement.planId} · {entitlement.period === 'annual' ? 'Annual' : 'Monthly'}
                  </Text>
                </View>
                <Row label="Status" value={statusLabel[status]} />
                <Row label="Profiles" value={`${seatHolders.length} of ${seats} used`} />
                <Row label={entitlement.willRenew ? 'Renews' : 'Access until'} value={renews} />
              </Card>

              {/* Who the seats cover — an Individual plan really does cover one
                  profile now, so the household needs to see which. */}
              {profiles.length > 1 && (
                <Card>
                  <Text style={{ fontFamily: Fonts.family.black, fontSize: 15, color: colors.ink, marginBottom: 6 }}>
                    Premium profiles
                  </Text>
                  {profiles.map((p) => (
                    <Row
                      key={p.id} label={p.name}
                      value={seatHolders.includes(p.id) ? 'Premium' : 'Free'}
                    />
                  ))}
                </Card>
              )}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <PPButton label="Change plan" size="md" variant="sky" onPress={() => go('paywall')} />
                <PPButton label="Restore" size="md" variant="ghost" onPress={onRestore} />
              </View>

              {/* Cancelling must happen in the store — an in-app "Cancel" button
                  cannot end a real subscription, and pretending otherwise leaves
                  someone still being charged while the app says they are not. */}
              <Text style={{ fontFamily: Fonts.family.bold, fontSize: 13, color: colors.inkFaint }}>
                {live
                  ? 'To cancel or change payment, use your App Store or Google Play subscription settings.'
                  : 'Test mode — no store is configured, so this subscription is local and nothing is charged.'}
              </Text>
            </>
          ) : (
            <Card>
              <Text style={{ fontFamily: Fonts.family.bold, fontSize: 16, color: colors.inkSoft, marginBottom: 14 }}>
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
