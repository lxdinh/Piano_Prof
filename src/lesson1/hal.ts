// Piano Professor — Lesson hardware layer, ported from "Lesson 1.html" BLOCK 2.
// PianoHardware interface (the engine talks ONLY to this): connect, onNoteOn,
// onNoteOff, ledSet/ledOn/ledOff/ledOffMany/ledClear/ledEffect, chordWindowMs.
//
// BLE GATT: the contract lives in src/ble/constants + src/ble/protocol, which
// track the SHIPPING ESP32-S3 firmware (firmware/controller). Summary:
//   Service     f0a1d2c3-0001-… — LEDs + note events
//   LED command f0a1d2c3-0002-… (write)   SET_MULTI frames, drawn immediately
//   Note event  f0a1d2c3-0003-… (notify)  [type, midiNote, velocity, source]
//   Status      f0a1d2c3-0004-… (read)    [ledCount, fwMajor, fwMinor, source]
//   OTA service f0a1d2c3-0010-… — present alone when the board is in recovery
//   ledIndex = midiNote − 36 (C2=36→LED0 … B6=95→LED59); C7 has NO LED.
//   Writes coalesced per 40ms tick and split to the negotiated MTU.

import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device, Characteristic, Subscription, State } from 'react-native-ble-plx';
import {
  BLE_SERVICE_UUID, BLE_CHAR_LED_CMD, BLE_CHAR_NOTE_EVENT,
  BLE_CHAR_DEVICE_STATUS, BLE_OTA_SERVICE_UUID,
} from '../ble/constants';
import {
  cmdSetMultiChunked, cmdSetBrightness,
  parseNoteEvent, parseDeviceStatus, DeviceStatus,
} from '../ble/protocol';
import { base64ToBytes, bytesToBase64 } from '../ble/base64';
import {
  noteToMidi, midiToNote, noteToLedIndex, WRONG_FLASH_MS,
  LED_LOW_MIDI, LED_HIGH_MIDI, KEY_LOW_MIDI, KEY_HIGH_MIDI,
} from './data';

import { bytesToB64, b64ToBytes } from './b64';

/* Android runtime BLE permissions. The manifest declares them, but Android 12+
   (API 31) requires BLUETOOTH_SCAN/CONNECT to be granted at runtime, and every
   Android version needs FINE_LOCATION for a BLE scan (our manifest doesn't opt
   out with neverForLocation). Without this, startDeviceScan fails on the first
   connect. iOS prompts automatically from the Info.plist usage strings. */
async function ensureBlePermissions(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const api = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);
  const P = PermissionsAndroid.PERMISSIONS;
  const wanted = api >= 31
    ? [P.BLUETOOTH_SCAN, P.BLUETOOTH_CONNECT, P.ACCESS_FINE_LOCATION]
    : [P.ACCESS_FINE_LOCATION];
  const res = await PermissionsAndroid.requestMultiple(wanted);
  const denied = wanted.filter((p) => res[p] !== PermissionsAndroid.RESULTS.GRANTED);
  if (denied.length) {
    throw new Error('Bluetooth permission is off — allow it in Settings, then reconnect.');
  }
}

/* Wait until the adapter is powered on (it may still be initialising right
   after launch, or be switched off). Rejects with a clear message if BT is off. */
function waitForBluetoothOn(manager: BleManager, timeoutMs = 6000): Promise<void> {
  return new Promise((resolve, reject) => {
    let sub: Subscription | null = null;
    const to = setTimeout(() => { sub?.remove(); reject(new Error('Bluetooth is off — turn it on to connect.')); }, timeoutMs);
    sub = manager.onStateChange((state) => {
      if (state === State.PoweredOn) { clearTimeout(to); sub?.remove(); resolve(); }
      else if (state === State.PoweredOff || state === State.Unauthorized) {
        clearTimeout(to); sub?.remove();
        reject(new Error(state === State.Unauthorized ? 'Bluetooth permission is off — allow it in Settings.' : 'Bluetooth is off — turn it on to connect.'));
      }
    }, true); // emitCurrentState: fires immediately with the present state
  });
}

