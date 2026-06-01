import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { localBackend } from '../services/localBackend';
import {
  UserProfile, LessonProgress, DailyActivity, AchievementProgress,
  makeDefaultProfile,
} from '../services/types';
import { todayKey, isYesterday, isSameDay } from '../services/dateKey';
import { refillHearts, spendHeart as spendHeartFn, grantFullHearts } from './hearts';
import {
  ACHIEVEMENTS, AchievementDef, evaluateAchievements, snapshotFromProfile,
} from './achievements';
import { logEvent, Events } from '../services/analytics';

interface CompleteLessonInput {
  lessonId: string;
  stars: number;
  accuracy: number;
  xp: number;
}

interface UserContextValue {
  ready: boolean;
  profile: UserProfile | null;
  lessonProgress: Record<string, LessonProgress>;
  achievements: Record<string, AchievementProgress>;
  todayActivity: DailyActivity | null;
  celebrating: AchievementDef | null;

  awardXp: (amount: number) => Promise<void>;
  registerActivity: (xp?: number) => Promise<void>;
  completeLesson: (input: CompleteLessonInput) => Promise<void>;
  loseHeart: () => Promise<void>;
  refillAllHearts: () => Promise<void>;
  addGems: (n: number) => Promise<void>;
  setCurrentLesson: (lessonId: string) => Promise<void>;
  /** Place a new learner: set their grade + mark prerequisite lessons done. */
  applyPlacement: (gradeNumber: number, completedLessonIds: string[]) => Promise<void>;
  dismissCelebration: () => void;
}

const UserCtx = createContext<UserContextValue | null>(null);

