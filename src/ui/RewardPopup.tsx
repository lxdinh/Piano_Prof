// Piano Professor — "added to your stash" reward popup.
//
// Games show what you EARNED at the moment you earn it, then get the counter
// out of the way — that beats parking a permanent balance in the header, which
// eats the space lessons and practice need. So gems and hearts pop up here when
// they change, and the running totals live in the Shop.
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { Fonts } from '../theme/tokens';

export type RewardKind = 'gems' | 'hearts' | 'xp';

const FACE: Record<RewardKind, { emoji: string; tint: string; deep: string }> = {
  gems:   { emoji: '💎', tint: '#5BB8E3', deep: '#2E84AD' },
  hearts: { emoji: '❤️', tint: '#FF6B81', deep: '#C4304A' },
  xp:     { emoji: '⚡', tint: '#F5B800', deep: '#C28A00' },
};

export interface Reward { id: number; kind: RewardKind; amount: number; }

/** One pill that pops in, floats up and fades out. */
function Pill({ reward, onDone }: { reward: Reward; onDone: (id: number) => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  const face = FACE[reward.kind];

  useEffect(() => {
    Animated.sequence([
      // overshoot in — the "pop" that makes a reward feel like a reward
      Animated.spring(anim, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(anim, { toValue: 2, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(() => onDone(reward.id));
  }, [anim, reward.id, onDone]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999,
        backgroundColor: face.tint, borderBottomWidth: 3, borderBottomColor: face.deep,
        opacity: anim.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 1, 0] }),
        transform: [
          { scale: anim.interpolate({ inputRange: [0, 1, 2], outputRange: [0.5, 1, 1] }) },
          { translateY: anim.interpolate({ inputRange: [0, 1, 2], outputRange: [10, 0, -36] }) },
        ],
      }}
    >
      <Text style={{ fontSize: 20 }}>{face.emoji}</Text>
      <Text style={{ fontFamily: Fonts.family.display, fontSize: 20, color: '#fff' }}>
        +{reward.amount}
      </Text>
    </Animated.View>
  );
}

/** Stack of active reward pills, centred near the top of the canvas. */
export default function RewardPopup({ rewards, onDone }: {
  rewards: Reward[]; onDone: (id: number) => void;
}) {
  if (!rewards.length) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute', top: 54, left: 0, right: 0,
        alignItems: 'center', gap: 8,
      }}
    >
      {rewards.map((r) => <Pill key={r.id} reward={r} onDone={onDone} />)}
    </View>
  );
}
