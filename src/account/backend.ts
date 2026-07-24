// Piano Professor — backend selector.
// Returns the active AuthBackend. Local today; to go fully cloud, implement a
// FirebaseAuthBackend (same AuthBackend interface) and return it here when
// Firebase config is present — no screen or provider changes required.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthBackend, StorageLike } from './types';
import { LocalAuthBackend } from './localBackend';
import { firebaseConfigured } from './firebaseConfig';

const storage: StorageLike = {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
};

let instance: AuthBackend | null = null;

export function getAuthBackend(): AuthBackend {
  if (!instance) {
    if (firebaseConfigured()) {
      // Real cloud accounts + sync. Loaded lazily so the Firebase SDK only
      // initializes when you've actually pasted a config in firebaseConfig.ts.
      const { FirebaseAuthBackend } = require('./firebaseBackend') as typeof import('./firebaseBackend');
      instance = new FirebaseAuthBackend();
    } else {
      instance = new LocalAuthBackend(storage);
    }
  }
  return instance;
}

/** Which backend is live — handy for showing "Cloud" vs "On this device". */
export function backendName(): 'local' | 'firebase' {
  return firebaseConfigured() ? 'firebase' : 'local';
}
