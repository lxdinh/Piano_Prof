// Piano Professor — Song preview: album header + animated chord chart.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import PPButton from '../ui/PPButton';
import { Song, artColors } from '../data/content';
import * as pianoEngine from '../audio/pianoEngine';

// Demo chord chart (I–V–vi–IV in C — the pop axis progression).
const CHART: { name: string; notes: number[] }[] = [
  { name: 'C', notes: [60, 64, 67] }, { name: 'G', notes: [67, 71, 74] },
  { name: 'Am', notes: [69, 72, 76] }, { name: 'F', notes: [65, 69, 72] },
  { name: 'C', notes: [60, 64, 67] }, { name: 'G', notes: [67, 71, 74] },
  { name: 'F', notes: [65, 69, 72] }, { name: 'C', notes: [60, 64, 67] },
];

export default function SongPreview() {
  const { colors } = useAppTheme();
  const { premium } = useApp();
  const { params, go, back } = useRouter();
  const insets = useSafeAreaInsets();
  const song: Song = params.song ?? { id: 's1', title: 'Perfect', artist: 'Ed Sheeran', hue: 12, level: 'Elementary' };
  const [c0, c1] = artColors(song.hue);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);

  const hearIt = async () => {
    for (let i = 0; i < CHART.length; i++) {
      setPlayingIdx(i);
      // sequential chord playback; small roll for musicality
      // eslint-disable-next-line no-await-in-loop
      await pianoEngine.playChord(CHART[i].notes, 60).catch(() => {});
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 520));
    }
    setPlayingIdx(null);
  };

  const learn = () => {
    if (song.premium && !premium) return go('paywall');
    go('lesson', { item: { title: song.title, kind: 'song' } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
        <Icon name="chevronLeft" size={28} color={colors.ink} />
      </Pressable>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 24 }}>
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
          <LinearGradient colors={[c0, c1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ width: 140, height: 140, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="music" size={54} color="#ffffffcc" />
          </LinearGradient>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 30, color: colors.ink }}>{song.title}</Text>
            <Text style={{ fontFamily: Fonts.family.bold, fontSize: 17, color: colors.inkSoft }}>{song.artist}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <View style={{ backgroundColor: colors.selSky, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 12 }}>
                <Text style={{ fontFamily: Fonts.family.black, fontSize: 12, color: colors.skyDeep }}>{song.level}</Text>
              </View>
              {song.premium && !premium && (
                <View style={{ backgroundColor: colors.selGold, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 12 }}>
                  <Text style={{ fontFamily: Fonts.family.black, fontSize: 12, color: '#9A6E00' }}>PREMIUM</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <PPButton label="Hear it" size="md" variant="sky" icon={<Icon name="sound" size={18} color="#fff" />} onPress={() => { void hearIt(); }} />
              <PPButton label="Learn this song" size="md" variant="green" onPress={learn} />
            </View>
          </View>
        </View>

        {/* chord chart */}
        <Text style={{ fontFamily: Fonts.family.black, fontSize: 17, color: colors.ink, marginTop: 26, marginBottom: 12 }}>Chord chart</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {CHART.map((ch, i) => (
            <Pressable key={i} onPress={() => { setPlayingIdx(i); pianoEngine.playChord(ch.notes, 60).catch(() => {}); setTimeout(() => setPlayingIdx(null), 500); }}
              style={{
                width: 92, height: 72, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                backgroundColor: playingIdx === i ? colors.green : colors.surface,
                borderWidth: 2, borderColor: playingIdx === i ? colors.greenDark : colors.line, borderBottomWidth: 5,
              }}>
              <Text style={{ fontFamily: Fonts.family.black, fontSize: 24, color: playingIdx === i ? '#fff' : colors.ink }}>{ch.name}</Text>
              <Text style={{ fontFamily: Fonts.family.bold, fontSize: 11, color: playingIdx === i ? '#ffffffcc' : colors.inkFaint }}>bar {i + 1}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
