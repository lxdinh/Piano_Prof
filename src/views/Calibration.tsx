// Piano Professor — LED calibration: teach the app where the strip actually sits.
//
// This screen used to be a mock. It showed four steps, lit two fake dots on the
// on-screen piano, and finished by setting `calibrated: true` — while the real
// mapping stayed hardcoded at `ledIndex = midi − 36`. Mount the strip off-centre
// and every lesson lit the wrong key, with a "calibration" flow that did nothing
// about it.
//
// The real flow: light ONE physical LED, ask the learner to press the key beneath
// it, and record the pair. Three anchors along the strip pin down both where it
// starts and how its LED pitch lines up with the keys.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useHardware } from '../state/HardwareProvider';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import Piano from '../ui/Piano';
import ScrollFit from '../ui/ScrollFit';
import * as pianoEngine from '../audio/pianoEngine';
import { CAL_POSITIONS, CAL_STEPS } from '../ble/constants';
import {
  CalibrationAnchor, anchorsUsable, clearAnchors, saveAnchors, targetLedIndex,
} from '../ble/calibration';
import { KEY_LOW_MIDI, KEY_HIGH_MIDI, noteToMidi } from '../lesson1/data';

/** Strip length to assume before the board has reported its own. */
const FALLBACK_LED_COUNT = 60;

const PROMPT = [
  'Press the key directly under the lit dot at the LEFT end of your strip.',
  'Now the key under the lit dot in the MIDDLE.',
  'Last one — the key under the dot at the RIGHT end.',
];

export default function Calibration() {
  const { colors } = useAppTheme();
  const { setLed } = useApp();
  const { hw, status } = useHardware();
  const { go, back } = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [anchors, setAnchors] = useState<CalibrationAnchor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const anchorsRef = useRef<CalibrationAnchor[]>([]);
  const stepRef = useRef(0);

  const live = status.state === 'connected';
  const ledCount = hw.ledCount ?? FALLBACK_LED_COUNT;
  const done = step >= CAL_STEPS;
  const targetLed = targetLedIndex(step, ledCount, CAL_POSITIONS);

  // Light the dot for the current step, and always leave the strip dark on exit.
  useEffect(() => {
    if (done) { hw.calibrateLight(null); return; }
    hw.calibrateLight(targetLed);
  }, [hw, targetLed, done]);

  useEffect(() => () => { hw.calibrateLight(null); }, [hw]);

  const record = useCallback((midi: number) => {
    const i = stepRef.current;
    if (i >= CAL_STEPS) return;
    if (midi < KEY_LOW_MIDI || midi > KEY_HIGH_MIDI) return;

    const next = [
      ...anchorsRef.current.filter((a) => a.midiNote !== midi),
      { midiNote: midi, ledIndex: targetLedIndex(i, ledCount, CAL_POSITIONS) },
    ];
    anchorsRef.current = next;
    setAnchors(next);
    setError(null);
    stepRef.current = i + 1;
    setStep(i + 1);
  }, [ledCount]);

  // A real key press on the board is the primary input; the on-screen piano is
  // the fallback for someone setting up without the piano to hand.
  useEffect(() => hw.onNoteOn((note) => record(noteToMidi(note))), [hw, record]);

  const finish = useCallback(async () => {
    if (!anchorsUsable(anchorsRef.current)) {
      // Two presses on the same key, or right-to-left, cannot describe a strip.
      setError('Those presses don’t line up left-to-right. Start again and press one key per dot, working across the strip.');
      anchorsRef.current = [];
      setAnchors([]);
      stepRef.current = 0;
      setStep(0);
      return;
    }
    await saveAnchors(anchorsRef.current);
    setLed({ calibrated: true });
    go('ledSettings');
  }, [go, setLed]);

  const restart = useCallback(async () => {
    await clearAnchors();
    anchorsRef.current = [];
    setAnchors([]);
    stepRef.current = 0;
    setStep(0);
    setError(null);
    setLed({ calibrated: false });
  }, [setLed]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
        <Icon name="chevronLeft" size={28} color={colors.ink} />
      </Pressable>

      <ScrollFit pad={26} style={{ gap: 14 }}>
        {/* stepper */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
          {Array.from({ length: CAL_STEPS + 1 }, (_, i) => (
            <View key={i} style={{
              width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
              backgroundColor: i < step ? colors.green : i === step ? colors.sky : colors.surface2,
              borderWidth: 2, borderColor: i <= step ? 'transparent' : colors.line,
            }}>
              {i < step
                ? <Icon name="check" size={16} color="#fff" />
                : <Text style={{ fontFamily: Fonts.family.black, fontSize: 14, color: i === step ? '#fff' : colors.inkFaint }}>{i + 1}</Text>}
            </View>
          ))}
        </View>

        {done
          ? <Maestro mood="cheer" size={110} bg={colors.selGreen} ring={5} ringColor={colors.green} float />
          : <Maestro mood="teach" size={96} bg={colors.surface2} float />}

        <Text style={{ fontFamily: Fonts.family.black, fontSize: 26, color: colors.ink }}>
          {done ? 'All set!' : `Dot ${step + 1} of ${CAL_STEPS}`}
        </Text>
        <Text style={{
          fontFamily: Fonts.family.bold, fontSize: 15, color: colors.inkSoft,
          textAlign: 'center', maxWidth: 460,
        }}>
          {done
            ? 'Your strip is lined up with your keys. Lessons will light the right notes now.'
            : PROMPT[step]}
        </Text>

        {!live && !done && (
          <Text style={{
            fontFamily: Fonts.family.bold, fontSize: 13, color: colors.gold,
            textAlign: 'center', maxWidth: 460,
          }}>
            No board connected — nothing will light up. You can still tap the keys
            below to record a mapping, but connecting first is much easier.
          </Text>
        )}

        {error && (
          <Text style={{
            fontFamily: Fonts.family.bold, fontSize: 14, color: colors.error,
            textAlign: 'center', maxWidth: 460,
          }}>
            {error}
          </Text>
        )}

        {!done && (
          <View style={{ width: 560, maxWidth: '100%' }}>
            <Piano
              low={KEY_LOW_MIDI} high={KEY_HIGH_MIDI} lit={{}} height={130} interactive
              onPlay={(m) => { pianoEngine.playMidi(m).catch(() => {}); record(m); }}
            />
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
          {done ? (
            <>
              <PPButton label="Finish" size="lg" variant="green" onPress={finish} />
              <PPButton label="Start over" size="lg" variant="ghost" onPress={restart} />
            </>
          ) : (
            <PPButton
              label={anchors.length ? 'Start over' : 'Skip for now'}
              size="lg" variant="ghost"
              onPress={anchors.length ? restart : () => go('ledSettings')}
            />
          )}
        </View>
      </ScrollFit>
    </View>
  );
}
