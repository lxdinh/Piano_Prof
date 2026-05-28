import { Hearts, HEARTS_MAX, HEART_REFILL_MS } from '../services/types';

// Pure helpers for the Duolingo-style hearts economy.

/** Apply any elapsed-time refills. Returns a new Hearts object. */
export function refillHearts(hearts: Hearts, now: number = Date.now()): Hearts {
  if (hearts.unlimited || hearts.count >= hearts.max) {
    return { ...hearts, nextRefillAt: null };
  }
  if (hearts.nextRefillAt == null) {
    return { ...hearts, nextRefillAt: now + HEART_REFILL_MS };
  }
  if (now < hearts.nextRefillAt) return hearts;

  const elapsed = now - hearts.nextRefillAt;
  const gained = 1 + Math.floor(elapsed / HEART_REFILL_MS);
  const count = Math.min(hearts.max, hearts.count + gained);
  const full = count >= hearts.max;
  return {
    ...hearts,
    count,
    nextRefillAt: full ? null : now + HEART_REFILL_MS,
  };
}

export function spendHeart(hearts: Hearts, now: number = Date.now()): Hearts {
  if (hearts.unlimited) return hearts;
  const count = Math.max(0, hearts.count - 1);
  return {
    ...hearts,
    count,
    nextRefillAt: hearts.nextRefillAt ?? now + HEART_REFILL_MS,
  };
}

export function grantFullHearts(hearts: Hearts): Hearts {
  return { ...hearts, count: hearts.max, nextRefillAt: null };
}

export function makeHearts(): Hearts {
  return { count: HEARTS_MAX, max: HEARTS_MAX, nextRefillAt: null, unlimited: false };
}
