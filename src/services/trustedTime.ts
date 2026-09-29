// Piano Professor — trusted time. One clock for the whole reward economy.
//
// THREAT: every streak day, quest set, daily chest and heart refill is worth
// currency, and all of them used to come from `Date.now()`. Moving the device
// clock forward a day farmed streaks + quests + gems and instantly refilled
// hearts; moving it backward reset an honest learner's streak.
//
// DEFENCE (three independent layers, so no single trick wins):
//   1. MONOTONIC ELAPSED — within a session, elapsed time comes from
//      `performance.now()`, which the OS clock cannot move. Changing the clock
//      while the app is backgrounded (the realistic attack) cannot fabricate
//      elapsed time.
//   2. FORWARD-ONLY RATCHET — the resolved timestamp and the day key can never
//      travel backward, so rolling the clock back is inert (and an honest
//      westward flight no longer resets the streak).
//   3. TAMPER DEFERRAL — when the device clock disagrees with monotonic elapsed
//      (a live tamper signal), day-boundary rewards (streak, quests, chest) are
//      HELD until a network anchor confirms the real date. Lessons still play
//      and still award XP, so an honest learner never notices.
// When online we re-anchor to network time, which corrects any accumulated drift.
//
// KNOWN RESIDUAL RISK (deliberate): app killed → clock moved → relaunched while
// OFFLINE loses the monotonic anchor, and no client can distinguish that from a
// user who was simply away for a week. Closing it fully needs a
// server-authoritative economy, which would break offline play. Everything that
// matters for monetization (heart refills) is clamped by real elapsed time and
// is safe regardless.
//
// The exported core is pure so clock-jump scenarios are unit-testable; the
// stateful wrapper at the bottom owns persistence.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE_KEY = 'pp.trustedtime.v1';

/** Device-clock drift beyond this (vs monotonic) marks the session suspicious. */
export const SUSPICIOUS_DRIFT_MS = 6 * 60 * 60 * 1000;
/** A network anchor is considered fresh for this long. */
export const ANCHOR_FRESH_MS = 24 * 60 * 60 * 1000;

export interface TimeAnchor {
  /** Best-known real UTC at the moment of anchoring. */
  utc: number;
  /** Monotonic reading at anchor time, or null if from a previous session. */
  mono: number | null;
  /** `Date.now()` at anchor time — used to derive an offset across restarts. */
  device: number;
  /** True when this anchor came from the network (not the device clock). */
  trusted: boolean;
}

export interface TimeState {
  anchor: TimeAnchor;
  /** Highest timestamp ever resolved — the forward-only ratchet. */
  highWater: number;
  /** Highest day key ever resolved (YYYY-MM-DD). */
  maxDayKey: string;
}

export interface TimeReading {
  now: number;
  /** Device clock disagrees with monotonic elapsed — treat rewards carefully. */
  suspicious: boolean;
  /** Signed device-vs-monotonic drift (ms); 0 when it cannot be measured. */
  driftMs: number;
}

/**
 * Resolve "now" from an anchor. Pure.
 *
 * Same session (anchor.mono set): elapsed comes from the monotonic clock, so
 * the result is immune to clock changes and we can *measure* tampering as the
 * drift between the device clock and monotonic elapsed.
 * Across restarts: fall back to the device clock plus the anchor's offset.
 * Either way the high-water ratchet forbids going backward.
 */
export function resolveNow(
  state: TimeState, deviceNow: number, mono: number | null,
): TimeReading {
  const { anchor } = state;
  let now: number;
  let driftMs = 0;

  if (anchor.mono != null && mono != null) {
    const elapsed = Math.max(0, mono - anchor.mono);
    now = anchor.utc + elapsed;
    driftMs = deviceNow - (anchor.device + elapsed);
  } else {
    now = deviceNow + (anchor.utc - anchor.device);
  }

  const suspicious = Math.abs(driftMs) > SUSPICIOUS_DRIFT_MS;
  // Forward-only: time never travels backward, whatever the clock says.
  return { now: Math.max(now, state.highWater), suspicious, driftMs };
}

