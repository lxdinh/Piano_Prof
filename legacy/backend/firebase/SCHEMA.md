# Piano Professor — Firebase Data Model

Authoritative schema for the **Piano Professor** backend. Stack: **Firebase Auth** (credentials),
**Cloud Firestore** (data), **Cloud Storage** (uploaded PDFs/photos + synthesized MusicXML).

Design rules:
- **One document per user** under `users/{uid}`, holding profile + the hot gamification counters the UI reads on
  every screen (streak, XP, gems, hearts). Heavier/append-only data lives in **subcollections** so the user doc
  stays small and cheap to read.
- **`{uid}` always equals the Firebase Auth UID.** Rules enforce that a signed-in user can only touch their own
  tree.
- **Money is never trusted from the client.** The entitlement that unlocks paid tiers lives at
  `users/{uid}/private/subscription` and is **writable only by the backend** (a Cloud Function reacting to a
  RevenueCat / App Store / Play webhook). The client may read it but never write it.
- **Static content** (lessons, songs, achievement/quest definitions, subscription plans & regional prices) lives in
  **top-level catalog collections**, world-readable to signed-in users and writable only by admins/Functions.
- Timestamps are Firestore `timestamp`. Dates used as keys/buckets are `YYYY-MM-DD` **strings in the user's
  timezone** (so streak math is stable across devices).

Legend: `ts`=timestamp, `str`=string, `int`/`num`, `bool`, `map`, `ref`=document reference (stored as path str).

---

## 1. `users/{uid}` — profile + gamification (one doc per user)

| field | type | notes |
|---|---|---|
| `uid` | str | mirror of Auth uid (handy for collectionGroup queries) |
| `username` | str | unique handle, e.g. `maya_keys` (uniqueness enforced via `usernames/{username}`) |
| `displayName` | str | |
| `email` | str | mirror of Auth email (Auth is source of truth for credentials) |
| `avatarId` | str | id into bundled avatar set (`avatar_1`…), or Storage path |
| `country` | str | ISO-3166 alpha-2, e.g. `JP` — drives the paywall price bracket |
| `locale` | str | BCP-47, e.g. `en-US` |
| `timezone` | str | IANA tz, e.g. `Asia/Tokyo` — used for streak/day bucketing |
| `grade` | int | current skill grade 1–12 |
| `currentLessonId` | str | resume pointer for cross-device sync (→ `lessons/{id}`) |
| `createdAt` | ts | |
| `updatedAt` | ts | |
| **gamification** | | |
| `streakCount` | int | consecutive active days |
| `longestStreak` | int | |
| `lastActiveDate` | str | `YYYY-MM-DD` (local) of last counted activity |
| `streakFreezes` | int | owned freezes (Duolingo-style streak insurance) |
| `totalXp` | int | lifetime XP |
| `gems` | int | soft currency |
| `hearts` | map | `{ count:int(0–5), max:int, nextRefillAt:ts|null, unlimited:bool }` |
| **settings** | map | `{ ledBrightness:int(0–100), colorTheme:str, instructorVoice:str, metronomeSound:str, autoPlayExamples:bool, darkMode:bool, dailyGoalMinutes:int, reminderTime:str("HH:mm")|null, soundVolume:str }` |

### 1a. `users/{uid}/lessonProgress/{lessonId}`
Per-lesson progress. `{lessonId}` matches `lessons/{lessonId}`.

| field | type | notes |
|---|---|---|
| `status` | str | `locked` \| `available` \| `completed` |
| `stars` | int | 0–3 |
| `bestAccuracy` | num | 0–1 |
| `attempts` | int | |
| `lastStepIndex` | int | **resume point** within the lesson (cross-device) |
| `xpEarned` | int | |
| `firstCompletedAt` | ts \| null | |
| `lastPlayedAt` | ts | |

### 1b. `users/{uid}/dailyActivity/{YYYY-MM-DD}`
One doc per active local day → powers the streak calendar + daily-goal ring.

| field | type | notes |
|---|---|---|
| `date` | str | `YYYY-MM-DD` (local) |
| `minutesPracticed` | int | |
| `lessonsCompleted` | int | |
| `xpEarned` | int | |
| `streakMaintained` | bool | true once the daily goal was met |

### 1c. `users/{uid}/quests/{questId}`
Live instances of daily/weekly quests (defined by `questTemplates/{id}`).

| field | type | notes |
|---|---|---|
| `templateId` | str | → `questTemplates/{id}` |
| `period` | str | `daily` \| `weekly` |
| `progress` | int | |
| `goal` | int | |
| `completed` | bool | |
| `rewardClaimed` | bool | |
| `expiresAt` | ts | |

### 1d. `users/{uid}/achievements/{achievementId}`
Unlocked / in-progress achievements (defined by `achievementsCatalog/{id}`).

| field | type | notes |
|---|---|---|
| `level` | int | current tier reached |
| `progress` | num | 0–1 toward next level |
| `unlockedAt` | ts \| null | |

### 1e. `users/{uid}/devices/{deviceId}`
Paired LED hardware modules. `{deviceId}` = stable BLE id (or a hash of it).

| field | type | notes |
|---|---|---|
| `name` | str | advertised name, e.g. `Piano-Prof-A8F2` |
| `bleId` | str | platform BLE identifier (Android MAC / iOS UUID / web id) |
| `ledCount` | int | from Device-Status characteristic, e.g. 60 |
| `firmwareVersion` | str | `"major.minor"` |
| `calibration` | map | `{ octaveStartMidi:int, keyToLedOffset:int, reversed:bool }` |
| `lastConnectedAt` | ts | |

### 1f. `users/{uid}/library/{itemId}`
User-uploaded sheet music. The binary lives in Cloud Storage; this doc is the index + OMR job status.

