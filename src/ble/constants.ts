// Piano Professor — BLE constants
// Matches the ESP32-S3 controller firmware in `firmware/controller/src/main.cpp`.
//
// These were previously written against a planned firmware
// (`pp-firmware/src/ble_server.cpp`) that was never built — the UUIDs and
// op-codes below are the contract the shipping firmware actually implements.

// ── Device identity ────────────────────────────────────────────
export const BLE_DEVICE_NAME_PREFIX = 'Piano-Prof-';
export const BLE_SCAN_TIMEOUT_MS    = 15_000;
export const BLE_CONNECT_TIMEOUT_MS = 10_000;

// ── GATT Service ───────────────────────────────────────────────
export const BLE_SERVICE_UUID = 'f0a1d2c3-0001-4a5b-8c9d-1a2b3c4d5e6f';

// ── Characteristics ────────────────────────────────────────────
// Write / write-without-response: LED command packets (see CMD below).
export const BLE_CHAR_LED_CMD = 'f0a1d2c3-0002-4a5b-8c9d-1a2b3c4d5e6f';

// Notify: key events forwarded from the TRS-MIDI input.
// Frame: [type (0 = note-off, 1 = note-on), midiNote, velocity, source].
export const BLE_CHAR_NOTE_EVENT = 'f0a1d2c3-0003-4a5b-8c9d-1a2b3c4d5e6f';

// Read + notify: device status.
// Frame: [ledCount, fwMajor, fwMinor, activeSource].
export const BLE_CHAR_STATUS = 'f0a1d2c3-0004-4a5b-8c9d-1a2b3c4d5e6f';

// Aliases kept so existing call-sites keep compiling.
export const BLE_CHAR_LED_COUNT = BLE_CHAR_STATUS;     // ledCount = byte 0
export const BLE_CHAR_CALIBRATE = BLE_CHAR_NOTE_EVENT; // key presses arrive here

// ── LED command op-codes (byte 0) ──────────────────────────────
// The firmware renders on every write — there is no separate COMMIT, and it
// implements no animation patterns or calibration mode.
export const CMD = {
  /** SET_LED    [idx, R, G, B] — light one LED */
  SET_LED:        0x01,
  /** SET_MANY   [count, idx0,R,G,B, idx1,R,G,B, …] — sparse map */
  SET_MANY:       0x02,
  /** CLEAR_ALL  [] — extinguish every LED */
  CLEAR_ALL:      0x03,
  /** SET_BRIGHTNESS [level 0..255] */
  SET_BRIGHTNESS: 0x04,
} as const;

// ── Calibration ────────────────────────────────────────────────
// The 3 keys the user presses so the app can map MIDI note → LED index.
// C2 (MIDI 36), C4 middle-C (MIDI 60), C6 (MIDI 84).
export const CAL_TARGET_NOTES = [36, 60, 84] as const;
export const CAL_STEPS = 3;

// Default strip length; overridden by the status characteristic.
export const DEFAULT_LED_COUNT = 60;
