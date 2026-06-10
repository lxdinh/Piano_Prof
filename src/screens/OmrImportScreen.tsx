import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TextInput, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import PpCard from '../components/PpCard';
import { pickFromLibrary, pickPagesFromLibrary, pickPdf, capturePhoto, PickedImage } from '../omr/pickImage';
import { saveLocalSong } from '../omr/songLibrary';
import { runOmr, getOmrServer, OmrNotConfiguredError } from '../omr/omrClient';
import { mergeMusicXml } from '../omr/mergeMusicXml';
import { parseMusicXmlScore } from '../omr/musicxmlScore';
import { registerImportedSong, newSongId } from '../omr/importedSongs';
import { setString, getString } from '../storage/settings';
import {
  listSavedSongs, downloadSongXml, deleteSavedSong, getFirebaseConfig, SavedSong,
} from '../services/firebaseSync';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Multi-page sheet-music import (klang.io-style): collect every page of the
// song, OMR each page, merge into ONE MusicXML, open the falling-notes player,
// and (when Firebase is configured) persist the song to the user's library.

export default function OmrImportScreen() {
  const nav = useNavigation<Nav>();
  const [pages, setPages] = useState<PickedImage[]>([]);
  // OMR result per page uri — re-converting only scans pages that changed,
  // which is also how "re-scan just page 3" works (↻ clears one entry).
  const [pageXmls, setPageXmls] = useState<Record<string, string>>({});
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  // server + firebase config
  const [server, setServerState] = useState('');
  const [fbApiKey, setFbApiKey] = useState('');
  const [fbProjectId, setFbProjectId] = useState('');
  const [fbBucket, setFbBucket] = useState('');

  // saved library
  const [saved, setSaved] = useState<SavedSong[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [openingId, setOpeningId] = useState('');

  useEffect(() => {
    getOmrServer().then((s) => setServerState(s ?? ''));
    Promise.all([
      getString('firebaseApiKey'),
      getString('firebaseProjectId'),
      getString('firebaseBucket'),
    ]).then(([k, p, b]) => {
      setFbApiKey(k ?? '');
      setFbProjectId(p ?? '');
      setFbBucket(b ?? '');
    });
  }, []);

  const refreshSaved = useCallback(async () => {
    if (!(await getFirebaseConfig())) { setSaved([]); return; }
    setSavedLoading(true);
    try {
      setSaved(await listSavedSongs());
    } catch {
      // non-fatal — library list is best-effort
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => { void refreshSaved(); }, [refreshSaved]);

  const addPages = async () => {
    const picked = await pickPagesFromLibrary();
    if (picked.length) setPages((p) => [...p, ...picked]);
  };
  const addSinglePage = async () => {
    const img = await pickFromLibrary();
    if (img) setPages((p) => [...p, img]);
  };
  const addPhoto = async () => {
    const img = await capturePhoto();
    if (img) setPages((p) => [...p, img]);
  };
  const addPdf = async () => {
    const pdf = await pickPdf();
    if (pdf) setPages((p) => [...p, pdf]);
  };
  const removePage = (i: number) => {
    const uri = pages[i]?.uri;
    setPages((p) => p.filter((_, j) => j !== i));
    if (uri) setPageXmls(({ [uri]: _gone, ...rest }) => rest);
  };
  const rescanPage = (uri: string) => setPageXmls(({ [uri]: _gone, ...rest }) => rest);

  const convert = async () => {
    if (!pages.length) return;
    setError('');
    setBusy(true);
    try {
      // 1) OMR every page in order (already-scanned pages come from the cache)
      const xmls: string[] = [];
      const cache = { ...pageXmls };
      for (let i = 0; i < pages.length; i++) {
        let xml = cache[pages[i].uri];
        if (!xml) {
          setProgress(`Reading page ${i + 1} of ${pages.length}…`);
          xml = await runOmr(pages[i]);
          cache[pages[i].uri] = xml;
          setPageXmls({ ...cache });
        }
        xmls.push(xml);
      }
      // 2) merge into one whole-song MusicXML
      setProgress('Stitching pages into one score…');
      const xml = mergeMusicXml(xmls);
      // 3) parse into a timed score for the player
      const score = parseMusicXmlScore(xml);
      if (!score.events.length) {
        throw new Error('No notes detected. Try clearer, well-lit photos of typeset sheet music.');
      }
      const songTitle = title.trim() || 'Imported song';
      const song = { id: newSongId(), title: songTitle, xml, score, pageCount: pages.length };
      registerImportedSong(song);
      void saveLocalSong(song); // on-device library — survives restarts

      // 4) review (check notation, fix title/tempo) → play / save to Firebase
      nav.navigate('ReviewScore', { songId: song.id });
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

  const openSaved = async (item: SavedSong) => {
    setOpeningId(item.id);
    setError('');
    try {
      const xml = await downloadSongXml(item.musicXmlPath);
      const score = parseMusicXmlScore(xml);
      const song = { id: newSongId(), title: item.title, xml, score, pageCount: item.pageCount };
      registerImportedSong(song);
      nav.navigate('SongPlayer', { songId: song.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the saved song.');
    } finally {
      setOpeningId('');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Import sheet music</Text>
        <Text style={styles.body}>
          Add every page of the song (photos or images, in order). We'll read them all, build one
          score, and show you the notation to check before playing or saving. Tap ↻ on a page to
          re-scan just that page.
        </Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Song title (e.g. Für Elise)"
          placeholderTextColor={Colors.ink300}
          style={styles.input}
        />

        {pages.length > 0 && (
          <View style={styles.pageGrid}>
            {pages.map((p, i) => (
              <View key={`${p.uri}-${i}`} style={styles.pageThumbWrap}>
                {p.mimeType === 'application/pdf' ? (
                  <View style={[styles.pageThumb, styles.pdfThumb]}>
                    <Text style={styles.pdfIcon}>📄</Text>
                    <Text style={styles.pdfName} numberOfLines={2}>{p.fileName}</Text>
                  </View>
                ) : (
                  <Image source={{ uri: p.uri }} style={styles.pageThumb} resizeMode="cover" />
                )}
                <Text style={styles.pageNum}>
                  Page {i + 1}{pageXmls[p.uri] ? ' ✓' : ''}
                </Text>
                <Pressable style={styles.pageRemove} hitSlop={8} onPress={() => removePage(i)}>
                  <Text style={styles.pageRemoveText}>✕</Text>
                </Pressable>
                {pageXmls[p.uri] && (
                  <Pressable style={styles.pageRescan} hitSlop={8} onPress={() => rescanPage(p.uri)}>
                    <Text style={styles.pageRemoveText}>↻</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={Colors.brand} size="large" />
            <Text style={styles.busyText}>{progress || 'Working…'}</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <ChunkyButton label="🖼️ Add pages from library" variant="sky" onPress={addPages} fullWidth />
            <ChunkyButton label="📄 Add a PDF" variant="violet" onPress={addPdf} fullWidth />
            <ChunkyButton label="📷 Photograph a page" variant="secondary" onPress={addPhoto} fullWidth />
            {pages.length > 0 && (
              <ChunkyButton
                label={`🎵 Convert ${pages.length} page${pages.length === 1 ? '' : 's'} to music`}
                onPress={convert}
                fullWidth
              />
            )}
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Saved library (Firebase) */}
        {(saved.length > 0 || savedLoading) && (
          <PpCard style={styles.card}>
            <Text style={styles.label}>My saved songs</Text>
            {savedLoading && <ActivityIndicator color={Colors.brand} />}
            {saved.map((s) => (
              <Pressable
                key={s.id}
                style={styles.savedRow}
                onPress={() => openSaved(s)}
                onLongPress={() => {
                  Alert.alert('Delete from Firebase?', `Remove "${s.title}" from your cloud library?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await deleteSavedSong(s.id, s.musicXmlPath);
                          void refreshSaved();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Delete failed.');
                        }
                      },
                    },
                  ]);
                }}
                disabled={!!openingId}
              >
                <Text style={styles.savedTitle} numberOfLines={1}>🎼 {s.title}</Text>
                <Text style={styles.savedMeta}>
                  {openingId === s.id ? 'Opening…' : `${s.pageCount} pg · hold to delete`}
                </Text>
              </Pressable>
            ))}
          </PpCard>
        )}

        <PpCard style={styles.card}>
          <Text style={styles.label}>OMR server URL</Text>
          <TextInput
            value={server}
            onChangeText={(url) => { setServerState(url); void setString('omrServerUrl', url); }}
            placeholder="https://your-omr-server"
            placeholderTextColor={Colors.ink300}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <Text style={styles.hint}>Self-host the free homr OMR service (see backend/omr). Leave blank to disable import.</Text>
        </PpCard>

        <PpCard style={styles.card}>
          <Text style={styles.label}>Save to Firebase (optional)</Text>
          <TextInput
            value={fbApiKey}
            onChangeText={(v) => { setFbApiKey(v); void setString('firebaseApiKey', v); }}
            placeholder="Web API key"
            placeholderTextColor={Colors.ink300}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <TextInput
            value={fbProjectId}
            onChangeText={(v) => { setFbProjectId(v); void setString('firebaseProjectId', v); }}
            placeholder="Project ID"
            placeholderTextColor={Colors.ink300}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <TextInput
            value={fbBucket}
            onChangeText={(v) => { setFbBucket(v); void setString('firebaseBucket', v); }}
            placeholder="Storage bucket (optional, e.g. my-app.firebasestorage.app)"
            placeholderTextColor={Colors.ink300}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <Text style={styles.hint}>
            From Firebase console → Project settings. Enable Anonymous sign-in under Authentication.
            Converted songs are stored in your library and synced back on any device.
          </Text>
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
  pageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  pageThumbWrap: { width: 96 },
  pageThumb: {
    width: 96, height: 128, borderRadius: Radii.md, backgroundColor: '#FFFFFF',
    borderWidth: 2, borderColor: Colors.inkLine,
  },
  pageNum: { fontSize: Fonts.sm, color: Colors.ink500, textAlign: 'center', marginTop: 2, fontWeight: Fonts.weight.heavy },
  pdfThumb: { alignItems: 'center', justifyContent: 'center', gap: 4, padding: 6 },
  pdfIcon: { fontSize: 28 },
  pdfName: { fontSize: Fonts.xs, color: Colors.ink500, textAlign: 'center' },
  pageRemove: {
    position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center',
  },
  pageRescan: {
    position: 'absolute', top: -6, left: -6, width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.sky, alignItems: 'center', justifyContent: 'center',
  },
  pageRemoveText: { color: '#FFFFFF', fontSize: 11, fontWeight: Fonts.weight.black },
  actions: { gap: Spacing.md },
  busy: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  busyText: { fontSize: Fonts.md, color: Colors.ink700, fontWeight: Fonts.weight.heavy },
  error: { fontSize: Fonts.base, color: Colors.error, fontWeight: Fonts.weight.heavy, textAlign: 'center' },
  card: { gap: Spacing.sm },
  label: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 1 },
  savedRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.inkLine, gap: Spacing.sm,
  },
  savedTitle: { flex: 1, fontSize: Fonts.md, color: Colors.ink900, fontWeight: Fonts.weight.heavy },
  savedMeta: { fontSize: Fonts.sm, color: Colors.ink300 },
  input: {
    backgroundColor: Colors.cream50, borderWidth: 1, borderColor: Colors.inkLine,
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Fonts.base, color: Colors.ink900,
  },
  hint: { fontSize: Fonts.sm, color: Colors.ink300 },
});
