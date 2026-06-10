// Every screen in this shell MUST be registered here — smoke.screens.test.tsx
// renders each entry and fails the suite if a screen file exists without a
// registry entry. When a design adds a screen, add it here in the same commit.
import type React from 'react';

import OnboardingScreen from '../screens/OnboardingScreen';
import LearnScreen from '../screens/LearnScreen';
import PathScreen from '../screens/PathScreen';
import LessonScreen from '../screens/LessonScreen';
import LessonCompleteScreen from '../screens/LessonCompleteScreen';
import SongbookScreen from '../screens/SongbookScreen';
import PracticeScreen from '../screens/PracticeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import VoiceSettingsScreen from '../screens/VoiceSettingsScreen';
import OmrImportScreen from '../screens/OmrImportScreen';
import PaywallScreen from '../screens/PaywallScreen';
import BLEPairingScreen from '../screens/BLEPairingScreen';
import BLEPairingRoute from '../screens/BLEPairingRoute';

export interface SmokeEntry {
  /** screens/<file>.tsx — used by the completeness assertion. */
  file: string;
  route: string;
  Screen: React.ComponentType<any>;
  params?: object;
}

export const SMOKE_REGISTRY: SmokeEntry[] = [
  { file: 'OnboardingScreen', route: 'Onboarding', Screen: OnboardingScreen },
  { file: 'LearnScreen', route: 'Learn', Screen: LearnScreen },
  // PathScreen is design section 02 variant B — currently unrouted (see
  // docs/UI_MASTER_PLAN.md) but kept render-safe until a route/kill decision.
  { file: 'PathScreen', route: 'Path', Screen: PathScreen },
  {
    file: 'LessonScreen', route: 'Lesson', Screen: LessonScreen,
    params: { gradeId: 1, lessonId: 'g1-l1' },
  },
  {
    file: 'LessonCompleteScreen', route: 'LessonComplete', Screen: LessonCompleteScreen,
    params: { gradeId: 1, lessonId: 'g1-l1', xp: 20, stars: 3, message: 'Nice!' },
  },
  { file: 'SongbookScreen', route: 'Songbook', Screen: SongbookScreen },
  { file: 'PracticeScreen', route: 'Practice', Screen: PracticeScreen },
  { file: 'ProfileScreen', route: 'Profile', Screen: ProfileScreen },
  { file: 'SettingsScreen', route: 'Settings', Screen: SettingsScreen },
  { file: 'VoiceSettingsScreen', route: 'VoiceSettings', Screen: VoiceSettingsScreen },
  { file: 'OmrImportScreen', route: 'OmrImport', Screen: OmrImportScreen },
  { file: 'PaywallScreen', route: 'Paywall', Screen: PaywallScreen },
  { file: 'BLEPairingScreen', route: 'BLEPairingInner', Screen: BLEPairingScreen },
  { file: 'BLEPairingRoute', route: 'BLEPairing', Screen: BLEPairingRoute },
];
