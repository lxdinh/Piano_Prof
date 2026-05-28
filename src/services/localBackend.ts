import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressBackend } from './ProgressBackend';
import { UserProfile, LessonProgress, DailyActivity, AchievementProgress } from './types';

// AsyncStorage-backed, offline-first implementation. This is the authoritative
// store for v1 (client-authoritative gamification). Keys are namespaced under
// pp.<uid>.* mirroring the Firestore tree shape.

const UID_KEY = 'pp.localUid';

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function profileKey(uid: string) { return `pp.${uid}.profile`; }
function lessonKey(uid: string)  { return `pp.${uid}.lessonProgress`; }
function dailyKey(uid: string, date: string) { return `pp.${uid}.daily.${date}`; }
function achKey(uid: string)     { return `pp.${uid}.achievements`; }

export class LocalBackend implements ProgressBackend {
  async getUid(): Promise<string> {
    let uid = await AsyncStorage.getItem(UID_KEY);
    if (!uid) {
      uid = `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      await AsyncStorage.setItem(UID_KEY, uid);
    }
    return uid;
  }

  loadProfile(uid: string): Promise<UserProfile | null> {
    return readJson<UserProfile>(profileKey(uid));
  }
  saveProfile(profile: UserProfile): Promise<void> {
    return writeJson(profileKey(profile.uid), profile);
  }

  async loadLessonProgress(uid: string): Promise<Record<string, LessonProgress>> {
    return (await readJson<Record<string, LessonProgress>>(lessonKey(uid))) ?? {};
  }
  async saveLessonProgress(uid: string, lessonId: string, progress: LessonProgress): Promise<void> {
    const all = await this.loadLessonProgress(uid);
    all[lessonId] = progress;
    await writeJson(lessonKey(uid), all);
  }

  loadDailyActivity(uid: string, date: string): Promise<DailyActivity | null> {
    return readJson<DailyActivity>(dailyKey(uid, date));
  }
  saveDailyActivity(uid: string, activity: DailyActivity): Promise<void> {
    return writeJson(dailyKey(uid, activity.date), activity);
  }

  async loadAchievements(uid: string): Promise<Record<string, AchievementProgress>> {
    return (await readJson<Record<string, AchievementProgress>>(achKey(uid))) ?? {};
  }
  async saveAchievement(uid: string, id: string, progress: AchievementProgress): Promise<void> {
    const all = await this.loadAchievements(uid);
    all[id] = progress;
    await writeJson(achKey(uid), all);
  }
}

// Single shared instance.
export const localBackend = new LocalBackend();
