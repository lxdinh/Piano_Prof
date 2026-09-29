// Piano Professor — secure storage for the account backend.
//
// Credentials/identity go to the OS keystore (iOS Keychain / Android Keystore)
// via expo-secure-store; the large, non-secret synced progress blob stays in
// AsyncStorage. If SecureStore isn't available (web / unsupported), we fall back
// to AsyncStorage so the app still works. This is the only file that imports the
// native module — the chunking logic lives in chunkedStore.ts (pure, tested).
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageLike } from '../account/types';
import { KVLike, createChunkedStore, routedStorage } from './chunkedStore';

const plain: StorageLike = {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
};

let available: boolean | null = null;
async function secureAvailable(): Promise<boolean> {
  if (available === null) {
    try {
      available = await SecureStore.isAvailableAsync();
    } catch {
      available = false;
    }
  }
  return available;
}

// expo-secure-store exposed as the KVLike the chunked store needs. When the
// keystore is unavailable, transparently proxy to AsyncStorage.
const secureKV: KVLike = {
  async get(key) {
    return (await secureAvailable()) ? SecureStore.getItemAsync(key) : AsyncStorage.getItem(key);
  },
  async set(key, value) {
    if (await secureAvailable()) await SecureStore.setItemAsync(key, value);
    else await AsyncStorage.setItem(key, value);
  },
  async del(key) {
    if (await secureAvailable()) await SecureStore.deleteItemAsync(key);
    else await AsyncStorage.removeItem(key);
  },
};

/** Keystore-backed StorageLike (chunked to clear the ~2KB per-item limit). */
export const secureStorage: StorageLike = createChunkedStore(secureKV);

/** Keys holding credentials/identity — routed to the secure keystore. */
export const isSecretKey = (key: string) =>
  key === 'pp.account.users' || key === 'pp.account.current';

/**
 * Account-backend storage: secrets → keystore, everything else → AsyncStorage.
 * Drop-in replacement for the plain AsyncStorage StorageLike backend.ts used.
 */
export const accountStorage: StorageLike = routedStorage(secureStorage, plain, isSecretKey);
