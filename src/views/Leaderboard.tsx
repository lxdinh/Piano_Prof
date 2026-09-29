// Piano Professor — Family League: rank the household by XP earned this week.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import ScrollFit from '../ui/ScrollFit';
import { leaderboard, Rank } from '../data/leaderboard';

function RankRow({ rank, isMe }: { rank: Rank; isMe: boolean }) {
  const { colors } = useAppTheme();
  const p = rank.profile;
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 18,
      backgroundColor: isMe ? colors.selSky : colors.surface,
      borderWidth: 2, borderColor: isMe ? colors.sky : colors.line, borderBottomWidth: 5,
    }}>
      <View style={{ width: 34, alignItems: 'center' }}>
        {rank.medal ? (
          <Text style={{ fontSize: 24 }}>{rank.medal}</Text>
        ) : (
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 18, color: colors.inkFaint }}>{rank.place}</Text>
        )}
      </View>
      <Maestro mood={p.avatar} size={48} bg={p.bg} fit="head" />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Fonts.family.black, fontSize: 17, color: colors.ink }}>
          {p.name}{isMe ? ' (you)' : ''}
        </Text>
        <Text style={{ fontFamily: Fonts.family.bold, fontSize: 12, color: colors.inkFaint }}>
          {`🔥 ${p.streak} · ⚡ ${p.xp} total`}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Icon name="bolt" size={16} color={colors.gold} />
        <Text style={{ fontFamily: Fonts.family.black, fontSize: 18, color: colors.ink }}>{rank.xp}</Text>
      </View>
    </View>
  );
}

export default function Leaderboard() {
  const { colors } = useAppTheme();
  const { profiles, activeId } = useApp();
  const { back, go } = useRouter();
  const insets = useSafeAreaInsets();
  const ranks = leaderboard(profiles);
  const solo = profiles.length < 2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <Pressable onPress={back} style={{ padding: 12 }}>
          <Icon name="chevronLeft" size={28} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: Fonts.family.black, fontSize: 24, color: colors.ink }}>Family League 🏆</Text>
      </View>

      <ScrollFit>
        <View style={{ width: 600, maxWidth: '100%', gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 2 }}>
            <Maestro mood="trophy" size={72} bg={colors.surface2} float />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Fonts.family.black, fontSize: 20, color: colors.ink }}>This week's standings</Text>
              <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: colors.inkSoft }}>
                Ranked by XP earned in the last 7 days
              </Text>
            </View>
          </View>

          {ranks.map((r) => (
            <RankRow key={r.profile.id} rank={r} isMe={r.profile.id === activeId} />
          ))}

          {solo && (
            <Pressable
              onPress={() => go('createProfile')}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 4, borderRadius: 16, borderWidth: 2, borderColor: colors.line, borderStyle: 'dashed' }}
            >
              <Icon name="plus" size={18} color={colors.green} />
              <Text style={{ fontFamily: Fonts.family.black, fontSize: 14, color: colors.green }}>Add family to compete</Text>
            </Pressable>
          )}
        </View>
      </ScrollFit>
    </View>
  );
}
