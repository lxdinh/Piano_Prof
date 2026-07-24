// Piano Professor — backend selector.
// Returns the active AuthBackend. Local today; to go fully cloud, implement a
// FirebaseAuthBackend (same AuthBackend interface) and return it here when
// Firebase config is present — no screen or provider changes required.
import { AuthBackend } from './types';
import { LocalAuthBackend } from './localBackend';
import { firebaseConfigured } from './firebaseConfig';
import { accountStorage } from '../security/secureStore';

// Credentials/identity persist in the OS keystore; the synced progress blob
// stays in AsyncStorage. See src/security/secureStore.ts.
const storage = accountStorage;

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
