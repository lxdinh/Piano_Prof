// Piano Professor — BLE pairing: a REAL scan/connect to the ESP32 LED strip
// (same react-native-ble-plx path the Lesson uses, via HwFacade). No board
// nearby → the scan times out and we show an honest "not found", so the app
// never claims "Connected" without a real link.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { useAppTheme } from '../theme/AppTheme';
import { useApp } from '../state/AppState';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Icon from '../ui/Icon';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import Piano from '../ui/Piano';
import ScrollFit from '../ui/ScrollFit';
import { HwFacade, HwStatus } from '../lesson1/hal';

type Phase = 'scan' | 'connecting' | 'success' | 'error';

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

// gentle rainbow sweep across the strip while celebrating a real connection
function useSweep(active: boolean, low: number, high: number): Record<number, string> {
  const [lit, setLit] = useState<Record<number, string>>({});
  useEffect(() => {
    if (!active) { setLit({}); return; }
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
  const [phase, setPhase] = useState<Phase>('scan');
  const [detail, setDetail] = useState('Looking for your LED strip…');
  const [errMsg, setErrMsg] = useState('');
  const sweep = useSweep(phase === 'success', 60, 84);
  const hwRef = useRef<HwFacade | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const hw = new HwFacade();
    hwRef.current = hw;
    hw.setMode('ble');
    hw.onStatus((s: HwStatus) => {
      if (!mounted.current) return;
      if (s.state === 'connected') {
        setPhase('success');
        setLed({ connected: true });
        try { hw.ledEffect('celebration', []); } catch { /* ignore */ }
      } else if (s.state === 'connecting') {
        setPhase(/scan/i.test(s.detail) ? 'scan' : 'connecting');
        setDetail(s.detail || 'Connecting…');
      } else if (s.state === 'error' || s.state === 'disconnected') {
        setPhase('error');
        setErrMsg(s.detail || (s.state === 'disconnected' ? 'Connection lost' : 'Could not connect'));
        setLed({ connected: false });
      }
    });
    hw.connect().catch(() => { /* status listener shows the error */ });
    return () => {
      mounted.current = false;
      setLed({ connected: false }); // honest: no live link once we leave
      hw.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    setErrMsg('');
    setPhase('scan');
    hwRef.current?.connect().catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Pressable onPress={back} style={{ padding: 14, alignSelf: 'flex-start' }}>
        <Icon name="close" size={26} color={colors.inkSoft} />
      </Pressable>

      <ScrollFit pad={28} style={{ gap: 14 }}>
        {(phase === 'scan' || phase === 'connecting') && (
          <>
            <Radar />
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 26, color: colors.ink }}>
              {phase === 'connecting' ? 'Connecting…' : 'Looking for your LED strip…'}
            </Text>
            <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: colors.inkFaint }}>
              {phase === 'connecting' ? detail : "Make sure it's powered on and nearby"}
            </Text>
          </>
        )}

        {phase === 'error' && (
          <>
            <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bluetooth" size={40} color={colors.inkFaint} />
            </View>
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 24, color: colors.ink }}>No board connected</Text>
            <Text style={{ fontFamily: Fonts.family.bold, fontSize: 14, color: colors.inkFaint, textAlign: 'center', maxWidth: 460 }}>
              {errMsg || 'Could not find your LED strip.'} Power it on, keep it nearby, and make sure Bluetooth is on.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
              <PPButton label="Try again" size="md" variant="sky" onPress={retry} />
              <PPButton label="Not now" size="md" variant="ghost" onPress={() => go('home')} />
            </View>
          </>
        )}

        {phase === 'success' && (
          <>
            <Maestro mood="cheer" size={120} bg={colors.selGreen} ring={5} ringColor={colors.green} float />
            <Text style={{ fontFamily: Fonts.family.black, fontSize: 26, color: colors.ink }}>Your keys light up! 🎉</Text>
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
