// Piano Professor — Import sheet music.
//
// Chords-first: photograph or upload every page of a song (or one PDF), send
// them to the OMR service in one request, and come back with the key, the
// chord under every bar, and three ways forward — play it with the lights,
// check the notation, or take the generated A→Z lesson. With no scan server
// configured the bundled demo score stands in, so the whole flow stays
// walkable before backend/omr is deployed (see src/omr/omrConfig.ts).
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../theme/AppTheme';
import { useRouter } from '../nav/Router';
import { useStage } from '../theme/responsive';
import { Fonts } from '../theme/tokens';
import Icon, { IconName } from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import ScrollFit from '../ui/ScrollFit';
import { useT } from '../i18n/useT';
import { OmrError, OmrNotConfiguredError, OmrProgress, runOmrScore } from '../omr/omrClient';
import { PickedImage, capturePhoto, pickPagesFromLibrary, pickPdf } from '../omr/pickImage';
import { DEMO_SCORE_TITLE, DEMO_SCORE_XML } from '../omr/demoScore';
import { parseMusicXmlScore } from '../omr/musicxmlScore';
import { MeasureChord, SongAnalysis, analyzeSong } from '../omr/analyzeSong';
import { ImportedSong, newSongId, registerImportedSong } from '../omr/importedSongs';
import { saveLocalSong } from '../omr/songLibrary';
import { generateSongLesson } from '../omr/songLessonGenerator';

type Phase = 'pick' | 'scanning' | 'error' | 'done';

interface Result {
  song: ImportedSong;
  analysis: SongAnalysis;
  /** True when the bundled demo score stood in for a real scan. */
  isDemo: boolean;
}

/** Show at most this many chord chips; the rest collapse into one "+N" chip. */
const MAX_CHIPS = 16;
const FALLBACK_TITLE = 'Imported sheet';

/**
 * The chord sequence a learner actually reads: one chip per chord change, so
 * eight bars of G read as "G", not "G G G G G G G G". Measures too sparse to
 * name are skipped rather than shown as gaps.
 */
export function collapseChords(chords: Pick<MeasureChord, 'label'>[]): string[] {
  const out: string[] = [];
  for (const c of chords) {
    if (!c.label) continue;
    if (out[out.length - 1] !== c.label) out.push(c.label);
  }
  return out;
}

const XML_ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
};

/** First non-empty <work-title> or <movement-title>, in document order. */
export function titleFromXml(xml: string): string | null {
  const re = /<(work-title|movement-title)[^>]*>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const text = m[2]
      .replace(/<[^>]+>/g, '')
      .replace(/&(amp|lt|gt|quot|apos);/g, (e) => XML_ENTITIES[e] ?? e)
      .trim();
    if (text) return text;
  }
  return null;
}

// ── Small pieces ─────────────────────────────────────────────────────────────

function PickCard({ icon, title, sub, onPress }: { icon: IconName; title: string; sub: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={{
      width: 240, alignItems: 'center', gap: 8, paddingVertical: 22, borderRadius: 22,
      backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.line, borderBottomWidth: 6,
    }}>
      <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: colors.selSky, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={30} color={colors.skyDeep} />
      </View>
      <Text style={{ fontFamily: Fonts.family.black, fontSize: 18, color: colors.ink }}>{title}</Text>
      <Text style={{ fontFamily: Fonts.family.bold, fontSize: 13, color: colors.inkSoft, textAlign: 'center', paddingHorizontal: 14 }}>{sub}</Text>
    </Pressable>
  );
}

function Pill({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={{ paddingVertical: 2, paddingHorizontal: 9, borderRadius: 999, backgroundColor: bg }}>
      <Text style={{ fontFamily: Fonts.family.black, fontSize: 11, color: fg, letterSpacing: 0.6 }}>{label}</Text>
    </View>
  );
}