/**
 * GATT ids re-exported from the single source of truth (src/ble/constants),
 * which tracks the SHIPPING firmware.
 *
 * These replaced a `7e4000xx` set invented from a spec document that no board
 * ever implemented. Worse than merely different: that set had the two
 * characteristic roles INVERTED — `…0002…` was treated as key-notify and
 * `…0003…` as the LED write, whereas the real firmware uses `…0002…` for LED
 * commands and `…0003…` for note events. Anything built against the old ids
 * could not talk to real hardware at all.
 */
export const BLE_IDS = {
  SERVICE: BLE_SERVICE_UUID,
  CHAR_LED: BLE_CHAR_LED_CMD,      // app → board (write, LED command frames)
  CHAR_NOTES: BLE_CHAR_NOTE_EVENT, // board → app (notify, key presses)
  CHAR_STATUS: BLE_CHAR_DEVICE_STATUS,
  OTA_SERVICE: BLE_OTA_SERVICE_UUID,
};

const SIM_CLICK_SUSTAIN_MS = 1000; // tapped keys stay "held" this long

export interface LedEntry { note: string; r: number; g: number; b: number; }
export type LedSnapshot = Map<number, string>; // midi -> css color visible now

/** 'recovery' = the board is running the factory image and needs firmware. */
export interface HwStatus { state: 'idle' | 'sim' | 'connecting' | 'connected' | 'recovery' | 'disconnected' | 'error'; detail: string; }
export { bytesToB64, b64ToBytes };

type RGB3 = [number, number, number];

// Attack/release envelope — LEDs ramp on/off gradually (teaches note length +
// when to lift) rather than snapping. Brightness carries intended dynamics: the
// caller sends a dimmer colour for a soft note, brighter for a loud one.
const ATTACK_MS = 120;
const RELEASE_MS = 220;

interface Lamp { rgb: RGB3; goal: 0 | 1; since: number; levelAt: number; }

