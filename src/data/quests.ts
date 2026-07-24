// Piano Professor — Daily Quests (pure, testable).
// Three quests a day, derived from real today-activity, claimable for gems.
// The set is deterministic per calendar day (stable while you play), and
// rotates day to day so it feels fresh. Resets automatically each day.
import { Profile } from './content';
import { todayKey } from '../services/dateKey';

export type QuestKind = 'xp' | 'lessons' | 'perfect';

export interface Quest {
  id: string;
  kind: QuestKind;
  goal: number;
  reward: number; // gems
  emoji: string;
  title: string;
}

const XP_QUESTS: Quest[] = [
  { id: 'xp20', kind: 'xp', goal: 20, reward: 10, emoji: '⚡', title: 'Earn 20 XP' },
  { id: 'xp50', kind: 'xp', goal: 50, reward: 20, emoji: '⚡', title: 'Earn 50 XP' },
];
const LESSON_QUESTS: Quest[] = [
  { id: 'les1', kind: 'lessons', goal: 1, reward: 10, emoji: '🎹', title: 'Complete a lesson' },
  { id: 'les3', kind: 'lessons', goal: 3, reward: 30, emoji: '🎹', title: 'Complete 3 lessons' },
];
const PERFECT_QUEST: Quest = { id: 'perfect', kind: 'perfect', goal: 1, reward: 15, emoji: '⭐', title: 'Get a perfect lesson' };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** The three quests for a given day — one XP, one lessons, one perfect. */
export function dailyQuests(day = todayKey()): Quest[] {
  return [
    XP_QUESTS[hash(`${day}xp`) % XP_QUESTS.length],
    LESSON_QUESTS[hash(`${day}les`) % LESSON_QUESTS.length],
    PERFECT_QUEST,
  ];
}

export interface QuestState {
  quest: Quest;
  current: number;
  done: boolean;
  claimed: boolean;
  claimable: boolean;
}

function metric(p: Profile, kind: QuestKind): number {
  switch (kind) {
    case 'xp': return p.todayXp ?? 0;
    case 'lessons': return p.todayLessons ?? 0;
    case 'perfect': return p.todayPerfect ? 1 : 0;
  }
}

/** Resolve today's quests against a profile's live activity + claim state. */
export function questsToday(p: Profile, day = todayKey()): QuestState[] {
  const claimedToday = p.questDay === day ? (p.questsClaimed ?? []) : [];
  return dailyQuests(day).map((quest) => {
    const current = Math.min(metric(p, quest.kind), quest.goal);
    const done = current >= quest.goal;
    const claimed = claimedToday.includes(quest.id);
    return { quest, current, done, claimed, claimable: done && !claimed };
  });
}

/** Count of quests ready to collect (drives the Home badge). */
export function claimableCount(p: Profile, day = todayKey()): number {
  return questsToday(p, day).filter((q) => q.claimable).length;
}

/**
 * Apply a claim: award the reward and mark it collected (idempotent, and only
 * if actually claimable). Pure — returns a new profile.
 */
export function applyClaim(p: Profile, questId: string, day = todayKey()): Profile {
  const state = questsToday(p, day).find((q) => q.quest.id === questId);
  if (!state || !state.claimable) return p;
  const claimedToday = p.questDay === day ? (p.questsClaimed ?? []) : [];
  return {
    ...p,
    gems: p.gems + state.quest.reward,
    questDay: day,
    questsClaimed: [...claimedToday, questId],
  };
}
