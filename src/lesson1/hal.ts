// Piano Professor — Lesson hardware layer, ported from "Lesson 1.html" BLOCK 2.
// PianoHardware interface (the engine talks ONLY to this): connect, onNoteOn,
// onNoteOff, ledSet/ledOn/ledOff/ledOffMany/ledClear/ledEffect, chordWindowMs.
//
// ESP32-S3 BLE GATT protocol (per the spec):
//   Service   7e400001-b5a3-f393-e0a9-e50e24dcca9e
//   CHAR_KEYS 7e400002-… (Notify, board→app)  3-byte packets, parse strides of 3:
//             [0x90, midiNote, velocity] on · [0x80, midiNote, 0] off
//   CHAR_LED  7e400003-… (WriteWithoutResponse, app→board)
//             [0x01, count, (ledIndex,r,g,b)×count] · [0x02] clear ·
//             [0x03, effectId, count, ledIndex×count]
//   ledIndex = midiNote − 36 (C2=36→LED0 … B6=95→LED59); C7 has NO LED.
//   Writes coalesced per 60ms tick, LED sets chunked ≤14 per packet.

import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device, Characteristic, Subscription, State } from 'react-native-ble-plx';
import {
  noteToMidi, midiToNote, noteToLedIndex, WRONG_FLASH_MS,
  LED_LOW_MIDI, LED_HIGH_MIDI, KEY_LOW_MIDI, KEY_HIGH_MIDI,
} from './data';

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

export const BLE_IDS = {
  SERVICE: '7e400001-b5a3-f393-e0a9-e50e24dcca9e',
  CHAR_KEYS: '7e400002-b5a3-f393-e0a9-e50e24dcca9e',
  CHAR_LED: '7e400003-b5a3-f393-e0a9-e50e24dcca9e',
};
const EFFECT_ID: Record<string, number> = { redFlash: 1, pulse: 2, rainbow: 3, celebration: 4 };

const SIM_CLICK_SUSTAIN_MS = 1000; // tapped keys stay "held" this long

export interface LedEntry { note: string; r: number; g: number; b: number; }
export type LedSnapshot = Map<number, string>; // midi -> css color visible now

export interface HwStatus { state: 'idle' | 'sim' | 'connecting' | 'connected' | 'disconnected' | 'error'; detail: string; }

import { bytesToB64, b64ToBytes } from './b64';
export { bytesToB64, b64ToBytes };

/* App-side mirror of the strip — drives the on-screen LED strip in BOTH
   backends, and emulates the board-side effects (flash/pulse/rainbow). */
export class LedModel {
  base = new Map<number, [number, number, number]>();
  flashes = new Map<number, number>();
  pulses = new Set<number>();
  fx: { type: string; until: number } | null = null;
  private subs: ((snap: LedSnapshot) => void)[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  onChange(cb: (snap: LedSnapshot) => void) { this.subs.push(cb); }
  private notify() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      const snap = this.snapshot();
      this.subs.forEach((cb) => cb(snap));
      if (this.animating()) this.notify();
    }, 66);
  }
  private animating(): boolean {
    const now = Date.now();
    if (this.fx && now < this.fx.until) return true;
    if (this.pulses.size > 0) return true;
    for (const until of this.flashes.values()) if (now < until) return true;
    return false;
  }
  set(list: LedEntry[]) {
    list.forEach((l) => {
      const m = noteToMidi(l.note);
      if (noteToLedIndex(m) < 0) return; // C7 etc: silently skip
      if (l.r === 0 && l.g === 0 && l.b === 0) this.base.delete(m);
      else this.base.set(m, [l.r, l.g, l.b]);
      this.pulses.delete(m); // a SET stops the pulse
    });
    this.notify();
  }
  off(notes: string[]) {
    notes.forEach((n) => { const m = noteToMidi(n); this.base.delete(m); this.pulses.delete(m); });
    this.notify();
  }
  clear() { this.base.clear(); this.pulses.clear(); this.flashes.clear(); this.fx = null; this.notify(); }
  effect(name: string, notes: string[]) {
    const now = Date.now();
    if (name === 'redFlash') {
      notes.forEach((n) => { const m = noteToMidi(n); if (noteToLedIndex(m) >= 0) this.flashes.set(m, now + WRONG_FLASH_MS); });
    } else if (name === 'pulse') {
      notes.forEach((n) => { const m = noteToMidi(n); if (this.base.has(m)) this.pulses.add(m); });
    } else {
      this.fx = { type: name, until: now + 2000 };
    }
    this.notify();
  }
  snapshot(): LedSnapshot {
    const out: LedSnapshot = new Map();
    const now = Date.now();
    if (this.fx && now < this.fx.until) {
      for (let m = LED_LOW_MIDI; m <= LED_HIGH_MIDI; m++) {
        const hue = (((m - 36) * 7) - now / 3.5) % 360;
        out.set(m, `hsl(${((hue % 360) + 360) % 360}, 95%, 55%)`);
      }
      return out;
    }
    this.base.forEach((rgb, m) => {
      let [r, g, b] = rgb;
      if (this.pulses.has(m)) {
        const f = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(now / 150));
        r *= f; g *= f; b *= f;
      }
      out.set(m, `rgb(${r | 0},${g | 0},${b | 0})`);
    });
    this.flashes.forEach((until, m) => {
      if (now < until) out.set(m, 'rgb(255,64,64)');
      else this.flashes.delete(m);
    });
    return out;
  }
}

