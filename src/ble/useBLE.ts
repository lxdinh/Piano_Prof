// Piano Professor — BLE state machine hook
// Depends on: react-native-ble-plx, @react-native-community/netinfo (not needed here)
// Install: npx expo install react-native-ble-plx

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  BleManager,
  Device,
  Characteristic,
  BleError,
  State as BleAdapterState,
} from 'react-native-ble-plx';
import {
  BLE_DEVICE_NAME_PREFIX,
  BLE_SCAN_TIMEOUT_MS,
  BLE_CONNECT_TIMEOUT_MS,
  BLE_SERVICE_UUID,
  BLE_CHAR_LED_CMD,
  BLE_CHAR_NOTE_EVENT,
  BLE_CHAR_STATUS,
  CAL_TARGET_NOTES,
  CAL_STEPS,
  DEFAULT_LED_COUNT,
} from './constants';
import {
  cmdClearAll,
  cmdSetMulti,
  cmdCalibrationHighlight,
  calibrationPositions,
  CalibrationAnchor,
} from './protocol';
import { bytesToBase64, base64ToBytes } from './base64';

// ── State machine types ─────────────────────────────────────────

export type BLEPhase =
  | 'IDLE'
  | 'SCANNING'
  | 'FOUND'       // ≥1 device discovered, waiting for user to tap PAIR
  | 'CONNECTING'
  | 'DISCOVERING' // connected, enumerating services
  | 'CALIBRATING' // waiting for user to press physical keys
  | 'CONNECTED'
  | 'ERROR';

export interface FoundDevice {
  id:     string;
  name:   string;
  rssi:   number | null;
}

export interface CalibrationState {
  step:       number;              // 0..CAL_STEPS-1
  anchors:    CalibrationAnchor[]; // confirmed mappings so far
  targetNote: number;              // MIDI note we're waiting for
}

interface BLEState {
  phase:        BLEPhase;
  devices:      FoundDevice[];
  activeDevice: FoundDevice | null;
  ledCount:     number;
  calibration:  CalibrationState | null;
  error:        string | null;
  adapterReady: boolean;
}

type BLEAction =
  | { type: 'ADAPTER_READY'; ready: boolean }
  | { type: 'SCAN_START' }
  | { type: 'DEVICE_FOUND'; device: FoundDevice }
  | { type: 'CONNECT_START'; device: FoundDevice }
  | { type: 'CONNECTED' }
  | { type: 'DISCOVERING' }
  | { type: 'SERVICE_READY'; ledCount: number }
  | { type: 'CAL_START' }
  | { type: 'CAL_KEY_CONFIRMED'; midiNote: number; ledIndex: number }
  | { type: 'CAL_COMPLETE' }
  | { type: 'DISCONNECT' }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' };

const INITIAL: BLEState = {
  phase:        'IDLE',
  devices:      [],
  activeDevice: null,
  ledCount:     60,
  calibration:  null,
  error:        null,
  adapterReady: false,
};

function reducer(state: BLEState, action: BLEAction): BLEState {
  switch (action.type) {
    case 'ADAPTER_READY':
      return { ...state, adapterReady: action.ready };

    case 'SCAN_START':
      return { ...state, phase: 'SCANNING', devices: [], error: null };

    case 'DEVICE_FOUND': {
      const already = state.devices.some(d => d.id === action.device.id);
      if (already) return state;
      return {
        ...state,
        phase: 'FOUND',
        devices: [...state.devices, action.device],
      };
    }

    case 'CONNECT_START':
      return { ...state, phase: 'CONNECTING', activeDevice: action.device };

    case 'CONNECTED':
      return { ...state, phase: 'CONNECTED' };

    case 'DISCOVERING':
      return { ...state, phase: 'DISCOVERING' };

    case 'SERVICE_READY':
      return { ...state, ledCount: action.ledCount };

    case 'CAL_START':
      return {
        ...state,
        phase: 'CALIBRATING',
        calibration: {
          step:       0,
          anchors:    [],
          targetNote: CAL_TARGET_NOTES[0],
        },
      };

    case 'CAL_KEY_CONFIRMED': {
      if (!state.calibration) return state;
      const anchors: CalibrationAnchor[] = [
        ...state.calibration.anchors,
        { midiNote: action.midiNote, ledIndex: action.ledIndex },
      ];
      const nextStep = state.calibration.step + 1;
      if (nextStep >= CAL_STEPS) {
        return { ...state, calibration: { ...state.calibration, step: nextStep, anchors } };
      }
      return {
        ...state,
        calibration: {
          step:       nextStep,
          anchors,
          targetNote: CAL_TARGET_NOTES[nextStep],
        },
      };
    }

    case 'CAL_COMPLETE':
      return { ...state, phase: 'CONNECTED', calibration: state.calibration };

    case 'DISCONNECT':
      return { ...INITIAL, adapterReady: state.adapterReady };

    case 'ERROR':
      return { ...state, phase: 'ERROR', error: action.message };

    case 'RESET':
      return { ...INITIAL, adapterReady: state.adapterReady };

    default:
      return state;
  }
}

