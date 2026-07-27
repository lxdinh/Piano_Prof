// Wire-format tests for the BLE layer.
//
// These pin the exact bytes against the firmware in `firmware/controller/src/
// main.cpp` and `firmware/factory/src/main.cpp`. If someone changes an opcode
// on one side, this fails instead of the module quietly ignoring commands.

import { base64ToBytes, bytesToBase64 } from '../ble/base64';
import { md5, toHex } from '../ble/md5';
import {
  cmdClearAll,
  cmdSetBrightness,
  cmdSetMulti,
  cmdSetMultiChunked,
  cmdSetSingle,
  cmdCommit,
  maxEntriesPerFrame,
  midiNoteToLedIndex,
  otaBegin,
  otaChunk,
  parseDeviceStatus,
  parseNoteEvent,
  parseOtaFrame,
} from '../ble/protocol';

describe('base64', () => {
  it('round-trips every byte value', () => {
    const bytes = new Uint8Array(256);
    for (let i = 0; i < 256; i++) bytes[i] = i;
    expect(Array.from(base64ToBytes(bytesToBase64(bytes)))).toEqual(Array.from(bytes));
  });

  it('handles all three padding cases', () => {
    for (const len of [1, 2, 3, 4, 5, 6]) {
      const b = new Uint8Array(len).fill(0xab);
      expect(base64ToBytes(bytesToBase64(b))).toHaveLength(len);
    }
  });

  it('matches known encodings', () => {
    expect(bytesToBase64(new Uint8Array([0x4d, 0x61, 0x6e]))).toBe('TWFu');
    expect(bytesToBase64(new Uint8Array([0x4d, 0x61]))).toBe('TWE=');
    expect(bytesToBase64(new Uint8Array([0x4d]))).toBe('TQ==');
  });
});

describe('md5', () => {
  it('matches published vectors', () => {
    const enc = (s: string) => new Uint8Array([...s].map(c => c.charCodeAt(0)));
    expect(toHex(md5(enc('')))).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(toHex(md5(enc('abc')))).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(toHex(md5(enc('The quick brown fox jumps over the lazy dog'))))
      .toBe('9e107d9d372bb6826bd81d3542a419d6');
  });

  it('handles the 55/56/64-byte padding boundaries', () => {
    const a = (n: number) => new Uint8Array(n).fill(0x61);
    expect(toHex(md5(a(55)))).toBe('ef1772b6dff9a122358552954ad0df65');
    expect(toHex(md5(a(56)))).toBe('3b0c8ac703f828b04c6c197006d17218');
    expect(toHex(md5(a(64)))).toBe('014842d480b571495a4a0363793f7367');
  });
});

describe('LED command frames', () => {
  it('encodes setLed as [0x01, idx, r, g, b]', () => {
    expect(Array.from(cmdSetSingle(7, 255, 128, 0))).toEqual([0x01, 7, 255, 128, 0]);
  });

  it('encodes setMany as [0x02, count, (idx,r,g,b)…]', () => {
    const frame = cmdSetMulti([
      { index: 1, rgb: [10, 20, 30] },
      { index: 2, rgb: [40, 50, 60] },
    ]);
    expect(Array.from(frame)).toEqual([0x02, 2, 1, 10, 20, 30, 2, 40, 50, 60]);
  });

  it('encodes clearAll and brightness', () => {
    expect(Array.from(cmdClearAll())).toEqual([0x03]);
    expect(Array.from(cmdSetBrightness(200))).toEqual([0x04, 200]);
  });

  it('clamps colour components', () => {
    expect(Array.from(cmdSetSingle(0, -5, 300, 12.7))).toEqual([0x01, 0, 0, 255, 13]);
  });

  it('treats commit as an empty no-op frame', () => {
    // The firmware draws on every write; sendLedCommand skips empty frames.
    expect(cmdCommit()).toHaveLength(0);
  });

  it('splits large highlights to fit the MTU', () => {
    // 244-byte payload at MTU 247 => (247-3-2)/4 = 60 entries per frame.
    expect(maxEntriesPerFrame(247)).toBe(60);
    const entries = Array.from({ length: 61 }, (_, i) => ({
      index: i, rgb: [1, 2, 3] as [number, number, number],
    }));
    const frames = cmdSetMultiChunked(entries, 247);
    expect(frames).toHaveLength(2);
    expect(frames[0][1]).toBe(60);
    expect(frames[1][1]).toBe(1);
    for (const f of frames) expect(f.length).toBeLessThanOrEqual(247 - 3);
  });
});

