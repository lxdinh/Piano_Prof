// Piano Professor — Songs / Songbook tab: featured hero + song shelves.
import React from 'react';
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

export function SongCover({ song, size = 132, onPress }: { song: Song; size?: number; onPress?: () => void }) {
  const { colors } = useAppTheme();
  const [c0, c1] = artColors(song.hue);
  return (
    <Pressable onPress={onPress} style={{ width: size, gap: 7 }}>
      <LinearGradient colors={[c0, c1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ width: size, height: size, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="music" size={size * 0.3} color="#ffffffcc" />
        {song.premium && (
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#00000040', borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 }}>
            <Text style={{ color: '#fff', fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 10 }}>PRO</Text>
          </View>
        )}
        <View style={{ position: 'absolute', bottom: 8, right: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: '#ffffffe8', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="play" size={18} color={c1} />
        </View>
      </LinearGradient>
      <Text numberOfLines={1} style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 15, color: colors.ink }}>{song.title}</Text>
      <Text numberOfLines={1} style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 12, color: colors.inkSoft, marginTop: -4 }}>{song.artist} · {song.level}</Text>
    </Pressable>
  );
}

function ShelfRow({ title, songs }: { title: string; songs: Song[] }) {
  const { colors } = useAppTheme();
  const { go } = useRouter();
  return (
    <View style={{ marginTop: 26 }}>
      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 18, color: colors.ink, marginBottom: 12 }}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingRight: 8 }}>
        {songs.map((s) => <SongCover key={s.id} song={s} onPress={() => go('songPreview', { song: s })} />)}
      </ScrollView>
    </View>
  );
}

export default function Songs() {
  const { go } = useRouter();
  const tr = useT();
  const f = SONGS.featured;
  const [c0, c1] = artColors(f.hue);

  return (
    <Shell active="songs">
      {/* featured hero */}
      <LinearGradient colors={[c0, c1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <View style={{ width: 110, height: 110, borderRadius: 18, backgroundColor: '#ffffff2e', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="music" size={48} color="#fff" />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 12, color: '#ffffffcc', letterSpacing: 1 }}>{tr('songs.featured').toUpperCase()}</Text>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 26, color: '#fff' }}>{f.title}</Text>
          <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 15, color: '#ffffffcc' }}>{f.artist} · {f.level}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <PPButton label="Play" size="sm" variant="white" icon={<Icon name="play" size={15} color="#2E84AD" />} onPress={() => go('songPreview', { song: f })} />
            <PPButton label="Import sheet" size="sm" variant="ghost" textColor="#fff" icon={<Icon name="camera" size={16} color="#fff" />} onPress={() => go('import')} />
          </View>
        </View>
      </LinearGradient>

      <ShelfRow title={tr('songs.trending')} songs={SONGS.trending} />
      <ShelfRow title={tr('songs.learn')} songs={SONGS.learn} />
    </Shell>
  );
}
