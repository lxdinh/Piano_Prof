// Thin analytics facade. v1 logs to console; swap the body for
// firebase analytics (or any provider) without touching call sites.

type Params = Record<string, string | number | boolean | undefined>;

export function logEvent(name: string, params: Params = {}): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${name}`, params);
  }
  // future: analytics().logEvent(name, params)
}

export const Events = {
  lessonStart: 'lesson_start',
  lessonComplete: 'lesson_complete',
  quizCorrect: 'quiz_correct',
  quizWrong: 'quiz_wrong',
  streakIncrement: 'streak_increment',
  achievementUnlock: 'achievement_unlock',
  blePaired: 'ble_paired',
  paywallView: 'paywall_view',
} as const;
