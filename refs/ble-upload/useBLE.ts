// Piano Professor — BLE state machine hook
//
// Talks to the firmware in `firmware/controller` (LEDs + note events) and
// `firmware/factory` (OTA). A board fresh from the factory advertises ONLY the
// OTA service — see `isRecovery` — and can do nothing until the app pushes it
// real firmware, so the pairing flow has to handle that as a first-class state
// rather than an error.

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  BleManager,
  Device,
  BleError,
  State as BleAdapterState,
} from 'react-native-ble-plx';

import { base64ToBytes, bytesToBase64 } from './base64';
import {
  BLE_CHAR_DEVICE_STATUS,
  BLE_CHAR_LED_CMD,
  BLE_CHAR_NOTE_EVENT,
  BLE_CHAR_OTA_CONTROL,
  BLE_CONNECT_TIMEOUT_MS,
  BLE_DEVICE_NAME_PREFIX,
  BLE_OTA_SERVICE_UUID,
  BLE_SCAN_TIMEOUT_MS,
  BLE_SERVICE_UUID,
  CAL_POSITIONS,
  CAL_STEPS,
  CAL_TARGET_NOTES,
} from './constants';
import { EffectContext, EffectName, runEffectByName } from './effects';
import { OtaProgress, OtaSession } from './ota';
import {
  CalibrationAnchor,
  cmdCalibrationTarget,
  cmdClearAll,
  DeviceStatus,
  parseDeviceStatus,
  parseNoteEvent,
} from './protocol';

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
  id:   string;
  name: string;
  rssi: number | null;
  /** True when the advertisement carried the OTA service but not the main one. */
  recovery?: boolean;
}

export interface CalibrationState {
  step:       number;              // 0..CAL_STEPS-1
  anchors:    CalibrationAnchor[]; // confirmed mappings so far
  targetNote: number;              // display hint only — any key works
  /** LED currently lit; the learner presses the key beneath it. */
  targetLed:  number;
}

interface BLEState {
  phase:        BLEPhase;
  devices:      FoundDevice[];
  activeDevice: FoundDevice | null;
  ledCount:     number;
  firmware:     string;
  calibration:  CalibrationState | null;
  error:        string | null;
  adapterReady: boolean;
  /** Module is running the factory recovery image: OTA only, no LEDs. */
  isRecovery:   boolean;
  otaAvailable: boolean;
}

type BLEAction =
  | { type: 'ADAPTER_READY'; ready: boolean }
  | { type: 'SCAN_START' }
  | { type: 'DEVICE_FOUND'; device: FoundDevice }
  | { type: 'CONNECT_START'; device: FoundDevice }
  | { type: 'CONNECTED' }
  | { type: 'DISCOVERING' }
  | { type: 'SERVICE_READY'; ledCount: number; firmware: string; isRecovery: boolean; otaAvailable: boolean }
  | { type: 'CAL_START'; targetLed: number }
  | { type: 'CAL_KEY_CONFIRMED'; midiNote: number; ledIndex: number; nextLed: number }
  | { type: 'CAL_COMPLETE' }
  | { type: 'DISCONNECT' }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' };

