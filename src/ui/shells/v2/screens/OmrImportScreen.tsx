import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import PpCard from '../components/PpCard';
import { pickFromLibrary, capturePhoto, PickedImage } from '../../../../core/contract';
import { runOmr, getOmrServer, OmrNotConfiguredError } from '../../../../core/contract';
import { musicXmlToLesson } from '../../../../core/contract';
import { registerImportedLesson } from '../../../../core/contract';
import { setString } from '../../../../core/contract';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function OmrImportScreen() {
  const nav = useNavigation<Nav>();
  const [image, setImage] = useState<PickedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [server, setServerState] = useState('');

  useEffect(() => {
    getOmrServer().then((s) => setServerState(s ?? ''));
  }, []);

  const saveServer = async (url: string) => {
    setServerState(url);
    await setString('omrServerUrl', url);
  };

  const process = async (img: PickedImage) => {
    setImage(img);
    setError('');
    setBusy(true);
    try {
      const xml = await runOmr(img);
      const lesson = musicXmlToLesson(xml, 'Imported score');
      registerImportedLesson(lesson);
      nav.replace('Lesson', { gradeId: 0, lessonId: lesson.id });
    } catch (e) {
      if (e instanceof OmrNotConfiguredError) {
        setError('Set your OMR server URL below first, then try again.');
      } else {
        setError(e instanceof Error ? e.message : 'Import failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  const onPickLibrary = async () => {
    const img = await pickFromLibrary();
    if (img) process(img);
  };
  const onCapture = async () => {
    const img = await capturePhoto();
    if (img) process(img);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Import sheet music</Text>
        <Text style={styles.body}>Take a photo of typeset sheet music or pick an image. We'll turn it into a playable preview.</Text>

        {image && <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="contain" />}

        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={Colors.brand} size="large" />
            <Text style={styles.busyText}>Reading the score…</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <ChunkyButton label="📷 Take photo" onPress={onCapture} fullWidth />
            <ChunkyButton label="🖼️ Pick from library" variant="sky" onPress={onPickLibrary} fullWidth />
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PpCard style={styles.serverCard}>
          <Text style={styles.label}>OMR server URL</Text>
          <TextInput
            value={server}
            onChangeText={saveServer}
            placeholder="https://your-omr-server"
            placeholderTextColor={Colors.ink300}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <Text style={styles.hint}>Self-host the free oemer service (see backend/omr). Leave blank to disable import.</Text>
        </PpCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream50 },
  scroll: { padding: Spacing.lg, gap: Spacing.lg },
  title: { fontSize: Fonts.xl, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  body: { fontSize: Fonts.base, color: Colors.ink500, lineHeight: 20 },
  preview: { width: '100%', height: 200, borderRadius: Radii.lg, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: Colors.inkLine },
  actions: { gap: Spacing.md },
  busy: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  busyText: { fontSize: Fonts.md, color: Colors.ink700, fontWeight: Fonts.weight.heavy },
  error: { fontSize: Fonts.base, color: Colors.error, fontWeight: Fonts.weight.heavy, textAlign: 'center' },
  serverCard: { gap: Spacing.sm },
  label: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: Colors.cream50, borderWidth: 1, borderColor: Colors.inkLine,
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Fonts.base, color: Colors.ink900,
  },
  hint: { fontSize: Fonts.sm, color: Colors.ink300 },
});
