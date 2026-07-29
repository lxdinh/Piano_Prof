// Piano Professor — firmware update over BLE.
//
// Speaks the OTA service in `firmware/factory/src/main.cpp`. The protocol is
// ack-paced rather than fire-and-hose: the module can only commit ~4 KB per
// flash sector erase, so we send one window, wait for it to confirm every byte
// of that window is in flash, then send the next. That confirmation doubles as
// the resume point, which is what makes a dropped chunk cheap to recover from.
//
// Measured on an ESP32-S3 over a 517-byte MTU: 541 KB in ~13 s, zero resyncs.

import { Device, Subscription } from 'react-native-ble-plx';

import { base64ToBytes, bytesToBase64 } from './base64';
import {
  BLE_CHAR_OTA_CONTROL,
  BLE_CHAR_OTA_DATA,
  BLE_OTA_SERVICE_UUID,
  OTA_ERR_MESSAGE,
  OTA_RESUMABLE_ERRS,
  OTA_STATE,
} from './constants';
import { md5 } from './md5';
import {
  OtaFrame,
  OtaInfoFrame,
  OtaStatusFrame,
  otaAbort,
  otaBegin,
  otaChunk,
  otaEnd,
  otaInfo,
  otaReboot,
  parseOtaFrame,
} from './protocol';

export type OtaPhase =
  | 'idle'
  | 'handshaking'
  | 'preparing'
  | 'transferring'
  | 'verifying'
  | 'rebooting'
  | 'done'
  | 'failed';

export const OTA_PHASE_LABEL: Record<OtaPhase, string> = {
  idle:         'Ready',
  handshaking:  'Talking to your module…',
  preparing:    'Preparing the module…',
  transferring: 'Sending firmware…',
  verifying:    'Checking the firmware…',
  rebooting:    'Restarting your module…',
  done:         'Update complete',
  failed:       'Update failed',
};

export interface OtaProgress {
  phase: OtaPhase;
  bytesSent: number;
  totalBytes: number;
  /** null until enough data has moved to measure. */
  bytesPerSecond: number | null;
  etaSeconds: number | null;
  error: string | null;
  /** Which slot the module is currently running from, once known. */
  runningSlot: number | null;
}

export class OtaError extends Error {}

/** How long to wait for any single reply. */
const REPLY_TIMEOUT_MS = 10_000;
/** END triggers an MD5 pass over the whole image on-device — give it room. */
const FINISH_TIMEOUT_MS = 30_000;
/** Consecutive resumable failures tolerated before giving up. */
const MAX_RETRIES = 8;

/** Simple async queue of notification frames with a timeout-aware `next()`. */
class FrameQueue {
  private items: OtaFrame[] = [];
  private waiter: ((f: OtaFrame) => void) | null = null;

  push(frame: OtaFrame): void {
    if (this.waiter) {
      const w = this.waiter;
      this.waiter = null;
      w(frame);
    } else {
      this.items.push(frame);
    }
  }

  next(timeoutMs: number): Promise<OtaFrame> {
    const queued = this.items.shift();
    if (queued) return Promise.resolve(queued);

    return new Promise<OtaFrame>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiter = null;
        reject(
          new OtaError('The module stopped responding. Move closer and try again.'),
        );
      }, timeoutMs);

      this.waiter = (f) => {
        clearTimeout(timer);
        resolve(f);
      };
    });
  }

  clear(): void {
    this.items = [];
  }
}

export class OtaSession {
  private cancelled = false;

  constructor(private readonly device: Device) {}

  cancel(): void {
    this.cancelled = true;
  }