function Chip({ label, small, accent, muted }: { label: string; small?: boolean; accent?: boolean; muted?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={{
      minWidth: small ? 48 : 64, height: small ? 36 : 50, paddingHorizontal: 10,
      borderRadius: small ? 10 : 14, alignItems: 'center', justifyContent: 'center',
      backgroundColor: accent ? colors.selGreen : colors.surface,
      borderWidth: 2, borderColor: accent ? colors.green : colors.line, borderBottomWidth: 4,
    }}>
      <Text style={{ fontFamily: Fonts.family.black, fontSize: small ? 15 : 19, color: muted ? colors.inkFaint : colors.ink }}>
        {label}
      </Text>
    </View>
  );
}

function RowButton({ label, disabled, onPress, children }: {
  label: string; disabled?: boolean; onPress: () => void; children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} hitSlop={6}
      style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.3 : 1 }}
    >
      {children}
    </Pressable>
  );
}

function PageRow({ page, index, count, onRemove, onMove }: {
  page: PickedImage; index: number; count: number; onRemove: () => void; onMove: (dir: -1 | 1) => void;
}) {
  const { colors } = useAppTheme();
  const tr = useT();
  const isPdf = page.mimeType === 'application/pdf' || /\.pdf$/i.test(page.fileName);
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingHorizontal: 6,
      borderRadius: 12, backgroundColor: colors.surface2,
    }}>
      {isPdf ? (
        <View style={{ width: 40, height: 50, borderRadius: 8, backgroundColor: colors.selSky, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="book" size={22} color={colors.skyDeep} />
        </View>
      ) : (
        <Image
          source={{ uri: page.uri }} resizeMode="cover"
          style={{ width: 40, height: 50, borderRadius: 8, backgroundColor: colors.surface }}
        />
      )}
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={{ fontFamily: Fonts.family.black, fontSize: 15, color: colors.ink }}>{tr('import.page', { n: index + 1 })}</Text>
        <Text numberOfLines={1} style={{ fontFamily: Fonts.family.bold, fontSize: 11, color: colors.inkFaint }}>{page.fileName}</Text>
      </View>
      <RowButton label={tr('import.moveUp', { n: index + 1 })} disabled={index === 0} onPress={() => onMove(-1)}>
        <View style={{ transform: [{ rotate: '180deg' }] }}>
          <Icon name="chevronDown" size={20} color={colors.inkSoft} />
        </View>
      </RowButton>
      <RowButton label={tr('import.moveDown', { n: index + 1 })} disabled={index === count - 1} onPress={() => onMove(1)}>
        <Icon name="chevronDown" size={20} color={colors.inkSoft} />
      </RowButton>
      <RowButton label={tr('import.remove')} onPress={onRemove}>
        <Icon name="close" size={18} color={colors.error} />
      </RowButton>
    </View>
  );
}

// ── Detected chords ──────────────────────────────────────────────────────────

