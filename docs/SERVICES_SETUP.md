# Services Setup — OMR server, Firebase, pre-generated Google voice

The app runs 100% offline with zero setup: local progress, on-device TTS, the
bundled demo score. These three services are upgrades. Each section says what
the service is for, exactly where to get the "information" the app asks for,
and what it costs. Do them in this order — they all share **one Google
account/project**, so the first setup makes the next two shorter.

---

## 1. OMR server (the URL the Import screen asks for)

**What it is:** sheet-music photo → playable lesson. The server is already
written in this repo (`backend/omr/` — wraps the free open-source
[oemer](https://github.com/BreezeWhite/oemer) engine). **Nobody issues this
URL to you — you create it by running the service**, then paste its URL into
the app (Import screen → "OMR server URL"). Blank = import disabled, demo
score still works.

### Option A — run it on your computer (free, for testing at home)
1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. ```bash
   cd backend/omr
   docker build -t pp-omr .
   docker run -p 8000:8000 pp-omr
   ```
3. Find your computer's LAN IP (`ipconfig` on Windows / `ifconfig` on Mac —
   something like `192.168.1.23`). Phone must be on the same Wi-Fi.
4. In the app, set the OMR server URL to `http://192.168.1.23:8000`.

### Option B — deploy to Google Cloud Run (real URL, scales to zero ≈ $0 idle)
1. Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install), then
   `gcloud auth login`. Use the same Google project you'll create for
   Firebase in section 2 (`gcloud config set project <project-id>`). Cloud
   Run requires a billing account on the project, but scale-to-zero means
   you pay only seconds of CPU per scan.
2. ```bash
   gcloud run deploy pp-omr --source backend/omr --region us-central1 \
       --allow-unauthenticated --memory 4Gi --cpu 2 --timeout 600
   ```
3. It prints a URL like `https://pp-omr-abc123-uc.a.run.app` — **that is your
   OMR server URL.** Paste it into the app.

Notes: the first scan is slow (the model downloads + warms up); clear photos
of *printed* sheet music work best.

---

## 2. Firebase (cloud sync — optional until you want multi-device)

**What it's for:** today all progress (XP, streaks, hearts, lesson stars)
lives on the phone (`src/services/localBackend.ts`). Firebase/Firestore is
the planned cloud copy — same data model, defined in
`backend/firebase/SCHEMA.md`, with security rules already written. Setting
it up costs nothing (Spark free tier) and nothing in the app breaks while
it's absent.

### Step 1 — create the project (this is "the Firebase information")
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
   → **Add project** → name it (e.g. `piano-professor`). This also creates
   the Google Cloud project that sections 1 and 3 can share.
2. **Build → Authentication → Get started → Sign-in method → enable
   Anonymous** (the app's uid model is anonymous-first).
3. **Build → Firestore Database → Create database** → production mode →
   pick a region near you.

### Step 2 — deploy the rules that are already in this repo
```bash
npm install -g firebase-tools
firebase login
cd backend/firebase
firebase use --add        # select the project you just created
firebase deploy --only firestore:rules,firestore:indexes,storage
```
(Local testing without touching production: `firebase emulators:start` in
`backend/firebase` — UI at http://localhost:4000.)

### Step 3 — get the app config
In **Project settings (gear) → Your apps**:

- **Recommended first: Web app** (`</>` icon). Register it and copy the
  config object (`apiKey`, `authDomain`, `projectId`, …). This is what the
  JS SDK (`npm install firebase`) uses — it works in Expo with **no native
  config files and no EAS build risk**.
- **Native SDK (later, only if needed):** add an **Android app** with package
  name `com.lxdinh.pianoprofessor` (from `app.json`) and download
  `google-services.json`. ⚠️ Per `docs/APP_ARCHITECTURE.md`: do **not**
  install `@react-native-firebase/*` or reference config files in `app.json`
  before the files exist — the EAS Android build will fail.

### Step 4 — wiring it into the app (when you're ready)
The app was built for this swap: implement
`FirestoreBackend implements ProgressBackend`
(`src/services/ProgressBackend.ts` is the interface, `SCHEMA.md` the field
names — they match on purpose), then swap it for `localBackend` in
`src/gamification/UserProvider.tsx`. Ask a coding agent for "implement
FirestoreBackend per docs/SERVICES_SETUP.md step 4" and paste your web
config — it's a contained, well-specified task.

---

## 3. Pre-generated Google voice (consistent instructor voice, free at runtime)

**What it is:** the instructor's lesson lines are a fixed script (every `say`
segment in `src/lessons/data/*.json` — currently 13 lines). Instead of
robotic on-device TTS or per-play ElevenLabs billing, synthesize them ONCE
with a Google studio voice, bundle the mp3s in the app, and play them
offline forever. `speak()` already prefers bundled clips, then ElevenLabs
(if you saved a key in Settings), then device TTS — so partial coverage is
always safe.

### Step 1 — get a Google TTS API key
1. [console.cloud.google.com](https://console.cloud.google.com) → select the
   same project from section 2 → **APIs & Services → Library → "Cloud
   Text-to-Speech API" → Enable**.
2. **APIs & Services → Credentials → Create credentials → API key.**
   (Edit the key → restrict it to the Text-to-Speech API.)
3. Cost: the free tier is ~1M characters/month for Neural2 voices; the whole
   lesson script is about a thousand characters — effectively $0.

### Step 2 — generate and bundle
```bash
npm run voice -- --dry-run                      # preview the lines, no API calls
GOOGLE_TTS_API_KEY=AIza... npm run voice        # synthesize → assets/audio/voice/
```
Pick a different voice or pace with
`npm run voice -- --voice en-US-Neural2-D --rate 0.95`
(audition voices at
[cloud.google.com/text-to-speech](https://cloud.google.com/text-to-speech#demo);
`en-US-Neural2-F` is the warm default).

### Step 3 — verify, commit, ship
```bash
npm run verify    # the asset gate proves every mapped mp3 exists
git add assets/audio/voice src/audio/voiceLineMap.generated.ts
git commit -m "Pre-generated instructor voice (en-US-Neural2-F)"
```
Push to `main` → the APK build picks the clips up automatically.

**When you add lessons:** run `npm run voice` again — it synthesizes only the
new lines (existing clips are reused, deleted lines are pruned). The
`voiceLines.test.ts` suite pins the text→clip key so the app and the script
can never drift apart.
