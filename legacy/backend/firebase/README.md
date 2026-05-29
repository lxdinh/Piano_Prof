# Piano Professor — Firebase backend

Firestore + Auth + Cloud Storage schema for Piano Professor. See **[SCHEMA.md](./SCHEMA.md)** for the full data
model and rationale.

```
backend/firebase/
├─ SCHEMA.md               # authoritative data-model doc
├─ firestore.rules         # Firestore security rules
├─ storage.rules           # Cloud Storage security rules
├─ firestore.indexes.json  # composite indexes
├─ firebase.json           # ties rules/indexes together + emulator config
└─ seed/catalog.example.json
```

## Prerequisites
```bash
npm install -g firebase-tools      # Firebase CLI (not yet installed on this machine)
firebase login
firebase use --add                 # pick/create the Firebase project -> writes .firebaserc
```

## Run the emulator (local verification)
```bash
cd backend/firebase
firebase emulators:start           # Auth :9099  Firestore :8080  Storage :9199  UI :4000
```
Open the Emulator UI at http://localhost:4000 and import a few docs from `seed/catalog.example.json`
(or write a tiny Admin-SDK script that walks the JSON and `set()`s each `collection/docId`).

## What to verify against the rules
- A signed-in user can read/write their own `users/{uid}/**`.
- User **A** cannot read or write user **B**'s tree (cross-user denied).
- A client write to `users/{uid}/private/subscription` is **denied** (backend-only entitlement).
- A client write to any catalog collection (`lessons`, `songs`, `subscriptionPlans`, …) is **denied**.
- `usernames/{handle}` can only be created pointing at your own uid.

## Deploy (when ready)
```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Notes
- **Entitlements** (`users/{uid}/private/subscription`) are written only by a Cloud Function reacting to a
  RevenueCat / App Store / Play Billing webhook — never by the client. That Function is out of scope for this turn.
- **OMR output** (`users/{uid}/musicxml/**`) is written only by the OMR Function; clients upload sources to
  `users/{uid}/uploads/**` and read the synthesized MusicXML back.
