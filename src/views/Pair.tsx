// Piano Professor — BLE pairing flow: scan → found → connecting → success.
// Phase 2 ships the design-faithful flow with a simulated scan; the real
// react-native-ble-plx wiring (src/ble/useBLE) hooks in behind these phases
// on-device in the hardware phase.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
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

type Phase = 'scan' | 'found' | 'connecting' | 'success';

function Radar() {
  const { colors } = useAppTheme();
  const rings = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const loops = rings.map((v, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 500),
        Animated.timing(v, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
    // rings are stable useRef values — run the radar animation once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={{ width: 190, height: 190, alignItems: 'center', justifyContent: 'center' }}>
      {rings.map((v, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', width: 90, height: 90, borderRadius: 45,
          borderWidth: 3, borderColor: colors.sky,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.1] }) }],
        }} />
      ))}
      <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="bluetooth" size={42} color="#fff" />
      </View>
    </View>
  );
}

// gentle rainbow sweep across the strip while celebrating
function useSweep(active: boolean, low: number, high: number): Record<number, string> {
  const [lit, setLit] = useState<Record<number, string>>({});
  useEffect(() => {
    if (!active) return;
    const cols = ['#FF4B4B', '#FF9600', '#F5B800', '#58CC02', '#5BB8E3', '#8B5CF6'];
    let head = low;
    const id = setInterval(() => {
      const next: Record<number, string> = {};
      for (let k = 0; k < 6; k++) {
        const m = head - k;
        if (m >= low && m <= high) next[m] = cols[k];
      }
      setLit(next);
      head = head >= high + 6 ? low : head + 1;
    }, 90);
    return () => clearInterval(id);
  }, [active, low, high]);
  return lit;
}

export default function Pair() {
  const { colors } = useAppTheme();
  const { setLed } = useApp();
  const { go, back } = useRouter();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('scan');
  const sweep = useSweep(phase === 'success', 60, 84);

  useEffect(() => {
    if (phase === 'scan') {
      const id = setTimeout(() => setPhase('found'), 2200);
      return () => clearTimeout(id);
    }
    if (phase === 'connecting') {
      const id = setTimeout(() => { setLed({ connected: true }); setPhase('success'); }, 1600);
      return () => clearTimeout(id);
    }
  }, [phase, setLed]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
        <Icon name="close" size={26} color={colors.inkSoft} />
      </Pressable>

      <ScrollFit pad={28} style={{ gap: 14 }}>
        {phase === 'scan' && (
          <>
            <Radar />
            <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 26, color: colors.ink }}>Looking for your LED strip…</Text>
            <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 14, color: colors.inkFaint }}>Make sure it's plugged in and nearby</Text>
          </>
        )}

        {phase === 'found' && (
          <>
            <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.selSky, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bluetooth" size={40} color={colors.skyDeep} />
            </View>
            <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 26, color: colors.ink }}>Found one!</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 2, borderColor: colors.line, borderBottomWidth: 5, padding: 18 }}>
              <Icon name="piano" size={30} color={colors.skyDeep} />
              <View>
                <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 17, color: colors.ink }}>Piano Professor LED</Text>
                <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '700', fontSize: 13, color: colors.inkSoft }}>PP-Strip · 88 keys</Text>
              </View>
              <PPButton label="Connect" size="sm" variant="sky" onPress={() => setPhase('connecting')} />
            </View>
          </>
        )}

        {phase === 'connecting' && (
          <>
            <Maestro mood="conduct" size={120} bg={colors.surface2} float />
            <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 24, color: colors.ink }}>Connecting…</Text>
          </>
        )}

        {phase === 'success' && (
          <>
            <Maestro mood="cheer" size={120} bg={colors.selGreen} ring={5} ringColor={colors.green} float />
            <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 26, color: colors.ink }}>Your keys light up! 🎉</Text>
            <View style={{ width: 460, maxWidth: '100%' }}>
              <Piano low={60} high={84} lit={sweep} height={120} interactive={false} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
              <PPButton label="Calibrate" size="md" variant="sky" onPress={() => go('calibration')} />
              <PPButton label="Done" size="md" variant="green" onPress={() => go('home')} />
            </View>
          </>
        )}
      </ScrollFit>
    </View>
  );
}
