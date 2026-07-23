// Piano Professor — Lesson complete celebration.
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';

function Tile({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', backgroundColor: '#ffffff14', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 22, gap: 4, minWidth: 108 }}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 24, color: '#fff' }}>{value}</Text>
      <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 12, color: '#ffffff99' }}>{label}</Text>
    </View>
  );
}

export default function Complete() {
  const { colors } = useAppTheme();
  const { activeProfile } = useApp();
  const { params, go } = useRouter();
  const stars: number = params.stars ?? 3;
  const xp: number = params.xp ?? 40;

  return (
    <LinearGradient colors={['#16273F', '#0A1320']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 }}>
      <Maestro mood={stars >= 3 ? 'trophy' : 'cheer'} size={150} bg="#ffffff1a" ring={5} ringColor="#ffffff33" float />
      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 34, color: '#fff', marginTop: 8 }}>Lesson complete!</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
        {[0, 1, 2].map((i) => (
          <Icon key={i} name={i < stars ? 'star' : 'starline'} size={44} color={i < stars ? '#F5B800' : '#ffffff40'} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 14, marginVertical: 12 }}>
        <Tile emoji="⚡" value={`+${xp}`} label="XP earned" />
        <Tile emoji="🔥" value={`${activeProfile?.streak ?? 0}`} label="Day streak" />
        <Tile emoji="🎯" value={`${60 + stars * 13}%`} label="Accuracy" />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
        <PPButton label="Back to learn" size="md" variant="dark" onPress={() => go('home')} />
        <PPButton label="Next lesson" size="md" variant="green" onPress={() => go('home')} />
      </View>
    </LinearGradient>
  );
}
