// Piano Professor — local AuthBackend. Implements the full account flow
// (anonymous → sign up / sign in → sync) against local storage, so the UX and
// data model are real and testable today. A Firebase backend implementing the
// same AuthBackend interface replaces this without touching any screen.
import {
  Account, AuthBackend, AuthResult, StorageLike, SyncData,
  Provider, normalizeEmail, hashPassword, isValidEmail,
} from './types';

const K_CURRENT = 'pp.account.current';        // the signed-in/anonymous account
const K_USERS = 'pp.account.users';            // registered users (email → record)
const K_DATA = (uid: string) => `pp.account.data.${uid}`; // per-account synced blob

interface UserRecord { uid: string; email: string; name: string; pwHash: string; provider: Provider; }

let seq = 0;
const newUid = (p: string) => `${p}_${Date.now().toString(36)}${(seq++).toString(36)}`;

export class LocalAuthBackend implements AuthBackend {
  readonly name = 'local' as const;
  constructor(private store: StorageLike) {}

  private async users(): Promise<Record<string, UserRecord>> {
    const raw = await this.store.getItem(K_USERS);
    return raw ? (JSON.parse(raw) as Record<string, UserRecord>) : {};
  }
  private async saveUsers(u: Record<string, UserRecord>) {
    await this.store.setItem(K_USERS, JSON.stringify(u));
  }
  private async setCurrent(a: Account): Promise<Account> {
    await this.store.setItem(K_CURRENT, JSON.stringify(a));
    return a;
  }

  async init(): Promise<Account> {
    const raw = await this.store.getItem(K_CURRENT);
    if (raw) return JSON.parse(raw) as Account;
    const anon: Account = { uid: newUid('anon'), email: null, displayName: null, isAnonymous: true, provider: 'anonymous' };
    return this.setCurrent(anon);
  }

  async signUpEmail(email: string, password: string, name: string): Promise<AuthResult> {
    const e = normalizeEmail(email);
    if (!isValidEmail(e)) return { ok: false, error: 'Enter a valid email address.' };
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
    const users = await this.users();
    if (users[e]) return { ok: false, error: 'That email already has an account. Try signing in.' };
    const uid = newUid('user');
    users[e] = { uid, email: e, name: name.trim() || 'Player', pwHash: hashPassword(password), provider: 'password' };
    await this.saveUsers(users);
    const account: Account = { uid, email: e, displayName: users[e].name, isAnonymous: false, provider: 'password' };
    await this.setCurrent(account);
    return { ok: true, account };
  }

  async signInEmail(email: string, password: string): Promise<AuthResult> {
    const e = normalizeEmail(email);
    const users = await this.users();
    const rec = users[e];
    if (!rec) return { ok: false, error: 'No account found for that email.' };
    if (rec.pwHash !== hashPassword(password)) return { ok: false, error: 'Wrong password. Try again.' };
    const account: Account = { uid: rec.uid, email: rec.email, displayName: rec.name, isAnonymous: false, provider: rec.provider };
    await this.setCurrent(account);
    return { ok: true, account };
  }

  async signInProvider(provider: 'google' | 'apple'): Promise<AuthResult> {
    // Local stand-in: one stable synthetic identity per provider so the flow
    // (and cross-session restore) works end-to-end. Firebase does the real
    // OAuth handshake behind this same method.
    const e = `${provider}.user@piano.local`;
    const users = await this.users();
    let rec = users[e];
    if (!rec) {
      rec = { uid: newUid(provider), email: e, name: provider === 'google' ? 'Google User' : 'Apple User', pwHash: '', provider };
      users[e] = rec;
      await this.saveUsers(users);
    }
    const account: Account = { uid: rec.uid, email: rec.email, displayName: rec.name, isAnonymous: false, provider };
    await this.setCurrent(account);
    return { ok: true, account };
  }

  async signOut(): Promise<Account> {
    const anon: Account = { uid: newUid('anon'), email: null, displayName: null, isAnonymous: true, provider: 'anonymous' };
    return this.setCurrent(anon);
  }

  async syncUp(uid: string, data: SyncData): Promise<void> {
    await this.store.setItem(K_DATA(uid), JSON.stringify(data));
  }

  async syncDown(uid: string): Promise<SyncData | null> {
    const raw = await this.store.getItem(K_DATA(uid));
    return raw ? (JSON.parse(raw) as SyncData) : null;
  }
}
