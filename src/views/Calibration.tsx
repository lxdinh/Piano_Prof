// Piano Professor — LED calibration: 4-step stepper (align → test key → mic → done).
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import Piano from '../ui/Piano';
import ScrollFit from '../ui/ScrollFit';
import * as pianoEngine from '../audio/pianoEngine';

const STEPS = [
  { title: 'Align the strip', body: 'Line the strip up above your keys — the two end dots are glowing.' },
  { title: 'Test the first key', body: 'Press the glowing C on your piano (or tap it below).' },
  { title: 'Mic check', body: 'Maestro listens for your piano so he can hear what you play.' },
  { title: 'All set!', body: 'Your LED strip is calibrated and ready for lit lessons.' },
];

export default function Calibration() {
  const { colors } = useAppTheme();
  const { setLed } = useApp();
  const { go, back } = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  const lit: Record<number, string> =
    step === 0 ? { 60: '#5BB8E3', 84: '#5BB8E3' } :
    step === 1 ? { 60: '#58CC02' } : {};

  const next = () => {
    if (last) { setLed({ calibrated: true }); go('ledSettings'); return; }
    setStep(step + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
        <Icon name="chevronLeft" size={28} color={colors.ink} />
      </Pressable>

      <ScrollFit pad={26} style={{ gap: 14 }}>
        {/* stepper */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
          {STEPS.map((_, i) => (
            <View key={i} style={{
              width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
              backgroundColor: i < step ? colors.green : i === step ? colors.sky : colors.surface2,
              borderWidth: 2, borderColor: i <= step ? 'transparent' : colors.line,
            }}>
              {i < step
                ? <Icon name="check" size={16} color="#fff" />
                : <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 14, color: i === step ? '#fff' : colors.inkFaint }}>{i + 1}</Text>}
            </View>
          ))}
        </View>

        {last
          ? <Maestro mood="cheer" size={110} bg={colors.selGreen} ring={5} ringColor={colors.green} float />
          : step === 2
            ? <Maestro mood="teach" size={110} bg={colors.surface2} float />
            : null}

        <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 26, color: colors.ink }}>{s.title}</Text>
        <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 15, color: colors.inkSoft, textAlign: 'center', maxWidth: 440 }}>{s.body}</Text>

        {step <= 1 && (
          <View style={{ width: 500, maxWidth: '100%' }}>
            <Piano
              low={60} high={84} lit={lit} height={130} interactive={step === 1}
              onPlay={(m) => {
                pianoEngine.playMidi(m).catch(() => {});
                if (step === 1 && m === 60) setTimeout(next, 400);
              }}
            />
          </View>
        )}

        <PPButton
          label={last ? 'Finish' : step === 1 ? 'Skip' : 'Continue'}
          size="lg" variant={last ? 'green' : 'sky'} onPress={next} style={{ marginTop: 6 }}
        />
      </ScrollFit>
    </View>
  );
}