describe('device → app frames', () => {
  it('parses a note-on event', () => {
    const e = parseNoteEvent(new Uint8Array([1, 60, 100, 1]));
    expect(e).toEqual({ on: true, midiNote: 60, velocity: 100, source: 1 });
  });

  it('treats type 0 as note-off', () => {
    expect(parseNoteEvent(new Uint8Array([0, 60, 0, 1]))?.on).toBe(false);
  });

  it('rejects short frames', () => {
    expect(parseNoteEvent(new Uint8Array([1, 60]))).toBeNull();
  });

  it('parses device status', () => {
    expect(parseDeviceStatus(new Uint8Array([60, 0, 1, 1]))).toEqual({
      ledCount: 60, firmware: '0.1', activeSource: 1,
    });
  });

  it('falls back to 60 LEDs when the module reports 0', () => {
    expect(parseDeviceStatus(new Uint8Array([0, 1, 0, 1])).ledCount).toBe(60);
  });
});

describe('OTA framing', () => {
  it('encodes BEGIN with a little-endian size and the md5 at offset 5', () => {
    const digest = new Uint8Array(16).fill(0xbb);
    const f = otaBegin(541488, digest);
    expect(f).toHaveLength(21);
    expect(f[0]).toBe(0x01);
    // 541488 = 0x00084330 -> little-endian 30 43 08 00
    expect(Array.from(f.subarray(1, 5))).toEqual([0x30, 0x43, 0x08, 0x00]);
    expect(Array.from(f.subarray(5))).toEqual(Array(16).fill(0xbb));
  });

  it('leaves the md5 all-zero when verification is skipped', () => {
    expect(Array.from(otaBegin(1024, null).subarray(5))).toEqual(Array(16).fill(0));
  });

  it('prefixes data chunks with the sequence byte', () => {
    const f = otaChunk(0xff, new Uint8Array([1, 2, 3]));
    expect(Array.from(f)).toEqual([0xff, 1, 2, 3]);
  });

  it('parses a status frame', () => {
    // [0xA0, state=2, err=0, flashed=8192, total=541488, nextSeq=17]
    const b = new Uint8Array([
      0xa0, 2, 0,
      0x00, 0x20, 0x00, 0x00,
      0x30, 0x43, 0x08, 0x00,
      17,
    ]);
    expect(parseOtaFrame(b)).toEqual({
      kind: 'status', state: 2, error: 0, flashed: 8192, total: 541488, nextSeq: 17,
    });
  });

  it('parses an info frame', () => {
    // [0xA1, 1, 0, subtype=0x00 (factory), slot=0x140000, window=8192, maxChunk=512]
    const b = new Uint8Array([
      0xa1, 1, 0, 0x00,
      0x00, 0x00, 0x14, 0x00,
      0x00, 0x20,
      0x00, 0x02,
    ]);
    expect(parseOtaFrame(b)).toEqual({
      kind: 'info', firmware: '1.0', runningSubtype: 0x00,
      slotSize: 0x140000, windowBytes: 8192, maxChunk: 512,
    });
  });

  it('ignores unknown or short frames', () => {
    expect(parseOtaFrame(new Uint8Array(12).fill(0x99))).toBeNull();
    expect(parseOtaFrame(new Uint8Array([0xa0, 1]))).toBeNull();
  });

  it('parses frames that sit at a non-zero byteOffset', () => {
    // base64ToBytes can hand back a view into a larger buffer; the DataView in
    // parseOtaFrame must respect byteOffset or the u32s decode as garbage.
    const backing = new Uint8Array(20);
    backing.set([0xa0, 3, 0, 0x30, 0x43, 0x08, 0x00, 0x30, 0x43, 0x08, 0x00, 5], 8);
    const view = backing.subarray(8);
    const f = parseOtaFrame(view);
    expect(f).toMatchObject({ kind: 'status', state: 3, flashed: 541488 });
  });
});

describe('midiNoteToLedIndex', () => {
  it('interpolates between anchors', () => {
    const anchors = [
      { midiNote: 36, ledIndex: 0 },
      { midiNote: 84, ledIndex: 48 },
    ];
    expect(midiNoteToLedIndex(60, anchors)).toBe(24);
    expect(midiNoteToLedIndex(36, anchors)).toBe(0);
    expect(midiNoteToLedIndex(84, anchors)).toBe(48);
  });

  it('clamps outside the calibrated range', () => {
    const anchors = [
      { midiNote: 36, ledIndex: 0 },
      { midiNote: 84, ledIndex: 48 },
    ];
    expect(midiNoteToLedIndex(20, anchors)).toBe(0);
    expect(midiNoteToLedIndex(100, anchors)).toBe(48);
  });

  it('needs at least two anchors', () => {
    expect(midiNoteToLedIndex(60, [{ midiNote: 36, ledIndex: 0 }])).toBeNull();
  });
});
