import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressBackend } from './ProgressBackend';
import {
  UserProfile, LessonProgress, DailyActivity, AchievementProgress, ProfileSummary,
  makeDefaultProfile,
} from './types';

// AsyncStorage-backed, offline-first implementation. This is the authoritative
// store for v1 (client-authoritative gamification). Keys are namespaced under
// pp.<uid>.* mirroring the Firestore tree shape.
//
// Multiple local profiles (a "family") live side-by-side: a registry at
// pp.profiles lists everyone, pp.activeUid points at the selected profile, and
// each profile keeps its own pp.<uid>.* subtree. Switching profiles is just
// re-pointing pp.activeUid.

const UID_KEY = 'pp.localUid';          // legacy single-uid (pre-multi-profile)
const PROFILES_KEY = 'pp.profiles';     // ProfileSummary[]
const ACTIVE_UID_KEY = 'pp.activeUid';  // currently selected uid

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

function newUid(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class LocalBackend implements ProgressBackend {
  // ── Profile registry ─────────────────────────────────────────
  async listProfiles(): Promise<ProfileSummary[]> {
    return (await readJson<ProfileSummary[]>(PROFILES_KEY)) ?? [];
  }

  private saveProfiles(list: ProfileSummary[]): Promise<void> {
    return writeJson(PROFILES_KEY, list);
  }

  getActiveUid(): Promise<string | null> {
    return AsyncStorage.getItem(ACTIVE_UID_KEY);
  }

  setActiveUid(uid: string): Promise<void> {
    return AsyncStorage.setItem(ACTIVE_UID_KEY, uid);
  }

  /** Create a new local profile (registry entry + seeded default profile). */
  async createProfile(displayName: string, avatarId: string): Promise<ProfileSummary> {
    const summary: ProfileSummary = {
      uid: newUid(), displayName, avatarId, createdAt: Date.now(),
    };
    const list = await this.listProfiles();
    await this.saveProfiles([...list, summary]);

    const profile = makeDefaultProfile(summary.uid);
    profile.displayName = displayName;
    profile.avatarId = avatarId;
    await this.saveProfile(profile);
    return summary;
  }

  /** Remove a profile from the registry and wipe its pp.<uid>.* subtree. */
  async deleteProfile(uid: string): Promise<void> {
    const list = (await this.listProfiles()).filter((p) => p.uid !== uid);
    await this.saveProfiles(list);

    const allKeys = await AsyncStorage.getAllKeys();
    const mine = allKeys.filter((k) => k.startsWith(`pp.${uid}.`));
    if (mine.length) await AsyncStorage.multiRemove(mine);

    // Re-point the active uid if we just deleted the active profile.
    if ((await this.getActiveUid()) === uid) {
      if (list[0]) await this.setActiveUid(list[0].uid);
      else await AsyncStorage.removeItem(ACTIVE_UID_KEY);
    }
  }

  /**
   * Ensure a registry exists and return the active uid (or null on a fresh
   * install with no profiles yet). Migrates the legacy single-uid layout
   * (pp.localUid) into the registry on first run after upgrade so existing
   * progress is preserved.
   */
  async ensureRegistry(): Promise<string | null> {
    const list = await this.listProfiles();
    if (list.length > 0) {
      const active = await this.getActiveUid();
      if (active && list.some((p) => p.uid === active)) return active;
      await this.setActiveUid(list[0].uid);
      return list[0].uid;
    }

    // No registry — migrate a pre-existing single profile if present.
    const legacy = await AsyncStorage.getItem(UID_KEY);
    if (legacy) {
      const p = await this.loadProfile(legacy);
      const summary: ProfileSummary = {
        uid: legacy,
        displayName: p?.displayName ?? 'Pianist',
        avatarId: p?.avatarId ?? 'avatar_1',
        createdAt: p?.createdAt ?? Date.now(),
      };
      await this.saveProfiles([summary]);
      await this.setActiveUid(legacy);
      return legacy;
    }

    return null; // fresh install — onboarding will create the first profile
  }

  /**
   * Stable active uid, always returning a value (legacy contract). Falls back
   * to creating a default profile if none exists — onboarding normally creates
   * the first profile before this is reached.
   */
  async getUid(): Promise<string> {
    const active = await this.ensureRegistry();
    if (active) return active;
    const created = await this.createProfile('Pianist', 'avatar_1');
    await this.setActiveUid(created.uid);
    return created.uid;
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
