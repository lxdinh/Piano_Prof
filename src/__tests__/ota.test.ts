// Behaviour tests for the OTA transfer engine, driven against a fake module.
//
// bleProtocol.test.ts pins the *bytes*; this pins the *conversation* — the parts
// that only go wrong once a real board replies in an awkward way. Both stall
// cases below hung the app indefinitely before the fix, which is exactly the
// failure a wire-format test cannot see.

import { OtaSession, OtaError, OtaProgress } from '../ble/ota';
import { base64ToBytes, bytesToBase64 } from '../ble/base64';
import { OTA_CMD, OTA_ERR, OTA_EVT, OTA_STATE } from '../ble/constants';
import type { Device } from 'react-native-ble-plx';

/** Lets a test bend the module's reply for one specific window. */
type WindowHook = (window: number, flashed: number)
  => { flashed?: number; error?: number } | void;

interface FakeOpts {
  slotSize?: number;
  windowBytes?: number;
  maxChunk?: number;
  mtu?: number;
  onWindow?: WindowHook;
}

/** A stand-in for the ESP32 running the factory OTA image. */
class FakeModule {
  readonly dataFrames: Uint8Array[] = [];
  readonly mtu: number;
  private readonly slotSize: number;
  private readonly windowBytes: number;
  private readonly maxChunk: number;
  private readonly onWindow?: WindowHook;

  private notify: ((bytes: Uint8Array) => void) | null = null;
  private flashed = 0;
  private inWindow = 0;
  private nextSeq = 0;
  private windows = 0;
  private total = 0;

  constructor(o: FakeOpts = {}) {
    this.slotSize = o.slotSize ?? 0x140000;
    this.windowBytes = o.windowBytes ?? 1024;
    this.maxChunk = o.maxChunk ?? 512;
    this.mtu = o.mtu ?? 185;
    this.onWindow = o.onWindow;
  }

  asDevice(): Device {
    return this as unknown as Device;
  }

  monitorCharacteristicForService(
    _svc: string, _char: string, cb: (e: unknown, c: { value: string } | null) => void,
  ) {
    this.notify = (bytes) => cb(null, { value: bytesToBase64(bytes) });
    return { remove: () => { this.notify = null; } };
  }

  private sendStatus(state: number, error: number = OTA_ERR.NONE) {
    const b = new Uint8Array(12);
    const dv = new DataView(b.buffer);
    b[0] = OTA_EVT.STATUS;
    b[1] = state;
    b[2] = error;
    dv.setUint32(3, this.flashed, true);
    dv.setUint32(7, this.total, true);
    b[11] = this.nextSeq;
    this.notify?.(b);
  }

  private sendInfo() {
    const b = new Uint8Array(12);
    const dv = new DataView(b.buffer);
    b[0] = OTA_EVT.INFO;
    b[1] = 1; b[2] = 0;
    b[3] = 0x00; // running from factory = recovery
    dv.setUint32(4, this.slotSize, true);
    dv.setUint16(8, this.windowBytes, true);
    dv.setUint16(10, this.maxChunk, true);
    this.notify?.(b);
  }

  async writeCharacteristicWithResponseForService(_s: string, _c: string, b64: string) {
    const bytes = base64ToBytes(b64);
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    switch (bytes[0]) {
      case OTA_CMD.INFO:
        this.sendInfo();
        break;
      case OTA_CMD.BEGIN:
        this.total = dv.getUint32(1, true);
        this.flashed = 0;
        this.nextSeq = 0;
        this.sendStatus(OTA_STATE.READY);
        break;
      case OTA_CMD.END:
        if (this.flashed === this.total) this.sendStatus(OTA_STATE.DONE);
        else this.sendStatus(OTA_STATE.ERROR, OTA_ERR.SIZE);
        break;
      default:
        break; // ABORT / REBOOT are silent
    }
    return null as never;
  }

  async writeCharacteristicWithoutResponseForService(_s: string, _c: string, b64: string) {
    const frame = base64ToBytes(b64);
    this.dataFrames.push(frame);
    const payload = frame.length - 1; // byte 0 is the sequence number
    this.inWindow += payload;
    this.flashed += payload;
    this.nextSeq = (this.nextSeq + 1) & 0xff;

    if (this.inWindow >= this.windowBytes || this.flashed >= this.total) {
      this.inWindow = 0;
      this.windows += 1;
      const bend = this.onWindow?.(this.windows, this.flashed);
      if (bend?.flashed !== undefined) this.flashed = bend.flashed;
      this.sendStatus(OTA_STATE.RECEIVING, bend?.error ?? OTA_ERR.NONE);
    }
    return null as never;
  }
}

