// Piano Professor — Daily Quests. Three goals a day, claim gems when done,
// plus the free daily chest (variable reward) that pulls learners back.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
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
import { canOpenChest } from '../data/chest';

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
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 16, color: colors.ink }}>{q.quest.title}</Text>
          <Text style={{ fontFamily: Fonts.family.bold, fontSize: 13, color: colors.inkFaint }}>{Math.min(q.current, q.quest.goal)}/{q.quest.goal}</Text>
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
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 15, color: '#5a3d00' }}>{q.quest.reward}</Text>
        </Pressable>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, width: 66, justifyContent: 'center', opacity: 0.5 }}>
          <Text style={{ fontSize: 14 }}>💎</Text>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 15, color: colors.inkFaint }}>{q.quest.reward}</Text>
        </View>
      )}
    </View>
  );
}

/**
 * The free daily chest. Its reward is variable (see data/chest.ts) — the
 * anticipation of an unknown payout is what pulls people back tomorrow.
 */
function ChestCard({ available, won, onOpen }: {
  available: boolean; won: number | null; onOpen: () => void;
}) {
  const { colors } = useAppTheme();
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!available) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(1400),
      Animated.timing(shake, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 90, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 90, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [available, shake]);

  return (
    <Pressable
      onPress={available ? onOpen : undefined}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20,
        backgroundColor: colors.surface, borderWidth: 2,
        borderColor: available ? colors.gold : colors.line, borderBottomWidth: 5,
        opacity: available || won != null ? 1 : 0.6,
      }}
    >
      <Animated.Text style={{
        fontSize: 36,
        transform: [{ rotate: shake.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] }) }],
      }}>
        {won != null ? '🎉' : '🎁'}
      </Animated.Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Fonts.family.black, fontSize: 17, color: colors.ink }}>
          {won != null ? `You won ${won} gems!` : available ? 'Daily chest' : 'Chest opened'}
        </Text>
        <Text style={{ fontFamily: Fonts.family.bold, fontSize: 13, color: colors.inkSoft }}>
          {won != null ? 'Come back tomorrow for another'
            : available ? 'Tap to open — how many gems today?' : 'Next chest tomorrow'}
        </Text>
      </View>
      {available && won == null && (
        <View style={{ backgroundColor: colors.gold, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 }}>
          <Text style={{ fontFamily: Fonts.family.black, fontSize: 13, color: '#5a3d00' }}>OPEN</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function Quests() {
  const { colors } = useAppTheme();
  const { activeProfile, claimQuest, openChest } = useApp();
  const { back, reward } = useRouter();
  const insets = useSafeAreaInsets();
  const [won, setWon] = useState<number | null>(null);

  const quests = activeProfile ? questsToday(activeProfile) : [];
  const doneCount = quests.filter((q) => q.done).length;
  const chestReady = activeProfile ? canOpenChest(activeProfile) : false;

  const open = () => {
    const gems = openChest();
    if (gems > 0) { setWon(gems); reward('gems', gems); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <Pressable onPress={back} style={{ padding: 12 }}>
          <Icon name="chevronLeft" size={28} color={colors.ink} />
        </Pressable>
        <Text style={{ fontFamily: Fonts.family.black, fontSize: 24, color: colors.ink }}>Daily Quests</Text>
      </View>

      <ScrollFit>
        <View style={{ width: 560, maxWidth: '100%', gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 }}>
            <Maestro mood={doneCount === quests.length ? 'trophy' : 'conduct'} size={72} bg={colors.surface2} float />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Fonts.family.black, fontSize: 20, color: colors.ink }}>
                {doneCount === quests.length ? 'All done — see you tomorrow!' : "Today's goals"}
              </Text>
              <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: colors.inkSoft }}>
                {doneCount}/{quests.length} complete · resets at midnight
              </Text>
            </View>
          </View>
          {quests.map((q) => (
            <QuestRow
              key={q.quest.id} q={q}
              onClaim={() => { claimQuest(q.quest.id); reward('gems', q.quest.reward); }}
            />
          ))}
          <ChestCard available={chestReady} won={won} onOpen={open} />
        </View>
      </ScrollFit>
    </View>
  );
}
