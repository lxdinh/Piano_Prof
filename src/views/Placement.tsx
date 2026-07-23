// Piano Professor — placement test (5 questions → score → level).
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import { ProgressBar } from '../ui/atoms';
import { PLACEMENT } from '../data/content';
import * as haptics from '../feedback/haptics';

export default function Placement() {
  const { colors } = useAppTheme();
  const { go } = useRouter();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const q = PLACEMENT[i];

  const choose = (v: number) => {
    haptics.tap();
    const nextScore = q.noScore ? score : score + v;
    if (i + 1 >= PLACEMENT.length) {
      go('placementResult', { score: nextScore });
    } else {
      setScore(nextScore);
      setI(i + 1);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top, paddingHorizontal: 30 }}>
      <View style={{ paddingVertical: 16 }}>
        <ProgressBar value={((i + 1) / PLACEMENT.length) * 100} height={12} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', gap: 24 }}>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 48 }}>{q.emoji}</Text>
          <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 26, color: colors.ink, textAlign: 'center' }}>{q.q}</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {q.a.map((opt, k) => (
            <Pressable
              key={k}
              onPress={() => choose(opt.v)}
              style={{
                width: '46%', maxWidth: 300, paddingVertical: 18, paddingHorizontal: 18, borderRadius: 16,
                borderWidth: 2, borderColor: colors.line, borderBottomWidth: 5, backgroundColor: colors.surface,
              }}
            >
              <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 16, color: colors.ink, textAlign: 'center' }}>{opt.t}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
