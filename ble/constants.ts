// Piano Professor — BLE constants
//
// Matches the real firmware in `firmware/controller/src/main.cpp` (the LED /
// note service) and `firmware/factory/src/main.cpp` (the OTA service). Those
// two files and this one are the contract; keep them in step.
//
// NOTE: these UUIDs replaced an earlier `4C49xxxx` set written against a
// `pp-firmware/src/ble_server.cpp` that never existed — no hardware ever spoke
// that protocol.

// ── Device identity ────────────────────────────────────────────
export const BLE_DEVICE_NAME_PREFIX = 'Piano-Prof-';
export const BLE_SCAN_TIMEOUT_MS    = 15_000;
export const BLE_CONNECT_TIMEOUT_MS = 10_000;

// ── Main service: LEDs + note events ───────────────────────────
export const BLE_SERVICE_UUID = 'f0a1d2c3-0001-4a5b-8c9d-1a2b3c4d5e6f';

/** Write-without-response: LED command frames (see protocol.ts). */
export const BLE_CHAR_LED_CMD = 'f0a1d2c3-0002-4a5b-8c9d-1a2b3c4d5e6f';

/**
 * Notify: `[type(0=off,1=on), midiNote, velocity, source(0=USB,1=TRS)]`.
 * Real key presses forwarded from the piano — drives calibration and grading.
 */
export const BLE_CHAR_NOTE_EVENT = 'f0a1d2c3-0003-4a5b-8c9d-1a2b3c4d5e6f';

/** Read + notify: `[ledCount, fwMajor, fwMinor, activeSource]`. */
export const BLE_CHAR_DEVICE_STATUS = 'f0a1d2c3-0004-4a5b-8c9d-1a2b3c4d5e6f';

// ── OTA service (firmware update) ──────────────────────────────
// Present on the factory recovery image and, later, on the app firmware. A
// board advertising ONLY this service is in recovery mode: no LEDs and no note
// events until real firmware is pushed to it.
export const BLE_OTA_SERVICE_UUID = 'f0a1d2c3-0010-4a5b-8c9d-1a2b3c4d5e6f';
export const BLE_CHAR_OTA_CONTROL = 'f0a1d2c3-0011-4a5b-8c9d-1a2b3c4d5e6f'; // write + notify
export const BLE_CHAR_OTA_DATA    = 'f0a1d2c3-0012-4a5b-8c9d-1a2b3c4d5e6f'; // write-no-response

// ── LED command opcodes (byte 0) ───────────────────────────────
export const CMD = {
  /** SET_SINGLE [idx, R, G, B] — light one LED */
  SET_SINGLE: 0x01,
  /** SET_MULTI  [count, idx,R,G,B, …] — sparse map, one frame */
  SET_MULTI:  0x02,
  /** CLEAR_ALL  [] */
  CLEAR_ALL:  0x03,
  /** SET_BRIGHTNESS [level 0..255] */
  BRIGHTNESS: 0x04,
} as const;

// ── OTA control op-codes ───────────────────────────────────────
export const OTA_CMD = {
  /** BEGIN [size u32 LE, md5 16B] — all-zero md5 skips verification */
  BEGIN:  0x01,
  /** END [] — flush, verify md5, switch boot partition */
  END:    0x02,
  ABORT:  0x03,
  REBOOT: 0x04,
  /** INFO [] — request the capability frame */
  INFO:   0x05,
} as const;

/** Notification frame tags on the OTA control characteristic. */
export const OTA_EVT = { STATUS: 0xa0, INFO: 0xa1 } as const;

export const OTA_STATE = {
  IDLE: 0, READY: 1, RECEIVING: 2, DONE: 3, ERROR: 4,
} as const;

export const OTA_ERR = {
  NONE: 0, BAD_CMD: 1, BEGIN_FAILED: 2, WRITE_FAILED: 3, VERIFY_FAILED: 4,
  SEQUENCE: 5, OVERFLOW: 6, NOT_STARTED: 7, SIZE: 8,
} as const;

/** Errors the device recovers from by resuming at `flashed`. */
export const OTA_RESUMABLE_ERRS: number[] = [OTA_ERR.SEQUENCE, OTA_ERR.OVERFLOW];

export const OTA_ERR_MESSAGE: Record<number, string> = {
  [OTA_ERR.NONE]:          'No error',
  [OTA_ERR.BAD_CMD]:       'The module rejected the command',
  [OTA_ERR.BEGIN_FAILED]:  'The module could not open an update slot (image too large?)',
  [OTA_ERR.WRITE_FAILED]:  'Flash write failed on the module',
  [OTA_ERR.VERIFY_FAILED]: 'The firmware failed its checksum — the transfer was corrupted',
  [OTA_ERR.SEQUENCE]:      'Chunks arrived out of order',
  [OTA_ERR.OVERFLOW]:      'Sent faster than the module could write',
  [OTA_ERR.NOT_STARTED]:   'The module was not expecting data',
  [OTA_ERR.SIZE]:          'Image size did not match what was announced',
};

// ── Calibration ────────────────────────────────────────────────
// The firmware streams real MIDI notes but has no idea where the strip sits
// over the keyboard, so calibration runs the other way round from the old
// design: the app lights ONE LED and the learner presses the key beneath it.
// That yields a {midiNote → ledIndex} anchor without the firmware needing to
// report anything but the note it heard.
export const CAL_STEPS = 3;

/**
 * Kept so screens that show a target note keep compiling. The flow no longer
 * requires these specific keys — whatever key sits under the lit LED works —
 * so treat them as a hint, not a requirement.
 */
export const CAL_TARGET_NOTES = [36, 60, 84] as const; // C2, middle C, C6

/** Fraction along the strip to light at each calibration step. */
export const CAL_POSITIONS = [0, 0.5, 1] as const;
