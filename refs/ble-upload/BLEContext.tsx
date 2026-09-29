import React, { createContext, useContext } from 'react';
import { useBLE, UseBLEReturn } from './useBLE';

const BLECtx = createContext<UseBLEReturn | null>(null);

export function BLEProvider({ children }: { children: React.ReactNode }) {
  const ble = useBLE();
  return <BLECtx.Provider value={ble}>{children}</BLECtx.Provider>;
}

export function useBLEContext(): UseBLEReturn {
  const ctx = useContext(BLECtx);
  if (!ctx) {
    throw new Error('useBLEContext must be used inside <BLEProvider>');
  }
  return ctx;
}
