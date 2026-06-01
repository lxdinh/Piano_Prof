import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { localBackend } from '../services/localBackend';
import { ProfileSummary } from '../services/types';

// Owns the local "family" of profiles and which one is active. Sits above
// UserProvider; when `activeUid` changes, UserProvider reloads that profile's
// data. Keeps navigation simple — switching is just setting the active uid.

interface ProfilesContextValue {
  ready: boolean;
  profiles: ProfileSummary[];
  activeUid: string | null;
  switchProfile: (uid: string) => Promise<void>;
  /** Create a profile, make it active, and return it (caller routes to placement). */
  addProfile: (displayName: string, avatarId: string) => Promise<ProfileSummary>;
  removeProfile: (uid: string) => Promise<void>;
}

const ProfilesCtx = createContext<ProfilesContextValue | null>(null);

export function ProfilesProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [activeUid, setActiveUid] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const active = await localBackend.ensureRegistry();
      const list = await localBackend.listProfiles();
      setProfiles(list);
      setActiveUid(active);
      setReady(true);
    })();
  }, []);

  const switchProfile = useCallback(async (uid: string) => {
    await localBackend.setActiveUid(uid);
    setActiveUid(uid);
  }, []);

  const addProfile = useCallback(async (displayName: string, avatarId: string) => {
    const summary = await localBackend.createProfile(displayName, avatarId);
    await localBackend.setActiveUid(summary.uid);
    setProfiles(await localBackend.listProfiles());
    setActiveUid(summary.uid);
    return summary;
  }, []);

  const removeProfile = useCallback(async (uid: string) => {
    await localBackend.deleteProfile(uid);
    const list = await localBackend.listProfiles();
    setProfiles(list);
    setActiveUid(await localBackend.getActiveUid());
  }, []);

  const value = useMemo<ProfilesContextValue>(() => ({
    ready, profiles, activeUid, switchProfile, addProfile, removeProfile,
  }), [ready, profiles, activeUid, switchProfile, addProfile, removeProfile]);

  return <ProfilesCtx.Provider value={value}>{children}</ProfilesCtx.Provider>;
}

export function useProfiles(): ProfilesContextValue {
  const ctx = useContext(ProfilesCtx);
  if (!ctx) throw new Error('useProfiles must be used inside <ProfilesProvider>');
  return ctx;
}