  /**
   * Push `image` (the contents of a PlatformIO `firmware.bin`) and reboot the
   * module into it. Throws [OtaError] with a user-presentable message.
   *
   * Resolves `true` when the module took the firmware, `false` when the caller
   * cancelled. Cancelling used to resolve indistinguishably from success, so
   * the screen congratulated the user on an update they had just stopped.
   */
  async run(
    image: Uint8Array,
    onProgress: (p: OtaProgress) => void,
  ): Promise<boolean> {
    this.cancelled = false;

    let phase: OtaPhase = 'idle';
    let sent = 0;
    let runningSlot: number | null = null;
    let startedAt = 0;

    const report = (error: string | null = null) => {
      const elapsed = startedAt ? (Date.now() - startedAt) / 1000 : 0;
      const rate = elapsed > 0 && sent > 0 ? sent / elapsed : null;
      onProgress({
        phase,
        bytesSent: sent,
        totalBytes: image.length,
        bytesPerSecond: rate,
        etaSeconds: rate && rate > 0 ? Math.round((image.length - sent) / rate) : null,
        error,
        runningSlot,
      });
    };

    const setPhase = (p: OtaPhase) => {
      phase = p;
      report();
    };

    // Every ESP-IDF application image starts with the magic byte 0xE9. Catching
    // it here saves a long upload the module would only reject at the very end.
    if (image.length < 1024) {
      throw new OtaError('That file is too small to be a firmware image.');
    }
    if (image[0] !== 0xe9) {
      throw new OtaError(
        'That does not look like an ESP32 firmware image. Pick the firmware.bin ' +
          'from .pio/build/, not a .elf or a zip.',
      );
    }

    const queue = new FrameQueue();
    let sub: Subscription | null = null;

    const writeControl = (bytes: Uint8Array) =>
      this.device.writeCharacteristicWithResponseForService(
        BLE_OTA_SERVICE_UUID,
        BLE_CHAR_OTA_CONTROL,
        bytesToBase64(bytes),
      );

    const writeData = (bytes: Uint8Array) =>
      this.device.writeCharacteristicWithoutResponseForService(
        BLE_OTA_SERVICE_UUID,
        BLE_CHAR_OTA_DATA,
        bytesToBase64(bytes),
      );

    const nextStatus = async (timeout: number): Promise<OtaStatusFrame> => {
      for (;;) {
        const f = await queue.next(timeout);
        if (f.kind === 'status') return f;
      }
    };

    try {
      sub = this.device.monitorCharacteristicForService(
        BLE_OTA_SERVICE_UUID,
        BLE_CHAR_OTA_CONTROL,
        (error, char) => {
          if (error || !char?.value) return;
          const frame = parseOtaFrame(base64ToBytes(char.value));
          if (frame) queue.push(frame);
        },
      );

      // ---- 1. capabilities ----
      setPhase('handshaking');
      await writeControl(otaInfo());
      let info: OtaInfoFrame | null = null;
      for (;;) {
        const f = await queue.next(REPLY_TIMEOUT_MS);
        if (f.kind === 'info') {
          info = f;
          break;
        }
      }
      runningSlot = info.runningSubtype;
      report();

      if (image.length > info.slotSize) {
        throw new OtaError(
          `Firmware is ${Math.round(image.length / 1024)} KB but the update slot ` +
            `only holds ${Math.round(info.slotSize / 1024)} KB.`,
        );
      }

      // Each write must fit BOTH the link (ATT payload = MTU − 3) and whatever
      // the module says it can take; one byte of that is the sequence number.
      // maxChunk is a hard ceiling, never a floor — an earlier `Math.max(19, …)`
      // sat outside the min and so produced over-size frames whenever the module
      // advertised a maxChunk below 20.
      const mtu = this.device.mtu ?? 23;
      const frameCap = Math.min(mtu - 3, info.maxChunk);
      const chunkSize = Math.max(1, frameCap - 1);
      const windowBytes = info.windowBytes;

      // ---- 2. announce the image ----
      setPhase('preparing');
      await writeControl(otaBegin(image.length, md5(image)));

      let status = await nextStatus(REPLY_TIMEOUT_MS);
      if (status.state === OTA_STATE.ERROR) {
        throw new OtaError(OTA_ERR_MESSAGE[status.error] ?? 'Unknown error');
      }
      if (status.state !== OTA_STATE.READY) {
        throw new OtaError(
          `Module refused the update: ${OTA_ERR_MESSAGE[status.error] ?? status.error}`,
        );
      }

      // ---- 3. stream it, one ack-gated window at a time ----
      setPhase('transferring');
      startedAt = Date.now();
      let offset = 0;
      let retries = 0;
      // The chunk counter runs continuously across windows and wraps at 256.
      // Rather than mirror the device's arithmetic, take the value it reports:
      // it stays correct through resyncs and wraps alike.
      let seq = status.nextSeq;

      while (offset < image.length) {
        if (this.cancelled) {
          await writeControl(otaAbort());
          setPhase('idle');
          return false;
        }

        const windowEnd = Math.min(offset + windowBytes, image.length);
        let cursor = offset;
        while (cursor < windowEnd) {
          const end = Math.min(cursor + chunkSize, windowEnd);
          await writeData(otaChunk(seq, image.subarray(cursor, end)));
          seq = (seq + 1) & 0xff;
          cursor = end;
        }

        status = await nextStatus(REPLY_TIMEOUT_MS);
        if (status.state === OTA_STATE.ERROR) {
          throw new OtaError(OTA_ERR_MESSAGE[status.error] ?? 'Unknown error');
        }
        seq = status.nextSeq;

        // A window only counts as delivered if the module reports MORE bytes in
        // flash than before. Treating "no error" as progress was enough to hang
        // the transfer forever: a module replying RECEIVING/NONE with an
        // unchanged `flashed` reset the retry counter, so the same window was
        // retransmitted indefinitely with the progress bar frozen. A stall is
        // now counted exactly like a resumable error.
        const resumable = OTA_RESUMABLE_ERRS.includes(status.error);
        const stalled = status.flashed <= offset;
        if (resumable || stalled) {
          if (++retries > MAX_RETRIES) {
            throw new OtaError(
              resumable
                ? `Lost too many chunks (${OTA_ERR_MESSAGE[status.error]}). Move the ` +
                  'phone closer to the module and try again.'
                : 'The module stopped writing to flash. Move the phone closer, ' +
                  'power-cycle the module, and try again.',
            );
          }
          // The module discarded whatever it had queued; its flashed count is
          // the only truth about where to pick up.
          offset = status.flashed;
          sent = offset;
          report();
          continue;
        }

        retries = 0;
        offset = status.flashed;
        sent = offset;
        report();
      }

      // ---- 4. verify + commit ----
      setPhase('verifying');
      await writeControl(otaEnd());
      status = await nextStatus(FINISH_TIMEOUT_MS);
      if (status.state === OTA_STATE.ERROR) {
        throw new OtaError(OTA_ERR_MESSAGE[status.error] ?? 'Unknown error');
      }
      if (status.state !== OTA_STATE.DONE) {
        throw new OtaError(
          `Update did not complete: ${OTA_ERR_MESSAGE[status.error] ?? status.error}`,
        );
      }

      // ---- 5. boot the new image ----
      // The module reboots immediately, so the link drops. That disconnect is
      // success, not an error — hence the swallowed catch.
      setPhase('rebooting');
      try {
        await writeControl(otaReboot());
      } catch {
        /* expected: the module is already on its way down */
      }
      setPhase('done');
      return true;
    } catch (e) {
      phase = 'failed';
      const message = e instanceof Error ? e.message : String(e);
      report(message);
      throw e instanceof OtaError ? e : new OtaError(message);
    } finally {
      sub?.remove();
      queue.clear();
    }
  }
}