const INITIAL: BLEState = {
  phase:        'IDLE',
  devices:      [],
  activeDevice: null,
  ledCount:     60,
  firmware:     '0.0',
  calibration:  null,
  error:        null,
  adapterReady: false,
  isRecovery:   false,
  otaAvailable: false,
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
      return {
        ...state,
        ledCount:     action.ledCount,
        firmware:     action.firmware,
        isRecovery:   action.isRecovery,
        otaAvailable: action.otaAvailable,
      };

    case 'CAL_START':
      return {
        ...state,
        phase: 'CALIBRATING',
        calibration: {
          step:       0,
          anchors:    [],
          targetNote: CAL_TARGET_NOTES[0],
          targetLed:  action.targetLed,
        },
      };

    case 'CAL_KEY_CONFIRMED': {
      if (!state.calibration) return state;
      const anchors: CalibrationAnchor[] = [
        ...state.calibration.anchors,
        { midiNote: action.midiNote, ledIndex: action.ledIndex },
      ];
      const nextStep = state.calibration.step + 1;
      return {
        ...state,
        calibration: {
          step:       nextStep,
          anchors,
          targetNote: CAL_TARGET_NOTES[Math.min(nextStep, CAL_TARGET_NOTES.length - 1)],
          targetLed:  action.nextLed,
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
  firmware:     string;
  calibration:  CalibrationState | null;
  error:        string | null;
  adapterReady: boolean;
  /** Module has the recovery image only — send it firmware before anything else. */
  isRecovery:   boolean;
  /** Module exposes the OTA service (true for recovery and for app firmware). */
  otaAvailable: boolean;

  startScan:         () => Promise<void>;
  connectToDevice:   (device: FoundDevice) => Promise<void>;
  startCalibration:  () => Promise<void>;
  skipCalibration:   () => Promise<void>;
  disconnect:        () => Promise<void>;
  sendLedCommand:    (bytes: Uint8Array) => Promise<void>;
  /** Run an LED animation app-side (the firmware has no pattern engine). */
  runEffect:         (name: EffectName, rgb?: [number, number, number]) => Promise<void>;
  reset:             () => void;
  /**
   * Subscribe to live key-press events from the piano. The firmware notifies
   * `[on/off, midiNote, velocity, source]`; listeners get the note on key-down
   * only. Returns an unsubscribe fn.
   */
  subscribeNotes:    (cb: (midiNote: number) => void) => () => void;

  /** Push a firmware.bin to the module. Throws OtaError on failure. */
  updateFirmware:    (image: Uint8Array, onProgress: (p: OtaProgress) => void) => Promise<void>;
  cancelFirmwareUpdate: () => void;
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
  const scanTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteSubscriptionRef = useRef<{ remove(): void } | null>(null);
  const noteListenersRef    = useRef<Set<(midiNote: number) => void>>(new Set());
  const otaSessionRef       = useRef<OtaSession | null>(null);

  // Mirrors of state read from async callbacks, where the reducer value would
  // otherwise be captured stale.
  const phaseRef      = useRef<BLEPhase>('IDLE');
  const ledCountRef   = useRef(60);
  const mtuRef        = useRef(23);
  const hasLedCharRef = useRef(false);

  // Calibration bookkeeping: which step we have already recorded, so the
  // note-off (or a second key-down) cannot double-count an anchor.
  const calStepRef      = useRef<number>(-1);
  const calActiveRef    = useRef(false);
  const calTargetLedRef = useRef(0);

  phaseRef.current    = state.phase;
  ledCountRef.current = state.ledCount;

  const subscribeNotes = useCallback((cb: (midiNote: number) => void) => {
    noteListenersRef.current.add(cb);
    return () => { noteListenersRef.current.delete(cb); };
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
    }
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return result === 'granted';
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

    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    scanTimerRef.current = setTimeout(() => {
      manager.stopDeviceScan();
      // phaseRef, not state.phase — this closure outlives the render it was
      // created in, so the reducer value here would be stale.
      if (phaseRef.current === 'SCANNING') {
        dispatch({
          type: 'ERROR',
          message: 'No Piano Professor module found nearby. Check it has power and try again.',
        });
      }
    }, BLE_SCAN_TIMEOUT_MS);

    // Match EITHER service: a module on the recovery image advertises only the
    // OTA one, and filtering on the main service alone would make exactly the
    // boards that need updating invisible.
    manager.startDeviceScan(
      [BLE_SERVICE_UUID, BLE_OTA_SERVICE_UUID],
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
          dispatch({ type: 'ERROR', message: error.message });
          return;
        }
        if (!device) return;

        // The name lives in the scan response and may not have arrived yet;
        // the service-UUID filter above already proved this is one of ours.
        const advertised = (device.serviceUUIDs ?? []).map(u => u.toLowerCase());
        const recovery =
          advertised.includes(BLE_OTA_SERVICE_UUID) &&
          !advertised.includes(BLE_SERVICE_UUID);
        const name = device.localName ?? device.name ?? `${BLE_DEVICE_NAME_PREFIX}????`;

        dispatch({
          type: 'DEVICE_FOUND',
          device: { id: device.id, name, rssi: device.rssi, recovery },
        });
      },
    );
  }, [state.adapterReady]);

  // ── Internal write helper ─────────────────────────────────────
  const writeToLed = useCallback(async (bytes: Uint8Array): Promise<void> => {
    // cmdCommit()/cmdEnterCalibration() are no-ops on this firmware and return
    // empty frames; skip them rather than making every call site check.
    if (bytes.length === 0) return;
    const device = connectedDeviceRef.current;
    if (!device || !hasLedCharRef.current) return;
    await device.writeCharacteristicWithoutResponseForService(
      BLE_SERVICE_UUID,
      BLE_CHAR_LED_CMD,
      bytesToBase64(bytes),
    );
  }, []);

  // Begin monitoring key presses. The firmware streams every note for the whole
  // connection, so one monitor feeds both calibration and lesson grading.
  const startNoteMonitor = useCallback((device: Device) => {
    if (noteSubscriptionRef.current) return;
    noteSubscriptionRef.current = device.monitorCharacteristicForService(
      BLE_SERVICE_UUID,
      BLE_CHAR_NOTE_EVENT,
      (error, char) => {
        if (error || !char?.value) return;
        const evt = parseNoteEvent(base64ToBytes(char.value));
        if (!evt || !evt.on) return;   // key-down only

        // Calibration consumes the note instead of forwarding it.
        if (calActiveRef.current) {
          const step = calStepRef.current;
          if (step >= 0 && step < CAL_STEPS) {
            calStepRef.current = step + 1;
            const nextIdx = Math.min(step + 1, CAL_POSITIONS.length - 1);
            const nextLed = Math.round(
              CAL_POSITIONS[nextIdx] * Math.max(0, ledCountRef.current - 1),
            );
            dispatch({
              type: 'CAL_KEY_CONFIRMED',
              midiNote: evt.midiNote,
              ledIndex: calTargetLedRef.current,
              nextLed,
            });
          }
          return;
        }

        noteListenersRef.current.forEach((cb) => {
          try { cb(evt.midiNote); } catch { /* one bad listener shouldn't break others */ }
        });
      },
    );
  }, []);

  // ── Connect + discover services ───────────────────────────────
  const connectToDevice = useCallback(async (found: FoundDevice) => {
    const manager = getManager();

    manager.stopDeviceScan();
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);

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

    // A big MTU matters far more for firmware transfer than for LED frames:
    // the OTA chunk size is MTU-4. Android only; iOS negotiates on its own.
    try {
      const negotiated = await device.requestMTU(517);
      mtuRef.current = negotiated.mtu ?? 23;
    } catch {
      mtuRef.current = device.mtu ?? 23;
    }

    connectedDeviceRef.current = device;

    device.onDisconnected(() => {
      noteSubscriptionRef.current?.remove();
      noteSubscriptionRef.current = null;
      connectedDeviceRef.current  = null;
      hasLedCharRef.current       = false;
      calActiveRef.current        = false;
      dispatch({ type: 'DISCONNECT' });
    });

    dispatch({ type: 'DISCOVERING' });

    try {
      await device.discoverAllServicesAndCharacteristics();
    } catch {
      dispatch({ type: 'ERROR', message: 'Service discovery failed. Try reconnecting.' });
      return;
    }

    let hasMain = false;
    let hasOta  = false;
    try {
      const services = await device.services();
      const uuids = services.map(s => s.uuid.toLowerCase());
      hasMain = uuids.includes(BLE_SERVICE_UUID);
      hasOta  = uuids.includes(BLE_OTA_SERVICE_UUID);
    } catch {
      dispatch({ type: 'ERROR', message: 'Could not read the module’s services.' });
      return;
    }

    if (!hasMain && !hasOta) {
      dispatch({ type: 'ERROR', message: 'This does not look like a Piano Professor module.' });
      return;
    }

    hasLedCharRef.current = hasMain;

    // Recovery image: OTA only. Report it and stop — there is nothing to read
    // and nothing to light until real firmware is installed.
    if (!hasMain) {
      dispatch({
        type: 'SERVICE_READY',
        ledCount: 60,
        firmware: 'recovery',
        isRecovery: true,
        otaAvailable: true,
      });
      dispatch({ type: 'CONNECTED' });
      return;
    }

    let ledCount = 60;
    let firmware = '0.0';
    try {
      const char = await device.readCharacteristicForService(
        BLE_SERVICE_UUID,
        BLE_CHAR_DEVICE_STATUS,
      );
      if (char.value) {
        const status: DeviceStatus = parseDeviceStatus(base64ToBytes(char.value));
        ledCount = status.ledCount;
        firmware = status.firmware;
      }
    } catch {
      /* keep defaults — an older build may not expose the status char */
    }

    ledCountRef.current = ledCount;
    dispatch({
      type: 'SERVICE_READY',
      ledCount,
      firmware,
      isRecovery: false,
      otaAvailable: hasOta,
    });
    dispatch({ type: 'CONNECTED' });

    startNoteMonitor(device);

    // Celebrate.
    await runEffectByName('rainbow', {
      send: writeToLed,
      ledCount,
      mtu: mtuRef.current,
      cancelled: () => connectedDeviceRef.current === null,
    });
  }, [startNoteMonitor, writeToLed]);

  // ── Public write ──────────────────────────────────────────────
  const sendLedCommand = useCallback(async (bytes: Uint8Array) => {
    await writeToLed(bytes);
  }, [writeToLed]);

  const runEffect = useCallback(
    async (name: EffectName, rgb?: [number, number, number]) => {
      const ctx: EffectContext = {
        send: writeToLed,
        ledCount: ledCountRef.current,
        mtu: mtuRef.current,
        cancelled: () => connectedDeviceRef.current === null,
      };
      await runEffectByName(name, ctx, rgb);
    },
    [writeToLed],
  );

  // ── Calibration ───────────────────────────────────────────────
  // The firmware cannot tell us where the strip sits over the keyboard, so we
  // light one LED and let the learner tell us, by pressing the key under it.
  const startCalibration = useCallback(async () => {
    if (!connectedDeviceRef.current || !hasLedCharRef.current) {
      dispatch({ type: 'ERROR', message: 'Module not connected.' });
      return;
    }

    const firstLed = Math.round(CAL_POSITIONS[0] * Math.max(0, ledCountRef.current - 1));
    calStepRef.current    = 0;
    calTargetLedRef.current = firstLed;
    calActiveRef.current  = true;

    await writeToLed(cmdClearAll());
    await writeToLed(cmdCalibrationTarget(firstLed));

    dispatch({ type: 'CAL_START', targetLed: firstLed });
  }, [writeToLed]);

  // Light the LED for the current step; finish once every anchor is in.
  useEffect(() => {
    if (state.phase !== 'CALIBRATING' || !state.calibration) return;

    const { step, targetLed } = state.calibration;

    if (step >= CAL_STEPS) {
      calActiveRef.current = false;
      void (async () => {
        await writeToLed(cmdClearAll());
        dispatch({ type: 'CAL_COMPLETE' });
        await runEffect('rainbow');
      })();
      return;
    }

    calTargetLedRef.current = targetLed;
    void (async () => {
      await writeToLed(cmdClearAll());
      await writeToLed(cmdCalibrationTarget(targetLed));
    })();
  }, [state.phase, state.calibration, writeToLed, runEffect]);

  const skipCalibration = useCallback(async () => {
    calActiveRef.current = false;
    calStepRef.current   = -1;
    await writeToLed(cmdClearAll());
    dispatch({ type: 'CAL_COMPLETE' });
  }, [writeToLed]);

  // ── Firmware update ───────────────────────────────────────────
  const updateFirmware = useCallback(
    async (image: Uint8Array, onProgress: (p: OtaProgress) => void) => {
      const device = connectedDeviceRef.current;
      if (!device) throw new Error('Module not connected.');
      const session = new OtaSession(device);
      otaSessionRef.current = session;
      try {
        await session.run(image, onProgress);
      } finally {
        otaSessionRef.current = null;
      }
    },
    [],
  );

  const cancelFirmwareUpdate = useCallback(() => {
    otaSessionRef.current?.cancel();
  }, []);

  // ── Disconnect ────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    noteSubscriptionRef.current?.remove();
    noteSubscriptionRef.current = null;
    calActiveRef.current = false;
    const device = connectedDeviceRef.current;
    if (device) {
      try { await device.cancelConnection(); } catch { /* already gone */ }
    }
    connectedDeviceRef.current = null;
    hasLedCharRef.current      = false;
    dispatch({ type: 'DISCONNECT' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      noteSubscriptionRef.current?.remove();
      getManager().stopDeviceScan();
    };
  }, []);

  return {
    phase:        state.phase,
    devices:      state.devices,
    activeDevice: state.activeDevice,
    ledCount:     state.ledCount,
    firmware:     state.firmware,
    calibration:  state.calibration,
    error:        state.error,
    adapterReady: state.adapterReady,
    isRecovery:   state.isRecovery,
    otaAvailable: state.otaAvailable,

    startScan,
    connectToDevice,
    startCalibration,
    skipCalibration,
    disconnect,
    sendLedCommand,
    runEffect,
    reset,
    subscribeNotes,
    updateFirmware,
    cancelFirmwareUpdate,
  };
}
