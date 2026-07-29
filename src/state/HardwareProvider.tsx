// Piano Professor — app-lifetime owner of the piano hardware link.
//
// WHY THIS EXISTS. The HwFacade used to be built inside whichever screen needed
// it (`new HwFacade()` in Pair and in Lesson). But <Router> swaps the rendered
// component on every `go()`, so navigating away UNMOUNTS the screen and runs its
// cleanup — which called `hw.dispose()` → `device.cancelConnection()`.
//
// That made the firmware-update flow impossible: Pair handed its live `Device`
// to the update screen through route params and then, unmounting, cancelled that
// exact connection. The OTA screen always received a dead handle.
//
// The radio therefore has to outlive any one screen. Screens now subscribe and
// unsubscribe; only the app itself tears the link down.
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { Device } from 'react-native-ble-plx';

import { HwFacade, HwStatus } from '../lesson1/hal';

export interface HardwareAPI {
  /** The shared facade — subscribe with `hw.onNoteOn(…)` etc. and keep the
   *  returned unsubscribe for your effect cleanup. */
  hw: HwFacade;
  /** Latest status, already re-rendered into React state. */
  status: HwStatus;
  /** Scan for and connect to a board. Idempotent while a link is up. */
  connect: () => Promise<void>;
  /** Drop the BLE link and fall back to the on-screen simulator. */
  disconnect: () => void;
  /** The live BLE device, for the OTA screen. Null on the simulator. */
  bleDevice: Device | null;
  /** True when the board is running only the factory recovery image. */
  isRecovery: boolean;
}

const Ctx = createContext<HardwareAPI | null>(null);

/** States that mean a link is already established — re-scanning would drop it. */
const LIVE = new Set<HwStatus['state']>(['connected', 'recovery']);

export function HardwareProvider({ children }: { children: React.ReactNode }) {
  const hwRef = useRef<HwFacade | null>(null);
  if (!hwRef.current) hwRef.current = new HwFacade();
  const hw = hwRef.current;

  const [status, setStatus] = useState<HwStatus>(hw.backend.status);

  useEffect(() => hw.onStatus(setStatus), [hw]);

  // The only place the radio is ever torn down.
  useEffect(() => () => hw.dispose(), [hw]);

  const connect = useCallback(async () => {
    if (hw.mode === 'ble' && LIVE.has(hw.backend.status.state)) return;
    if (hw.mode !== 'ble') hw.setMode('ble');
    await hw.connect();
  }, [hw]);

  const disconnect = useCallback(() => {
    if (hw.mode !== 'sim') hw.setMode('sim');
  }, [hw]);

  const value = useMemo<HardwareAPI>(() => ({
    hw, status, connect, disconnect,
    bleDevice: hw.bleDevice,
    isRecovery: hw.isRecovery,
  }), [hw, status, connect, disconnect]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHardware(): HardwareAPI {
  const v = useContext(Ctx);
  if (!v) throw new Error('useHardware must be used inside <HardwareProvider>');
  return v;
}