// ── Hook public API ─────────────────────────────────────────────

export interface UseBLEReturn {
  phase:        BLEPhase;
  devices:      FoundDevice[];
  activeDevice: FoundDevice | null;
  ledCount:     number;
  calibration:  CalibrationState | null;
  error:        string | null;
  adapterReady: boolean;

  startScan:         () => Promise<void>;
  connectToDevice:   (device: FoundDevice) => Promise<void>;
  startCalibration:  () => Promise<void>;
  skipCalibration:   () => Promise<void>;
  disconnect:        () => Promise<void>;
  sendLedCommand:    (bytes: Uint8Array) => Promise<void>;
  reset:             () => void;
  /**
   * Subscribe to live key-press events from the piano (firmware sends
   * [0x01, midiNote] on the calibrate characteristic). Returns an unsubscribe
   * fn. Works whenever a device is CONNECTED — used by the lesson engine to
   * grade "play this note" steps from what the learner actually plays.
   */
  subscribeNotes:    (cb: (midiNote: number) => void) => () => void;
}

// ── Singleton BleManager ────────────────────────────────────────
// One manager per app — re-creating it leaks resources.
let _manager: BleManager | null = null;
function getManager(): BleManager {
  if (!_manager) _manager = new BleManager();
  return _manager;
}

// ── The hook ────────────────────────────────────────────────────

