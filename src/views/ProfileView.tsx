// Piano Professor — Profile tab: identity, stat tiles, weekly XP, achievements.
import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Shell from '../nav/Shell';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import { Card } from '../ui/atoms';
import { levelById, Profile } from '../data/content';
import { weeklyXp, deriveAchievements, songsLearned } from '../data/progress';
import { useT } from '../i18n/useT';

function StatTile({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  const { colors } = useAppTheme();
  return (
    <Card pad={14} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 22, color: colors.ink }}>{value}</Text>
      <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 12, color: colors.inkFaint }}>{label}</Text>
    </Card>
  );
}

export default function ProfileView() {
  const { colors } = useAppTheme();
  const { activeProfile } = useApp();
  const { go } = useRouter();
  const tr = useT();
  const p: Profile | null = activeProfile;
  const level = levelById(p?.levelId ?? 'el');
  const week = p ? weeklyXp(p) : [];
  const maxXp = Math.max(1, ...week.map((w) => w.xp));
  const achievements = p ? deriveAchievements(p) : [];

  return (
    <Shell active="profile">
      {/* identity */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <Maestro mood={p?.avatar ?? 'cool'} size={110} bg={p?.bg ?? colors.surface2} ring={5} ringColor={level.color} fit="head" />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 30, color: colors.ink }}>{p?.name ?? 'Player'}</Text>
          <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 15, color: colors.inkSoft }}>
            {level.name} · Grade {level.grade} · {p?.path === 'soloist' ? 'Soloist' : 'Chords'} path
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <PPButton label={tr('profile.edit')} size="sm" variant="white" onPress={() => go('editProfile')} />
            <PPButton label={tr('profile.switch')} size="sm" variant="ghost" onPress={() => go('who')} />
            <PPButton label="Diploma 🎓" size="sm" variant="gold" onPress={() => go('diploma')} />
          </View>
        </View>
      </View>

      {/* stat tiles */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 22 }}>
        <StatTile emoji="🔥" value={`${p?.streak ?? 0}`} label="Day streak" />
        <StatTile emoji="⚡" value={`${p?.xp ?? 0}`} label="Total XP" />
        <StatTile emoji="💎" value={`${p?.gems ?? 0}`} label="Gems" />
        <StatTile emoji="🎵" value={`${p ? songsLearned(p) : 0}`} label="Songs learned" />
      </View>

      {/* weekly XP */}
      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 18, color: colors.ink, marginTop: 26, marginBottom: 12 }}>{tr('profile.thisWeek')}</Text>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110 }}>
          {week.map((w, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
              <View style={{ width: 22, height: Math.max(6, (w.xp / maxXp) * 84), borderRadius: 8, backgroundColor: w.xp >= 50 ? colors.green : w.xp > 0 ? colors.gold : colors.line }} />
              <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 12, color: colors.inkFaint }}>{w.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* achievements */}
      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 18, color: colors.ink, marginTop: 26, marginBottom: 12 }}>{tr('profile.achievements')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {achievements.map((a) => (
          <Card key={a.id} pad={14} style={{ width: 150, alignItems: 'center', gap: 4, opacity: a.done ? 1 : 0.5 }}>
            <Text style={{ fontSize: 28 }}>{a.emoji}</Text>
            <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 14, color: colors.ink, textAlign: 'center' }}>{a.name}</Text>
            <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 11, color: a.done ? colors.green : colors.inkFaint }}>
              {a.done ? 'Unlocked' : 'Locked'}
            </Text>
          </Card>
        ))}
      </View>
    </Shell>
  );
}