function hslToRgb(h: number, s: number, l: number): RGB3 {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/* App-side mirror of the strip — the single source of truth for what the strip
   shows. Emits ~25 fps frames that drive BOTH the on-screen strip (css) and the
   real board over BLE (numeric), so fades + brightness appear on the hardware. */
export class LedModel {
  private lamps = new Map<number, Lamp>();
  flashes = new Map<number, number>();
  pulses = new Set<number>();
  fx: { type: string; until: number } | null = null;
  private master = 1; // global brightness 0..1 (LED settings)
  private subs: ((snap: LedSnapshot) => void)[] = [];
  private frameSubs: ((rgb: Map<number, RGB3>) => void)[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  onChange(cb: (snap: LedSnapshot) => void) { this.subs.push(cb); }
  onFrame(cb: (rgb: Map<number, RGB3>) => void) { this.frameSubs.push(cb); }
  setBrightness(v: number) { this.master = Math.max(0, Math.min(1, v)); this.notify(); }

  private level(l: Lamp, now: number): number {
    const e = now - l.since;
    return l.goal === 1 ? Math.min(1, l.levelAt + e / ATTACK_MS) : Math.max(0, l.levelAt - e / RELEASE_MS);
  }
  private notify() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      const rgb = this.snapshotRgb();
      const css: LedSnapshot = new Map();
      rgb.forEach((c, m) => css.set(m, `rgb(${c[0]},${c[1]},${c[2]})`));
      this.subs.forEach((cb) => cb(css));
      this.frameSubs.forEach((cb) => cb(rgb));
      if (this.animating()) this.notify();
    }, 40);
  }
  private animating(): boolean {
    const now = Date.now();
    if (this.fx && now < this.fx.until) return true;
    if (this.pulses.size > 0) return true;
    for (const until of this.flashes.values()) if (now < until) return true;
    for (const l of this.lamps.values()) {
      const lv = this.level(l, now);
      if (l.goal === 1 ? lv < 1 : lv > 0) return true;
    }
    return false;
  }
  private startOff(m: number, now: number) {
    const cur = this.lamps.get(m);
    if (!cur) return;
    this.lamps.set(m, { ...cur, goal: 0, since: now, levelAt: this.level(cur, now) });
    this.pulses.delete(m);
  }
  set(list: LedEntry[]) {
    const now = Date.now();
    list.forEach((l) => {
      const m = noteToMidi(l.note);
      if (noteToLedIndex(m) < 0) return; // C7 etc: silently skip
      if (l.r === 0 && l.g === 0 && l.b === 0) { this.startOff(m, now); return; }
      const cur = this.lamps.get(m);
      this.lamps.set(m, { rgb: [l.r, l.g, l.b], goal: 1, since: now, levelAt: cur ? this.level(cur, now) : 0 });
      this.pulses.delete(m); // a SET stops the pulse
    });
    this.notify();
  }
  off(notes: string[]) {
    const now = Date.now();
    notes.forEach((n) => this.startOff(noteToMidi(n), now));
    this.notify();
  }
  clear() { this.lamps.clear(); this.pulses.clear(); this.flashes.clear(); this.fx = null; this.notify(); }
  effect(name: string, notes: string[]) {
    const now = Date.now();
    if (name === 'redFlash') {
      notes.forEach((n) => { const m = noteToMidi(n); if (noteToLedIndex(m) >= 0) this.flashes.set(m, now + WRONG_FLASH_MS); });
    } else if (name === 'pulse') {
      notes.forEach((n) => { const m = noteToMidi(n); if (this.lamps.has(m)) this.pulses.add(m); });
    } else {
      this.fx = { type: name, until: now + 2000 };
    }
    this.notify();
  }
  /** Numeric enveloped frame (drives BLE). */
  snapshotRgb(): Map<number, RGB3> {
    const out = new Map<number, RGB3>();
    const now = Date.now();
    if (this.fx && now < this.fx.until) {
      for (let m = LED_LOW_MIDI; m <= LED_HIGH_MIDI; m++) {
        const hue = ((((m - 36) * 7) - now / 3.5) % 360 + 360) % 360;
        const [r, g, b] = hslToRgb(hue, 0.95, 0.55);
        out.set(m, [Math.round(r * this.master), Math.round(g * this.master), Math.round(b * this.master)]);
      }
      return out;
    }
    this.lamps.forEach((l, m) => {
      let lv = this.level(l, now);
      if (lv <= 0 && l.goal === 0) { this.lamps.delete(m); return; }
      if (this.pulses.has(m)) lv *= 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(now / 150));
      const k = lv * this.master;
      out.set(m, [Math.round(l.rgb[0] * k), Math.round(l.rgb[1] * k), Math.round(l.rgb[2] * k)]);
    });
    this.flashes.forEach((until, m) => {
      if (now < until) out.set(m, [255, 64, 64]);
      else this.flashes.delete(m);
    });
    return out;
  }
  /** Css frame (drives the on-screen strip). */
  snapshot(): LedSnapshot {
    const out: LedSnapshot = new Map();
    this.snapshotRgb().forEach((c, m) => out.set(m, `rgb(${c[0]},${c[1]},${c[2]})`));
    return out;
  }
}

/* Shared backend base — event plumbing + LED mirror. Subclasses override _tx*.
   Note events carry velocity (how hard) and a timestamp; note-off also carries
   the hold duration, so the engine can grade dynamics, timing, and note length.
   Extra callback args are ignored by older `(note) => …` listeners. */
export type NoteOnCb = (note: string, vel: number, t: number) => void;
export type NoteOffCb = (note: string, relVel: number, t: number, durationMs: number) => void;
export type PedalCb = (down: boolean) => void;

