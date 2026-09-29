import { LocalAuthBackend } from '../account/localBackend';
import { StorageLike, SyncData, isValidEmail, hashPassword } from '../account/types';

function memStore(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: async (k) => m.get(k) ?? null,
    setItem: async (k, v) => { m.set(k, v); },
    removeItem: async (k) => { m.delete(k); },
  };
}

const data = (n: number): SyncData => ({ profiles: [{ id: 'p1' }], activeId: 'p1', premium: n > 0, updatedAt: n });

describe('email validation & hashing', () => {
  it('validates emails', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('nope')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
  });
  it('never returns the raw password and is stable', () => {
    expect(hashPassword('secret123')).not.toContain('secret');
    expect(hashPassword('secret123')).toBe(hashPassword('secret123'));
    expect(hashPassword('secret123')).not.toBe(hashPassword('secret124'));
  });
});

describe('LocalAuthBackend', () => {
  it('starts anonymous', async () => {
    const b = new LocalAuthBackend(memStore());
    const a = await b.init();
    expect(a.isAnonymous).toBe(true);
    expect(a.provider).toBe('anonymous');
  });

  it('persists the current account across instances (same store)', async () => {
    const store = memStore();
    const a1 = await new LocalAuthBackend(store).init();
    const a2 = await new LocalAuthBackend(store).init();
    expect(a2.uid).toBe(a1.uid); // survives an app restart
  });

  it('signs up, rejects duplicates and short passwords', async () => {
    const b = new LocalAuthBackend(memStore());
    await b.init();
    const ok = await b.signUpEmail('Ava@Example.com', 'sixchars', 'Ava');
    expect(ok.ok).toBe(true);
    expect(ok.account?.email).toBe('ava@example.com'); // normalized
    expect(ok.account?.isAnonymous).toBe(false);
    expect((await b.signUpEmail('ava@example.com', 'another', 'Ava')).ok).toBe(false); // dup
    expect((await b.signUpEmail('x@y.com', '123', 'X')).ok).toBe(false); // too short
  });

  it('signs in with the right password only', async () => {
    const b = new LocalAuthBackend(memStore());
    await b.signUpEmail('leo@x.com', 'password', 'Leo');
    await b.signOut();
    expect((await b.signInEmail('leo@x.com', 'wrong')).ok).toBe(false);
    expect((await b.signInEmail('nobody@x.com', 'password')).ok).toBe(false);
    const ok = await b.signInEmail('leo@x.com', 'password');
    expect(ok.ok).toBe(true);
    expect(ok.account?.displayName).toBe('Leo');
  });

  it('signOut returns a fresh anonymous account', async () => {
    const b = new LocalAuthBackend(memStore());
    await b.signUpEmail('m@x.com', 'password', 'Mum');
    const anon = await b.signOut();
    expect(anon.isAnonymous).toBe(true);
  });

  it('syncs data up and back down per account, isolated by uid', async () => {
    const b = new LocalAuthBackend(memStore());
    const up = await b.signUpEmail('sync@x.com', 'password', 'S');
    const uid = up.account!.uid;
    expect(await b.syncDown(uid)).toBeNull();
    await b.syncUp(uid, data(5));
    const down = await b.syncDown(uid);
    expect(down?.updatedAt).toBe(5);
    expect(down?.premium).toBe(true);
    expect(await b.syncDown('other-uid')).toBeNull(); // isolation
  });

  it('provider sign-in is stable across sessions (restores the same identity)', async () => {
    const store = memStore();
    const first = await new LocalAuthBackend(store).signInProvider('google');
    const second = await new LocalAuthBackend(store).signInProvider('google');
    expect(second.account?.uid).toBe(first.account?.uid);
    expect(second.account?.provider).toBe('google');
  });
});
