// Piano Professor — account & sync contracts.
// Efficient-app pattern (Duolingo-style): the app is fully usable with an
// anonymous, on-device account; an optional real account upgrades it and
// syncs progress across devices. The AuthBackend interface is swappable —
// a local implementation runs today; a Firebase implementation drops in later
// with zero screen changes.

export type Provider = 'anonymous' | 'password' | 'google' | 'apple';

export interface Account {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  provider: Provider;
}

export interface AuthResult {
  ok: boolean;
  account?: Account;
  error?: string;
}

/** The app-state blob that syncs to/from the cloud (household + progress). */
export interface SyncData {
  profiles: unknown[];
  activeId: string | null;
  premium: boolean;
  updatedAt: number;
}

export interface StorageLike {
  getItem(k: string): Promise<string | null>;
  setItem(k: string, v: string): Promise<void>;
  removeItem(k: string): Promise<void>;
}

export interface AuthBackend {
  readonly name: 'local' | 'firebase';
  /** Return the current account, creating an anonymous one on first launch. */
  init(): Promise<Account>;
  signUpEmail(email: string, password: string, name: string): Promise<AuthResult>;
  signInEmail(email: string, password: string): Promise<AuthResult>;
  /** OAuth (Google/Apple). Local impl simulates; Firebase does the real flow. */
  signInProvider(provider: 'google' | 'apple'): Promise<AuthResult>;
  /** Sign out → return to a fresh anonymous account. */
  signOut(): Promise<Account>;
  /** Push the household/progress blob to the account's cloud record. */
  syncUp(uid: string, data: SyncData): Promise<void>;
  /** Pull the account's cloud record (null if none yet). */
  syncDown(uid: string): Promise<SyncData | null>;
}

export const normalizeEmail = (e: string) => e.trim().toLowerCase();

// Non-cryptographic hash — a stand-in so the local demo never stores a raw
// password. Real credential security is handled by Firebase Auth, not here.
export function hashPassword(pw: string): string {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h + pw.charCodeAt(i)) | 0;
  return `h${(h >>> 0).toString(36)}`;
}

export function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}
