// Piano Professor — where sheet-music scanning runs.
//
// A wrong or unreachable address is the single most likely setup failure, and
// the symptom without this screen is "scanning silently never works". So this
// does not just store a string: it can test the address against the server's
// /health endpoint and say what came back.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../theme/AppTheme';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import PPButton from '../ui/PPButton';
import ScrollFit from '../ui/ScrollFit';
import { getOmrServer, isPlausibleServerUrl, setOmrServer } from '../omr/omrConfig';

type Check = { state: 'idle' | 'testing' | 'ok' | 'bad'; detail?: string };

export default function OmrServer() {
  const { colors } = useAppTheme();
  const { back, toast } = useRouter();
  const insets = useSafeAreaInsets();

  const [url, setUrl] = useState('');
  const [check, setCheck] = useState<Check>({ state: 'idle' });

  useEffect(() => { getOmrServer().then((s) => setUrl(s ?? '')).catch(() => {}); }, []);

  const test = useCallback(async () => {
    setCheck({ state: 'testing' });
    const base = url.trim().replace(/\/+$/, '');
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15_000);
      const resp = await fetch(`${base}/health`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!resp.ok) { setCheck({ state: 'bad', detail: `Server answered ${resp.status}.` }); return; }
      const body = await resp.json().catch(() => ({}));
      setCheck({ state: 'ok', detail: body?.engine ? `Ready · ${body.engine}` : 'Ready' });
    } catch {
      setCheck({
        state: 'bad',
        detail: 'Could not reach it. Check the address, and that your phone is on the same network.',
      });
    }
  }, [url]);

  const save = useCallback(async () => {
    await setOmrServer(url);
    toast(url.trim() ? 'Scan server saved' : 'Scan server cleared — using the demo score');
    back();
  }, [url, back, toast]);

  const valid = url.trim() === '' || isPlausibleServerUrl(url);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
        <Icon name="chevronLeft" size={28} color={colors.ink} />
      </Pressable>

      <ScrollFit pad={26} style={{ gap: 14 }}>
        <View style={{ width: 560, maxWidth: '100%', gap: 12 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 26, color: colors.ink }}>
            Scan server
          </Text>
          <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: colors.inkSoft }}>
            Sheet music is read by a service you run yourself — see backend/omr.
            Leave this empty and importing still works, using a built-in demo score.
          </Text>

          <TextInput
            value={url}
            onChangeText={(t) => { setUrl(t); setCheck({ state: 'idle' }); }}
            placeholder="https://your-omr-server"
            placeholderTextColor={colors.inkFaint}
            autoCapitalize="none" autoCorrect={false} keyboardType="url"
            style={{
              borderWidth: 2.5, borderColor: valid ? colors.line : colors.error,
              borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16,
              fontFamily: Fonts.family.bold, fontSize: 16, color: colors.ink,
              backgroundColor: colors.surface,
            }}
          />

          {!valid && (
            <Text style={{ fontFamily: Fonts.family.bold, fontSize: 13, color: colors.error }}>
              That should start with http:// or https://
            </Text>
          )}

          {check.state === 'testing' && <ActivityIndicator color={colors.sky} />}
          {check.state !== 'idle' && check.state !== 'testing' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon
                name={check.state === 'ok' ? 'check' : 'close'} size={18}
                color={check.state === 'ok' ? colors.green : colors.error}
              />
              <Text style={{
                flex: 1, fontFamily: Fonts.family.bold, fontSize: 13,
                color: check.state === 'ok' ? colors.green : colors.error,
              }}>
                {check.detail}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <PPButton
              label="Test" size="md" variant="sky" onPress={test}
              disabled={!url.trim() || !valid || check.state === 'testing'}
            />
            <PPButton label="Save" size="md" variant="green" onPress={save} disabled={!valid} />
          </View>
        </View>
      </ScrollFit>
    </View>
  );
}
