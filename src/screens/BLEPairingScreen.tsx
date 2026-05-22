// Piano Professor — BLE Pairing Screen
// Matches the three hardware states: Discover → Calibrate → Connected
// Design reference: pp-screens-hardware.jsx (ScreenHwDiscover / ScreenHwPairing / ScreenHwConnected)

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  ScrollView,
  Platform,
  Pressable,
  SafeAreaView,
} from 'react-native';
import Svg, {
  Rect, Circle, Ellipse, Line, G, Defs,
  RadialGradient, LinearGradient, Stop, Text as SvgText, Animate,
} from 'react-native-svg';
import { useBLE, FoundDevice, BLEPhase } from '../ble/useBLE';
import { CAL_STEPS, CAL_TARGET_NOTES } from '../ble/constants';
import { cmdRainbow, cmdCommit } from '../ble/protocol';
import { Colors, Fonts, Radii, Spacing } from '../theme/tokens';

// ── Shared icon components ───────────────────────────────────────

function BluetoothIcon({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Line x1="12" y1="6" x2="18" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Line x1="18" y1="12" x2="12" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Line x1="12" y1="6" x2="6" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Line x1="6" y1="12" x2="12" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );
}

function CheckIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="12" x2="10" y2="18" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <Line x1="10" y1="18" x2="20" y2="6" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    </Svg>
  );
}

// ── LED Strip SVG art (React Native version) ─────────────────────

const LED_DEFAULTS = ['#58CC02','#5BB8E3','#FF7A9C','#F5B800','#C2410C','#8B5CF6'];
const LED_COUNT = 32;

function LedStripArt({
  width = 320,
  height = 180,
  ledColors,
  animate = true,
}: {
  width?: number;
  height?: number;
  ledColors?: string[];
  animate?: boolean;
}) {
  const leds = Array.from({ length: LED_COUNT }, (_, i) =>
    ledColors?.[i] ?? LED_DEFAULTS[i % LED_DEFAULTS.length],
  );

  return (
    <Svg viewBox="0 0 320 200" width={width} height={height}>
      <Defs>
        <LinearGradient id="pianoBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3A2818"/>
          <Stop offset="1" stopColor="#1A1410"/>
        </LinearGradient>
      </Defs>

      {/* shadow */}
      <Ellipse cx="160" cy="190" rx="120" ry="6" fill="rgba(42,29,17,0.18)"/>

      {/* controller block */}
      <G transform="translate(8,108)">
        <Rect width="48" height="42" rx="6" fill="url(#pianoBody)" stroke="#000" strokeWidth="0.5"/>
        <Rect x="6" y="6" width="20" height="14" rx="2" fill="#0A0805"/>
        <Rect x="-6" y="14" width="6" height="14" rx="2" fill="#222"/>
        <Circle cx="38" cy="12" r="3" fill="#58CC02"/>
        <SvgText x="24" y="34" textAnchor="middle" fontSize="6" fontWeight="900" fill="#888">
          PIANO PROF
        </SvgText>
      </G>

      {/* strip body */}
      <G transform="translate(56,120)">
        <Rect width="256" height="22" rx="3" fill="url(#pianoBody)" stroke="#000" strokeWidth="0.5"/>
        {leds.map((c, i) => {
          const x = 6 + i * (244 / LED_COUNT);
          return (
            <G key={i}>
              {animate && <Circle cx={x + 3} cy={11} r="12" fill={c} opacity="0.35"/>}
              <Circle cx={x + 3} cy={11} r="3" fill={c}/>
              <Circle cx={x + 3} cy={11} r="1.4" fill="#fff"/>
            </G>
          );
        })}
      </G>

      {/* piano keys */}
      <G transform="translate(56,148)">
        {Array.from({ length: 35 }).map((_, i) => (
          <Rect key={i} x={i * 7.3} y={0} width={7} height={40} fill="#FFFAEC" stroke="#000" strokeWidth="0.4"/>
        ))}
        {[0,1,3,4,5,7,8,10,11,12,14,15,17,18,19,21,22,24,25,26,28,29,31,32,33].map(i => (
          <Rect key={i} x={i * 7.3 + 5} y={0} width={4.6} height={22} fill="#1A1410"/>
        ))}
      </G>
    </Svg>
  );
}

