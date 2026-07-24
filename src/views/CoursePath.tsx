// Piano Professor — choose learning path (Chords vs Soloist) → Home.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon, { IconName } from '../ui/Icon';
import ScrollFit from '../ui/ScrollFit';
import { LearningPath, levelById } from '../data/content';
import { useT } from '../i18n/useT';

function PathCard({ icon, title, tag, tagColor, body, onPress, color }: {
  icon: IconName; title: string; tag: string; tagColor: string; body: string; onPress: () => void; color: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, maxWidth: 320, backgroundColor: colors.surface, borderRadius: 22, borderWidth: 2, borderColor: colors.line, borderBottomWidth: 6, padding: 22, gap: 12, alignItems: 'center' }}
    >
      <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: tagColor, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 }}>
        <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 11, color: '#fff' }}>{tag}</Text>
      </View>
      <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: color, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
        <Icon name={icon} size={38} color="#fff" />
      </View>
      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 22, color: colors.ink }}>{title}</Text>
      <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 14, color: colors.inkSoft, textAlign: 'center' }}>{body}</Text>
    </Pressable>
  );
}

export default function CoursePath() {
  const { colors } = useAppTheme();
  const { updateActive } = useApp();
  const { params, go } = useRouter();
  const tr = useT();
  const level = levelById(params.levelId ?? 'el');

  const pick = (path: LearningPath) => {
    updateActive({
      placed: true, path, levelId: level.id, grade: level.grade,
      lastUnit: path === 'chords' ? 'Pop Chords I' : 'First 3 Notes',
    });
    go('home');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollFit pad={32} style={{ gap: 24 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 28, color: colors.ink }}>{tr('path.title')}</Text>
        <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 15, color: colors.inkSoft }}>{tr('path.switch')}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 18, width: '100%', justifyContent: 'center' }}>
        <PathCard
          icon="piano" title="Chords" tag="MOST POPULAR" tagColor={colors.green} color={colors.green}
          body="Play the songs you love with chord shapes, fast."
          onPress={() => pick('chords')}
        />
        <PathCard
          icon="music" title="Soloist" tag="CLASSIC" tagColor={colors.sky} color={colors.sky}
          body="Read notes and play melodies the traditional way."
          onPress={() => pick('soloist')}
        />
      </View>
      </ScrollFit>
    </View>
  );
}
