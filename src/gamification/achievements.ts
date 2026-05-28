import { UserProfile, LessonProgress, AchievementProgress } from '../services/types';

// The 8 badges (mirrors the retired Flutter app). Each has tiered thresholds;
// `metric` is read from a snapshot of the user's current stats.

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;            // emoji for v1
  color: string;
  metric: 'lessonsCompleted' | 'totalXp' | 'streakCount' | 'perfectLessons' | 'chordsPlayed' | 'devicesPaired' | 'songsImported' | 'gems';
  thresholds: number[];    // ascending; index+1 = level reached
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_steps', title: 'First Steps', description: 'Complete your first lesson', icon: '🎹', color: '#58CC02', metric: 'lessonsCompleted', thresholds: [1, 5, 15] },
  { id: 'xp_hunter', title: 'XP Hunter', description: 'Earn lifetime XP', icon: '⭐', color: '#F5B800', metric: 'totalXp', thresholds: [100, 500, 2000] },
  { id: 'on_fire', title: 'On Fire', description: 'Keep a daily streak', icon: '🔥', color: '#FF9600', metric: 'streakCount', thresholds: [3, 7, 30] },
  { id: 'flawless', title: 'Flawless', description: 'Finish lessons with 3 stars', icon: '💯', color: '#FF4B4B', metric: 'perfectLessons', thresholds: [1, 5, 20] },
  { id: 'chord_master', title: 'Chord Master', description: 'Play chords correctly', icon: '🎶', color: '#8B5CF6', metric: 'chordsPlayed', thresholds: [10, 50, 200] },
  { id: 'connected', title: 'Connected', description: 'Pair an LED strip', icon: '🔌', color: '#5BB8E3', metric: 'devicesPaired', thresholds: [1, 2, 3] },
  { id: 'sheet_reader', title: 'Sheet Reader', description: 'Import sheet music', icon: '📄', color: '#46A302', metric: 'songsImported', thresholds: [1, 5, 15] },
  { id: 'collector', title: 'Collector', description: 'Save up gems', icon: '💎', color: '#5BB8E3', metric: 'gems', thresholds: [50, 200, 1000] },
];

export interface StatSnapshot {
  lessonsCompleted: number;
  totalXp: number;
  streakCount: number;
  perfectLessons: number;
  chordsPlayed: number;
  devicesPaired: number;
  songsImported: number;
  gems: number;
}

export function snapshotFromProfile(
  profile: UserProfile,
  lessonProgress: Record<string, LessonProgress>,
  extras: Partial<StatSnapshot> = {},
): StatSnapshot {
  const lessons = Object.values(lessonProgress);
  return {
    lessonsCompleted: lessons.filter((l) => l.status === 'completed').length,
    totalXp: profile.totalXp,
    streakCount: profile.streakCount,
    perfectLessons: lessons.filter((l) => l.stars >= 3).length,
    chordsPlayed: extras.chordsPlayed ?? 0,
    devicesPaired: extras.devicesPaired ?? 0,
    songsImported: extras.songsImported ?? 0,
    gems: profile.gems,
  };
}

export function levelFor(def: AchievementDef, value: number): { level: number; progress: number } {
  let level = 0;
  for (let i = 0; i < def.thresholds.length; i++) {
    if (value >= def.thresholds[i]) level = i + 1;
  }
  const nextThreshold = def.thresholds[level];
  if (nextThreshold == null) return { level, progress: 1 };
  const prevThreshold = level === 0 ? 0 : def.thresholds[level - 1];
  const progress = (value - prevThreshold) / (nextThreshold - prevThreshold);
  return { level, progress: Math.max(0, Math.min(1, progress)) };
}

export interface UnlockResult {
  updates: Record<string, AchievementProgress>;
  newlyUnlocked: AchievementDef[];
}

/** Recompute achievement levels; returns which ones leveled up. */
export function evaluateAchievements(
  snapshot: StatSnapshot,
  current: Record<string, AchievementProgress>,
): UnlockResult {
  const updates: Record<string, AchievementProgress> = {};
  const newlyUnlocked: AchievementDef[] = [];

  for (const def of ACHIEVEMENTS) {
    const value = snapshot[def.metric];
    const { level, progress } = levelFor(def, value);
    const prev = current[def.id];
    const prevLevel = prev?.level ?? 0;

    if (level > prevLevel) {
      newlyUnlocked.push(def);
    }
    if (!prev || level !== prevLevel || progress !== prev.progress) {
      updates[def.id] = {
        level,
        progress,
        unlockedAt: level > 0 ? (prev?.unlockedAt ?? Date.now()) : null,
      };
    }
  }

  return { updates, newlyUnlocked };
}