export function useBLE(): UseBLEReturn {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const connectedDeviceRef  = useRef<Device | null>(null);
  const ledCmdCharRef       = useRef<Characteristic | null>(null);
  const calCharRef          = useRef<Characteristic | null>(null);
  const scanTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calSubscriptionRef  = useRef<{ remove(): void } | null>(null);
  // Persistent note-input monitor (lives for the whole connection) + the set of
  // listeners (lesson engine, free-play, etc.) that want key-press events.
  const noteSubscriptionRef = useRef<{ remove(): void } | null>(null);
  const noteListenersRef    = useRef<Set<(midiNote: number) => void>>(new Set());
  // Strip length reported by the device; needed by helpers that run before the
  // reducer state has caught up.
  const ledCountRef         = useRef<number>(DEFAULT_LED_COUNT);

  const subscribeNotes = useCallback((cb: (midiNote: number) => void) => {
    noteListenersRef.current.add(cb);
    return () => { noteListenersRef.current.delete(cb); };
  }, []);

  // Begin monitoring key presses on the note-event characteristic. The firmware
  // sends [type (0 = off, 1 = on), midiNote, velocity, source] for every key, so
  // a single monitor feeds both calibration and lesson grading. Note-offs are
  // ignored here — listeners only care about presses. Idempotent.
  const startNoteMonitor = useCallback(() => {
    if (noteSubscriptionRef.current || !calCharRef.current) return;
    noteSubscriptionRef.current = calCharRef.current.monitor((error, char) => {
      if (error || !char?.value) return;
      const bytes = base64ToBytes(char.value);
      if (bytes.length < 2 || bytes[0] !== 0x01) return; // 0x01 = note-on
      const midiNote = bytes[1];
      noteListenersRef.current.forEach((cb) => {
        try { cb(midiNote); } catch { /* one bad listener shouldn't break others */ }
      });
    });
  }, []);

  // ── Monitor BLE adapter state ─────────────────────────────────
  useEffect(() => {
    const manager = getManager();
    const sub = manager.onStateChange((adapterState) => {
      dispatch({ type: 'ADAPTER_READY', ready: adapterState === BleAdapterState.PoweredOn });
    }, true);
    return () => sub.remove();
  }, []);

  // ── Android runtime permissions ───────────────────────────────
  async function requestAndroidPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    const apiLevel = Platform.Version as number;

    if (apiLevel >= 31) {
      // Android 12+
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return (
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN]  === 'granted' &&
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted'
      );
    } else {
      // Android 6-11
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return result === 'granted';
    }
  }

  // ── Start BLE scan ────────────────────────────────────────────
  const startScan = useCallback(async () => {
    const manager = getManager();

    const granted = await requestAndroidPermissions();
    if (!granted) {
      dispatch({ type: 'ERROR', message: 'Bluetooth permission denied. Please enable it in Settings.' });
      return;
    }

    if (!state.adapterReady) {
      dispatch({ type: 'ERROR', message: 'Bluetooth is off. Please enable it in your device settings.' });
      return;
    }

    dispatch({ type: 'SCAN_START' });

    // Auto-stop after timeout
    scanTimerRef.current = setTimeout(() => {
      manager.stopDeviceScan();
      if (state.phase === 'SCANNING') {
        dispatch({ type: 'ERROR', message: 'No Piano Professor device found nearby. Hold BOOT for 3s and try again.' });
      }
    }, BLE_SCAN_TIMEOUT_MS);

    // Scan unfiltered and match by name in JS. We cannot filter on
    // [BLE_SERVICE_UUID] here: the controller's advertising packet has no room
    // for a 128-bit UUID once the device name is included, so it advertises the
    // name only. A service-UUID scan filter matches nothing.
    manager.startDeviceScan(
      null,
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          clearTimeout(scanTimerRef.current!);
          dispatch({ type: 'ERROR', message: error.message });
          return;
        }
        if (!device) return;

        const name = device.localName ?? device.name ?? '';
        if (!name.startsWith(BLE_DEVICE_NAME_PREFIX)) return;

        dispatch({
          type: 'DEVICE_FOUND',
          device: { id: device.id, name, rssi: device.rssi },
        });
      },
    );
  }, [state.adapterReady, state.phase]);

  // ── Connect + discover services ───────────────────────────────
  const connectToDevice = useCallback(async (found: FoundDevice) => {
    const manager = getManager();

    // Stop scan first
    manager.stopDeviceScan();
    clearTimeout(scanTimerRef.current!);

    dispatch({ type: 'CONNECT_START', device: found });

    let device: Device;
    try {
      device = await manager.connectToDevice(found.id, {
        timeout: BLE_CONNECT_TIMEOUT_MS,
        autoConnect: false,
      });
    } catch (e) {
      const msg = (e as BleError).message ?? 'Connection failed';
      dispatch({ type: 'ERROR', message: msg });
      return;
    }

    connectedDeviceRef.current = device;

    // Ask for a larger MTU so multi-LED frames fit in one write. The default
    // 23-byte ATT MTU only carries 4 LEDs per SET_MANY. Android-only; iOS
    // negotiates on its own and rejecting this is not fatal.
    try {
      await device.requestMTU(185);
    } catch {
      /* keep the default MTU */
    }

    // Disconnect listener
    device.onDisconnected(() => {
      calSubscriptionRef.current?.remove();
      calSubscriptionRef.current = null;
      connectedDeviceRef.current  = null;
      ledCmdCharRef.current       = null;
      calCharRef.current          = null;
      dispatch({ type: 'DISCONNECT' });
    });

    dispatch({ type: 'DISCOVERING' });

    try {
      await device.discoverAllServicesAndCharacteristics();
    } catch (e) {
      dispatch({ type: 'ERROR', message: 'Service discovery failed. Try reconnecting.' });
      return;
    }

    // Grab the characteristics we need
    try {
      const chars = await device.characteristicsForService(BLE_SERVICE_UUID);
      const byUuid = Object.fromEntries(chars.map(c => [c.uuid.toUpperCase(), c]));

      ledCmdCharRef.current = byUuid[BLE_CHAR_LED_CMD.toUpperCase()] ?? null;
      calCharRef.current    = byUuid[BLE_CHAR_NOTE_EVENT.toUpperCase()] ?? null;

      if (!ledCmdCharRef.current) {
        dispatch({ type: 'ERROR', message: 'Piano Professor service not found on this device.' });
        return;
      }

      // Read LED count from the status frame: [ledCount, fwMajor, fwMinor, source]
      let ledCount = DEFAULT_LED_COUNT;
      const statusChar = byUuid[BLE_CHAR_STATUS.toUpperCase()];
      if (statusChar) {
        const read = await statusChar.read();
        if (read.value) {
          const bytes = base64ToBytes(read.value);
          if (bytes[0]) ledCount = bytes[0];
        }
      }

      ledCountRef.current = ledCount;
      dispatch({ type: 'SERVICE_READY', ledCount });
    } catch (e) {
      dispatch({ type: 'ERROR', message: 'Could not read device characteristics.' });
      return;
    }

    dispatch({ type: 'CONNECTED' });

    // Start listening for key presses for the whole connection (lesson grading).
    startNoteMonitor();

    // Confirm the link visually: flash the strip green, then clear.
    await fillStrip(0x58, 0xcc, 0x02);
    setTimeout(() => { void writeToLed(cmdClearAll()); }, 800);
  }, [startNoteMonitor]);

  // ── Internal write helper ─────────────────────────────────────
  async function writeToLed(bytes: Uint8Array): Promise<void> {
    const char = ledCmdCharRef.current;
    if (!char || !connectedDeviceRef.current) return;
    // Unsupported commands (COMMIT, patterns, calibration mode) encode to an
    // empty payload — dropping them here keeps those call-sites harmless.
    if (bytes.length === 0) return;
    await char.writeWithoutResponse(bytesToBase64(bytes));
  }

  // Paint the whole strip one color. The firmware has no fill command, so this
  // sends SET_MANY frames chunked to stay inside the negotiated MTU
  // (182 usable bytes at MTU 185 → 45 LEDs; 40 leaves headroom).
  const MAX_LEDS_PER_FRAME = 40;
  async function fillStrip(r: number, g: number, b: number): Promise<void> {
    const count = ledCountRef.current;
    for (let start = 0; start < count; start += MAX_LEDS_PER_FRAME) {
      const end = Math.min(count, start + MAX_LEDS_PER_FRAME);
      const entries: Array<{ index: number; rgb: [number, number, number] }> = [];
      for (let i = start; i < end; i++) entries.push({ index: i, rgb: [r, g, b] });
      await writeToLed(cmdSetMulti(entries));
    }
  }

  // ── Public write ──────────────────────────────────────────────
  const sendLedCommand = useCallback(async (bytes: Uint8Array) => {
    await writeToLed(bytes);
  }, []);

  // ── Start calibration ─────────────────────────────────────────
  const startCalibration = useCallback(async () => {
    if (!calCharRef.current || !connectedDeviceRef.current) {
      dispatch({ type: 'ERROR', message: 'Device not connected.' });
      return;
    }

    // The firmware has no calibration mode — it streams every key press on the
    // note-event characteristic. So the app runs calibration itself: light one
    // target at a time and pair each press with the LED currently lit.
    const positions = calibrationPositions(state.ledCount);

    await writeToLed(cmdClearAll());
    await writeToLed(cmdCalibrationHighlight(state.ledCount, 0));

    dispatch({ type: 'CAL_START' });

    let step = 0;
    calSubscriptionRef.current = calCharRef.current.monitor((error, char) => {
      if (error || !char?.value) return;
      const bytes = base64ToBytes(char.value);
      if (bytes.length < 2 || bytes[0] !== 0x01) return; // note-on only
      if (step >= CAL_STEPS) return;

      const midiNote = bytes[1];
      const ledIndex = positions[Math.min(step, positions.length - 1)];
      dispatch({ type: 'CAL_KEY_CONFIRMED', midiNote, ledIndex });

      step += 1;
      if (step < CAL_STEPS) {
        void (async () => {
          await writeToLed(cmdClearAll());
          await writeToLed(cmdCalibrationHighlight(state.ledCount, step));
        })();
      }
    });
  }, [state.ledCount]);

  // Complete calibration once all steps done (driven by state changes)
  useEffect(() => {
    if (
      state.phase === 'CALIBRATING' &&
      state.calibration?.step === CAL_STEPS
    ) {
      (async () => {
        calSubscriptionRef.current?.remove();
        calSubscriptionRef.current = null;

        await writeToLed(cmdClearAll());
        await fillStrip(0x58, 0xcc, 0x02);
        setTimeout(() => { void writeToLed(cmdClearAll()); }, 800);

        dispatch({ type: 'CAL_COMPLETE' });
      })();
    }
  }, [state.phase, state.calibration?.step]);

  // ── Skip calibration ──────────────────────────────────────────
  const skipCalibration = useCallback(async () => {
    calSubscriptionRef.current?.remove();
    calSubscriptionRef.current = null;

    await writeToLed(cmdClearAll());

    dispatch({ type: 'CAL_COMPLETE' });
  }, []);

  // ── Disconnect ────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    calSubscriptionRef.current?.remove();
    noteSubscriptionRef.current?.remove();
    noteSubscriptionRef.current = null;
    const device = connectedDeviceRef.current;
    if (device) {
      try { await device.cancelConnection(); } catch {}
    }
    connectedDeviceRef.current = null;
    ledCmdCharRef.current      = null;
    calCharRef.current         = null;
    dispatch({ type: 'DISCONNECT' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(scanTimerRef.current!);
      calSubscriptionRef.current?.remove();
      noteSubscriptionRef.current?.remove();
      getManager().stopDeviceScan();
    };
  }, []);

  return {
    phase:        state.phase,
    devices:      state.devices,
    activeDevice: state.activeDevice,
    ledCount:     state.ledCount,
    calibration:  state.calibration,
    error:        state.error,
    adapterReady: state.adapterReady,

    startScan,
    connectToDevice,
    startCalibration,
    skipCalibration,
    disconnect,
    sendLedCommand,
    reset,
    subscribeNotes,
  };
}