function Detected({ result, onPlay, onReview, onLearn, onAnother }: {
  result: Result; onPlay: () => void; onReview: () => void; onLearn: () => void; onAnother: () => void;
}) {
  const { colors } = useAppTheme();
  const { isTablet } = useStage();
  const tr = useT();
  const { song, analysis, isDemo } = result;
  const chips = collapseChords(analysis.chords);
  const shown = chips.slice(0, MAX_CHIPS);
  const overflow = chips.length - shown.length;
  const loop = analysis.loop;
  const pages = song.pageCount;
  const summary = tr('import.summary', {
    bars: song.score.measureCount,
    bpm: Math.round(song.score.tempoBpm),
    pages: pages === 1 ? tr('import.pageOne') : tr('import.pages', { n: pages }),
  });

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, maxWidth: '100%' }}>
        <Maestro mood="epiphany" size={isTablet ? 120 : 92} bg={colors.selGreen} float />
        <View style={{ gap: 3, flexShrink: 1 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: isTablet ? 28 : 24, color: colors.ink }}>
            {tr('import.detectedN', { n: chips.length, key: analysis.key.name })}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: colors.inkSoft }}>{summary}</Text>
            {isDemo && <Pill label="Demo" bg={colors.selGold} fg={colors.goldDeep} />}
          </View>
          <Text numberOfLines={1} style={{ fontFamily: Fonts.family.bold, fontSize: 13, color: colors.inkFaint }}>{song.title}</Text>
        </View>
      </View>

      {loop && (
        // The repeating progression, once — that is the shape a learner hears.
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {loop.labels.map((l, i) => <Chip key={`${l}-${i}`} label={l} accent />)}
          <Pill label={`×${loop.repeats}`} bg={colors.selGreen} fg={colors.greenDark} />
        </View>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 760 }}>
        {shown.map((c, i) => <Chip key={`${c}-${i}`} label={c} small={!!loop} />)}
        {overflow > 0 && <Chip label={`+${overflow}`} small={!!loop} muted />}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
        <PPButton label={tr('import.playLights')} size="lg" variant="green" onPress={onPlay} />
        <PPButton label={tr('import.review')} size="md" variant="sky" onPress={onReview} />
        <PPButton label={tr('import.learn')} size="md" variant="gold" onPress={onLearn} />
        <PPButton label={tr('import.another')} size="sm" variant="ghost" onPress={onAnother} />
      </View>
    </>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function ImportSheet() {
  const { colors } = useAppTheme();
  const { go, back, toast } = useRouter();
  const { isTablet } = useStage();
  const insets = useSafeAreaInsets();
  const tr = useT();

  const [phase, setPhase] = useState<Phase>('pick');
  // A scan can outlive the screen (back during 'scanning'); ignore its result then.
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const [pages, setPages] = useState<PickedImage[]>([]);
  const [progress, setProgress] = useState<OmrProgress | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  // A picker rejects when the OS sheet dies or a permission prompt is dismissed
  // mid-way. That is not a failed scan, so it only toasts and keeps the pages.
  const pick = async (fn: () => Promise<PickedImage[] | PickedImage | null>) => {
    try {
      const got = await fn();
      const picked = got == null ? [] : Array.isArray(got) ? got : [got];
      if (picked.length) setPages((p) => [...p, ...picked]);
    } catch {
      toast(tr('import.failed'));
    }
  };
  const addPhoto = () => { void pick(capturePhoto); };
  const addLibrary = () => { void pick(pickPagesFromLibrary); };
  const addPdf = () => { void pick(pickPdf); };

  const removePage = (i: number) => setPages((p) => p.filter((_, j) => j !== i));
  const movePage = (i: number, dir: -1 | 1) => setPages((p) => {
    const j = i + dir;
    if (j < 0 || j >= p.length) return p;
    const next = [...p];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const fail = (message: string) => { setError(message); setPhase('error'); };

  const read = async () => {
    if (pages.length === 0) return; // runOmrScore must never see an empty list
    setProgress(null);
    setPhase('scanning');

    let xml: string;
    let isDemo = false;
    try {
      xml = await runOmrScore(pages, setProgress);
    } catch (e) {
      if (!alive.current) return;
      if (!(e instanceof OmrNotConfiguredError)) {
        fail(e instanceof OmrError ? e.message : tr('import.failed'));
        return;
      }
      xml = DEMO_SCORE_XML;
      isDemo = true;
      toast(tr('import.demoNotice'));
    }
    if (!alive.current) return;

    let score;
    try {
      score = parseMusicXmlScore(xml);
    } catch {
      fail(tr('import.failed'));
      return;
    }
    if (score.events.length === 0) { fail(tr('import.noNotes')); return; }
    const analysis = analyzeSong(score, xml);
    // The demo XML's own <work-title> reads "Sunrise (demo OMR output)" — the
    // curated label is the one a learner should see.
    const title = isDemo ? DEMO_SCORE_TITLE : (titleFromXml(xml) ?? FALLBACK_TITLE);
    const song: ImportedSong = {
      id: newSongId(), title, xml, score, pageCount: Math.max(pages.length, 1),
    };
    registerImportedSong(song);
    // The bundled demo is a stand-in, not the learner's music: keep it out of My songs.
    if (!isDemo) void saveLocalSong(song).catch(() => undefined);
    setResult({ song, analysis, isDemo });
    setPhase('done');
  };

  const reset = () => {
    setPages([]); setResult(null); setError(''); setProgress(null); setPhase('pick');
  };

  const learn = (song: ImportedSong) => {
    const c = generateSongLesson(song);
    go('lesson', { item: { id: c.id, title: c.title, sub: c.subtitle, kind: 'song' }, lesson: c.lesson });
  };

  const progressLine = !progress || progress.indeterminate
    ? tr('import.detecting')
    : tr('import.pageProgress', { x: progress.page, y: progress.pageCount });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back" style={{ padding: 14, alignSelf: 'flex-start' }}>
        <Icon name="chevronLeft" size={28} color={colors.ink} />
      </Pressable>

      <ScrollFit pad={22} style={{ gap: 12 }}>
        {phase === 'pick' && pages.length === 0 && (
          <>
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 28, color: colors.ink }}>{tr('import.title')}</Text>
            <Text style={{ fontFamily: Fonts.family.bold, fontSize: 15, color: colors.inkSoft }}>
              {tr('import.subtitle')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
              <PickCard icon="camera" title={tr('import.photo')} sub={tr('import.photoSub')} onPress={addPhoto} />
              <PickCard icon="image" title={tr('import.upload')} sub={tr('import.uploadSub')} onPress={addLibrary} />
            </View>
            <PPButton
              label={tr('import.pdf')} size="sm" variant="ghost" onPress={addPdf}
              icon={<Icon name="book" size={16} color={colors.inkSoft} />}
            />
          </>
        )}

        {phase === 'pick' && pages.length > 0 && (
          <View style={{ width: '100%', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
              <Text style={{ fontFamily: Fonts.family.black, fontSize: 24, color: colors.ink }}>{tr('import.title')}</Text>
              {pages.length > 1 && (
                <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: colors.inkFaint }}>
                  {tr('import.pages', { n: pages.length })}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
              <View style={{
                flex: 1, gap: 6, padding: 8, borderRadius: 18,
                backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.line,
              }}>
                {pages.map((p, i) => (
                  <PageRow
                    key={`${p.uri}-${i}`} page={p} index={i} count={pages.length}
                    onRemove={() => removePage(i)} onMove={(d) => movePage(i, d)}
                  />
                ))}
              </View>
              <View style={{ width: isTablet ? 300 : 250, gap: 8 }}>
                <PPButton
                  label={tr('import.photo')} size="sm" variant="ghost" full onPress={addPhoto}
                  icon={<Icon name="camera" size={16} color={colors.inkSoft} />}
                />
                <PPButton
                  label={tr('import.library')} size="sm" variant="ghost" full onPress={addLibrary}
                  icon={<Icon name="image" size={16} color={colors.inkSoft} />}
                />
                <PPButton
                  label={tr('import.pdf')} size="sm" variant="ghost" full onPress={addPdf}
                  icon={<Icon name="book" size={16} color={colors.inkSoft} />}
                />
                <PPButton
                  label={tr('import.read')} size="md" variant="green" full disabled={pages.length === 0}
                  onPress={() => { void read(); }} style={{ marginTop: 6 }}
                />
              </View>
            </View>
          </View>
        )}

        {phase === 'scanning' && (
          <>
            <Maestro mood="idea" size={isTablet ? 150 : 120} bg={colors.surface2} float />
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 24, color: colors.ink }}>{tr('import.reading')}</Text>
            <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: colors.inkFaint }}>{progressLine}</Text>
          </>
        )}

        {phase === 'error' && (
          <>
            <Maestro mood="confused" size={isTablet ? 130 : 104} bg={colors.surface2} />
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 20, color: colors.ink, textAlign: 'center', maxWidth: 560 }}>
              {error}
            </Text>
            <PPButton label={tr('import.retry')} size="md" variant="sky" onPress={() => setPhase('pick')} />
          </>
        )}

        {phase === 'done' && result && (
          <Detected
            result={result}
            onPlay={() => go('songPlayer', { songId: result.song.id })}
            onReview={() => go('reviewScore', { songId: result.song.id })}
            onLearn={() => learn(result.song)}
            onAnother={reset}
          />
        )}
      </ScrollFit>
    </View>
  );
}