/** A plausible ESP-IDF image: right magic byte, over the 1 KB floor. */
function image(bytes = 4096): Uint8Array {
  const img = new Uint8Array(bytes);
  for (let i = 0; i < bytes; i++) img[i] = i & 0xff;
  img[0] = 0xe9;
  return img;
}

const run = (mod: FakeModule, img = image()) => {
  const seen: OtaProgress[] = [];
  return new OtaSession(mod.asDevice())
    .run(img, (p) => seen.push(p))
    .then((ok) => ({ ok, seen }));
};

describe('OtaSession — happy path', () => {
  it('transfers, verifies and reports completion', async () => {
    const mod = new FakeModule();
    const { ok, seen } = await run(mod);

    expect(ok).toBe(true);
    expect(seen[seen.length - 1].phase).toBe('done');
    expect(seen.some((p) => p.phase === 'transferring')).toBe(true);
    // Every byte reached flash.
    const sent = mod.dataFrames.reduce((n, f) => n + f.length - 1, 0);
    expect(sent).toBe(4096);
  });

  it('reports the running slot from the INFO frame', async () => {
    const { seen } = await run(new FakeModule());
    expect(seen.some((p) => p.runningSlot === 0x00)).toBe(true);
  });
});

describe('OtaSession — refuses to hang', () => {
  // THE REGRESSION. A module that replies RECEIVING/NONE without advancing
  // `flashed` used to reset the retry counter, so the same window was
  // retransmitted forever with the progress bar frozen and — because the screen
  // hides every control while busy — no way out but force-quitting the app.
  it('gives up when the module stops making progress', async () => {
    const mod = new FakeModule({ onWindow: () => ({ flashed: 0 }) });
    await expect(run(mod)).rejects.toThrow(OtaError);
    await expect(run(mod)).rejects.toThrow(/stopped writing to flash/i);
  }, 10_000);

  it('bounds how many windows a stalled transfer costs', async () => {
    const mod = new FakeModule({ onWindow: () => ({ flashed: 0 }) });
    await expect(run(mod)).rejects.toThrow(OtaError);
    // 1 KB windows at ~181 B/frame ≈ 6 frames per window; 9 attempts max.
    expect(mod.dataFrames.length).toBeLessThan(80);
  }, 10_000);
});

describe('OtaSession — recoverable trouble', () => {
  it('resumes from the module\'s flashed count after an overflow', async () => {
    let bent = false;
    const mod = new FakeModule({
      onWindow: (n) => {
        if (n !== 2 || bent) return;
        bent = true;
        return { flashed: 1024, error: OTA_ERR.OVERFLOW }; // roll back one window
      },
    });
    const { ok } = await run(mod);
    expect(ok).toBe(true);
    expect(bent).toBe(true);
  }, 10_000);
});

describe('OtaSession — framing limits', () => {
  // maxChunk is a ceiling. The old `Math.max(19, Math.min(mtu - 3, maxChunk) - 1)`
  // put the floor OUTSIDE the min, so a module advertising a small maxChunk got
  // over-size frames it had said it could not accept.
  it('never writes a frame larger than the module advertised', async () => {
    const mod = new FakeModule({ maxChunk: 16, mtu: 185 });
    await run(mod);
    const largest = Math.max(...mod.dataFrames.map((f) => f.length));
    expect(largest).toBeLessThanOrEqual(16);
  }, 10_000);

  it('respects a small negotiated MTU', async () => {
    const mod = new FakeModule({ mtu: 23 });
    await run(mod);
    const largest = Math.max(...mod.dataFrames.map((f) => f.length));
    expect(largest).toBeLessThanOrEqual(20); // 23 − 3
  }, 10_000);
});

describe('OtaSession — rejects bad images', () => {
  it('refuses a file that is not an ESP32 image', async () => {
    const notFirmware = image();
    notFirmware[0] = 0x50; // "P" — a zip, say
    await expect(run(new FakeModule(), notFirmware)).rejects.toThrow(/ESP32 firmware image/);
  });

  it('refuses a file too small to be firmware', async () => {
    await expect(run(new FakeModule(), new Uint8Array(64))).rejects.toThrow(/too small/);
  });

  it('refuses an image larger than the update slot', async () => {
    const mod = new FakeModule({ slotSize: 2048 });
    await expect(run(mod, image(4096))).rejects.toThrow(/only holds/);
  });
});

describe('OtaSession — cancellation', () => {
  // Cancelling used to resolve exactly like success, so the screen popped
  // "Module updated 🎉" over an update the user had just stopped.
  it('resolves false, not true, when cancelled', async () => {
    const mod = new FakeModule();
    const session = new OtaSession(mod.asDevice());
    const done = session.run(image(), (p) => {
      if (p.phase === 'transferring') session.cancel();
    });
    await expect(done).resolves.toBe(false);
  }, 10_000);
});
