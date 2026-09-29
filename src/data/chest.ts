// Piano Professor — daily chest (pure, testable).
//
// One free chest per day with a VARIABLE gem reward. A variable-ratio schedule
// is the most powerful reinforcement pattern known (Skinner) — an unpredictable
// payout drives far more return visits than a fixed one, which is why every
// retention-led app has a daily chest.
//
// KIDS-SAFE BY DESIGN: the chest is always free, can never be bought, and no
// real money is ever involved in the randomness. That keeps the mechanic on the
// right side of the loot-box line for a child-directed app.
//
// The reward is DETERMINISTIC for a given (profile, day): the learner cannot
// reroll a bad chest by force-quitting, and the value cannot be farmed.
import { Profile } from './content';
import { todayKey } from '../services/dateKey';

export interface ChestTier { gems: number; weight: number; label: string; emoji: string; }

/** Mostly modest, occasionally thrilling — the shape that sustains anticipation. */
export const CHEST_TIERS: ChestTier[] = [
  { gems: 10, weight: 60, label: 'Nice!', emoji: '💎' },
  { gems: 20, weight: 25, label: 'Great!', emoji: '💎' },
  { gems: 40, weight: 12, label: 'Excellent!', emoji: '🎁' },
  { gems: 100, weight: 3, label: 'JACKPOT!', emoji: '🏆' },
];

const TOTAL_WEIGHT = CHEST_TIERS.reduce((s, t) => s + t.weight, 0);

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** The tier this profile gets today — stable, so it cannot be rerolled. */
export function chestTier(profileId: string, day = todayKey()): ChestTier {
  let roll = hash(`${profileId}:${day}:chest`) % TOTAL_WEIGHT;
  for (const tier of CHEST_TIERS) {
    if (roll < tier.weight) return tier;
    roll -= tier.weight;
  }
  return CHEST_TIERS[0];
}

/**
 * Is today's chest still unopened? `suspicious` (a clock-tamper signal) holds
 * the chest, so jumping the clock forward cannot mint extra chests.
 */
export function canOpenChest(p: Profile, day = todayKey(), suspicious = false): boolean {
  return !suspicious && p.chestDay !== day;
}

/** Open today's chest. Idempotent — a second call the same day is a no-op. */
export function applyChestOpen(p: Profile, day = todayKey(), suspicious = false): Profile {
  if (!canOpenChest(p, day, suspicious)) return p;
  return { ...p, gems: p.gems + chestTier(p.id, day).gems, chestDay: day };
}
