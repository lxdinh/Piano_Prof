import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabsParamList = {
  Learn: undefined;
  Sheet: undefined;
  Practice: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabsParamList> | undefined;
  Lesson: { gradeId: number; lessonId: string };
  LessonComplete: { gradeId: number; lessonId: string; xp: number; stars: number; message: string };
  BLEPairing: undefined;
  VoiceSettings: undefined;
  OmrImport: undefined;
  Paywall: undefined;
  Settings: undefined;
};

// NOTE: the global ReactNavigation.RootParamList declaration deliberately
// does NOT live here. It lives in src/ui/activeShell.ts, keyed to the
// active shell — two shells both declaring it would merge their route
// params globally and conflict.
