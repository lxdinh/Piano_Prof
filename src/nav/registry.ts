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
import Songs from '../views/Songs';
import SongPreview from '../views/SongPreview';
import ImportSheet from '../views/ImportSheet';
import Practice from '../views/Practice';
import ProfileView from '../views/ProfileView';
import Paywall from '../views/Paywall';
import Upsell from '../views/Upsell';
import ManageSub from '../views/ManageSub';
import Pair from '../views/Pair';
import Calibration from '../views/Calibration';
import LedSettings from '../views/LedSettings';
import Settings from '../views/Settings';
import Diploma from '../views/Diploma';
import Account from '../views/Account';
import SignIn from '../views/SignIn';
import Quests from '../views/Quests';
import Shop from '../views/Shop';
import Leaderboard from '../views/Leaderboard';
import Streak from '../views/Streak';

export const registry: ScreenRegistry = {
  splash: Splash,
  who: Who,
  home: Home,
  songs: Songs,
  songPreview: SongPreview,
  import: ImportSheet,
  practice: Practice,
  profile: ProfileView,
  createProfile: CreateProfile,
  editProfile: CreateProfile,
  onboarding: Onboarding,
  placement: Placement,
  placementResult: PlacementResult,
  coursePath: CoursePath,
  lesson: Lesson,
  complete: Complete,
  paywall: Paywall,
  upsell: Upsell,
  manageSub: ManageSub,
  pair: Pair,
  calibration: Calibration,
  ledSettings: LedSettings,
  settings: Settings,
  diploma: Diploma,
  account: Account,
  signIn: SignIn,
  quests: Quests,
  shop: Shop,
  leaderboard: Leaderboard,
  streak: Streak,
};