| field | type | notes |
|---|---|---|
| `title` | str | |
| `source` | str | `pdfUpload` \| `photoOmr` \| `import` |
| `status` | str | `uploaded` \| `processing` \| `ready` \| `failed` |
| `originalAssetPath` | str | Storage path of the uploaded PDF/photo (`users/{uid}/uploads/...`) |
| `musicXmlPath` | str \| null | Storage path of synthesized MusicXML (`users/{uid}/musicxml/...`) |
| `omrJobId` | str \| null | id of the OMR processing job |
| `errorMessage` | str \| null | populated when `status == failed` |
| `difficulty` | str \| null | `easy` \| `medium` \| `hard` |
| `durationSec` | int \| null | |
| `createdAt` | ts | |
| `updatedAt` | ts | |

### 1g. `users/{uid}/private/subscription` — **client read-only**
Entitlement state. Written **only** by the backend (RevenueCat/store webhook → Cloud Function). The `private`
subcollection is fully blocked from client writes by rules.

| field | type | notes |
|---|---|---|
| `tier` | str | `free` \| `super` \| `max` (mirrors Duolingo Super / Max) |
| `status` | str | `active` \| `trialing` \| `grace` \| `expired` \| `none` |
| `provider` | str | `appStore` \| `playStore` \| `stripe` \| `revenueCat` |
| `entitlementId` | str | provider entitlement / product id |
| `priceRegion` | str | resolved billing region (→ `subscriptionPlans/*.priceByRegion`) |
| `isTrial` | bool | |
| `autoRenew` | bool | |
| `currentPeriodEnd` | ts | access valid until this instant |
| `updatedAt` | ts | last webhook sync |

---

## 2. Top-level catalog (read-only to clients)

### 2a. `lessons/{lessonId}`
| field | type | notes |
|---|---|---|
| `order` | int | position in the path |
| `section` | str | e.g. `Foundations`, `Chord Lab`, `Songcraft` |
| `title` | str | e.g. `Grade 1: Piano Layout & 1-3-5 Chords` |
| `grade` | int | 1–12 |
| `xpReward` | int | typically 50 |
| `estMinutes` | int | |
| `completeMessage` | str | shown on the lesson-complete screen |
| `isPremium` | bool | gated behind a paid tier |

#### `lessons/{lessonId}/steps/{stepIndex}`
Mirrors the existing in-app lesson engine (`App/.../LessonData.kt`): a step is an ordered list of segments.

| field | type | notes |
|---|---|---|
| `index` | int | step order |
| `segments` | array<map> | each: `{ type:"say"|"pause"|"chord"|"seq"|"seqAll"|"quiz", ... }` — `say{text,rate,pitch,gap}`, `pause{ms}`, `chord{notes[],color,wait}`, `seq/seqAll{notes[],color,delay,wait}`, `quiz{quiz:{kind:"mcq"|"key", question, sub, options[], answer, target, explain}}` |

### 2b. `songs/{songId}`
| field | type | notes |
|---|---|---|
| `title` / `artist` | str | |
| `category` | str | e.g. `Trending pop`, `Just learned` |
| `level` | int | difficulty 1–5 |
| `chords` | array<str> | e.g. `["Am","F","C","G"]` |
| `musicXmlPath` | str \| null | catalog MusicXML in Storage |
| `isPremium` | bool | |

### 2c. `achievementsCatalog/{id}`
`{ title, description, icon, color, maxLevel:int, thresholds:array<int> }`

### 2d. `questTemplates/{id}`
`{ title, period:"daily"|"weekly", metric:str, goal:int, reward:{gems?:int,xp?:int} }`

### 2e. `subscriptionPlans/{planId}` — the paywall source of truth
| field | type | notes |
|---|---|---|
| `tier` | str | `super` \| `max` |
| `interval` | str | `monthly` \| `annual` |
| `features` | array<str> | bullet list for the paywall |
| `storeProductIds` | map | `{ appStore:str, playStore:str }` |
| `priceByRegion` | map | `{ "<ISO2>": { currency:str, amountMinor:int, display:str } }` — Duolingo-style regional brackets |
| `trialDays` | int | |

### 2f. `usernames/{username}` — uniqueness guard
`{ uid:str }`. Created transactionally with the profile so handles can't collide. Readable by all (to check
availability); a user may only create the doc that points to their own uid, and never delete someone else's.

---

## 3. Cloud Storage layout

```
users/{uid}/uploads/{itemId}.(pdf|png|jpg)   ← user-uploaded source (client read+write own)
users/{uid}/musicxml/{itemId}.(xml|mxl)      ← OMR output (client READ own; written by Function)
users/{uid}/avatar.(png|jpg)                 ← optional custom avatar (client read+write own)
catalog/songs/{songId}.(xml|mxl)             ← catalog MusicXML (client read; admin write)
```

Limits enforced in `storage.rules`: uploads ≤ 25 MB and `application/pdf|image/*`; musicxml ≤ 5 MB.

---

## 4. Cross-device sync

Firestore real-time listeners + on-device offline persistence give automatic multi-device sync. The resume point
is `users/{uid}.currentLessonId` + `lessonProgress/{id}.lastStepIndex`; the streak/XP/gems/hearts the home screen
shows live on the single `users/{uid}` doc, so switching phone↔web never loses placement or daily streak.

## 5. Required indexes (see `firestore.indexes.json`)
- `library` by `status` + `createdAt desc` (poll OMR queue / recent uploads).
- collectionGroup `lessonProgress` by `status` + `lastPlayedAt desc` (continue-where-you-left-off across lessons).
- `songs` by `category` + `level asc` (songbook rows).