export abstract class PianoBackend {
  leds = new LedModel();
  status: HwStatus = { state: 'idle', detail: '' };
  private onCbs: NoteOnCb[] = [];
  private offCbs: NoteOffCb[] = [];
  private pedalCbs: PedalCb[] = [];
  private statusCbs: ((s: HwStatus) => void)[] = [];
  private onset = new Map<number, number>(); // midi → note-on time (for duration)

  constructor() {
    // Every enveloped frame drives the hardware (subclass sends it to BLE).
    this.leds.onFrame((rgb) => this.txFrame(rgb));
  }

  onNoteOn(cb: NoteOnCb) { this.onCbs.push(cb); }
  onNoteOff(cb: NoteOffCb) { this.offCbs.push(cb); }
  onPedal(cb: PedalCb) { this.pedalCbs.push(cb); }
  protected emitOn(midi: number, vel: number) {
    if (midi < KEY_LOW_MIDI || midi > KEY_HIGH_MIDI) return;
    const t = Date.now();
    this.onset.set(midi, t);
    const n = midiToNote(midi);
    this.onCbs.forEach((cb) => cb(n, vel, t));
  }
  protected emitOff(midi: number, relVel = 0) {
    if (midi < KEY_LOW_MIDI || midi > KEY_HIGH_MIDI) return;
    const t = Date.now();
    const on = this.onset.get(midi);
    const durationMs = on != null ? t - on : 0;
    this.onset.delete(midi);
    const n = midiToNote(midi);
    this.offCbs.forEach((cb) => cb(n, relVel, t, durationMs));
  }
  protected emitPedal(down: boolean) { this.pedalCbs.forEach((cb) => cb(down)); }
  onStatus(cb: (s: HwStatus) => void) { this.statusCbs.push(cb); cb(this.status); }
  protected setStatus(state: HwStatus['state'], detail = '') {
    this.status = { state, detail };
    this.statusCbs.forEach((cb) => cb(this.status));
  }
  async connect(): Promise<void> {}
  dispose() {}
  chordWindowMs(base: number) { return base; }
  // LED commands only update the model; its frames (with the fade envelope) are
  // what actually get sent to the strip, via txFrame.
  ledSet(list: LedEntry[]) { this.leds.set(list); }
  ledOn(note: string, r: number, g: number, b: number) { this.ledSet([{ note, r, g, b }]); }
  ledOff(note: string) { this.ledOffMany([note]); }
  ledOffMany(notes: string[]) { this.leds.off(notes); }
  ledClear() { this.leds.clear(); }
  ledEffect(effect: string, notes: string[]) { this.leds.effect(effect, notes); }
  setBrightness(v: number) { this.leds.setBrightness(v); }
  /** Send one enveloped frame (midi → rgb) to the board. Sim backend: no-op. */
  protected txFrame(_frame: Map<number, [number, number, number]>) {}
}

/* SimulatorPiano — on-screen board, no hardware needed.
   tap: press now, auto-release after 1s (sequential taps build chords);
   hold (pressIn/pressOut): true held keys — multi-touch chords work. */
