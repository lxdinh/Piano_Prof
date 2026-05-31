import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TextInput, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import PpCard from '../components/PpCard';
import {
  pickFromLibrary, capturePhoto, pickMultiple, pickDocuments, PickedImage,
} from '../omr/pickImage';
import {
  runOmrSong, runSongLesson, getOmrServer, OmrNotConfiguredError, SongJobStatus,
} from '../omr/omrClient';
import { musicXmlToLesson } from '../omr/musicxmlToLesson';
import { registerImportedLesson } from '../lessons/importedLessons';
import { setString } from '../storage/settings';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function OmrImportScreen() {
  const nav = useNavigation<Nav>();
  const [pages, setPages] = useState<PickedImage[]>([]);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [server, setServerState] = useState('');

  useEffect(() => {
    getOmrServer().then((s) => setServerState(s ?? ''));
  }, []);

  const saveServer = async (url: string) => {
    setServerState(url);
    await setString('omrServerUrl', url);
  };

  const addOne = (img: PickedImage | null) => {
    if (img) setPages((p) => [...p, img]);
  };
  const addMany = (imgs: PickedImage[]) => {
    if (imgs.length) setPages((p) => [...p, ...imgs]);
  };

  const move = (i: number, dir: -1 | 1) => {
    setPages((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const next = p.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const remove = (i: number) => setPages((p) => p.filter((_, k) => k !== i));

  const process = async () => {
    if (!pages.length) return;
    setError('');
    setProgress('Uploading…');
    setBusy(true);
    const songTitle = title.trim() || 'Imported song';
    const onProg = (s: SongJobStatus) => {
      if (s.status === 'processing') {
        setProgress(`Reading the score… page ${s.donePages ?? 0}/${s.totalPages ?? '?'}`);
      }
    };
    try {
      let lesson;
      try {
        // Preferred: the server analyzes the score into a full professor lesson
        // (time signature, left-hand-first, chord rolls).
        lesson = await runSongLesson(pages, undefined, onProg);
      } catch (inner) {
        if (inner instanceof OmrNotConfiguredError) throw inner;
        // Fallback for older servers without /lesson support: merged MusicXML →
        // basic client-side lesson.
        const xml = await runOmrSong(pages, undefined, onProg);
        lesson = musicXmlToLesson(xml, songTitle);
      }
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
      setProgress('');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Import a song</Text>
        <Text style={styles.body}>
          Add every page of one song — photos, screenshots, or PDFs. Put them in playing
          order, then process. We read the whole score into one playable lesson.
        </Text>

        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={Colors.brand} size="large" />
            <Text style={styles.busyText}>{progress || 'Reading the score…'}</Text>
          </View>
        ) : (
          <>
            <PpCard style={styles.titleCard}>
              <Text style={styles.label}>Song title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Für Elise"
                placeholderTextColor={Colors.ink300}
                style={styles.input}
              />
            </PpCard>

            {pages.length > 0 && (
              <View style={styles.pageList}>
                {pages.map((p, i) => (
                  <View key={`${p.uri}-${i}`} style={styles.pageRow}>
                    {p.kind === 'pdf' ? (
                      <View style={styles.pdfThumb}><Text style={styles.pdfThumbText}>PDF</Text></View>
                    ) : (
                      <Image source={{ uri: p.uri }} style={styles.thumb} resizeMode="cover" />
                    )}
                    <Text style={styles.pageName} numberOfLines={1}>{i + 1}. {p.fileName}</Text>
                    <IconBtn label="▲" disabled={i === 0} onPress={() => move(i, -1)} />
                    <IconBtn label="▼" disabled={i === pages.length - 1} onPress={() => move(i, 1)} />
                    <IconBtn label="✕" onPress={() => remove(i)} />
                  </View>
                ))}
              </View>
            )}

            <View style={styles.actions}>
              <ChunkyButton label="🖼️ Add images" variant="sky" onPress={async () => addMany(await pickMultiple())} fullWidth />
              <ChunkyButton label="📄 Add PDFs" variant="violet" onPress={async () => addMany(await pickDocuments())} fullWidth />
              <ChunkyButton label="📷 Take photo" variant="secondary" onPress={async () => addOne(await capturePhoto())} fullWidth />
              <ChunkyButton label="🗂️ Pick one from library" variant="ghost" onPress={async () => addOne(await pickFromLibrary())} fullWidth />
            </View>

            <ChunkyButton
              label={pages.length ? `Process song (${pages.length} ${pages.length === 1 ? 'page' : 'pages'})` : 'Add pages to start'}
              onPress={process}
              disabled={!pages.length}
              fullWidth
            />
          </>
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

function IconBtn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.iconBtn, disabled && styles.iconBtnOff]} hitSlop={6}>
      <Text style={styles.iconBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream50 },
  scroll: { padding: Spacing.lg, gap: Spacing.lg },
  title: { fontSize: Fonts.xl, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  body: { fontSize: Fonts.base, color: Colors.ink500, lineHeight: 20 },
  titleCard: { gap: Spacing.sm },
  pageList: { gap: Spacing.sm },
  pageRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.inkLine,
    borderRadius: Radii.md, padding: Spacing.sm,
  },
  thumb: { width: 40, height: 40, borderRadius: Radii.sm, backgroundColor: Colors.cream50 },
  pdfThumb: {
    width: 40, height: 40, borderRadius: Radii.sm, backgroundColor: '#E63A3A',
    alignItems: 'center', justifyContent: 'center',
  },
  pdfThumbText: { color: '#FFFFFF', fontSize: Fonts.xs, fontWeight: Fonts.weight.black },
  pageName: { flex: 1, fontSize: Fonts.sm, color: Colors.ink700 },
  iconBtn: {
    width: 34, height: 34, borderRadius: Radii.sm, backgroundColor: Colors.cream50,
    borderWidth: 1, borderColor: Colors.inkLine, alignItems: 'center', justifyContent: 'center',
  },
  iconBtnOff: { opacity: 0.35 },
  iconBtnText: { fontSize: Fonts.md, color: Colors.ink700, fontWeight: Fonts.weight.heavy },
  actions: { gap: Spacing.md },
  busy: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  busyText: { fontSize: Fonts.md, color: Colors.ink700, fontWeight: Fonts.weight.heavy, textAlign: 'center' },
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
