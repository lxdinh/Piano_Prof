// Piano Professor — account state + sync orchestration.
// Sits inside AppStateProvider so it can read the household and restore it.
// Anonymous on first launch; when a real account is active it auto-syncs the
// household up, and on sign-in it restores the account's cloud copy.
import React, {
  createContext, useContext, useEffect, useMemo, useRef, useState, useCallback,
} from 'react';
import { Account, AuthResult, SyncData } from './types';
import { getAuthBackend } from './backend';
import { useApp } from '../state/AppState';
import { Profile } from '../data/content';

export interface AccountAPI {
  ready: boolean;
  account: Account | null;
  syncedAt: number | null;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInProvider: (provider: 'google' | 'apple') => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AccountAPI | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const backend = getAuthBackend();
  const { profiles, activeId, premium, importAll } = useApp();
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    backend.init().then((a) => { setAccount(a); setReady(true); }).catch(() => setReady(true));
  }, [backend]);

  const snapshot = useCallback((): SyncData => ({
    profiles: profiles as unknown[], activeId, premium, updatedAt: Date.now(),
  }), [profiles, activeId, premium]);

  // Auto-sync the household up whenever it changes (only for real accounts).
  useEffect(() => {
    if (!account || account.isAnonymous) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const data = snapshot();
      backend.syncUp(account.uid, data).then(() => setSyncedAt(data.updatedAt)).catch(() => {});
    }, 800);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [account, snapshot, backend]);

  const afterAuth = useCallback(async (res: AuthResult, claimLocal: boolean): Promise<AuthResult> => {
    if (!res.ok || !res.account) return res;
    const acc = res.account;
    const cloud = await backend.syncDown(acc.uid).catch(() => null);
    if (cloud && Array.isArray(cloud.profiles) && cloud.profiles.length) {
      importAll(cloud.profiles as Profile[], cloud.activeId, !!cloud.premium); // restore the account
      setSyncedAt(cloud.updatedAt);
    } else if (claimLocal) {
      const data = snapshot(); // claim the on-device household into the new account
      await backend.syncUp(acc.uid, data).catch(() => {});
      setSyncedAt(data.updatedAt);
    }
    setAccount(acc);
    return res;
  }, [backend, importAll, snapshot]);

  const signUp = useCallback(async (email: string, password: string, name: string) =>
    afterAuth(await backend.signUpEmail(email, password, name), true), [backend, afterAuth]);
  const signIn = useCallback(async (email: string, password: string) =>
    afterAuth(await backend.signInEmail(email, password), true), [backend, afterAuth]);
  const signInProvider = useCallback(async (p: 'google' | 'apple') =>
    afterAuth(await backend.signInProvider(p), true), [backend, afterAuth]);

  const signOut = useCallback(async () => {
    const anon = await backend.signOut();
    setAccount(anon);
    setSyncedAt(null);
  }, [backend]);

  const value = useMemo<AccountAPI>(() => ({
    ready, account, syncedAt, signUp, signIn, signInProvider, signOut,
  }), [ready, account, syncedAt, signUp, signIn, signInProvider, signOut]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccount(): AccountAPI {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAccount must be used inside <AccountProvider>');
  return v;
}
