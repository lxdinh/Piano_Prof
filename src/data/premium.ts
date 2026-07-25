// Piano Professor — premium perks (pure, testable).
//
// The goal is the thing a paywall usually gets wrong: making someone GLAD they
// paid, and keeping them practising afterwards. Two mechanisms do the work.
//  · An immediate win at the moment of purchase. Post-purchase rationalization:
//    people resolve the discomfort of spending by valuing what they bought, but
//    only if the value is felt right away — hence the welcome bonus.
//  · Perks felt in EVERY session (unlimited hearts, double XP), so the
//    subscription keeps justifying itself instead of fading into the background.
import { Profile } from './content';
import { nowMs } from '../services/dateKey';

/** Gems granted once, the moment premium is unlocked. */
export const PREMIUM_WELCOME_GEMS = 250;

/** The 7-day plan shown on the welcome screen — a concrete commitment device. */
export const PREMIUM_PLAN: { day: number; title: string }[] = [
  { day: 1, title: 'Unlock your first premium song' },
  { day: 2, title: 'Both hands together' },
  { day: 3, title: 'Play with feeling (loud & soft)' },
  { day: 4, title: 'Your first full song, start to finish' },
  { day: 5, title: 'Chord inversions' },
  { day: 6, title: 'Play along at full tempo' },
  { day: 7, title: 'Record and share your song' },
];

/** Has this profile already collected the welcome bonus? */
export function hasPremiumWelcome(p: Profile): boolean {
  return p.premiumGrantedAt != null;
}

/**
 * Grant the one-time premium welcome bonus. Idempotent — guarded by
 * `premiumGrantedAt`, so re-entering the screen (or resubscribing) can never
 * pay twice.
 */
export function applyPremiumWelcome(p: Profile, now = nowMs()): Profile {
  if (hasPremiumWelcome(p)) return p;
  return { ...p, gems: p.gems + PREMIUM_WELCOME_GEMS, premiumGrantedAt: now };
}
