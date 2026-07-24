import { createChunkedStore, routedStorage, sanitizeKey, KVLike } from '../security/chunkedStore';
import { StorageLike } from '../account/types';

/** In-memory KV standing in for the OS keystore. */
function fakeKV(): KVLike & { dump: () => Record<string, string> } {
  const m = new Map<string, string>();
  return {
    get: async (k) => (m.has(k) ? m.get(k)! : null),
    set: async (k, v) => { m.set(k, v); },
    del: async (k) => { m.delete(k); },
    dump: () => Object.fromEntries(m),
  };
}

function memStorage(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: async (k) => (m.has(k) ? m.get(k)! : null),
    setItem: async (k, v) => { m.set(k, v); },
    removeItem: async (k) => { m.delete(k); },
  };
}

describe('sanitizeKey', () => {
  it('keeps keystore-legal chars, replaces the rest', () => {
    expect(sanitizeKey('pp.account.current')).toBe('pp.account.current');
    expect(sanitizeKey('a b/c:d')).toBe('a_b_c_d');
  });
});

describe('createChunkedStore', () => {
  it('round-trips a small value inline (no chunk marker)', async () => {
    const kv = fakeKV();
    const s = createChunkedStore(kv, 100);
    await s.setItem('pp.account.current', 'hello');
    expect(await s.getItem('pp.account.current')).toBe('hello');
    expect(kv.dump()['pp.account.current']).toBe('hello'); // stored inline
  });

  it('splits a large value across chunks and reassembles it exactly', async () => {
    const kv = fakeKV();
    const s = createChunkedStore(kv, 10);
    const big = 'x'.repeat(95); // 10 chunks (9 full + 1 partial)
    await s.setItem('k', big);
    expect(kv.dump()['k']).toBe('§chunks:10');
    expect(kv.dump()['k.0']).toHaveLength(10);
    expect(await s.getItem('k')).toBe(big);
  });

  it('overwriting a chunked value with a small one leaves no stale chunks', async () => {
    const kv = fakeKV();
    const s = createChunkedStore(kv, 10);
    await s.setItem('k', 'y'.repeat(45)); // chunked
    await s.setItem('k', 'small');        // now inline
    expect(await s.getItem('k')).toBe('small');
    expect(Object.keys(kv.dump()).filter((x) => x.startsWith('k.'))).toHaveLength(0);
  });

  it('removeItem clears the marker and every chunk', async () => {
    const kv = fakeKV();
    const s = createChunkedStore(kv, 10);
    await s.setItem('k', 'z'.repeat(35));
    await s.removeItem!('k');
    expect(await s.getItem('k')).toBeNull();
    expect(Object.keys(kv.dump())).toHaveLength(0);
  });

  it('returns null for a missing key', async () => {
    const s = createChunkedStore(fakeKV());
    expect(await s.getItem('nope')).toBeNull();
  });
});

describe('routedStorage', () => {
  it('sends secret keys to secure storage and the rest to plain', async () => {
    const secure = memStorage();
    const plain = memStorage();
    const isSecret = (k: string) => k.startsWith('pp.account.');
    const s = routedStorage(secure, plain, isSecret);

    await s.setItem('pp.account.current', 'identity');
    await s.setItem('pp.appstate.v1', 'progress');

    expect(await secure.getItem('pp.account.current')).toBe('identity');
    expect(await plain.getItem('pp.account.current')).toBeNull();
    expect(await plain.getItem('pp.appstate.v1')).toBe('progress');
    expect(await secure.getItem('pp.appstate.v1')).toBeNull();
    // reads route the same way
    expect(await s.getItem('pp.account.current')).toBe('identity');
  });
});