export function UserProvider({ children, uid: uidProp }: {
  children: React.ReactNode;
  // Active profile to load. When omitted (legacy), resolves via getUid(). When
  // explicitly null, no profile is loaded (fresh install, pre-onboarding).
  uid?: string | null;
}) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>({});
  const [achievements, setAchievements] = useState<Record<string, AchievementProgress>>({});
  const [todayActivity, setTodayActivity] = useState<DailyActivity | null>(null);
  const [celebrating, setCelebrating] = useState<AchievementDef | null>(null);

  const uidRef = useRef<string>('');
  const celebrationQueue = useRef<AchievementDef[]>([]);

  // ── Load (and reload when the active profile changes) ─────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Reset to a clean slate so a switched-in profile never briefly shows the
      // previous learner's streak/XP.
      setReady(false);
      setProfile(null);
      setLessonProgress({});
      setAchievements({});
      setTodayActivity(null);
      celebrationQueue.current = [];

      const uid = uidProp !== undefined ? uidProp : await localBackend.getUid();
      if (!uid) {
        // Fresh install with no active profile yet — onboarding will create one.
        if (!cancelled) setReady(true);
        return;
      }
      uidRef.current = uid;

      let p = await localBackend.loadProfile(uid);
      if (!p) {
        p = makeDefaultProfile(uid);
        await localBackend.saveProfile(p);
      }
      // apply any pending heart refills since last open
      const hearts = refillHearts(p.hearts);
      if (hearts !== p.hearts) {
        p = { ...p, hearts };
        await localBackend.saveProfile(p);
      }

      const [lp, ach, today] = await Promise.all([
        localBackend.loadLessonProgress(uid),
        localBackend.loadAchievements(uid),
        localBackend.loadDailyActivity(uid, todayKey()),
      ]);

      if (cancelled) return;
      setProfile(p);
      setLessonProgress(lp);
      setAchievements(ach);
      setTodayActivity(today);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [uidProp]);

  const persistProfile = useCallback(async (next: UserProfile) => {
    next.updatedAt = Date.now();
    setProfile(next);
    await localBackend.saveProfile(next);
  }, []);

  // ── Achievement evaluation ────────────────────────────────────
  const runAchievementCheck = useCallback(
    async (p: UserProfile, lp: Record<string, LessonProgress>, extras = {}) => {
      const snap = snapshotFromProfile(p, lp, extras);
      const { updates, newlyUnlocked } = evaluateAchievements(snap, achievements);
      if (Object.keys(updates).length > 0) {
        const merged = { ...achievements, ...updates };
        setAchievements(merged);
        await Promise.all(
          Object.entries(updates).map(([id, prog]) =>
            localBackend.saveAchievement(uidRef.current, id, prog),
          ),
        );
      }
      if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach((a) => logEvent(Events.achievementUnlock, { id: a.id }));
        celebrationQueue.current.push(...newlyUnlocked);
        setCelebrating((c) => c ?? celebrationQueue.current.shift() ?? null);
      }
    },
    [achievements],
  );

  // ── Mutations ─────────────────────────────────────────────────
  const awardXp = useCallback(async (amount: number) => {
    if (!profile || amount <= 0) return;
    const next = { ...profile, totalXp: profile.totalXp + amount };
    await persistProfile(next);
    await runAchievementCheck(next, lessonProgress);
  }, [profile, lessonProgress, persistProfile, runAchievementCheck]);

  const registerActivity = useCallback(async (xp = 0) => {
    if (!profile) return;
    const today = todayKey();
    let streakCount = profile.streakCount;
    let longestStreak = profile.longestStreak;

    if (profile.lastActiveDate && isSameDay(profile.lastActiveDate, today)) {
      // already counted today
    } else if (profile.lastActiveDate && isYesterday(profile.lastActiveDate, today)) {
      streakCount += 1;
      logEvent(Events.streakIncrement, { streak: streakCount });
    } else {
      streakCount = 1;
    }
    longestStreak = Math.max(longestStreak, streakCount);

    const next: UserProfile = {
      ...profile,
      streakCount,
      longestStreak,
      lastActiveDate: today,
      totalXp: profile.totalXp + xp,
    };
    await persistProfile(next);

    // daily activity bucket
    const prevDaily = todayActivity ?? {
      date: today, minutesPracticed: 0, lessonsCompleted: 0, xpEarned: 0, streakMaintained: false,
    };
    const goal = next.settings.dailyGoalXp;
    const daily: DailyActivity = {
      ...prevDaily,
      date: today,
      xpEarned: prevDaily.xpEarned + xp,
      streakMaintained: prevDaily.xpEarned + xp >= goal,
    };
    setTodayActivity(daily);
    await localBackend.saveDailyActivity(uidRef.current, daily);

    await runAchievementCheck(next, lessonProgress);
  }, [profile, todayActivity, lessonProgress, persistProfile, runAchievementCheck]);

  const completeLesson = useCallback(async (input: CompleteLessonInput) => {
    if (!profile) return;
    const prev = lessonProgress[input.lessonId];
    const progress: LessonProgress = {
      status: 'completed',
      stars: Math.max(prev?.stars ?? 0, input.stars),
      bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, input.accuracy),
      attempts: (prev?.attempts ?? 0) + 1,
      lastStepIndex: 0,
      xpEarned: (prev?.xpEarned ?? 0) + input.xp,
      firstCompletedAt: prev?.firstCompletedAt ?? Date.now(),
      lastPlayedAt: Date.now(),
    };
    const nextLp = { ...lessonProgress, [input.lessonId]: progress };
    setLessonProgress(nextLp);
    await localBackend.saveLessonProgress(uidRef.current, input.lessonId, progress);

    logEvent(Events.lessonComplete, { lessonId: input.lessonId, stars: input.stars, xp: input.xp });

    // One atomic profile update: XP + gems + streak rollover. (Self-contained so
    // we never chain off a stale `profile` between async state updates.)
    const today = todayKey();
    let streakCount = profile.streakCount;
    if (profile.lastActiveDate && isSameDay(profile.lastActiveDate, today)) {
      // already counted today
    } else if (profile.lastActiveDate && isYesterday(profile.lastActiveDate, today)) {
      streakCount += 1;
      logEvent(Events.streakIncrement, { streak: streakCount });
    } else {
      streakCount = 1;
    }
    const longestStreak = Math.max(profile.longestStreak, streakCount);
    const gems = input.stars; // 1 gem per star

    const next: UserProfile = {
      ...profile,
      totalXp: profile.totalXp + input.xp,
      gems: profile.gems + gems,
      streakCount,
      longestStreak,
      lastActiveDate: today,
      currentLessonId: input.lessonId,
    };
    await persistProfile(next);

    // daily activity bucket
    const prevDaily = todayActivity ?? {
      date: today, minutesPracticed: 0, lessonsCompleted: 0, xpEarned: 0, streakMaintained: false,
    };
    const goal = next.settings.dailyGoalXp;
    const xpToday = prevDaily.xpEarned + input.xp;
    const daily: DailyActivity = {
      ...prevDaily,
      date: today,
      lessonsCompleted: prevDaily.lessonsCompleted + 1,
      xpEarned: xpToday,
      streakMaintained: xpToday >= goal,
    };
    setTodayActivity(daily);
    await localBackend.saveDailyActivity(uidRef.current, daily);

    await runAchievementCheck(next, nextLp);
  }, [profile, lessonProgress, todayActivity, persistProfile, runAchievementCheck]);

  const loseHeart = useCallback(async () => {
    if (!profile) return;
    const hearts = spendHeartFn(profile.hearts);
    await persistProfile({ ...profile, hearts });
    logEvent(Events.quizWrong);
  }, [profile, persistProfile]);

  const refillAllHearts = useCallback(async () => {
    if (!profile) return;
    await persistProfile({ ...profile, hearts: grantFullHearts(profile.hearts) });
  }, [profile, persistProfile]);

  const addGems = useCallback(async (n: number) => {
    if (!profile) return;
    await persistProfile({ ...profile, gems: Math.max(0, profile.gems + n) });
  }, [profile, persistProfile]);

  const setCurrentLesson = useCallback(async (lessonId: string) => {
    if (!profile) return;
    await persistProfile({ ...profile, currentLessonId: lessonId });
  }, [profile, persistProfile]);

  const applyPlacement = useCallback(async (gradeNumber: number, completedLessonIds: string[]) => {
    if (!profile) return;
    // Seed prerequisite lessons as completed — no XP/gems/streak, since this is
    // placement (skipping ahead), not earned progress.
    const nextLp = { ...lessonProgress };
    const now = Date.now();
    for (const id of completedLessonIds) {
      if (nextLp[id]?.status === 'completed') continue;
      const prog: LessonProgress = {
        status: 'completed', stars: 0, bestAccuracy: 0, attempts: 0,
        lastStepIndex: 0, xpEarned: 0, firstCompletedAt: now, lastPlayedAt: now,
      };
      nextLp[id] = prog;
      await localBackend.saveLessonProgress(uidRef.current, id, prog);
    }
    setLessonProgress(nextLp);
    await persistProfile({ ...profile, grade: gradeNumber });
  }, [profile, lessonProgress, persistProfile]);

  const dismissCelebration = useCallback(() => {
    const nextInQueue = celebrationQueue.current.shift() ?? null;
    setCelebrating(nextInQueue);
  }, []);

  const value = useMemo<UserContextValue>(() => ({
    ready, profile, lessonProgress, achievements, todayActivity, celebrating,
    awardXp, registerActivity, completeLesson, loseHeart, refillAllHearts,
    addGems, setCurrentLesson, applyPlacement, dismissCelebration,
  }), [
    ready, profile, lessonProgress, achievements, todayActivity, celebrating,
    awardXp, registerActivity, completeLesson, loseHeart, refillAllHearts,
    addGems, setCurrentLesson, applyPlacement, dismissCelebration,
  ]);

  return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}

// Convenience selectors matching the plan's hook names.
export function useEngagement() {
  const u = useUser();
  return {
    profile: u.profile,
    todayActivity: u.todayActivity,
    awardXp: u.awardXp,
    registerActivity: u.registerActivity,
    completeLesson: u.completeLesson,
    loseHeart: u.loseHeart,
    refillAllHearts: u.refillAllHearts,
    addGems: u.addGems,
  };
}

export function useAchievements() {
  const u = useUser();
  return {
    defs: ACHIEVEMENTS,
    progress: u.achievements,
    celebrating: u.celebrating,
    dismissCelebration: u.dismissCelebration,
  };
}
