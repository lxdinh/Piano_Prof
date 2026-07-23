// Piano Professor — Home / "Learn" hub: continue hero + poster-card shelves.
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Shell from '../nav/Shell';
import Maestro from '../ui/Maestro';
import Icon, { IconName } from '../ui/Icon';
import PPButton from '../ui/PPButton';
import { ProgressBar } from '../ui/atoms';
import { SHELVES, ShelfItem, Shelf, ItemKind, levelById } from '../data/content';

const KIND_ICON: Record<ItemKind, IconName> = {
  lesson: 'piano', song: 'music', concept: 'book', exercise: 'bolt',
};

function PosterCard({ item, shelf }: { item: ShelfItem; shelf: Shelf }) {
  const { colors } = useAppTheme();
  const { go, toast } = useRouter();

  const onPress = () => {
    if (item.state === 'soon') return toast('Still cooking 👨‍🍳');
    if (item.state === 'locked') {
      if (item.premium) return go('paywall');
      return toast('Finish the earlier units first');
    }
    go('lesson', { item });
  };

  return (
    <Pressable onPress={onPress} style={{
      width: 156, borderRadius: 18, backgroundColor: colors.surface,
      borderWidth: 2, borderColor: colors.line, borderBottomWidth: 5, overflow: 'hidden',
      opacity: item.state === 'locked' || item.state === 'soon' ? 0.75 : 1,
    }}>
      <LinearGradient colors={[shelf.color, shelf.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ height: 82, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={KIND_ICON[item.kind]} size={34} color="#ffffff" />
        {item.premium && (
          <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: '#00000030', borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7 }}>
            <Text style={{ color: '#fff', fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 10 }}>PRO</Text>
          </View>
        )}
      </LinearGradient>
      <View style={{ padding: 11, gap: 6 }}>
        <Text numberOfLines={1} style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 15, color: colors.ink }}>{item.title}</Text>
        <Text numberOfLines={1} style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 12, color: colors.inkSoft }}>{item.sub}</Text>
        <View style={{ minHeight: 20, justifyContent: 'center' }}>
          {item.state === 'done' && (
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {[0, 1, 2].map((i) => (
                <Icon key={i} name={i < (item.stars ?? 0) ? 'star' : 'starline'} size={16} color={i < (item.stars ?? 0) ? '#F5B800' : colors.line} />
              ))}
            </View>
          )}
          {item.state === 'active' && <ProgressBar value={item.progress ?? 0} height={10} />}
          {item.state === 'locked' && <Icon name="lock" size={16} color={colors.inkFaint} />}
          {item.state === 'soon' && (
            <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 11, color: colors.inkFaint }}>Still cooking 👨‍🍳</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function Home() {
  const { colors } = useAppTheme();
  const { activeProfile } = useApp();
  const { go } = useRouter();
  const level = levelById(activeProfile?.levelId ?? 'el');

  return (
    <Shell active="home">
      {/* Continue hero */}
      <LinearGradient colors={[level.color, level.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 12, color: '#ffffffcc', letterSpacing: 1 }}>
            CONTINUE LEARNING
          </Text>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 26, color: '#fff' }}>
            {activeProfile?.lastUnit ?? 'Pop Chords I'}
          </Text>
          <View style={{ maxWidth: 320 }}>
            <ProgressBar value={60} height={12} color="#fff" track="#ffffff44" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <PPButton label="Continue" size="md" variant="white" onPress={() => go('lesson', { item: { title: activeProfile?.lastUnit ?? 'Pop Chords I', kind: 'lesson' } })} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff33', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13 }}>
              <Icon name="bolt" size={16} color="#fff" />
              <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 14, color: '#fff' }}>30 / 50 XP</Text>
            </View>
          </View>
        </View>
        <Maestro mood="cheer" size={116} bg="#ffffff33" float />
      </LinearGradient>

      {/* Shelves */}
      {SHELVES.map((shelf) => (
        <View key={shelf.levelId} style={{ marginTop: 26 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 18, color: colors.ink, marginBottom: 12 }}>
            {shelf.title}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingRight: 8 }}>
            {shelf.items.map((item) => <PosterCard key={item.id} item={item} shelf={shelf} />)}
          </ScrollView>
        </View>
      ))}
    </Shell>
  );
}
