// Piano Professor — screen registry (name → component) for the router.
import { ScreenRegistry } from './Router';
import Splash from '../views/Splash';
import Who from '../views/Who';
import Home from '../views/Home';
import {
  Songs, Practice, ProfileScreen, CreateProfile, Onboarding, Placement,
  PlacementResult, CoursePath, Lesson, LessonComplete, Paywall, Pair, Settings,
} from '../views/stubs';

export const registry: ScreenRegistry = {
  splash: Splash,
  who: Who,
  home: Home,
  songs: Songs,
  practice: Practice,
  profile: ProfileScreen,
  createProfile: CreateProfile,
  editProfile: CreateProfile,
  onboarding: Onboarding,
  placement: Placement,
  placementResult: PlacementResult,
  coursePath: CoursePath,
  lesson: Lesson,
  complete: LessonComplete,
  paywall: Paywall,
  pair: Pair,
  settings: Settings,
};
