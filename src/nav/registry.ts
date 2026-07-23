// Piano Professor — screen registry (name → component) for the router.
import { ScreenRegistry } from './Router';
import Splash from '../views/Splash';
import Who from '../views/Who';
import Home from '../views/Home';
import Lesson from '../views/Lesson';
import Complete from '../views/Complete';
import CreateProfile from '../views/CreateProfile';
import Onboarding from '../views/Onboarding';
import Placement from '../views/Placement';
import PlacementResult from '../views/PlacementResult';
import CoursePath from '../views/CoursePath';
import { Songs, Practice, ProfileScreen, Paywall, Pair, Settings } from '../views/stubs';

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
  complete: Complete,
  paywall: Paywall,
  pair: Pair,
  settings: Settings,
};