export class SimulatorPiano extends PianoBackend {
  private held = new Map<number, { downAt: number; timer: ReturnType<typeof setTimeout> | null }>();
  constructor() { super(); this.setStatus('sim', 'Simulator — tap the keys'); }
  async connect() { this.setStatus('sim', 'Simulator ready'); }
  press(midi: number) {
    if (midi < KEY_LOW_MIDI || midi > KEY_HIGH_MIDI) return;
    const rec = this.held.get(midi);
    if (rec) { if (rec.timer) clearTimeout(rec.timer); this.held.delete(midi); this.emitOff(midi); }
    this.emitOn(midi, 100);
    this.held.set(midi, { downAt: Date.now(), timer: setTimeout(() => this.release(midi), SIM_CLICK_SUSTAIN_MS) });
  }
  keyDown(midi: number) {
    if (midi < KEY_LOW_MIDI || midi > KEY_HIGH_MIDI || this.held.has(midi)) return;
    this.emitOn(midi, 100);
    this.held.set(midi, { downAt: Date.now(), timer: null });
  }
  keyUp(midi: number) {
    const rec = this.held.get(midi);
    if (!rec) return;
    const elapsed = Date.now() - rec.downAt;
    const wait = Math.max(0, SIM_CLICK_SUSTAIN_MS - elapsed);
    if (rec.timer) clearTimeout(rec.timer);
    rec.timer = setTimeout(() => this.release(midi), wait);
  }
  release(midi: number) {
    const rec = this.held.get(midi);
    if (!rec) return;
    if (rec.timer) clearTimeout(rec.timer);
    this.held.delete(midi);
    this.emitOff(midi);
  }
  dispose() { [...this.held.keys()].forEach((m) => this.release(m)); }
}

/* BLEPiano — the real ESP32-S3 board over react-native-ble-plx. */
let sharedManager: BleManager | null = null;
function getManager(): BleManager {
  if (!sharedManager) sharedManager = new BleManager();
  return sharedManager;
}

export class BLEPiano extends PianoBackend {
  private device: Device | null = null;
  private charLed: Characteristic | null = null;
  private keySub: Subscription | null = null;
  private pending = new Map<number, [number, number, number]>(); // ledIndex → rgb to send
  private lastSent = new Map<number, string>(); // ledIndex → last rgb sent (diffing)
  private timer: ReturnType<typeof setInterval> | null = null;
  private recovery = false;
  private deviceStatus: DeviceStatus | null = null;

  constructor() { super(); this.setStatus('idle', 'Not connected'); }

  async connect() {
    try {
      this.setStatus('connecting', 'Checking Bluetooth…');
      await ensureBlePermissions();
      const manager = getManager();
      await waitForBluetoothOn(manager);
      this.setStatus('connecting', 'Scanning for your board…');
      // Scan for BOTH services. A board in recovery advertises only the OTA
      // service — filtering on the main service alone would make exactly the
      // boards that need new firmware invisible.
      const device = await new Promise<Device>((resolve, reject) => {
        const to = setTimeout(() => { manager.stopDeviceScan(); reject(new Error('No board found — is it powered on?')); }, 12000);
        manager.startDeviceScan([BLE_IDS.SERVICE, BLE_IDS.OTA_SERVICE], null, (err, d) => {
          if (err) { clearTimeout(to); manager.stopDeviceScan(); reject(err); return; }
          if (d) { clearTimeout(to); manager.stopDeviceScan(); resolve(d); }
        });
      });
      this.setStatus('connecting', `Connecting to ${device.name ?? 'board'}…`);
      this.device = await device.connect();
      this.device.onDisconnected(() => this.setStatus('disconnected', 'Connection lost'));
      await this.device.discoverAllServicesAndCharacteristics();
      try { await this.device.requestMTU(185); } catch { /* default MTU still fits chunks */ }

      const svcs = await this.device.services();
      const has = (uuid: string) => svcs.some((s) => s.uuid.toLowerCase() === uuid.toLowerCase());

      // Recovery mode is a legitimate state, not a failure: the factory image
      // has no LEDs and no note events until real firmware is pushed to it.
      if (!has(BLE_IDS.SERVICE) && has(BLE_IDS.OTA_SERVICE)) {
        this.recovery = true;
        this.setStatus('recovery', this.device.name ?? 'Module needs firmware');
        return;
      }
      this.recovery = false;

      this.keySub = this.device.monitorCharacteristicForService(
        BLE_IDS.SERVICE, BLE_IDS.CHAR_NOTES,
        (err, ch) => { if (!err && ch?.value) this.onNoteFrame(base64ToBytes(ch.value)); },
      );
      const svc = svcs.find((s) => s.uuid.toLowerCase() === BLE_IDS.SERVICE.toLowerCase());
      const chars = svc ? await svc.characteristics() : [];
      this.charLed = chars.find((c) => c.uuid.toLowerCase() === BLE_IDS.CHAR_LED.toLowerCase()) ?? null;

      // Ask the board how many LEDs it drives and what firmware it runs.
      try {
        const st = await this.device.readCharacteristicForService(BLE_IDS.SERVICE, BLE_IDS.CHAR_STATUS);
        if (st?.value) this.deviceStatus = parseDeviceStatus(base64ToBytes(st.value));
      } catch { /* older firmware may not expose status — defaults are fine */ }

      this.startFlush();
      const fw = this.deviceStatus ? ` · fw ${this.deviceStatus.firmware}` : '';
      this.setStatus('connected', `${this.device.name ?? 'Piano-Prof'}${fw}`);
    } catch (err: any) {
      if (this.status.state !== 'error') this.setStatus('error', err?.message ?? 'Connection failed');
      throw err;
    }
  }

