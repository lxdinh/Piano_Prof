// Piano Professor — Account screen. Anonymous by default (play with no login);
// prompts to save & sync, or shows the signed-in account + sync status.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useAccount } from '../account/AccountProvider';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import ScrollFit from '../ui/ScrollFit';
import { Card } from '../ui/atoms';

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1.5, borderBottomColor: colors.line }}>
      <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 15, color: colors.inkSoft }}>{label}</Text>
      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 15, color: colors.ink }}>{value}</Text>
    </View>
  );
}

export default function Account() {
  const { colors } = useAppTheme();
  const { account, syncedAt, signOut } = useAccount();
  const { go, back, toast } = useRouter();
  const insets = useSafeAreaInsets();
  const signedIn = account && !account.isAnonymous;

  const providerLabel = account?.provider === 'google' ? 'Google'
    : account?.provider === 'apple' ? 'Apple' : 'Email';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
        <Icon name="chevronLeft" size={28} color={colors.ink} />
      </Pressable>

      <ScrollFit pad={26}>
        <View style={{ width: 520, maxWidth: '100%', gap: 16 }}>
          {signedIn ? (
            <>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Maestro mood="cool" size={96} bg={colors.surface2} ring={4} ringColor={colors.green} float />
                <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 26, color: colors.ink }}>{account?.displayName ?? 'Your account'}</Text>
              </View>
              <Card>
                <Row label="Email" value={account?.email ?? '—'} />
                <Row label="Sign-in" value={providerLabel} />
                <Row label="Cloud sync" value={syncedAt ? 'On · synced ✓' : 'On'} />
                <Row label="Household" value="Synced across devices" />
              </Card>
              <PPButton label="Sign out" size="md" variant="ghost" onPress={async () => { await signOut(); toast('Signed out — your data stays on this device'); back(); }} />
            </>
          ) : (
            <>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Maestro mood="wow" size={110} bg={colors.selSky} ring={5} ringColor={colors.sky} float />
                <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 26, color: colors.ink, textAlign: 'center' }}>Save your progress</Text>
                <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 15, color: colors.inkSoft, textAlign: 'center', maxWidth: 420 }}>
                  Create a free account to back up your family's streaks and XP, and pick up on any device.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', backgroundColor: colors.surface2, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 }}>
                <Icon name="shield" size={16} color={colors.green} />
                <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 13, color: colors.inkSoft }}>Your progress is safe on this device right now</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
                <PPButton label="Sign in" size="md" variant="white" onPress={() => go('signIn', { mode: 'signin' })} />
                <PPButton label="Create account" size="md" variant="green" onPress={() => go('signIn', { mode: 'signup' })} />
              </View>
            </>
          )}
        </View>
      </ScrollFit>
    </View>
  );
}
