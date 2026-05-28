import { useCallback } from 'react';
import { CalibrationAnchor, midiNoteToLedIndex } from '../ble/protocol';
import { useBLEContext } from '../ble/BLEContext';

/**
 * Hook that exposes a stable `midiToLed` function bound to the active device's
 * calibration anchors. Returns null if no device is calibrated yet.
 */
export function useMidiToLed() {
  const ble = useBLEContext();
  const anchors: CalibrationAnchor[] = ble.calibration?.anchors ?? [];

  const map = useCallback(
    (midiNote: number): number | null => {
      if (anchors.length < 2) {
        // Fallback: assume strip starts at C2 (midi 36), 2 LEDs per semitone-ish
        // Strictly used in dev mode before calibration.
        const fallback = Math.max(0, Math.min(ble.ledCount - 1, (midiNote - 36) * 1));
        return Math.round(fallback);
      }
      return midiNoteToLedIndex(midiNote, anchors);
    },
    [anchors, ble.ledCount],
  );

  return map;
}
