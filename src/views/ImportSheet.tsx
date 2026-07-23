// Piano Professor — Import sheet music (camera/upload → detected chords).
// Phase 2 keeps the design-faithful mock flow; the real OMR client
// (src/omr/) plugs into runDetect later.
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon, { IconName } from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';

type Phase = 'pick' | 'scanning' | 'done';
const DETECTED = ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'G'];

function PickCard({ icon, title, sub, onPress }: { icon: IconName; title: string; sub: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={{
      width: 240, alignItems: 'center', gap: 10, paddingVertical: 28, borderRadius: 22,
      backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.line, borderBottomWidth: 6,
    }}>
      <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: colors.selSky, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={32} color={colors.skyDeep} />
      </View>
      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 18, color: colors.ink }}>{title}</Text>
      <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 13, color: colors.inkSoft, textAlign: 'center', paddingHorizontal: 14 }}>{sub}</Text>
    </Pressable>
  );
}

export default function ImportSheet() {
  const { colors } = useAppTheme();
  const { go, back } = useRouter();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('pick');

  const scan = () => {
    setPhase('scanning');
    setTimeout(() => setPhase('done'), 1800);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
        <Icon name="chevronLeft" size={28} color={colors.ink} />
      </Pressable>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 16 }}>
        {phase === 'pick' && (
          <>
            <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 28, color: colors.ink }}>Import sheet music</Text>
            <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 15, color: colors.inkSoft }}>Maestro reads the chords and lights your keys.</Text>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
              <PickCard icon="camera" title="Take a photo" sub="Snap the sheet on your piano stand" onPress={scan} />
              <PickCard icon="image" title="Upload" sub="Pick a photo or PDF from your device" onPress={scan} />
            </View>
          </>
        )}

        {phase === 'scanning' && (
          <>
            <Maestro mood="idea" size={130} bg={colors.surface2} float />
            <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 24, color: colors.ink }}>Reading your music…</Text>
            <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 14, color: colors.inkFaint }}>Finding the key, chords and melody</Text>
          </>
        )}

        {phase === 'done' && (
          <>
            <Maestro mood="epiphany" size={120} bg={colors.selGreen} float />
            <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 26, color: colors.ink }}>Detected 8 chords · Key of G</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 480 }}>
              {DETECTED.map((c, i) => (
                <View key={i} style={{ width: 74, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.line, borderBottomWidth: 4 }}>
                  <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 20, color: colors.ink }}>{c}</Text>
                </View>
              ))}
            </View>
            <PPButton label="Play with lights" size="lg" variant="green" style={{ marginTop: 8 }}
              onPress={() => go('lesson', { item: { title: 'Imported sheet', kind: 'song' } })} />
          </>
        )}
      </View>
    </View>
  );
}