/* Shared backend base — event plumbing + LED mirror. Subclasses override _tx*. */
export abstract class PianoBackend {
  leds = new LedModel();
  status: HwStatus = { state: 'idle', detail: '' };
  private onCbs: ((note: string, vel: number) => void)[] = [];
  private offCbs: ((note: string) => void)[] = [];
  private statusCbs: ((s: HwStatus) => void)[] = [];

  onNoteOn(cb: (note: string, vel: number) => void) { this.onCbs.push(cb); }
  onNoteOff(cb: (note: string) => void) { this.offCbs.push(cb); }
  protected emitOn(midi: number, vel: number) {
    if (midi < KEY_LOW_MIDI || midi > KEY_HIGH_MIDI) return;
    const n = midiToNote(midi);
    this.onCbs.forEach((cb) => cb(n, vel));
  }
  protected emitOff(midi: number) {
    if (midi < KEY_LOW_MIDI || midi > KEY_HIGH_MIDI) return;
    const n = midiToNote(midi);
    this.offCbs.forEach((cb) => cb(n));
  }
  onStatus(cb: (s: HwStatus) => void) { this.statusCbs.push(cb); cb(this.status); }
  protected setStatus(state: HwStatus['state'], detail = '') {
    this.status = { state, detail };
    this.statusCbs.forEach((cb) => cb(this.status));
  }
  async connect(): Promise<void> {}
  dispose() {}
  chordWindowMs(base: number) { return base; }
  ledSet(list: LedEntry[]) { this.leds.set(list); this.txSet(list); }
  ledOn(note: string, r: number, g: number, b: number) { this.ledSet([{ note, r, g, b }]); }
  ledOff(note: string) { this.ledOffMany([note]); }
  ledOffMany(notes: string[]) { this.leds.off(notes); this.txSet(notes.map((n) => ({ note: n, r: 0, g: 0, b: 0 }))); }
  ledClear() { this.leds.clear(); this.txClear(); }
  ledEffect(effect: string, notes: string[]) { this.leds.effect(effect, notes); this.txEffect(effect, notes); }
  protected txSet(_list: LedEntry[]) {}
  protected txClear() {}
  protected txEffect(_effect: string, _notes: string[]) {}
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
  private pending = new Map<number, [number, number, number]>();
  private fxQueue: number[][] = [];
  private clearAll = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() { super(); this.setStatus('idle', 'Not connected'); }