// Cal highlight: only 3 green LEDs on dark strip
function calLedColors(): string[] {
  return Array.from({ length: LED_COUNT }, (_, i) => {
    if (i === 4 || i === 16 || i === 27) return '#58CC02';
    return '#222';
  });
}

// Rainbow: cycle through LED_COLORS palette
function rainbowLedColors(): string[] {
  const cs = ['#FF4B4B','#FF9600','#F5B800','#58CC02','#5BB8E3','#8B5CF6','#FF7A9C'];
  return Array.from({ length: LED_COUNT }, (_, i) => cs[(i + Math.floor(i / 4)) % cs.length]);
}

// ── Animated BT spinner ──────────────────────────────────────────

function BTSpinner() {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true }),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.55, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
    return () => { spin.stopAnimation(); pulse.stopAnimation(); };
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.btRow}>
      {/* animated icon + ring */}
      <View style={styles.btIconWrap}>
        <View style={styles.btIconBg}>
          <BluetoothIcon size={22}/>
        </View>
        <Animated.View style={[styles.btRing, { opacity: pulse }]}/>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.searchTitle}>Searching nearby…</Text>
        <Text style={styles.searchSub}>Bluetooth is on. Holding BOOT button helps.</Text>
      </View>

      {/* spinner wheel */}
      <Animated.View style={[styles.spinWheel, { transform: [{ rotate }] }]}/>
    </View>
  );
}

// ── Signal strength indicator ────────────────────────────────────

function SignalBars({ rssi }: { rssi: number | null }) {
  // RSSI typically -30 (excellent) to -90 (weak)
  const strength = rssi == null ? 0 : rssi > -60 ? 3 : rssi > -75 ? 2 : 1;
  const label = ['No signal', 'Weak', 'Good', 'Strong'][strength];
  const color = [Colors.rust, Colors.butter, Colors.brand, Colors.brand][strength];

  return (
    <Text style={[styles.signalText, { color }]}>
      {'● '}{label} signal
    </Text>
  );
}

// ── SCREEN 1: Discover ───────────────────────────────────────────

