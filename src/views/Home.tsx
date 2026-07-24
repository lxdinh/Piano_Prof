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
import { ItemKind, levelById } from '../data/content';
import { useT } from '../i18n/useT';
import {
  deriveShelves, DerivedItem, DerivedShelf, activeItem, activeShelf, shelfProgressPct,
} from '../data/progress';
import { DAILY_GOAL_XP } from '../data/progress';

const KIND_ICON: Record<ItemKind, IconName> = {
  lesson: 'piano', song: 'music', concept: 'book', exercise: 'bolt',
};

function PosterCard({ item, shelf }: { item: DerivedItem; shelf: DerivedShelf }) {
  const { colors } = useAppTheme();
  const { go, toast } = useRouter();
  const tr = useT();
  const state = item.derivedState;

  const onPress = () => {
    if (state === 'soon') return toast('Still cooking 👨‍🍳');
    if (state === 'locked') {
      if (item.premium) return go('paywall');
      return toast('Finish the earlier units first');
    }
    if (item.premium) return go('paywall');
    go('lesson', { item });
  };

  return (
    <Pressable onPress={onPress} style={{
      width: 156, borderRadius: 18, backgroundColor: colors.surface,
      borderWidth: 2, borderColor: colors.line, borderBottomWidth: 5, overflow: 'hidden',
      opacity: state === 'locked' || state === 'soon' ? 0.75 : 1,
    }}>
      <LinearGradient colors={[shelf.color, shelf.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ height: 82, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={KIND_ICON[item.kind]} size={34} color="#ffffff" />
        {state === 'active' && (
          <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: '#ffffff33', borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 }}>
            <Text style={{ color: '#fff', fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 9 }}>NEXT UP</Text>
          </View>
        )}
        {item.premium && (
          <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: '#00000030', borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7 }}>
            <Text style={{ color: '#fff', fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 10 }}>PRO</Text>
          </View>
        )}
      </LinearGradient>
      <View style={{ padding: 11, gap: 6 }}>
        <Text numberOfLines={1} style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 15, color: colors.ink }}>{tr.item(item.id, item.title)}</Text>
        <Text numberOfLines={1} style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 12, color: colors.inkSoft }}>{item.kind === 'song' ? item.sub : tr.sub(item.id, item.sub)}</Text>
        <View style={{ minHeight: 20, justifyContent: 'center' }}>
          {state === 'done' && (
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {[0, 1, 2].map((i) => (
                <Icon key={i} name={i < (item.derivedStars ?? 0) ? 'star' : 'starline'} size={16} color={i < (item.derivedStars ?? 0) ? '#F5B800' : colors.line} />
              ))}
            </View>
          )}
          {state === 'active' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="play" size={14} color={colors.green} />
              <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 12, color: colors.green }}>{tr('common.start')}</Text>
            </View>
          )}
          {state === 'locked' && <Icon name="lock" size={16} color={colors.inkFaint} />}
          {state === 'soon' && (
            <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 11, color: colors.inkFaint }}>Still cooking 👨‍🍳</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function Skeleton() {
  const { colors } = useAppTheme();
  const block = (w: any, h: number, extra?: object) => (
    <View style={{ width: w, height: h, borderRadius: 14, backgroundColor: colors.surface2, ...extra }} />
  );
  return (
    <Shell active="home">
      {block('100%', 150, { borderRadius: 24 })}
      {[0, 1].map((r) => (
        <View key={r} style={{ marginTop: 26, gap: 12 }}>
          {block(180, 18)}
          <View style={{ flexDirection: 'row', gap: 14 }}>
            {[0, 1, 2, 3].map((i) => block(156, 150, { borderRadius: 18 } as object))}
          </View>
        </View>
      ))}
    </Shell>
  );
}

export default function Home() {
  const { colors } = useAppTheme();
  const { activeProfile, ready } = useApp();
  const { go } = useRouter();
  const tr = useT();

  if (!ready) return <Skeleton />;

  const progress = activeProfile?.progress ?? {};
  const shelves = deriveShelves(progress);
  const next = activeItem(progress);
  const heroShelf = activeShelf(progress);
  const level = levelById(activeProfile?.levelId ?? heroShelf.levelId);
  const pct = shelfProgressPct(progress);
  const todayXp = activeProfile?.todayXp ?? 0;
  const goalXp = activeProfile?.dailyGoalXp ?? DAILY_GOAL_XP;
  const heroTitle = next?.title ?? activeProfile?.lastUnit ?? 'All caught up!';

  return (
    <Shell active="home">
      {/* Continue hero */}
      <LinearGradient colors={[heroShelf.color, heroShelf.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 12, color: '#ffffffcc', letterSpacing: 1 }}>
            {next ? tr('home.continueLearning').toUpperCase() : `${tr(`level.${level.id}`).toUpperCase()} · ${tr('grade').toUpperCase()} ${level.grade}`}
          </Text>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 26, color: '#fff' }}>
            {next ? tr.item(next.id, heroTitle) : heroTitle}
          </Text>
          <View style={{ maxWidth: 320 }}>
            <ProgressBar value={pct} height={12} color="#fff" track="#ffffff44" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <PPButton
              label={next ? 'Continue' : 'Practice'} size="md" variant="white"
              onPress={() => (next ? go('lesson', { item: next }) : go('practice'))}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff33', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13 }}>
              <Icon name="bolt" size={16} color="#fff" />
              <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 14, color: '#fff' }}>
                {Math.min(todayXp, goalXp)} / {goalXp} XP
              </Text>
            </View>
          </View>
        </View>
        <Maestro mood={next ? 'cheer' : 'trophy'} size={116} bg="#ffffff33" float />
      </LinearGradient>

      {/* Shelves */}
      {shelves.map((shelf) => (
        <View key={shelf.levelId} style={{ marginTop: 26 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 18, color: colors.ink, marginBottom: 12 }}>
            {tr(`level.${shelf.levelId}`)} · {tr('grade')} {levelById(shelf.levelId).grade}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingRight: 8 }}>
            {shelf.items.map((item) => <PosterCard key={item.id} item={item} shelf={shelf} />)}
          </ScrollView>
        </View>
      ))}
    </Shell>
  );
}
