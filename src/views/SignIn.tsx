// Piano Professor — Sign in / Create account. Email + password, plus Google &
// Apple (real OAuth once Firebase is wired; simulated locally today).
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useAccount } from '../account/AccountProvider';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import PPButton from '../ui/PPButton';
import ScrollFit from '../ui/ScrollFit';

export default function SignIn() {
  const { colors } = useAppTheme();
  const { signUp, signIn, signInProvider } = useAccount();
  const { params, back, toast } = useRouter();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<'signin' | 'signup'>(params.mode === 'signup' ? 'signup' : 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isSignup = mode === 'signup';

  const submit = async () => {
    setError(''); setBusy(true);
    const res = isSignup ? await signUp(email, password, name) : await signIn(email, password);
    setBusy(false);
    if (res.ok) { toast(isSignup ? 'Account created — progress is syncing ☁️' : 'Welcome back — progress restored'); back(); }
    else setError(res.error ?? 'Something went wrong.');
  };

  const provider = async (p: 'google' | 'apple') => {
    setBusy(true);
    const res = await signInProvider(p);
    setBusy(false);
    if (res.ok) { toast('Signed in — progress is syncing ☁️'); back(); }
    else setError(res.error ?? 'Sign-in failed.');
  };

  const field = (value: string, set: (v: string) => void, placeholder: string, opts?: { secure?: boolean; email?: boolean }) => (
    <TextInput
      value={value} onChangeText={(t) => { set(t); setError(''); }}
      placeholder={placeholder} placeholderTextColor={colors.inkFaint}
      secureTextEntry={opts?.secure} autoCapitalize={opts?.email ? 'none' : 'words'}
      keyboardType={opts?.email ? 'email-address' : 'default'} autoCorrect={false}
      style={{ borderWidth: 2.5, borderColor: colors.line, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 16, color: colors.ink, backgroundColor: colors.surface }}
    />
  );

  const ProviderButton = ({ p, label }: { p: 'google' | 'apple'; label: string }) => (
    <Pressable onPress={() => provider(p)} disabled={busy}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 13, borderRadius: 14, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.surface }}>
      <Text style={{ fontSize: 18 }}>{p === 'google' ? '🇬' : ''}</Text>
      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 15, color: colors.ink }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
        <Icon name="chevronLeft" size={28} color={colors.ink} />
      </Pressable>
      <ScrollFit pad={26}>
        <View style={{ width: 400, maxWidth: '100%', gap: 12 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 28, color: colors.ink, textAlign: 'center' }}>
            {isSignup ? 'Create account' : 'Welcome back'}
          </Text>

          {isSignup && field(name, setName, 'Your name')}
          {field(email, setEmail, 'Email', { email: true })}
          {field(password, setPassword, 'Password', { secure: true })}

          {error ? <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 13, color: colors.error, textAlign: 'center' }}>{error}</Text> : null}

          <PPButton
            label={busy ? '' : isSignup ? 'Create account' : 'Sign in'} size="lg" variant="green" full disabled={busy}
            icon={busy ? <ActivityIndicator color="#fff" /> : undefined}
            onPress={submit}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 }}>
            <View style={{ flex: 1, height: 1.5, backgroundColor: colors.line }} />
            <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 12, color: colors.inkFaint }}>OR</Text>
            <View style={{ flex: 1, height: 1.5, backgroundColor: colors.line }} />
          </View>
          <ProviderButton p="google" label="Continue with Google" />
          <ProviderButton p="apple" label="Continue with Apple" />

          <Pressable onPress={() => { setMode(isSignup ? 'signin' : 'signup'); setError(''); }} style={{ paddingVertical: 8 }}>
            <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 14, color: colors.skyDeep, textAlign: 'center' }}>
              {isSignup ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </Text>
          </Pressable>
        </View>
      </ScrollFit>
    </View>
  );
}
