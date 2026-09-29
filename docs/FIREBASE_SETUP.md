# Turning on real cloud accounts (Firebase)

The app ships with a **local** account backend so everything works offline and
in development. To enable real accounts + cross-device sync, create a Firebase
project and paste its config. No app code changes are needed — the backend
selector switches automatically once the config is present.

## 1. Create the project
1. <https://console.firebase.google.com> → **Add project**.
2. **Build → Authentication → Get started**, then enable:
   - **Anonymous** (required — every user starts anonymous)
   - **Email/Password**
   - *(optional)* **Google** and **Apple** for social sign-in.
3. **Build → Firestore Database → Create database** (Production mode is fine).

## 2. Get the Web config
Project settings (⚙️) → **General → Your apps → Web app** (create one if needed)
→ **SDK setup and configuration → Config**. You'll get:

```js
{ apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId }
```

## 3. Paste it
Put those values in **`src/account/firebaseConfig.ts`** (`FIREBASE_CONFIG`).
That's it — on next launch `getAuthBackend()` returns the Firebase backend.
Leaving it empty keeps the local backend, so this is safe to commit blank.

## 4. Firestore security rules
Each household document is private to its owner. In **Firestore → Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /households/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Progress syncs to `households/{uid}` — one document per account holding the
family profiles, active profile, and premium flag.

## 5. (Optional) Google / Apple sign-in
Email/password + anonymous work out of the box. Social sign-in needs OAuth
client IDs and a token step:

- **Google:** add `expo-auth-session`, create an OAuth client ID, get an
  `idToken`, then in `firebaseBackend.signInProvider`:
  `signInWithCredential(auth, GoogleAuthProvider.credential(idToken))`.
- **Apple:** add `expo-apple-authentication`, request the credential, then
  `signInWithCredential(auth, new OAuthProvider('apple.com').credential({ idToken }))`.

Until then the two buttons return a clear "needs OAuth setup" message.

## Notes
- `metro.config.js` already has the Firebase JS SDK fix
  (`sourceExts += 'cjs'`, `unstable_enablePackageExports = false`).
- Auth persists between launches via AsyncStorage
  (`getReactNativePersistence`), so users stay signed in.
- The whole client (screens, provider, sync engine) is unchanged between the
  local and Firebase backends — they implement the same `AuthBackend` interface.
