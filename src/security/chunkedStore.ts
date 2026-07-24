// Piano Professor — chunked key/value storage (pure, testable).
//
// Secure keystores (iOS Keychain / Android Keystore via expo-secure-store) cap
// a single value at ~2KB on Android. This wraps any small-value KV store into a
// StorageLike that transparently splits large values across numbered chunks, so
// credentials/tokens of any size persist securely. No native imports here — the
// native SecureStore KV is injected (see secureStore.ts), which also keeps this
// unit-testable with an in-memory fake.
import { StorageLike } from '../account/types';

/** Minimal async key/value primitive a secure store must provide. */
export interface KVLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

const META = '§chunks:'; // marker stored at the base key when a value was split
// SecureStore keys must be [A-Za-z0-9._-]; sanitize app keys like "pp.account.current".
export const sanitizeKey = (k: string) => k.replace(/[^A-Za-z0-9._-]/g, '_');

export function createChunkedStore(kv: KVLike, chunkSize = 1800): StorageLike {
  return {
    async getItem(key) {
      const k = sanitizeKey(key);
      const head = await kv.get(k);
      if (head === null) return null;
      if (!head.startsWith(META)) return head; // stored inline
      const n = parseInt(head.slice(META.length), 10) || 0;
      let out = '';
      for (let i = 0; i < n; i++) out += (await kv.get(`${k}.${i}`)) ?? '';
      return out;
    },
    async setItem(key, value) {
      const k = sanitizeKey(key);
      await this.removeItem!(key); // clear any prior chunks so counts never drift
      if (value.length <= chunkSize) {
        await kv.set(k, value);
        return;
      }
      const n = Math.ceil(value.length / chunkSize);
      await kv.set(k, `${META}${n}`);
      for (let i = 0; i < n; i++) {
        await kv.set(`${k}.${i}`, value.slice(i * chunkSize, (i + 1) * chunkSize));
      }
    },
    async removeItem(key) {
      const k = sanitizeKey(key);
      const head = await kv.get(k);
      if (head?.startsWith(META)) {
        const n = parseInt(head.slice(META.length), 10) || 0;
        for (let i = 0; i < n; i++) await kv.del(`${k}.${i}`);
      }
      await kv.del(k);
    },
  };
}

/** Route sensitive keys to `secure`, everything else to `plain`. */
export function routedStorage(
  secure: StorageLike,
  plain: StorageLike,
  isSecret: (key: string) => boolean,
): StorageLike {
  const pick = (key: string) => (isSecret(key) ? secure : plain);
  return {
    getItem: (k) => pick(k).getItem(k),
    setItem: (k, v) => pick(k).setItem(k, v),
    removeItem: (k) => pick(k).removeItem!(k),
  };
}
