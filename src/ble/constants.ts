// Piano Professor — BLE constants
// Matches the ESP32 firmware's GATT table (pp-firmware/src/ble_server.cpp)

// ── Device identity ────────────────────────────────────────────
export const BLE_DEVICE_NAME_PREFIX = 'Piano-Prof-';
export const BLE_SCAN_TIMEOUT_MS    = 15_000;
export const BLE_CONNECT_TIMEOUT_MS = 10_000;

// ── GATT Service ───────────────────────────────────────────────
// Custom 128-bit UUID: base "Piano Professor LED Service"
export const BLE_SERVICE_UUID = '4C490001-1234-1000-8000-00805F9B34FB';

// ── Characteristics ────────────────────────────────────────────
// Write-without-response: send LED command packets
export const BLE_CHAR_LED_CMD    = '4C490002-1234-1000-8000-00805F9B34FB';

// Read: returns uint8 count of addressable LEDs on the strip
export const BLE_CHAR_LED_COUNT  = '4C490003-1234-1000-8000-00805F9B34FB';

// Notify: firmware emits a 2-byte packet (0x01, keyIndex) on each keypress
// during calibration mode; app confirms with a write-back
export const BLE_CHAR_CALIBRATE  = '4C490004-1234-1000-8000-00805F9B34FB';

// Write: firmware config register (brightness uint8, color-theme uint8)
export const BLE_CHAR_CONFIG     = '4C490005-1234-1000-8000-00805F9B34FB';

// ── LED command opcodes (byte 0) ───────────────────────────────
export const CMD = {
  /** SET_SINGLE  [idx, R, G, B] — light one LED */
  SET_SINGLE:   0x01,
  /** SET_RANGE   [start, end, R, G, B] — inclusive range, one color */
  SET_RANGE:    0x02,
  /** SET_MULTI   [count, idx0,R,G,B, idx1,R,G,B, …] — sparse map */
  SET_MULTI:    0x03,
  /** CLEAR_ALL   [] — extinguish every LED */
  CLEAR_ALL:    0x04,
  /** RUN_PATTERN [patternId, speed, …extraParams] */
  RUN_PATTERN:  0x05,
  /** COMMIT      [] — flush the framebuffer to the strip (required after writes) */
  COMMIT:       0x06,
  /** ENTER_CALIBRATION [] — put firmware into calibration listener mode */
  ENTER_CAL:    0x07,
  /** EXIT_CALIBRATION  [] */
  EXIT_CAL:     0x08,
} as const;

// ── Pattern IDs (byte 1 of RUN_PATTERN) ───────────────────────
export const PATTERN = {
  RAINBOW:       0x01,  // full-strip rainbow sweep; speed = ms-per-frame
  BREATHING:     0x02,  // all LEDs breathe a single color; extra: [R,G,B]
  SPARKLE:       0x03,  // random twinkles on black; extra: [R,G,B, density]
  THEATER_CHASE: 0x04,  // theater-marquee effect; extra: [R,G,B]
  STATIC:        0x05,  // solid color; extra: [R,G,B]
  SUCCESS_BURST: 0x06,  // green burst for correct note — used by lesson engine
} as const;

// ── Config register ────────────────────────────────────────────
export const COLOR_THEME = {
  RAINBOW:   0x00,
  GREEN:     0x01,
  BLUE:      0x02,
  WARM:      0x03,
} as const;

// ── Calibration ────────────────────────────────────────────────
// The 3 keys the user must press so the app can map MIDI note → LED index.
// These are C2 (MIDI 36), C4 middle-C (MIDI 60), C6 (MIDI 84).
export const CAL_TARGET_NOTES = [36, 60, 84] as const;  // MIDI note numbers
export const CAL_STEPS = 3;
