// Piano Professor — BLE binary command encoder
// Every function returns a Uint8Array ready for BLE write-without-response.
//
// Frames match `firmware/controller/src/main.cpp`. The firmware draws to the
// strip immediately on every write, so there is no framebuffer and no COMMIT
// step; `cmdCommit()` survives as a no-op purely so existing call sites keep
// reading naturally.

import { CMD, OTA_CMD, OTA_EVT, OTA_STATE } from './constants';

type RGB = [number, number, number];

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

// ── Single LED ─────────────────────────────────────────────────
export function cmdSetSingle(index: number, r: number, g: number, b: number): Uint8Array {
  return new Uint8Array([CMD.SET_SINGLE, index & 0xff, clamp(r), clamp(g), clamp(b)]);
}

// ── Sparse key highlight ───────────────────────────────────────
// Used by the lesson engine to light the exact keys for the current chord.
// One frame carries 4 bytes per LED after a 2-byte header, so how many fit
// depends on the negotiated MTU — see `maxEntriesPerFrame`.
export function cmdSetMulti(entries: Array<{ index: number; rgb: RGB }>): Uint8Array {
  const payload = [CMD.SET_MULTI, entries.length & 0xff];
  for (const { index, rgb } of entries) {
    payload.push(index & 0xff, clamp(rgb[0]), clamp(rgb[1]), clamp(rgb[2]));
  }
  return new Uint8Array(payload);
}

/** How many (index,r,g,b) entries fit in one write at the given MTU. */
export function maxEntriesPerFrame(mtu: number): number {
  return Math.max(1, Math.floor((mtu - 3 - 2) / 4));
}

/** Split a large highlight into MTU-safe frames. */
export function cmdSetMultiChunked(
  entries: Array<{ index: number; rgb: RGB }>,
  mtu: number,
): Uint8Array[] {
  const per = maxEntriesPerFrame(mtu);
  const out: Uint8Array[] = [];
  for (let i = 0; i < entries.length; i += per) {
    out.push(cmdSetMulti(entries.slice(i, i + per)));
  }
  return out;
}

// ── Contiguous range, one color ────────────────────────────────
// The firmware has no range opcode, so this expands to a sparse map. Callers
// with more LEDs than fit one frame should use cmdSetMultiChunked instead.
export function cmdSetRange(
  start: number,
  end: number,
  r: number,
  g: number,
  b: number,
): Uint8Array {
  const entries: Array<{ index: number; rgb: RGB }> = [];
  for (let i = start; i <= end; i++) entries.push({ index: i, rgb: [r, g, b] });
  return cmdSetMulti(entries);
}

// ── Clear all ──────────────────────────────────────────────────
export function cmdClearAll(): Uint8Array {
  return new Uint8Array([CMD.CLEAR_ALL]);
}

// ── Brightness ─────────────────────────────────────────────────
export function cmdSetBrightness(level: number): Uint8Array {
  return new Uint8Array([CMD.BRIGHTNESS, clamp(level)]);
}

// ── Commit ─────────────────────────────────────────────────────
/**
 * No-op. The firmware pushes to the strip on every write, so there is nothing
 * to flush. Returns an empty frame, which `sendLedCommand` skips — kept so the
 * existing `await send(cmdCommit())` call sites stay valid.
 */
export function cmdCommit(): Uint8Array {
  return new Uint8Array(0);
}

// ── Calibration ────────────────────────────────────────────────
// The firmware has no calibration mode: it always streams note events. These
// remain as no-ops so the pairing flow's enter/exit calls keep working.
export function cmdEnterCalibration(): Uint8Array {
  return new Uint8Array(0);
}

export function cmdExitCalibration(): Uint8Array {
  return new Uint8Array(0);
}

/** Light the single LED the learner should press the key beneath. */
export function cmdCalibrationTarget(ledIndex: number): Uint8Array {
  return cmdSetSingle(ledIndex, 0x58, 0xcc, 0x02);
}

// ── Note events (device → app) ─────────────────────────────────
export interface NoteEvent {
  on: boolean;
  midiNote: number;
  velocity: number;
  /** 0 = USB-MIDI, 1 = TRS jack */
  source: number;
}

/** Parse a notification from BLE_CHAR_NOTE_EVENT. */
export function parseNoteEvent(bytes: Uint8Array): NoteEvent | null {
  if (bytes.length < 4) return null;
  return {
    on: bytes[0] === 1,
    midiNote: bytes[1],
    velocity: bytes[2],
    source: bytes[3],
  };
}

// ── Device status (device → app) ───────────────────────────────
export interface DeviceStatus {
  ledCount: number;
  firmware: string;
  activeSource: number;
}