function DiscoverScreen({
  devices,
  isScanning,
  error,
  onScan,
  onPair,
}: {
  devices: FoundDevice[];
  isScanning: boolean;
  error: string | null;
  onScan: () => void;
  onPair: (d: FoundDevice) => void;
}) {
  return (
    <ScrollView
      style={styles.scrollRoot}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* step indicator */}
      <Text style={styles.stepLabel}>STEP 1 OF 3 · CONNECT</Text>
      <Text style={styles.screenTitle}>Plug in your Piano Lights</Text>
      <Text style={styles.screenSub}>
        Stick the strip above your keys and connect the USB-C cable.
        The status dot turns green when ready.
      </Text>

      {/* strip art */}
      <View style={styles.artWrap}>
        <LedStripArt width={320} height={180}/>
      </View>

      {/* search card */}
      <View style={styles.card}>
        {isScanning ? (
          <BTSpinner/>
        ) : (
          <Pressable style={styles.btRow} onPress={onScan}>
            <View style={styles.btIconWrap}>
              <View style={[styles.btIconBg, { backgroundColor: Colors.ink900 }]}>
                <BluetoothIcon size={22}/>
              </View>
            </View>
            <Text style={[styles.searchTitle, { flex: 1 }]}>Tap to search</Text>
            <Text style={styles.pairBtn}>SCAN</Text>
          </Pressable>
        )}

        {/* found devices */}
        {devices.length > 0 && (
          <View style={styles.divider}/>
        )}
        {devices.map((d) => (
          <View key={d.id} style={styles.deviceRow}>
            <View style={styles.deviceIcon}>
              <Text style={styles.deviceIconText}>PP</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceName}>{d.name}</Text>
              <SignalBars rssi={d.rssi}/>
            </View>
            <Pressable
              style={styles.pairPressable}
              onPress={() => onPair(d)}
            >
              <Text style={styles.pairBtn}>PAIR</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {/* error / no-device help */}
      {error ? (
        <View style={[styles.helpBanner, { backgroundColor: '#FFE4E4', borderColor: Colors.rust }]}>
          <Text style={styles.helpEmoji}>⚠️</Text>
          <Text style={[styles.helpText, { color: Colors.rust }]}>{error}</Text>
        </View>
      ) : (
        <View style={styles.helpBanner}>
          <Text style={styles.helpEmoji}>💡</Text>
          <Text style={styles.helpText}>
            <Text style={{ fontWeight: '900' }}>No device showing?</Text>
            {' '}Hold BOOT for 3s while plugging in USB-C.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── SCREEN 2: Calibrating ────────────────────────────────────────

const CAL_STEP_LABELS = [
  'Press the LEFT-most green key',
  'Press the MIDDLE green key',
  'Press the RIGHT-most green key',
];

function CalibratingScreen({
  step,
  onSkip,
}: {
  step: number;
  onSkip: () => void;
}) {
  return (
    <View style={styles.calRoot}>
      <Text style={styles.stepLabel}>STEP 2 OF 3 · CALIBRATING</Text>
      <Text style={styles.screenTitle}>Press the highlighted keys</Text>
      <Text style={styles.screenSub}>
        We need to learn where your octaves start.
        Tap each green key on the LED strip.
      </Text>

      <View style={styles.artWrap}>
        <LedStripArt width={320} height={180} ledColors={calLedColors()}/>
      </View>

      {/* step list */}
      <View style={styles.card}>
        <View style={styles.calHeader}>
          <Text style={styles.calHeaderText}>Calibration</Text>
          <Text style={styles.calProgress}>{step} / {CAL_STEPS} keys</Text>
        </View>

        {CAL_STEP_LABELS.map((label, i) => {
          const done   = i < step;
          const active = i === step;
          return (
            <View
              key={i}
              style={[styles.calRow, i > 0 && styles.calRowBorder, done && { opacity: 0.5 }]}
            >
              <View style={[
                styles.calDot,
                done   && { backgroundColor: Colors.brand },
                active && { backgroundColor: Colors.butterBg, borderWidth: 2.5, borderColor: Colors.butterDark, borderStyle: 'dashed' },
                !done && !active && { backgroundColor: Colors.inkLine },
              ]}>
                {done   && <CheckIcon size={16}/>}
                {active && <Text style={styles.calDotNum}>{i + 1}</Text>}
              </View>
              <Text style={[styles.calStepText, active && { color: Colors.ink900 }]}>{label}</Text>
              {active && <PulseDot/>}
            </View>
          );
        })}
      </View>

      <View style={{ flex: 1 }}/>
      <Pressable style={styles.ghostBtn} onPress={onSkip}>
        <Text style={styles.ghostBtnText}>SKIP CALIBRATION</Text>
      </Pressable>
    </View>
  );
}

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
    return () => scale.stopAnimation();
  }, []);

  return (
    <Animated.View style={[styles.pulseDot, { transform: [{ scale }] }]}/>
  );
}

// ── SCREEN 3: Connected ──────────────────────────────────────────

function ConnectedScreen({
  deviceName,
  ledCount,
  rssi,
  onStartLesson,
  onTestLights,
  onDisconnect,
  sendLedCommand,
}: {
  deviceName: string;
  ledCount: number;
  rssi: number | null;
  onStartLesson: () => void;
  onTestLights: () => void;
  onDisconnect: () => void;
  sendLedCommand: (b: Uint8Array) => Promise<void>;
}) {
  const [isAnimating, setIsAnimating] = React.useState(false);

  async function handleTestLights() {
    setIsAnimating(true);
    await sendLedCommand(cmdRainbow(25));
    await sendLedCommand(cmdCommit());
    onTestLights();
    setTimeout(() => setIsAnimating(false), 3000);
  }

  const stars = Array.from({ length: 60 }, (_, i) => ({
    cx: (i * 47) % 390,
    cy: (i * 73) % 500,
    r:  0.8 + (i % 3) * 0.4,
    op: 0.15 + (i % 5) * 0.1,
  }));

  return (
    <View style={styles.connectedRoot}>
      <StatusBar barStyle="light-content"/>

      {/* starfield */}
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 390 720" preserveAspectRatio="none">
        {stars.map((s, i) => (
          <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#fff" opacity={s.op}/>
        ))}
      </Svg>

      {/* top bar */}
      <SafeAreaView style={styles.connectedTopBar}>
        <Pressable onPress={onDisconnect}>
          <Text style={styles.connectedBack}>‹ BACK</Text>
        </Pressable>
        <Text style={styles.connectedSettings}>SETTINGS</Text>
      </SafeAreaView>

      <View style={styles.connectedBody}>
        {/* status pill */}
        <View style={styles.connectedPill}>
          <View style={styles.connectedDot}/>
          <Text style={styles.connectedPillText}>CONNECTED · {ledCount} LEDs</Text>
        </View>

        <Text style={styles.connectedHeadline}>Your piano just woke up.</Text>
        <Text style={styles.connectedSub}>
          {deviceName} is online. Every lesson now lights up the keys above your hand.
        </Text>

        {/* rainbow strip */}
        <View style={styles.artWrap}>
          <LedStripArt width={320} height={180} ledColors={rainbowLedColors()} animate/>
        </View>

        {/* stat grid */}
        <View style={styles.statGrid}>
          <DarkStat val={String(ledCount)} label="LEDs"/>
          <DarkStat val={rssi != null ? `${rssi} dB` : '—'} label="SIGNAL"/>
          <DarkStat val="100%" label="BATTERY"/>
        </View>
      </View>

      {/* CTA */}
      <SafeAreaView style={styles.connectedCta}>
        <Pressable style={styles.chunkBtn} onPress={onStartLesson}>
          <Text style={styles.chunkBtnText}>START YOUR FIRST LIT LESSON</Text>
        </Pressable>
        <Pressable style={{ alignItems: 'center', marginTop: 10 }} onPress={handleTestLights}>
          <Text style={styles.testLightsText}>
            {isAnimating ? 'Running light show…' : 'Run light show test →'}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function DarkStat({ val, label }: { val: string; label: string }) {
  return (
    <View style={styles.darkStat}>
      <Text style={styles.darkStatVal}>{val}</Text>
      <Text style={styles.darkStatLbl}>{label}</Text>
    </View>
  );
}

// ── Root screen — phase router ───────────────────────────────────

export interface BLEPairingScreenProps {
  onConnected?: (deviceName: string) => void;
  onStartLesson?: () => void;
  onBack?: () => void;
}

export default function BLEPairingScreen({
  onConnected,
  onStartLesson,
  onBack,
}: BLEPairingScreenProps) {
  const ble = useBLE();

  useEffect(() => {
    if (ble.phase === 'CONNECTED' && ble.activeDevice) {
      onConnected?.(ble.activeDevice.name);
    }
  }, [ble.phase]);

  // Kick off scan automatically when screen mounts and BT is ready
  useEffect(() => {
    if (ble.adapterReady && ble.phase === 'IDLE') {
      ble.startScan();
    }
  }, [ble.adapterReady]);

  // ── Header (shared across discover + calibrate) ───────────────
  function Header() {
    return (
      <View style={styles.header}>
        <Pressable onPress={onBack ?? ble.reset} hitSlop={12}>
          <Text style={styles.headerBack}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Piano Lights</Text>
        <View style={{ width: 28 }}/>
      </View>
    );
  }

  // ── Connecting overlay ────────────────────────────────────────
  if (ble.phase === 'CONNECTING' || ble.phase === 'DISCOVERING') {
    return (
      <View style={styles.root}>
        <Header/>
        <View style={styles.centeredFlex}>
          <View style={styles.btIconBg}>
            <BluetoothIcon size={32}/>
          </View>
          <Text style={[styles.screenTitle, { marginTop: 20 }]}>
            {ble.phase === 'CONNECTING' ? 'Connecting…' : 'Reading device…'}
          </Text>
          <Text style={styles.screenSub}>This takes just a moment.</Text>
        </View>
      </View>
    );
  }

  // ── Connected (dark theme) ────────────────────────────────────
  if (ble.phase === 'CONNECTED') {
    return (
      <ConnectedScreen
        deviceName={ble.activeDevice?.name ?? 'Piano Prof'}
        ledCount={ble.ledCount}
        rssi={ble.activeDevice?.rssi ?? null}
        onStartLesson={onStartLesson ?? (() => {})}
        onTestLights={() => {}}
        onDisconnect={ble.disconnect}
        sendLedCommand={ble.sendLedCommand}
      />
    );
  }

  // ── Calibrating ───────────────────────────────────────────────
  if (ble.phase === 'CALIBRATING') {
    return (
      <View style={styles.root}>
        <Header/>
        <CalibratingScreen
          step={ble.calibration?.step ?? 0}
          onSkip={ble.skipCalibration}
        />
      </View>
    );
  }

  // ── Discover (default: IDLE / SCANNING / FOUND / ERROR) ───────
  return (
    <View style={styles.root}>
      <Header/>
      <DiscoverScreen
        devices={ble.devices}
        isScanning={ble.phase === 'SCANNING'}
        error={ble.error}
        onScan={ble.startScan}
        onPair={ble.connectToDevice}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const Colors2 = {
  butterDark: '#C99300',
  ink900: Colors.ink900,
  inkLine: Colors.inkLine,
} as const;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.cream50,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.inkLine,
  },
  headerBack: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.ink700,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Fonts.lg,
    fontWeight: '900',
    color: Colors.ink900,
  },
  scrollRoot: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 90,
  },
  stepLabel: {
    fontSize: Fonts.xs,
    fontWeight: '900',
    color: Colors.rust,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 6,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.ink900,
    textAlign: 'center',
    marginBottom: 8,
  },
  screenSub: {
    fontSize: Fonts.base,
    fontWeight: '700',
    color: Colors.ink500,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    alignSelf: 'center',
    marginBottom: 8,
  },
  artWrap: {
    alignItems: 'center',
    marginVertical: 12,
  },
  card: {
    backgroundColor: Colors.cream50,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.inkLine,
    padding: Spacing.md,
    shadowColor: Colors.ink900,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1.5,
    backgroundColor: Colors.inkLine,
    marginVertical: Spacing.md,
    borderStyle: 'dashed',
  },

  // BT scanner
  btRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btIconWrap: {
    position: 'relative',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.skyDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  btRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.sky,
  },
  spinWheel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: Colors.inkLine,
    borderTopColor: Colors.sky,
  },
  searchTitle: {
    fontSize: Fonts.base,
    fontWeight: '900',
    color: Colors.ink900,
  },
  searchSub: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.ink500,
    marginTop: 2,
  },

  // Device rows
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: Spacing.md,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.ink900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIconText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  deviceName: {
    fontSize: Fonts.base,
    fontWeight: '900',
    color: Colors.ink900,
  },
  signalText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  pairPressable: {
    backgroundColor: Colors.brand,
    borderRadius: Radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: Colors.brandDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  pairBtn: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Help banner
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.md,
    backgroundColor: Colors.butterBg,
    borderWidth: 1.5,
    borderColor: Colors2.butterDark,
    borderStyle: 'dashed',
    borderRadius: Radii.md,
  },
  helpEmoji: {
    fontSize: 18,
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink700,
  },

  // Calibration
  calRoot: {
    flex: 1,
    padding: Spacing.lg,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calHeaderText: {
    fontSize: Fonts.base,
    fontWeight: '900',
    color: Colors.ink900,
  },
  calProgress: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.brand,
  },
  calRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  calRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.inkLine,
  },
  calDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.inkLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDotNum: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.ink900,
  },
  calStepText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.ink500,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand,
  },
  ghostBtn: {
    width: '100%',
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderColor: Colors.inkLine,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  ghostBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.ink500,
    letterSpacing: 0.5,
  },

  // Connected (dark)
  connectedRoot: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  connectedTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'android' ? Spacing.xl : Spacing.md,
  },
  connectedBack: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.sky,
    letterSpacing: 1.5,
  },
  connectedSettings: {
    fontSize: 13,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
  },
  connectedBody: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 24,
    alignItems: 'center',
  },
  connectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(88,204,2,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(88,204,2,0.4)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brand,
    shadowColor: Colors.brand,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  connectedPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.brand,
    letterSpacing: 1.5,
  },
  connectedHeadline: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.darkText,
    textAlign: 'center',
    marginTop: 14,
  },
  connectedSub: {
    fontSize: Fonts.base,
    fontWeight: '700',
    color: Colors.darkSubtext,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    marginTop: 8,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.md,
    width: '100%',
  },
  darkStat: {
    flex: 1,
    backgroundColor: Colors.darkSurface,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    borderRadius: Radii.lg,
    paddingVertical: 10,
    alignItems: 'center',
  },
  darkStatVal: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.darkText,
  },
  darkStatLbl: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.darkMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  connectedCta: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  chunkBtn: {
    backgroundColor: Colors.brand,
    borderRadius: Radii.lg,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: Colors.brandDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  chunkBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  testLightsText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
  },

  // Shared
  centeredFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
});
