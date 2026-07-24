// Piano Professor — Daily Quests. Three goals a day, claim gems when done.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import { ProgressBar } from '../ui/atoms';
import ScrollFit from '../ui/ScrollFit';
import * as haptics from '../feedback/haptics';
import { questsToday, QuestState } from '../data/quests';

function QuestRow({ q, onClaim }: { q: QuestState; onClaim: () => void }) {
  const { colors } = useAppTheme();
  const pct = (q.current / q.quest.goal) * 100;
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20,
      backgroundColor: colors.surface, borderWidth: 2, borderColor: q.claimable ? colors.gold : colors.line,
      borderBottomWidth: 5, opacity: q.claimed ? 0.6 : 1,
    }}>
      <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 26 }}>{q.quest.emoji}</Text>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 16, color: colors.ink }}>{q.quest.title}</Text>
          <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 13, color: colors.inkFaint }}>{Math.min(q.current, q.quest.goal)}/{q.quest.goal}</Text>
        </View>
        <ProgressBar value={pct} height={12} color={q.done ? colors.green : colors.gold} />
      </View>
      {q.claimed ? (
        <View style={{ width: 66, alignItems: 'center' }}>
          <Icon name="check" size={22} color={colors.green} />
        </View>
      ) : q.claimable ? (
        <Pressable onPress={() => { haptics.success(); onClaim(); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 3, borderBottomColor: colors.goldDeep }}>
          <Text style={{ fontSize: 14 }}>💎</Text>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 15, color: '#5a3d00' }}>{q.quest.reward}</Text>
        </Pressable>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, width: 66, justifyContent: 'center', opacity: 0.5 }}>
          <Text style={{ fontSize: 14 }}>💎</Text>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 15, color: colors.inkFaint }}>{q.quest.reward}</Text>
        </View>
      )}
    </View>
  );
}

export default function Quests() {
  const { colors } = useAppTheme();
  const { activeProfile, claimQuest } = useApp();
  const { back } = useRouter();
  const insets = useSafeAreaInsets();

  const quests = activeProfile ? questsToday(activeProfile) : [];
  const doneCount = quests.filter((q) => q.done).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <Pressable onPress={back} style={{ padding: 12 }}>
          <Icon name="chevronLeft" size={28} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 24, color: colors.ink }}>Daily Quests</Text>
      </View>

      <ScrollFit>
        <View style={{ width: 560, maxWidth: '100%', gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 }}>
            <Maestro mood={doneCount === quests.length ? 'trophy' : 'conduct'} size={72} bg={colors.surface2} float />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 20, color: colors.ink }}>
                {doneCount === quests.length ? 'All done — see you tomorrow!' : "Today's goals"}
              </Text>
              <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 14, color: colors.inkSoft }}>
                {doneCount}/{quests.length} complete · resets at midnight
              </Text>
            </View>
          </View>
          {quests.map((q) => (
            <QuestRow key={q.quest.id} q={q} onClaim={() => claimQuest(q.quest.id)} />
          ))}
        </View>
      </ScrollFit>
    </View>
  );
}
