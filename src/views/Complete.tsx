// Piano Professor — Lesson complete celebration.
import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import ScrollFit from '../ui/ScrollFit';
import { useT } from '../i18n/useT';

function Tile({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', backgroundColor: '#ffffff14', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 22, gap: 4, minWidth: 108 }}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text style={{ fontFamily: Fonts.family.black, fontSize: 24, color: '#fff' }}>{value}</Text>
      <Text style={{ fontFamily: Fonts.family.bold, fontSize: 12, color: '#ffffff99' }}>{label}</Text>
    </View>
  );
}

export default function Complete() {
  const { activeProfile } = useApp();
  const { params, go, reward } = useRouter();
  const tr = useT();
  const stars: number = params.stars ?? 3;
  const xp: number = params.xp ?? 40;

  // Show the haul landing in the stash (1 gem per star, as applyCompletion pays).
  const popped = useRef(false);
  useEffect(() => {
    if (popped.current) return;
    popped.current = true;
    reward('gems', stars);
  }, [stars, reward]);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#16273F', '#0A1320']} style={StyleSheet.absoluteFill} />
      <ScrollFit pad={32} style={{ gap: 10 }}>
      <Maestro mood={stars >= 3 ? 'trophy' : 'cheer'} size={150} bg="#ffffff1a" ring={5} ringColor="#ffffff33" float />
      <Text style={{ fontFamily: Fonts.family.black, fontSize: 34, color: '#fff', marginTop: 8 }}>{tr('complete.title')}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
        {[0, 1, 2].map((i) => (
          <Icon key={i} name={i < stars ? 'star' : 'starline'} size={44} color={i < stars ? '#F5B800' : '#ffffff40'} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 14, marginVertical: 12 }}>
        <Tile emoji="⚡" value={`+${xp}`} label={tr('complete.xp')} />
        <Tile emoji="🔥" value={`${activeProfile?.streak ?? 0}`} label={tr('complete.streak')} />
        <Tile emoji="🎯" value={`${60 + stars * 13}%`} label={tr('complete.accuracy')} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
        <PPButton label={tr('complete.backToLearn')} size="md" variant="dark" onPress={() => go('home')} />
        <PPButton label="Get diploma" size="md" variant="gold" onPress={() => go('diploma')} />
        <PPButton label={tr('complete.nextLesson')} size="md" variant="green" onPress={() => go('home')} />
      </View>
      </ScrollFit>
    </View>
  );
}
