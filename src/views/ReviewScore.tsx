// Piano Professor — Review an imported score before playing or learning it.
//
// The step between OMR and the player. The recognised score is shown as REAL
// notation (OpenSheetMusicDisplay inside a WebView) so a misread page is
// obvious at a glance, the learner fixes the title and tempo, then plays,
// learns, or saves the song to the on-device library.
// Route: go('reviewScore', { songId }) — the song comes from importedSongs.
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { useAppTheme } from '../theme/AppTheme';
import { useRouter } from '../nav/Router';
import { useT } from '../i18n/useT';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import PPButton from '../ui/PPButton';
import { getImportedSong, registerImportedSong, ImportedSong } from '../omr/importedSongs';
import { parseMusicXmlScore } from '../omr/musicxmlScore';
import { analyzeSong } from '../omr/analyzeSong';
import { generateSongLesson } from '../omr/songLessonGenerator';
import { saveLocalSong } from '../omr/songLibrary';

export const TEMPO_MIN = 30;
export const TEMPO_MAX = 240;
const TEMPO_STEP = 5;

const OSMD_CDN = 'https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.4/build/opensheetmusicdisplay.min.js';

/** Messages the notation page posts back to the screen (WebView onMessage). */
export const NOTATION_READY = 'notation-ready';
export const NOTATION_ERROR = 'notation-error';

/**
 * The self-contained page the WebView renders: OpenSheetMusicDisplay from a CDN
 * engraving the MusicXML into SVG. Pure, so it can be unit-tested — the xml is
 * embedded as a JSON string literal, with `</` escaped so a `</script>` inside
 * the score can never close the script tag early (`<\/` is still valid JSON).
 */
export function notationHtml(xml: string): string {
  const literal = JSON.stringify(xml).replace(/<\//g, '<\\/');
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
  const xml = ${literal};
  const post = (m) => { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(m); };
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
      post(${JSON.stringify(NOTATION_READY)});
    } catch (e) {
      msg.textContent = 'Notation preview unavailable: ' + (e && e.message ? e.message : e);
      post(${JSON.stringify(NOTATION_ERROR)});
    }
  };
