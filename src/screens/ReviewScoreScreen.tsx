import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { RootStackParamList } from '../navigation/types';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';
import ChunkyButton from '../components/ChunkyButton';
import PpCard from '../components/PpCard';
import { getImportedSong, registerImportedSong } from '../omr/importedSongs';
import { parseMusicXmlScore } from '../omr/musicxmlScore';
import { saveSongToFirebase, FirebaseNotConfiguredError } from '../services/firebaseSync';

// Review step between OMR and the player (klang.io's "Edit Mode", v1): the
// recognized score is rendered as REAL notation (OpenSheetMusicDisplay inside
// a WebView) so mistakes are visible at a glance, the user fixes title/tempo,
// then plays or saves. If a page came out wrong, going back to the Import
// screen re-scans just that page (per-page results are cached there).

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ReviewScore'>;

const OSMD_CDN = 'https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.4/build/opensheetmusicdisplay.min.js';

function notationHtml(xml: string): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  body { margin: 0; padding: 8px; background: #FFFFFF; font-family: -apple-system, sans-serif; }
  #msg { color: #7A6250; padding: 24px; text-align: center; font-size: 14px; }
</style>
<script src="${OSMD_CDN}"></script>
</head><body>
<div id="osmd"></div><div id="msg">Loading notation…</div>
<script>
  const xml = ${JSON.stringify(xml)};
  window.onload = async () => {
    const msg = document.getElementById('msg');
    try {
      if (!window.opensheetmusicdisplay) throw new Error('notation library did not load (offline?)');
      const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay('osmd', {
        backend: 'svg', drawTitle: false, drawingParameters: 'compacttight',
      });
      await osmd.load(xml);
      osmd.render();
      msg.style.display = 'none';
    } catch (e) {
      msg.textContent = 'Notation preview unavailable: ' + (e && e.message ? e.message : e);
    }
  };
</script>
</body></html>`;
}

export default function ReviewScoreScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const song = useMemo(() => getImportedSong(route.params.songId), [route.params.songId]);

  const [title, setTitle] = useState(song?.title ?? '');
  const [tempo, setTempo] = useState(Math.round(song?.score.tempoBpm ?? 90));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const html = useMemo(() => (song ? notationHtml(song.xml) : ''), [song]);

  // Push the edited title/tempo back into the registry so the player and any
  // later save see the reviewed version.
  const applyEdits = useCallback(() => {
    if (!song) return song;
    const updated = {
      ...song,
      title: title.trim() || song.title,
      score: parseMusicXmlScore(song.xml, tempo),
    };
    registerImportedSong(updated);
    return updated;
  }, [song, title, tempo]);

  const play = useCallback(() => {
    const updated = applyEdits();
    if (updated) nav.navigate('SongPlayer', { songId: updated.id });
  }, [applyEdits, nav]);

  const save = useCallback(async () => {
    const updated = applyEdits();
    if (!updated) return;
    setSaving(true);
    setStatus('');
    try {
      await saveSongToFirebase(updated.title, updated.xml, updated.pageCount);
      setStatus('Saved to your Firebase library ✓');
    } catch (e) {
      if (e instanceof FirebaseNotConfiguredError) {
        setStatus('Set up Firebase on the Import screen first.');
      } else {
        setStatus(e instanceof Error ? e.message : 'Save failed.');
      }
    } finally {
      setSaving(false);
    }
  }, [applyEdits]);

  if (!song) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.missing}>
          <Text style={styles.h1}>Score not found</Text>
          <Text style={styles.hint}>This import is no longer in memory. Re-import it.</Text>
          <ChunkyButton label="Back" variant="secondary" onPress={() => nav.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12}>
          <Text style={styles.close}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.h1}>Check the score</Text>
          <Text style={styles.sub}>
            {song.pageCount} page{song.pageCount === 1 ? '' : 's'} · {song.score.events.length} notes
          </Text>
        </View>
      </View>

      <View style={styles.sheet}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.web}
          javaScriptEnabled
          scrollEnabled
          setSupportMultipleWindows={false}
        />
      </View>

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        <PpCard style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Song title"
            placeholderTextColor={Colors.ink300}
            style={styles.input}
          />
          <Text style={styles.label}>Tempo</Text>
          <View style={styles.tempoRow}>
            <Pressable style={styles.tempoBtn} onPress={() => setTempo((t) => Math.max(30, t - 5))}>
              <Text style={styles.tempoBtnText}>−</Text>
            </Pressable>
            <Text style={styles.tempoValue}>{tempo} BPM</Text>
            <Pressable style={styles.tempoBtn} onPress={() => setTempo((t) => Math.min(240, t + 5))}>
              <Text style={styles.tempoBtnText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>
            Wrong notes on a page? Go back, tap ↻ on that page, and convert again — only that page
            is re-scanned.
          </Text>
        </PpCard>

        {status ? <Text style={styles.status}>{status}</Text> : null}

        <View style={styles.actions}>
          <ChunkyButton label="▶ Play" onPress={play} style={{ flex: 1 }} />
          <ChunkyButton
            label={saving ? 'Saving…' : '☁️ Save'}
            variant="sky"
            onPress={save}
            disabled={saving}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream50 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  close: { fontSize: 34, color: Colors.ink700, fontWeight: Fonts.weight.black, marginTop: -4 },
  h1: { fontSize: Fonts.lg, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  sub: { fontSize: Fonts.sm, color: Colors.ink500 },
  sheet: {
    flex: 1, marginHorizontal: Spacing.lg, borderRadius: Radii.lg, overflow: 'hidden',
    borderWidth: 2, borderColor: Colors.inkLine, backgroundColor: '#FFFFFF',
  },
  web: { flex: 1, backgroundColor: '#FFFFFF' },
  panel: { flexGrow: 0, maxHeight: 290 },
  panelContent: { padding: Spacing.lg, gap: Spacing.md },
  card: { gap: Spacing.sm },
  label: { fontSize: Fonts.sm, fontWeight: Fonts.weight.bold, color: Colors.ink500, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: Colors.cream50, borderWidth: 1, borderColor: Colors.inkLine,
    borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Fonts.base, color: Colors.ink900,
  },
  tempoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  tempoBtn: {
    width: 44, height: 44, borderRadius: Radii.md, backgroundColor: Colors.cream100,
    borderWidth: 1, borderColor: Colors.inkLine, alignItems: 'center', justifyContent: 'center',
  },
  tempoBtnText: { fontSize: Fonts.xl, color: Colors.ink900, fontWeight: Fonts.weight.black },
  tempoValue: { flex: 1, textAlign: 'center', fontSize: Fonts.md, fontWeight: Fonts.weight.black, color: Colors.ink900 },
  hint: { fontSize: Fonts.sm, color: Colors.ink300 },
  status: { fontSize: Fonts.base, color: Colors.brandDark, fontWeight: Fonts.weight.heavy, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
});
