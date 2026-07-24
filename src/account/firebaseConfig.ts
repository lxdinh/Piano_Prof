// Piano Professor — Firebase config.
//
// Paste your Firebase *Web app* config here to turn on real cloud accounts +
// cross-device sync. Until apiKey/projectId/appId are filled in, the app
// automatically uses the local backend, so nothing breaks while this is empty.
//
// Where to get it: Firebase console → Project settings → "Your apps" → Web app
// → SDK setup and configuration → Config. See docs/FIREBASE_SETUP.md.

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

export const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

export function firebaseConfigured(): boolean {
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.appId);
}
