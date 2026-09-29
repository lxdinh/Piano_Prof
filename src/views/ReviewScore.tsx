// Piano Professor — Review an imported score before learning it.
// SCAFFOLD: placeholder view; the real screen (notation preview, title/tempo edit)
// replaces this file. Route: go('reviewScore', { songId }).
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAppTheme } from '../theme/AppTheme';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import { getImportedSong } from '../omr/importedSongs';

export default function ReviewScore() {
  const { colors } = useAppTheme();
  const { params, back } = useRouter();
  const song = getImportedSong(String(params.songId ?? ''));
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
        <Icon name="chevronLeft" size={28} color={colors.ink} />
      </Pressable>
      <Text style={{ fontFamily: Fonts.family.black, fontSize: 24, color: colors.ink, paddingHorizontal: 20 }}>
        {song?.title ?? 'Song not found'}
      </Text>
    </View>
  );
}
