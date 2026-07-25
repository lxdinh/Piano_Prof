// Piano Professor — Family League (pure, testable). Ranks the household's
// profiles by XP earned this week (last 7 days), Duolingo-league style.
import { Profile } from './content';
import { weeklyXp } from './progress';

const MEDALS = ['🥇', '🥈', '🥉'];

export interface Rank {
  profile: Profile;
  xp: number;            // XP earned in the last 7 days
  place: number;         // 1-based standing
  medal: string | null;  // 🥇/🥈/🥉 for the top three, else null
}

/** Total XP a profile earned across the last 7 days (today = live bucket). */
export function weeklyXpTotal(p: Profile, today = new Date()): number {
  return weeklyXp(p, today).reduce((sum, d) => sum + d.xp, 0);
}

/**
 * Rank the household by weekly XP (desc). Ties break by lifetime BASE xp (not
 * the premium-boosted total, so a paying member can't outrank the family just
 * by subscribing), then name so the order is stable. Top three earn medals.
 */
export function leaderboard(profiles: Profile[], today = new Date()): Rank[] {
  const base = (p: Profile) => p.baseXp ?? p.xp;
  return profiles
    .map((p) => ({ profile: p, xp: weeklyXpTotal(p, today) }))
    .sort((a, b) =>
      b.xp - a.xp ||
      base(b.profile) - base(a.profile) ||
      a.profile.name.localeCompare(b.profile.name))
    .map((r, i) => ({ ...r, place: i + 1, medal: MEDALS[i] ?? null }));
}

/** The 1-based standing of one profile in the league (0 if not found). */
export function placeOf(profiles: Profile[], id: string, today = new Date()): number {
  return leaderboard(profiles, today).find((r) => r.profile.id === id)?.place ?? 0;
}