  async connect() {
    try {
      this.setStatus('connecting', 'Checking Bluetooth…');
      await ensureBlePermissions();
      const manager = getManager();
      await waitForBluetoothOn(manager);
      this.setStatus('connecting', 'Scanning for your board…');
      const device = await new Promise<Device>((resolve, reject) => {
        const to = setTimeout(() => { manager.stopDeviceScan(); reject(new Error('No board found — is it powered on?')); }, 12000);
        manager.startDeviceScan([BLE_IDS.SERVICE], null, (err, d) => {
          if (err) { clearTimeout(to); manager.stopDeviceScan(); reject(err); return; }
          if (d) { clearTimeout(to); manager.stopDeviceScan(); resolve(d); }
        });
      });
      this.setStatus('connecting', `Connecting to ${device.name ?? 'board'}…`);
      this.device = await device.connect();
      this.device.onDisconnected(() => this.setStatus('disconnected', 'Connection lost'));
      await this.device.discoverAllServicesAndCharacteristics();
      try { await this.device.requestMTU(185); } catch { /* default MTU still fits chunks */ }
      this.keySub = this.device.monitorCharacteristicForService(
        BLE_IDS.SERVICE, BLE_IDS.CHAR_KEYS,
        (err, ch) => { if (!err && ch?.value) this.onPacket(b64ToBytes(ch.value)); },
      );
      const svcs = await this.device.services();
      const svc = svcs.find((s) => s.uuid.toLowerCase() === BLE_IDS.SERVICE);
      const chars = svc ? await svc.characteristics() : [];
      this.charLed = chars.find((c) => c.uuid.toLowerCase() === BLE_IDS.CHAR_LED) ?? null;
      this.startFlush();
      this.setStatus('connected', this.device.name ?? 'ESP32-S3');
    } catch (err: any) {
      if (this.status.state !== 'error') this.setStatus('error', err?.message ?? 'Connection failed');
      throw err;
    }
  }
  dispose() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.keySub?.remove(); this.keySub = null;
    this.device?.cancelConnection().catch(() => {});
    this.device = null;
  }
  private onPacket(bytes: number[]) {
    for (let i = 0; i + 2 < bytes.length; i += 3) {
      const st = bytes[i], note = bytes[i + 1], vel = bytes[i + 2];
      if (st === 0x90 && vel > 0) this.emitOn(note, vel);
      else if (st === 0x80 || (st === 0x90 && vel === 0)) this.emitOff(note);
    }
  }
  protected txSet(list: LedEntry[]) {
    list.forEach((l) => {
      const idx = noteToLedIndex(noteToMidi(l.note));
      if (idx < 0) return; // C7: silently skip
      this.pending.set(idx, [l.r, l.g, l.b]);
    });
  }
  protected txClear() { this.pending.clear(); this.clearAll = true; }
  protected txEffect(effect: string, notes: string[]) {
    const id = EFFECT_ID[effect];
    if (!id) return;
    const idxs = notes.map((n) => noteToLedIndex(noteToMidi(n))).filter((i) => i >= 0);
    if (!idxs.length && effect !== 'rainbow' && effect !== 'celebration') return;
    this.fxQueue.push([0x03, id, idxs.length, ...idxs]);
  }
  private startFlush() { if (!this.timer) this.timer = setInterval(() => { void this.flush(); }, 60); }
  private async flush() {
    if (!this.charLed || !this.device) return;
    try {
      if (this.clearAll) { this.clearAll = false; await this.write([0x02]); }
      while (this.fxQueue.length) await this.write(this.fxQueue.shift()!);
      if (this.pending.size) {
        const entries = [...this.pending];
        this.pending.clear();
        for (let i = 0; i < entries.length; i += 14) {
          const chunk = entries.slice(i, i + 14);
          const bytes = [0x01, chunk.length];
          chunk.forEach(([idx, rgb]) => bytes.push(idx, rgb[0], rgb[1], rgb[2]));
          await this.write(bytes);
        }
      }
    } catch { /* dropped write — next engine command refreshes state */ }
  }
  private write(bytes: number[]) {
    return this.charLed!.writeWithoutResponse(bytesToB64(bytes));
  }
}

export type HwMode = 'sim' | 'ble';

/* HW facade — swaps backends behind stable listeners. */
export class HwFacade {
  backend: PianoBackend = new SimulatorPiano();
  mode: HwMode = 'sim';
  private on: ((n: string, v: number) => void)[] = [];
  private off: ((n: string) => void)[] = [];
  private statusCbs: ((s: HwStatus) => void)[] = [];
  private ledCbs: ((snap: LedSnapshot) => void)[] = [];

  constructor() { this.wire(); }
  private wire() {
    this.backend.onNoteOn((n, v) => this.on.forEach((cb) => cb(n, v)));
    this.backend.onNoteOff((n) => this.off.forEach((cb) => cb(n)));
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
  onNoteOn(cb: (n: string, v: number) => void) { this.on.push(cb); }
  onNoteOff(cb: (n: string) => void) { this.off.push(cb); }
  onStatus(cb: (s: HwStatus) => void) { this.statusCbs.push(cb); cb(this.backend.status); }
  onLed(cb: (snap: LedSnapshot) => void) { this.ledCbs.push(cb); cb(this.backend.leds.snapshot()); }
  ledSet(l: LedEntry[]) { this.backend.ledSet(l); }
  ledOn(n: string, r: number, g: number, b: number) { this.backend.ledOn(n, r, g, b); }
  ledOff(n: string) { this.backend.ledOff(n); }
  ledOffMany(ns: string[]) { this.backend.ledOffMany(ns); }
  ledClear() { this.backend.ledClear(); }
  ledEffect(e: string, ns: string[]) { this.backend.ledEffect(e, ns); }
  chordWindowMs(b: number) { return this.backend.chordWindowMs(b); }
  dispose() { try { this.backend.ledClear(); this.backend.dispose(); } catch { /* ignore */ } }
}