  /** The connected board, so the firmware-update screen can drive OTA on it. */
  get bleDevice(): Device | null { return this.device; }
  get isRecovery(): boolean { return this.recovery; }
  get status_(): DeviceStatus | null { return this.deviceStatus; }
  dispose() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.keySub?.remove(); this.keySub = null;
    this.device?.cancelConnection().catch(() => {});
    this.device = null;
  }
  /**
   * Note events arrive as the firmware's 4-byte frame
   * `[type(0=off,1=on), midiNote, velocity, source]` — NOT raw MIDI. Velocity
   * and hold duration still reach the grader, because PianoBackend timestamps
   * emitOn/emitOff itself. The board sends no sustain-pedal event, so the
   * pedal stays up until the firmware grows CC64 support.
   */
  private onNoteFrame(bytes: Uint8Array) {
    const ev = parseNoteEvent(bytes);
    if (!ev) return;
    if (ev.on && ev.velocity > 0) this.emitOn(ev.midiNote, ev.velocity);
    else this.emitOff(ev.midiNote, ev.velocity);
  }
  // Diff each enveloped frame against what the strip is currently showing and
  // queue only the LEDs that changed (LEDs that dropped out are set to black).
  protected txFrame(frame: Map<number, [number, number, number]>) {
    const seen = new Set<number>();
    frame.forEach((rgb, midi) => {
      const idx = noteToLedIndex(midi);
      if (idx < 0) return;
      seen.add(idx);
      const key = `${rgb[0]},${rgb[1]},${rgb[2]}`;
      if (this.lastSent.get(idx) !== key) { this.pending.set(idx, rgb); this.lastSent.set(idx, key); }
    });
    for (const idx of [...this.lastSent.keys()]) {
      if (!seen.has(idx)) { this.pending.set(idx, [0, 0, 0]); this.lastSent.delete(idx); }
    }
  }
  private startFlush() { if (!this.timer) this.timer = setInterval(() => { void this.flush(); }, 40); }
  private async flush() {
    if (!this.charLed || !this.device || !this.pending.size) return;
    try {
      const entries = [...this.pending];
      this.pending.clear();
      // SET_MULTI frames, split to the negotiated MTU. The firmware draws on
      // every write, so there is no commit step.
      const mtu = this.device.mtu ?? 23;
      const frames = cmdSetMultiChunked(
        entries.map(([index, rgb]) => ({ index, rgb })), mtu,
      );
      for (const f of frames) {
        // eslint-disable-next-line no-await-in-loop
        await this.write(f);
      }
    } catch { /* dropped write — the next frame refreshes state */ }
  }
  /** Board-side brightness (0..255), mirroring the LED-settings slider. */
  async setDeviceBrightness(level: number) {
    if (!this.charLed) return;
    try { await this.write(cmdSetBrightness(level)); } catch { /* ignore */ }
  }
  private write(bytes: Uint8Array) {
    if (!bytes.length) return Promise.resolve(null); // cmdCommit() is a no-op frame
    return this.charLed!.writeWithoutResponse(bytesToBase64(bytes));
  }
}