/** Local YYYY-MM-DD for a UTC timestamp (local fields, never toISOString). */
export function dayKeyOf(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Ratchet the day key forward only. Pure.
 * A candidate day earlier than the max is ignored (clock rollback / westward
 * travel), so a streak can never be broken by moving the clock back.
 */
export function ratchetDayKey(maxDayKey: string, candidate: string): string {
  return candidate > maxDayKey ? candidate : maxDayKey;
}

// ── stateful wrapper ────────────────────────────────────────────────────────

/** Monotonic ms; `performance.now()` where available, else null (no monotonic). */
function monoNow(): number | null {
  const p = (globalThis as { performance?: { now?: () => number } }).performance;
  return typeof p?.now === 'function' ? p.now() : null;
}

function freshState(deviceNow: number, mono: number | null): TimeState {
  return {
    anchor: { utc: deviceNow, mono, device: deviceNow, trusted: false },
    highWater: deviceNow,
    maxDayKey: dayKeyOf(deviceNow),
  };
}

let state: TimeState | null = null;
let sessionStartMono: number | null = null;
let loaded = false;

/** Load persisted anchors. Safe to call repeatedly. */
export async function initTrustedTime(): Promise<void> {
  if (loaded) return;
  loaded = true;
  sessionStartMono = monoNow();
  const device = Date.now();
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as TimeState;
      if (p?.anchor && typeof p.highWater === 'number' && p.maxDayKey) {
        // A restored anchor has no monotonic reading in this JS context.
        state = { ...p, anchor: { ...p.anchor, mono: null } };
        return;
      }
    }
  } catch {
    /* fall through to a fresh anchor */
  }
  state = freshState(device, sessionStartMono);
}

async function persist(): Promise<void> {
  if (!state) return;
  try {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* best effort */
  }
}

function ensure(): TimeState {
  if (!state) state = freshState(Date.now(), monoNow());
  return state;
}

/** Current best-known UTC (forward-only). */
export function now(): number {
  const s = ensure();
  const r = resolveNow(s, Date.now(), monoNow());
  if (r.now > s.highWater) {
    s.highWater = r.now;
    void persist();
  }
  return r.now;
}

/** Whether the device clock looks tampered with this session. */
export function isSuspicious(): boolean {
  const s = ensure();
  return resolveNow(s, Date.now(), monoNow()).suspicious;
}

/** Today's local day key, ratcheted forward-only. */
export function todayKey(): string {
  const s = ensure();
  const candidate = dayKeyOf(now());
  const next = ratchetDayKey(s.maxDayKey, candidate);
  if (next !== s.maxDayKey) {
    s.maxDayKey = next;
    void persist();
  }
  return next;
}

/** Monotonic elapsed since this session started, or null without a monotonic clock. */
export function sessionElapsed(): number | null {
  const m = monoNow();
  return m != null && sessionStartMono != null ? Math.max(0, m - sessionStartMono) : null;
}

/** True when the last network anchor is recent enough to trust day boundaries. */
export function hasFreshAnchor(): boolean {
  const s = ensure();
  return s.anchor.trusted && now() - s.anchor.utc < ANCHOR_FRESH_MS;
}

/**
 * Re-anchor to network time using an HTTPS `Date` response header — no API key,
 * no payload, and it corrects any drift the device clock introduced. Failure is
 * silent: the app keeps running on the monotonic anchor.
 */
export async function syncFromNetwork(url = 'https://www.google.com/generate_204'): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal });
    clearTimeout(timer);
    const header = res.headers.get('date');
    if (!header) return false;
    const utc = Date.parse(header);
    if (!Number.isFinite(utc)) return false;
    const s = ensure();
    s.anchor = { utc, mono: monoNow(), device: Date.now(), trusted: true };
    // Network time is authoritative: it OVERRIDES the ratchet in both
    // directions, so a high-water mark or day key inflated by a forward clock
    // jump is corrected back to reality rather than being locked in forever.
    s.highWater = utc;
    s.maxDayKey = dayKeyOf(utc);
    await persist();
    return true;
  } catch {
    return false;
  }
}

/** Test-only: reset module state. */
export function __resetForTest(): void {
  state = null;
  sessionStartMono = null;
  loaded = false;
}
