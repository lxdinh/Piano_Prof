import { UserProfile, LessonProgress, DailyActivity, AchievementProgress } from './types';

// Storage-agnostic contract for the user data layer. The app talks only to
// this interface; v1 ships a local (AsyncStorage) implementation. A Firestore
// implementation can be added later (same method names, same field shapes as
// backend/firebase/SCHEMA.md) and swapped in behind a feature flag.

export interface ProgressBackend {
  /** Stable signed-in user id (anon-local in v1). */
  getUid(): Promise<string>;

  loadProfile(uid: string): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<void>;

  loadLessonProgress(uid: string): Promise<Record<string, LessonProgress>>;
  saveLessonProgress(uid: string, lessonId: string, progress: LessonProgress): Promise<void>;

  loadDailyActivity(uid: string, date: string): Promise<DailyActivity | null>;
  saveDailyActivity(uid: string, activity: DailyActivity): Promise<void>;

  loadAchievements(uid: string): Promise<Record<string, AchievementProgress>>;
  saveAchievement(uid: string, id: string, progress: AchievementProgress): Promise<void>;
}
