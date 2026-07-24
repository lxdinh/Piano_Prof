// Piano Professor — backend selector.
// Returns the active AuthBackend. Local today; to go fully cloud, implement a
// FirebaseAuthBackend (same AuthBackend interface) and return it here when
// Firebase config is present — no screen or provider changes required.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthBackend, StorageLike } from './types';
import { LocalAuthBackend } from './localBackend';

const storage: StorageLike = {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
};

let instance: AuthBackend | null = null;

export function getAuthBackend(): AuthBackend {
  if (!instance) {
    // if (firebaseConfigured()) instance = new FirebaseAuthBackend();
    instance = new LocalAuthBackend(storage);
  }
  return instance;
}