export function parseDeviceStatus(bytes: Uint8Array): DeviceStatus {
  if (bytes.length < 4) return { ledCount: 60, firmware: '0.0', activeSource: 1 };
  return {
    ledCount: bytes[0] === 0 ? 60 : bytes[0],
    firmware: `${bytes[1]}.${bytes[2]}`,
    activeSource: bytes[3],
  };
}

// ── OTA framing ────────────────────────────────────────────────

/** `[0x01][size u32 LE][md5 16B]` — pass null md5 to skip verification. */
export function otaBegin(size: number, md5: Uint8Array | null): Uint8Array {
  const out = new Uint8Array(21);
  out[0] = OTA_CMD.BEGIN;
  new DataView(out.buffer).setUint32(1, size, true);
  if (md5) {
    if (md5.length !== 16) throw new Error(`md5 must be 16 bytes, got ${md5.length}`);
    out.set(md5, 5);
  }
  return out;
}

export const otaEnd    = (): Uint8Array => new Uint8Array([OTA_CMD.END]);
export const otaAbort  = (): Uint8Array => new Uint8Array([OTA_CMD.ABORT]);
export const otaReboot = (): Uint8Array => new Uint8Array([OTA_CMD.REBOOT]);
export const otaInfo   = (): Uint8Array => new Uint8Array([OTA_CMD.INFO]);

/**
 * One data chunk: a sequence byte then payload. `seq` increments per chunk
 * mod 256 **continuously across windows**, restarting at 0 only after a resync.
 */
export function otaChunk(seq: number, payload: Uint8Array): Uint8Array {
  const out = new Uint8Array(payload.length + 1);
  out[0] = seq & 0xff;
  out.set(payload, 1);
  return out;
}

export interface OtaStatusFrame {
  kind: 'status';
  state: number;
  error: number;
  /** Bytes committed to flash — the authoritative resume point. */
  flashed: number;
  total: number;
  nextSeq: number;
}

export interface OtaInfoFrame {
  kind: 'info';
  firmware: string;
  /** 0x00 = factory (recovery), 0x10 = ota_0, 0x11 = ota_1. */
  runningSubtype: number;
  slotSize: number;
  windowBytes: number;
  maxChunk: number;
}

export type OtaFrame = OtaStatusFrame | OtaInfoFrame;

export function parseOtaFrame(bytes: Uint8Array): OtaFrame | null {
  if (bytes.length < 12) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes[0] === OTA_EVT.STATUS) {
    return {
      kind: 'status',
      state: bytes[1],
      error: bytes[2],
      flashed: dv.getUint32(3, true),
      total: dv.getUint32(7, true),
      nextSeq: bytes[11],
    };
  }
  if (bytes[0] === OTA_EVT.INFO) {
    return {
      kind: 'info',
      firmware: `${bytes[1]}.${bytes[2]}`,
      runningSubtype: bytes[3],
      slotSize: dv.getUint32(4, true),
      windowBytes: dv.getUint16(8, true),
      maxChunk: dv.getUint16(10, true),
    };
  }
  return null;
}

export function otaSlotName(subtype: number): string {
  if (subtype === 0x00) return 'factory';
  if (subtype === 0x10) return 'ota_0';
  if (subtype === 0x11) return 'ota_1';
  return 'unknown';
}

export const isOtaFatal = (f: OtaStatusFrame): boolean => f.state === OTA_STATE.ERROR;

// ── Lesson helper: map MIDI note → LED index using calibration map ─
// calMap is an array of {midiNote, ledIndex} anchors. We interpolate linearly.
export type CalibrationAnchor = { midiNote: number; ledIndex: number };

export function midiNoteToLedIndex(
  midiNote: number,
  anchors: CalibrationAnchor[],
): number | null {
  if (anchors.length < 2) return null;
  const sorted = [...anchors].sort((a, b) => a.midiNote - b.midiNote);

  // Clamp to range
  if (midiNote <= sorted[0].midiNote) return sorted[0].ledIndex;
  if (midiNote >= sorted[sorted.length - 1].midiNote) return sorted[sorted.length - 1].ledIndex;

  for (let i = 0; i < sorted.length - 1; i++) {
    const lo = sorted[i];
    const hi = sorted[i + 1];
    if (midiNote >= lo.midiNote && midiNote <= hi.midiNote) {
      const t = (midiNote - lo.midiNote) / (hi.midiNote - lo.midiNote);
      return Math.round(lo.ledIndex + t * (hi.ledIndex - lo.ledIndex));
    }
  }
  return null;
}
