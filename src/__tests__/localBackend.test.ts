import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalBackend } from '../services/localBackend';
import { makeDefaultProfile, LessonProgress } from '../services/types';

// Use the official in-memory AsyncStorage mock so the registry logic runs in
// the plain-node test environment.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const completed: LessonProgress = {
  status: 'completed', stars: 3, bestAccuracy: 1, attempts: 1,
  lastStepIndex: 0, xpEarned: 50, firstCompletedAt: 1, lastPlayedAt: 1,
};

describe('LocalBackend family profiles', () => {
  let backend: LocalBackend;

  beforeEach(async () => {
    await AsyncStorage.clear();
    backend = new LocalBackend();
  });

  it('returns null from ensureRegistry on a fresh install', async () => {
    expect(await backend.ensureRegistry()).toBeNull();
    expect(await backend.listProfiles()).toEqual([]);
  });

  it('creates profiles, lists them, and seeds a default profile record', async () => {
    const a = await backend.createProfile('Emma', 'cool');
    const b = await backend.createProfile('Liam', 'cheer');

    const list = await backend.listProfiles();
    expect(list.map((p) => p.displayName)).toEqual(['Emma', 'Liam']);

    const profile = await backend.loadProfile(a.uid);
    expect(profile?.displayName).toBe('Emma');
    expect(profile?.avatarId).toBe('cool');
    expect(b.uid).not.toBe(a.uid);
  });

  it('keeps each profile’s progress isolated', async () => {
    const a = await backend.createProfile('Emma', 'cool');
    const b = await backend.createProfile('Liam', 'cheer');

    await backend.saveLessonProgress(a.uid, 'g1-l1', completed);

    expect(await backend.loadLessonProgress(a.uid)).toHaveProperty('g1-l1');
    expect(await backend.loadLessonProgress(b.uid)).toEqual({});
  });

  it('switches the active profile', async () => {
    const a = await backend.createProfile('Emma', 'cool');
    const b = await backend.createProfile('Liam', 'cheer');

    await backend.setActiveUid(a.uid);
    expect(await backend.getActiveUid()).toBe(a.uid);
    await backend.setActiveUid(b.uid);
    expect(await backend.getActiveUid()).toBe(b.uid);
  });

  it('deletes a profile and wipes its subtree, re-pointing the active uid', async () => {
    const a = await backend.createProfile('Emma', 'cool');
    const b = await backend.createProfile('Liam', 'cheer');
    await backend.saveLessonProgress(a.uid, 'g1-l1', completed);
    await backend.setActiveUid(a.uid);

    await backend.deleteProfile(a.uid);

    expect((await backend.listProfiles()).map((p) => p.uid)).toEqual([b.uid]);
    expect(await backend.loadProfile(a.uid)).toBeNull();
    expect(await backend.loadLessonProgress(a.uid)).toEqual({});
    // active uid falls back to the remaining profile
    expect(await backend.getActiveUid()).toBe(b.uid);
  });

  it('migrates a legacy single-uid install into the registry', async () => {
    const legacyUid = 'local-legacy';
    await AsyncStorage.setItem('pp.localUid', legacyUid);
    const legacyProfile = makeDefaultProfile(legacyUid);
    legacyProfile.displayName = 'Old Account';
    legacyProfile.totalXp = 999;
    await backend.saveProfile(legacyProfile);

    const active = await backend.ensureRegistry();
    expect(active).toBe(legacyUid);

    const list = await backend.listProfiles();
    expect(list).toHaveLength(1);
    expect(list[0].displayName).toBe('Old Account');
    // progress preserved
    expect((await backend.loadProfile(legacyUid))?.totalXp).toBe(999);
  });
});
