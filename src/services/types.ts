// Client data model. Field names mirror backend/firebase/SCHEMA.md so a
// Firestore sync layer can drop in later with no model changes.

export interface Hearts {
  count: number;          // 0..max
  max: number;            // default 5
  nextRefillAt: number | null; // epoch ms, or null when full/unlimited
  unlimited: boolean;
}

export interface UserSettings {
  ledBrightness: number;  // 0..100
  colorTheme: string;
  instructorVoice: string;
  autoPlayExamples: boolean;
  dailyGoalXp: number;
  reminderTime: string | null; // "HH:mm"
}

export interface UserProfile {
  uid: string;
  displayName: string;
  avatarId: string;
  grade: number;
  currentLessonId: string | null;
  createdAt: number;
  updatedAt: number;

  // gamification — the "hot" counters every screen reads
  streakCount: number;
  longestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD local
  totalXp: number;
  gems: number;
  hearts: Hearts;

  settings: UserSettings;
}

export interface LessonProgress {
  status: 'locked' | 'available' | 'completed';
  stars: number;          // 0..3
  bestAccuracy: number;   // 0..1
  attempts: number;
  lastStepIndex: number;
  xpEarned: number;
  firstCompletedAt: number | null;
  lastPlayedAt: number;
}

export interface DailyActivity {
  date: string;           // YYYY-MM-DD local
  minutesPracticed: number;
  lessonsCompleted: number;
  xpEarned: number;
  streakMaintained: boolean;
}

export interface AchievementProgress {
  level: number;
  progress: number;       // 0..1 toward next level
  unlockedAt: number | null;
}

export const HEARTS_MAX = 5;
export const HEART_REFILL_MS = 30 * 60 * 1000; // 30 min per heart
export const DEFAULT_DAILY_GOAL_XP = 50;

export function makeDefaultProfile(uid: string): UserProfile {
  const now = Date.now();
  return {
    uid,
    displayName: 'Pianist',
    avatarId: 'avatar_1',
    grade: 1,
    currentLessonId: null,
    createdAt: now,
    updatedAt: now,
    streakCount: 0,
    longestStreak: 0,
    lastActiveDate: null,
    totalXp: 0,
    gems: 0,
    hearts: { count: HEARTS_MAX, max: HEARTS_MAX, nextRefillAt: null, unlimited: false },
    settings: {
      ledBrightness: 80,
      colorTheme: 'rainbow',
      instructorVoice: 'default',
      autoPlayExamples: true,
      dailyGoalXp: DEFAULT_DAILY_GOAL_XP,
      reminderTime: null,
    },
  };
}
