// Piano Professor — Firebase AuthBackend. Same interface as the local backend,
// so selecting it (backend.ts, once firebaseConfig is filled in) turns on real
// accounts + cross-device sync with no screen or provider changes.
//
// Auth: Firebase Auth (anonymous + email/password fully wired; Google/Apple
// need OAuth client IDs — see docs/FIREBASE_SETUP.md).
// Sync: one Firestore document per household at households/{uid}.
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth, initializeAuth, signInAnonymously,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, signOut as fbSignOut, onAuthStateChanged, User, Auth,
} from 'firebase/auth';
// getReactNativePersistence exists at runtime in firebase/auth but isn't in the
// package's type surface — import it loosely.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getReactNativePersistence } = require('firebase/auth') as {
  getReactNativePersistence: (s: unknown) => unknown;
};
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from './firebaseConfig';
import {
  Account, AuthBackend, AuthResult, SyncData, Provider, normalizeEmail,
} from './types';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function ensure(): { auth: Auth; db: Firestore } {
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
    try {
      auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) as never });
    } catch {
      auth = getAuth(app); // already initialized (fast refresh / re-entry)
    }
  }
  return { auth: auth ?? getAuth(app), db: getFirestore(app) };
}

function toAccount(u: User): Account {
  const pid = u.providerData[0]?.providerId ?? '';
  const provider: Provider = u.isAnonymous ? 'anonymous'
    : pid.includes('google') ? 'google'
    : pid.includes('apple') ? 'apple' : 'password';
  return { uid: u.uid, email: u.email, displayName: u.displayName, isAnonymous: u.isAnonymous, provider };
}

function friendly(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/email-already-in-use': return 'That email already has an account. Try signing in.';
    case 'auth/invalid-email': return 'Enter a valid email address.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/user-not-found': return 'No account found for that email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Wrong email or password.';
    case 'auth/network-request-failed': return 'Network error — check your connection.';
    default: return 'Something went wrong. Please try again.';
  }
}

export class FirebaseAuthBackend implements AuthBackend {
  readonly name = 'firebase' as const;

  async init(): Promise<Account> {
    const { auth: a } = ensure();
    const current = a.currentUser ?? (await new Promise<User | null>((resolve) => {
      const unsub = onAuthStateChanged(a, (u) => { unsub(); resolve(u); });
    }));
    if (current) return toAccount(current);
    const cred = await signInAnonymously(a);
    return toAccount(cred.user);
  }

  async signUpEmail(email: string, password: string, name: string): Promise<AuthResult> {
    try {
      const { auth: a } = ensure();
      const cred = await createUserWithEmailAndPassword(a, normalizeEmail(email), password);
      if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      return { ok: true, account: toAccount(cred.user) };
    } catch (e) { return { ok: false, error: friendly(e) }; }
  }

  async signInEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const { auth: a } = ensure();
      const cred = await signInWithEmailAndPassword(a, normalizeEmail(email), password);
      return { ok: true, account: toAccount(cred.user) };
    } catch (e) { return { ok: false, error: friendly(e) }; }
  }

  async signInProvider(provider: 'google' | 'apple'): Promise<AuthResult> {
    // Getting the OAuth credential needs client IDs + expo-auth-session (Google)
    // / expo-apple-authentication (Apple); once you have the idToken, call
    // signInWithCredential(auth, GoogleAuthProvider.credential(idToken)).
    return { ok: false, error: `${provider === 'google' ? 'Google' : 'Apple'} sign-in needs OAuth setup — see docs/FIREBASE_SETUP.md` };
  }

  async signOut(): Promise<Account> {
    const { auth: a } = ensure();
    await fbSignOut(a);
    return this.init(); // back to a fresh anonymous account
  }

  async syncUp(uid: string, data: SyncData): Promise<void> {
    const { db } = ensure();
    await setDoc(doc(db, 'households', uid), data, { merge: true });
  }

  async syncDown(uid: string): Promise<SyncData | null> {
    const { db } = ensure();
    const snap = await getDoc(doc(db, 'households', uid));
    return snap.exists() ? (snap.data() as SyncData) : null;
  }
}
