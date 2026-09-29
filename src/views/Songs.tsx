// Piano Professor — Songs / Songbook tab: featured hero + song shelves.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../theme/AppTheme';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Shell from '../nav/Shell';
import Icon from '../ui/Icon';
import PPButton from '../ui/PPButton';
import { SONGS, Song, artColors } from '../data/content';
import { useT } from '../i18n/useT';
import { useStage } from '../theme/responsive';
import { LocalSongMeta, deleteLocalSong, listLocalSongs, loadLocalSong } from '../omr/songLibrary';
import { registerImportedSong } from '../omr/importedSongs';

export function SongCover({ song, size = 132, onPress, onLongPress }: {
  song: Song; size?: number; onPress?: () => void; onLongPress?: () => void;
}) {
  const { colors } = useAppTheme();
  const [c0, c1] = artColors(song.hue);
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={{ width: size, gap: 7 }}>
      <LinearGradient colors={[c0, c1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ width: size, height: size, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="music" size={size * 0.3} color="#ffffffcc" />
        {song.premium && (
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#00000040', borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 }}>
            <Text style={{ color: '#fff', fontFamily: Fonts.family.black, fontSize: 10 }}>PRO</Text>
          </View>
        )}
        <View style={{ position: 'absolute', bottom: 8, right: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: '#ffffffe8', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="play" size={18} color={c1} />
        </View>
      </LinearGradient>
      <Text numberOfLines={1} style={{ fontFamily: Fonts.family.black, fontSize: 15, color: colors.ink }}>{song.title}</Text>
      <Text numberOfLines={1} style={{ fontFamily: Fonts.family.bold, fontSize: 12, color: colors.inkSoft, marginTop: -4 }}>{[song.artist, song.level].filter(Boolean).join(' · ')}</Text>
    </Pressable>
  );
}

function ShelfRow({ title, songs }: { title: string; songs: Song[] }) {
  const { colors } = useAppTheme();
  const { go } = useRouter();
  const { isTablet } = useStage();
  return (
    <View style={{ marginTop: 26 }}>
      <Text style={{ fontFamily: Fonts.family.black, fontSize: isTablet ? 18 : 15, color: colors.ink, marginBottom: 10 }}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingRight: 8 }}>
        {songs.map((s) => <SongCover key={s.id} song={s} onPress={() => go('songPreview', { song: s })} />)}
      </ScrollView>
    </View>
  );
}

/** Stable 0..359 hue from an id, so an imported song keeps its cover colour across launches. */
function hueOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
}

/**
 * Songs the learner scanned in themselves (src/omr/songLibrary.ts). Tap opens
 * the review screen; a long press deletes. Read on mount only — the router
 * remounts this tab on every visit, so a fresh import shows up on the way back.
 */
function MySongsShelf() {
  const { colors } = useAppTheme();
  const { go, toast } = useRouter();
  const { isTablet } = useStage();
  const tr = useT();
  const [mine, setMine] = useState<LocalSongMeta[]>([]);

  const refresh = useCallback(() => {
    listLocalSongs().then(setMine).catch(() => setMine([]));
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const open = async (id: string) => {
    const song = await loadLocalSong(id).catch(() => null);
    if (!song) {
      toast(tr('songs.openFailed'));
      refresh();
      return;
    }
    registerImportedSong(song);
    go('reviewScore', { songId: song.id });
  };

  const remove = async (id: string) => {
    await deleteLocalSong(id).catch(() => undefined);
    toast(tr('songs.removed'));
    refresh();
  };

  return (
    <View style={{ marginTop: 26 }}>
      <Text style={{ fontFamily: Fonts.family.black, fontSize: isTablet ? 18 : 15, color: colors.ink, marginBottom: 10 }}>
        {tr('songs.mine')}
      </Text>
      {mine.length === 0 ? (
        <Text style={{ fontFamily: Fonts.family.bold, fontSize: 13, color: colors.inkFaint }}>{tr('songs.mineEmpty')}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingRight: 8 }}>
          {mine.map((m) => (
            <SongCover
              key={m.id}
              song={{
                id: m.id, title: m.title, hue: hueOf(m.id), level: '',
                artist: `${m.pageCount} ${m.pageCount === 1 ? 'page' : 'pages'}`,
              }}
              onPress={() => { void open(m.id); }}
              onLongPress={() => { void remove(m.id); }}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export default function Songs() {
  const { go } = useRouter();
  const { isTablet } = useStage();
  const tr = useT();
  const f = SONGS.featured;
  const [c0, c1] = artColors(f.hue);

  return (
    <Shell active="songs">
      {/* featured hero */}
      <LinearGradient colors={[c0, c1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <View style={{ width: isTablet ? 110 : 92, height: isTablet ? 110 : 92, borderRadius: 16, backgroundColor: '#ffffff2e', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="music" size={isTablet ? 48 : 40} color="#fff" />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: isTablet ? 12 : 10.5, color: '#ffffffcc', letterSpacing: 0.8 }}>{tr('songs.featured').toUpperCase()}</Text>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: isTablet ? 26 : 24, color: '#fff' }}>{f.title}</Text>
          <Text style={{ fontFamily: Fonts.family.bold, fontSize: isTablet ? 15 : 13, color: '#ffffffcc' }}>{f.artist} · {f.level}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <PPButton label="Play" size="sm" variant="white" icon={<Icon name="play" size={15} color="#2E84AD" />} onPress={() => go('songPreview', { song: f })} />
            <PPButton label="Import sheet" size="sm" variant="ghost" textColor="#fff" icon={<Icon name="camera" size={16} color="#fff" />} onPress={() => go('import')} />
          </View>
        </View>
      </LinearGradient>

      <ShelfRow title={tr('songs.trending')} songs={SONGS.trending} />
      <ShelfRow title={tr('songs.learn')} songs={SONGS.learn} />
      <MySongsShelf />
    </Shell>
  );
}
