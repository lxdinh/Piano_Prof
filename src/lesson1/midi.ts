// Piano Professor — MIDI packet decoder (pure, testable). The ESP32 bridges the
// Casio's USB-MIDI to BLE as discrete 3-byte messages; this turns a notify
// payload (one or more messages) into typed events the HAL emits. Channel bits
// are masked, so note/pedal messages on any MIDI channel are understood.
export type MidiEvent =
  | { type: 'on'; note: number; vel: number }
  | { type: 'off'; note: number; vel: number } // vel = release velocity (0 if unknown)
  | { type: 'pedal'; down: boolean }; // sustain (CC64)

export function parseMidiPackets(bytes: number[]): MidiEvent[] {
  const out: MidiEvent[] = [];
  for (let i = 0; i + 2 < bytes.length; i += 3) {
    const status = bytes[i] & 0xf0;
    const d1 = bytes[i + 1];
    const d2 = bytes[i + 2];
    if (status === 0x90 && d2 > 0) {
      out.push({ type: 'on', note: d1, vel: d2 });
    } else if (status === 0x80 || (status === 0x90 && d2 === 0)) {
      out.push({ type: 'off', note: d1, vel: d2 });
    } else if (status === 0xb0 && d1 === 0x40) {
      out.push({ type: 'pedal', down: d2 >= 64 });
    }
    // other CC / messages are ignored
  }
  return out;
}
