import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabsParamList = {
  Learn: undefined;
  Path: undefined;
  Songbook: undefined;
  Profile: undefined;
  Settings: undefined;
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
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