</script>
</body></html>`;
}

const clampTempo = (bpm: number) => Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, bpm));

/** "C major · 8 bars · C Am F G" — what the learner is about to play, in one line. */
function summarize(song: ImportedSong): string {
  const a = analyzeSong(song.score, song.xml);
  const chords: string[] = [];
  for (const c of a.chords) {
    if (c.label && chords[chords.length - 1] !== c.label) chords.push(c.label);
    if (chords.length >= 4) break;
  }
  const bars = `${song.score.measureCount} ${song.score.measureCount === 1 ? 'bar' : 'bars'}`;
  return [a.key.name, bars, chords.length ? chords.join(' ') : null].filter(Boolean).join(' · ');
}

type WebState = 'loading' | 'ready' | 'error';

export default function ReviewScore() {
  const { colors } = useAppTheme();
  const { params, go, back, toast } = useRouter();
  const tr = useT();
  const insets = useSafeAreaInsets();

  const songId = String(params.songId ?? '');
  // The song this screen edits. Edits are applied on top of it from the title
  // and tempo state, so re-reading the registry after applyEdits() is not needed.
  const song = useMemo(() => getImportedSong(songId), [songId]);

  const [title, setTitle] = useState(song?.title ?? '');
  const [tempo, setTempo] = useState(() => clampTempo(Math.round(song?.score.tempoBpm ?? 90)));
  const [webState, setWebState] = useState<WebState>('loading');
  const [saving, setSaving] = useState(false);

  const html = useMemo(() => (song ? notationHtml(song.xml) : ''), [song]);
  const summary = useMemo(() => (song ? summarize(song) : ''), [song]);

  // Push the reviewed title/tempo back into the registry so the player, the
  // lesson generator and a later save all see the same song. The score is
  // re-timed only when the tempo actually changed — parsing is not free.
  const applyEdits = useCallback((): ImportedSong | null => {
    if (!song) return null;
    const tempoChanged = tempo !== Math.round(song.score.tempoBpm);
    const updated: ImportedSong = {
      ...song,
      title: title.trim() || song.title,
      score: tempoChanged ? parseMusicXmlScore(song.xml, tempo) : song.score,
    };
    registerImportedSong(updated);
    return updated;
  }, [song, title, tempo]);

  const play = useCallback(() => {
    const updated = applyEdits();
    if (updated) go('songPlayer', { songId: updated.id });
  }, [applyEdits, go]);

  const learn = useCallback(() => {
    const updated = applyEdits();
    if (!updated) return;
    const course = generateSongLesson(updated);
    go('lesson', {
      item: { id: course.id, title: course.title, sub: course.subtitle, kind: 'song' },
      lesson: course.lesson,
    });
  }, [applyEdits, go]);

  const save = useCallback(async () => {
    const updated = applyEdits();
    if (!updated) return;
    setSaving(true);
    try {
      const ok = await saveLocalSong(updated);
      toast(tr(ok ? 'review.saved' : 'review.saveFailed'));
    } catch {
      toast(tr('review.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [applyEdits, toast, tr]);

  const stepTempo = (delta: number) => setTempo((t) => clampTempo(t + delta));

  if (!song) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back" style={{ padding: 14, alignSelf: 'flex-start' }}>
          <Icon name="chevronLeft" size={28} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 24, color: colors.ink }}>{tr('review.notFound')}</Text>
          <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: colors.inkSoft, textAlign: 'center' }}>
            {tr('review.notFoundHint')}
          </Text>
        </View>
      </View>
    );
  }

  const label = { fontFamily: Fonts.family.black, fontSize: 12, color: colors.inkFaint, textTransform: 'uppercase' as const, letterSpacing: 1 };
  const stepper = (delta: number, glyph: string, testID: string) => {
    const atEdge = delta < 0 ? tempo <= TEMPO_MIN : tempo >= TEMPO_MAX;
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={delta < 0 ? 'Slower' : 'Faster'}
        onPress={() => stepTempo(delta)}
        disabled={atEdge}
        hitSlop={6}
        style={{
          width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
          backgroundColor: colors.surface2, borderWidth: 2, borderColor: colors.line,
          opacity: atEdge ? 0.4 : 1,
        }}
      >
        <Text style={{ fontFamily: Fonts.family.black, fontSize: 22, color: colors.ink, includeFontPadding: false }}>{glyph}</Text>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg, paddingTop: insets.top }}>
      {/* ── left: the engraved score ── */}
      <View style={{ flex: 3, paddingLeft: 6, paddingRight: 4, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} style={{ padding: 10 }}>
            <Icon name="chevronLeft" size={28} color={colors.ink} />
          </Pressable>
          <Text style={{ flex: 1, fontFamily: Fonts.family.bold, fontSize: 13, color: colors.inkSoft }} numberOfLines={1}>
            {song.pageCount} {song.pageCount === 1 ? 'page' : 'pages'} · {song.score.events.length} notes
          </Text>
        </View>
        {/* Sheet music is paper: the card stays white in both themes so the
            engraving reads the way a printed score does. */}
        <View style={{
          flex: 1, marginLeft: 8, borderRadius: 18, overflow: 'hidden',
          borderWidth: 2, borderColor: colors.line, backgroundColor: '#FFFFFF',
        }}>
          {webState === 'error' ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 }}>
              <Icon name="music" size={32} color="#A99F82" />
              <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: '#79735F', textAlign: 'center' }}>
                {tr('review.notationUnavailable')}
              </Text>
            </View>
          ) : (
            <WebView
              originWhitelist={['*']}
              source={{ html }}
              style={{ flex: 1, backgroundColor: '#FFFFFF' }}
              javaScriptEnabled
              scrollEnabled
              setSupportMultipleWindows={false}
              onLoadStart={() => setWebState('loading')}
              onLoadEnd={() => setWebState((s) => (s === 'error' ? s : 'ready'))}
              onError={() => setWebState('error')}
              onHttpError={() => setWebState('error')}
              onMessage={(e) => {
                if (e.nativeEvent.data === NOTATION_ERROR) setWebState('error');
                else if (e.nativeEvent.data === NOTATION_READY) setWebState('ready');
              }}
            />
          )}
          {webState === 'loading' && (
            <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={colors.sky} />
            </View>
          )}
        </View>
      </View>

      {/* ── right: title · tempo · actions ── */}
      <ScrollView
        style={{ flex: 2 }}
        contentContainerStyle={{ padding: 16, paddingLeft: 8, gap: 8 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontFamily: Fonts.family.black, fontSize: 22, color: colors.ink }}>{tr('review.title')}</Text>

        <Text style={label}>{tr('review.songTitle')}</Text>
        <TextInput
          testID="title-input"
          value={title}
          onChangeText={setTitle}
          placeholder={song.title}
          placeholderTextColor={colors.inkFaint}
          returnKeyType="done"
          style={{
            borderWidth: 2.5, borderColor: colors.line, borderRadius: 14,
            paddingVertical: 8, paddingHorizontal: 14,
            fontFamily: Fonts.family.bold, fontSize: 16, color: colors.ink,
            backgroundColor: colors.surface,
          }}
        />

        <Text style={label}>{tr('review.tempo')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {stepper(-TEMPO_STEP, '−', 'tempo-minus')}
          <Text style={{ flex: 1, textAlign: 'center', fontFamily: Fonts.family.black, fontSize: 20, color: colors.ink }}>
            {tempo} BPM
          </Text>
          {stepper(TEMPO_STEP, '+', 'tempo-plus')}
        </View>

        <Text style={{ fontFamily: Fonts.family.bold, fontSize: 13, color: colors.inkSoft }} numberOfLines={2}>
          {summary}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <PPButton label={tr('review.play')} size="sm" variant="green" onPress={play} style={{ flex: 1 }} />
          <PPButton label={tr('review.learn')} size="sm" variant="gold" onPress={learn} style={{ flex: 1.3 }} />
          <PPButton label={tr('review.save')} size="sm" variant="sky" onPress={save} disabled={saving} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </View>
  );
}