export type HwMode = 'sim' | 'ble';

/** Detach a listener. Returned by every HwFacade `on*` subscription. */
export type Unsubscribe = () => void;

function subscribe<T>(list: T[], cb: T): Unsubscribe {
  list.push(cb);
  return () => {
    const i = list.indexOf(cb);
    if (i >= 0) list.splice(i, 1);
  };
}

/* HW facade — swaps backends behind stable listeners.
   The facade outlives the screens (it is owned by HardwareProvider), so every
   subscription hands back an unsubscribe: a screen that mounts twice used to
   leave its old callbacks attached forever, double-handling every note. */
export class HwFacade {
  backend: PianoBackend = new SimulatorPiano();
  mode: HwMode = 'sim';
  private on: NoteOnCb[] = [];
  private off: NoteOffCb[] = [];
  private pedalCbs: PedalCb[] = [];
  private statusCbs: ((s: HwStatus) => void)[] = [];
  private ledCbs: ((snap: LedSnapshot) => void)[] = [];

  constructor() { this.wire(); }
  private wire() {
    this.backend.onNoteOn((n, v, t) => this.on.forEach((cb) => cb(n, v, t)));
    this.backend.onNoteOff((n, rv, t, d) => this.off.forEach((cb) => cb(n, rv, t, d)));
    this.backend.onPedal((down) => this.pedalCbs.forEach((cb) => cb(down)));
    this.backend.onStatus((s) => this.statusCbs.forEach((cb) => cb(s)));
    this.backend.leds.onChange((snap) => this.ledCbs.forEach((cb) => cb(snap)));
  }
  setMode(mode: HwMode) {
    try { this.backend.ledClear(); this.backend.dispose(); } catch { /* ignore */ }
    this.mode = mode;
    this.backend = mode === 'ble' ? new BLEPiano() : new SimulatorPiano();
    this.wire();
    this.ledCbs.forEach((cb) => cb(this.backend.leds.snapshot()));
  }
  connect() { return this.backend.connect(); }
  onNoteOn(cb: NoteOnCb): Unsubscribe { return subscribe(this.on, cb); }
  onNoteOff(cb: NoteOffCb): Unsubscribe { return subscribe(this.off, cb); }
  onPedal(cb: PedalCb): Unsubscribe { return subscribe(this.pedalCbs, cb); }
  onStatus(cb: (s: HwStatus) => void): Unsubscribe {
    const off = subscribe(this.statusCbs, cb);
    cb(this.backend.status);
    return off;
  }
  onLed(cb: (snap: LedSnapshot) => void): Unsubscribe {
    const off = subscribe(this.ledCbs, cb);
    cb(this.backend.leds.snapshot());
    return off;
  }
  ledSet(l: LedEntry[]) { this.backend.ledSet(l); }
  ledOn(n: string, r: number, g: number, b: number) { this.backend.ledOn(n, r, g, b); }
  ledOff(n: string) { this.backend.ledOff(n); }
  ledOffMany(ns: string[]) { this.backend.ledOffMany(ns); }
  ledClear() { this.backend.ledClear(); }
  ledEffect(e: string, ns: string[]) { this.backend.ledEffect(e, ns); }
  setBrightness(v: number) { this.backend.setBrightness(v); }
  /** The live BLE device (null on the simulator) — used by the OTA screen. */
  get bleDevice(): Device | null {
    return this.backend instanceof BLEPiano ? this.backend.bleDevice : null;
  }
  /** True when the connected board runs only the factory recovery image. */
  get isRecovery(): boolean {
    return this.backend instanceof BLEPiano && this.backend.isRecovery;
  }
  chordWindowMs(b: number) { return this.backend.chordWindowMs(b); }
  dispose() { try { this.backend.ledClear(); this.backend.dispose(); } catch { /* ignore */ } }
}
