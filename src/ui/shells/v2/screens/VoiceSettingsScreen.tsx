import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import PpCard from '../components/PpCard';
import { getVoiceSettings, saveVoiceSettings, DEFAULT_VOICE_ID } from '../../../../core/contract';
import { testElevenLabs } from '../../../../core/contract';

// Port of the ElevenLabs voice settings modal from the web prototype
// (index.html). Default voice is on-device TTS; entering a key upgrades to
// realistic AI narration.
const VOICES: { name: string; id: string }[] = [
  { name: 'Rachel (warm)', id: '21m00Tcm4TlvDq8ikWAM' },
  { name: 'Adam (deep)', id: 'pNInz6obpgDQGcFmaJgB' },
  { name: 'Bella (bright)', id: 'EXAVITQu4vr4xnSDxMaL' },
];

export default function VoiceSettingsScreen() {
  const nav = useNavigation();
  const [key, setKey] = useState('');
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE_ID);
  const [status, setStatus] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      const v = await getVoiceSettings();
      setKey(v.apiKey ?? '');
      setVoiceId(v.voiceId);
    })();
  }, []);

  const save = async () => {
    if (!key.trim()) {
      // saving with empty key reverts to on-device TTS
      await saveVoiceSettings('', voiceId);
      setStatus('✓ Using on-device voice.');
      return;
    }
    setTesting(true);
    setStatus('Testing connection…');
    const ok = await testElevenLabs(key.trim(), voiceId);
    setTesting(false);
    if (ok) {
      await saveVoiceSettings(key.trim(), voiceId);
      setStatus('✓ Connected! Realistic voice is active.');
      setTimeout(() => nav.goBack(), 1200);
    } else {
      setStatus('✗ Connection failed. Check your API key.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Instructor voice</Text>
        <Text style={styles.body}>
          By default the instructor uses your device's built-in voice. Connect ElevenLabs for a
          realistic AI voice (free tier = 10,000 chars/month).
        </Text>

        <PpCard style={styles.card}>
          <Text style={styles.label}>ElevenLabs API key</Text>
          <TextInput
            value={key}
            onChangeText={setKey}
            placeholder="Paste your API key (optional)"
            placeholderTextColor={Colors.ink300}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={styles.label}>Voice</Text>
          <View style={styles.voiceRow}>
            {VOICES.map((v) => (
              <ChunkyButton
                key={v.id}
                label={v.name}
                variant={v.id === voiceId ? 'primary' : 'ghost'}
                onPress={() => setVoiceId(v.id)}
                style={styles.voiceBtn}
              />
            ))}
          </View>

          {testing ? <ActivityIndicator color={Colors.brand} /> : null}
          {status ? <Text style={styles.status}>{status}</Text> : null}

          <ChunkyButton label="Save & apply" fullWidth onPress={save} />
        </PpCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream50 },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  title: { fontSize: Fonts.xl, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  body: { fontSize: Fonts.base, color: Colors.ink500, lineHeight: 20 },
  card: { gap: Spacing.sm },
  label: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.sm },
  input: {
    backgroundColor: Colors.cream50, borderWidth: 1, borderColor: Colors.inkLine,
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Fonts.base, color: Colors.ink900,
  },
  voiceRow: { gap: Spacing.sm },
  voiceBtn: {},
  status: { fontSize: Fonts.base, color: Colors.ink700, fontWeight: Fonts.weight.heavy, textAlign: 'center' },
});
