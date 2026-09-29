// Local-timezone date helpers.
//
// IMPORTANT: never use `new Date().toISOString().slice(0,10)` for "today" —
// toISOString() is UTC, so in the evening (west of UTC) it already reports
// tomorrow, corrupting streak math. Always build the key from local fields.
//
// "Today" with no argument comes from the TRUSTED clock (services/trustedTime),
// which is forward-only and monotonic-backed, so the reward economy cannot be
// farmed by changing the device clock. Passing an explicit Date keeps these
// helpers pure — every caller in data/* accepts an injected day for testing.

import * as trustedTime from './trustedTime';

export function todayKey(d?: Date): string {
  if (d === undefined) return trustedTime.todayKey();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Trusted "now" in ms — use instead of Date.now() for anything rewarded. */
export function nowMs(): number {
  return trustedTime.now();
}

export function dayKey(d: Date): string {
  return todayKey(d);
}

/** Number of whole local days between two YYYY-MM-DD keys (b - a). */
export function daysBetween(a: string, b: string): number {
  const da = parseKey(a);
  const db = parseKey(b);
  const ms = db.getTime() - da.getTime();
  return Math.round(ms / 86_400_000);
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isYesterday(prevKey: string, today: string = todayKey()): boolean {
  return daysBetween(prevKey, today) === 1;
}

export function isSameDay(prevKey: string, today: string = todayKey()): boolean {
  return prevKey === today;
}
