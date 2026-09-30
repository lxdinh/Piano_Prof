# Sheet Music Import — Audit, Root Causes, and the Plan to Beat Scan2Notes

**Date:** 2026-09-29
**Scope:** every branch in `lxdinh/Piano_Prof`, the Firebase schema, the design prototype, and the legacy Flutter app.
**Audience:** founder first (plain language), then a coding agent (Appendix A has the exact file map).

---

## 1. The short answer

**Yes, we had a plan. We had three.** They live on three branches that were never merged, so the app people actually build from (`main`) still has the first rough version from May. That is why scanning looks mediocre today.

| Question | Answer |
|---|---|
| Can a customer scan sheet music in the shipped app right now? | **No.** The app asks the user to type a "server URL", and no server is deployed. |
| Is the best work lost? | **No.** It is sitting on `claude/mcr-sheet-music-xml-00eqaa` (June) and half of it was ported to the newest app rebuild (July 30). |
| Does the newest app rebuild scan? | **No.** Its import screen is a fake demo: it waits 1.8 seconds and shows a hard-coded "8 chords, key of G". The real scanning code sits next to it, unused. |
| Can we beat Scan2Notes on raw recognition? | Not soon. Their model is proprietary and trained on far more data than any free engine. |
| Can we beat Scan2Notes as a product? | **Yes**, on four fronts they cannot copy: most songs should never be scanned at all, the learner checks results by ear and fixes them by pressing the right key on the lit piano, the scan becomes a full course instead of a PDF, and chords-first output is both our brand promise and far more error-tolerant than note-by-note output. |

---

## 2. The bar: what Scan2Notes does

From klang.io's product page, Scan2Notes offers:

- **Input:** photos, PDFs, multi-page scores.
- **Output:** MusicXML, MIDI, PDF.
- **Edit mode:** fix wrong notes, transpose, change tempo.
- **Playback:** play the score, piano-roll view, switch instruments.
- **Business:** web app, free demo limited to the first 12 measures, paid Pro tier.
- **Claim:** "the most accurate online sheet music scanner", with the honest caveat that clearer input gives better results.

Klang.io also sells a developer API. That matters later: if their recognition is really better than the free engines, we can rent it behind our own server for paying users while keeping everything else ours.

The previous coding sessions on our branches were already copying this pipeline step by step. Commit messages literally say "klang.io steps 1+2" (engine plus photo cleanup) and "steps 3+4" (musical correction plus a review screen).

---

## 3. Branch-by-branch audit

Sorted by how much sheet-music work each branch carries.

| Branch | Last commit | What it has for sheet music | Relation to `main` | Verdict |
|---|---|---|---|---|
| `main` | 2026-06-05 | Single-photo scan with the older **oemer** engine. Notes-only conversion: rhythm and hands are thrown away, output capped at 24 chords. No PDF, no multi-page, no review. User must paste a server URL. | is main | **This is the "mid" version.** |
| `claude/mcr-sheet-music-xml-00eqaa` | 2026-06-10 | **The most complete pipeline.** Newer **homr** engine, photo cleanup (perspective, deskew, shadows), musical sanity pass (piano range, rhythm quantizing), PDF input, whole-song multi-page merge. App side: timed score parser, **review screen with real engraved notation**, **falling-notes player** (Synthesia-style), **A-to-Z course generator** (key, circle of fifths, left hand first, right hand by section, hands together, dynamics, perform with metronome), save to Firebase and local library. 57 tests. Versioned v0.7.0. | 6 commits ahead, **0 behind** | **Merge-ready against main.** Built on main's screen architecture. |
| `claude/mcr-sheet-music-server-Fd8GH` | 2026-05-31 | Older engine (oemer) but adds two ideas the other branch lacks: **background jobs** (upload returns a job id, app polls; no 10-minute request), and a **server-side "professor lesson"** generator with hand separation, rhythm counting, rolled chords. Adds `count` and `arpeggio` lesson segment types. Browser upload portal. | 3 ahead, 1 behind | Superseded, but **steal the job pattern and the new segment types.** |
| `claude/debug-test-yesterdays-update-4ovbsv` | 2026-07-30 | **Newest app: a full rebuild** (custom router, 10 languages, RevenueCat billing, Sentry, Firebase). "Sheet import phase A" ported the framework-free core (score parser, page merge, song analysis). "Phase B" ported the homr server, a proper scan client with fallback logic, a Settings screen that tests the server, an offline demo score, and `docs/OMR_SETUP.md`. **Not ported:** the course generator, the falling-notes player, the review screen. **The import screen is still a mock.** 419 tests. | 58 ahead, 0 behind | **The base to build on**, with the last three pieces still to port. |
| `claude/ui-ux-design-rebuild-tp13sq` | 2026-07-28 | Parent of the branch above. Same rebuild, no scanning work. | 49 ahead | Superseded by the branch above. |
| `claude/vigilant-bohr-b6z548` | 2026-06-10 | Docs only: `SERVICES_SETUP.md` explains how to run the scan server at home or on Cloud Run; `UI_MASTER_PLAN.md` lists the import screen. | 10 ahead | Useful reading. No code. |
| `claude/kind-goodall-1z1mZ` | 2026-05-23 | "v0.6.0 notation highlight + oemer OMR". | fully merged | History only. |
| `docs/claude-md`, `polish/welcome-screen`, `clever-mendel`, `legacy-ui-replication`, `piano-sound-haptic-polyphony`, `piano-practice-ui-fixes`, `simply-piano-ui-redesign`, `feat/firebase-schema-ble-pairing`, `fix/ble-match-firmware`, `htdinh-patch-3` | various | **Nothing** about sheet music. UI polish, audio, BLE, hardware. | — | Not relevant to this feature. |

Two more places hold plans:

- **Firebase schema** (`backend/firebase/SCHEMA.md`): already designs a per-user **library** with job status (uploaded, processing, ready, failed) and a **catalog of songs with MusicXML files** in cloud storage. Neither is built. This is the blueprint for both "copy" and "scan".
- **Legacy Flutter app** (`legacy/mobile/`): the original version had a notation view, a MusicXML parser and the same server contract. Everything useful was re-done in TypeScript on the branches above.

**Test material:** one demo MusicXML file and one inlined demo score. **Zero real photographs** of sheet music with known-correct answers. The "121 of 121 notes correct" result in the June commit was measured on computer-rendered pages that were artificially rotated and shadowed, not on phone photos of real books.

---

## 4. Why it looks mid: seven root causes

1. **Wrong branch is live.** `main` has the May prototype. The June pipeline that fixes most of this was never merged, and the July rebuild ported only half of it.
2. **Older engine.** `main` uses oemer. The branches moved to homr, which builds on oemer's models and is described by its authors as producing output where "some errors are present but the overall structure remains accurate". Free engines also ignore dynamics, articulation and most symbols.
3. **The photo is never cleaned on main.** Recognition models are trained on flat, evenly lit scans. Phone photos are warped, tilted and shadowed. The cleanup code exists on the branches.
4. **Rhythm and hands are discarded on main.** The converter keeps only the pitch sequence and cuts off after 24 groups. Even a perfect scan would come out as a flat note dump.
5. **No review step on main.** Every recognition mistake goes straight into the lesson. Scan2Notes's whole product is built around an edit mode for exactly this reason.
6. **Nothing is deployed.** A customer cannot scan anything. The "server URL" field is a developer setting leaking into the product.
7. **Nothing is measured.** With no real-photo test set there is no way to say whether a change made recognition better or worse. "Mid" cannot be improved until it can be measured.

An eighth point is strategic rather than a defect: the design prototype's tagline is **"Chords first, sheet music never."** The mock import screen outputs a chord chart. The song preview shows a chord chart. We have been trying to read full engraved notation when the product promises chords. Chord detection per bar is highly tolerant of a few wrong notes; exact melody transcription is not. Leading with the robust thing is both on-brand and easier.

---

## 5. How we make it work

### 5.1 Copy before you scan

The cheapest way to be more accurate than Scan2Notes is to not scan.

- **Built-in catalog.** The Firebase schema already reserves a `songs` collection with a MusicXML file per song. Fill it with public-domain music (classical, folk, hymns, children's songs) and our own arrangements typed in MuseScore. These are exactly right, every time, with zero server cost. Licensing rule: public domain or licensed only; pop songs need a publisher deal before they go in the catalog. Users scanning their own purchased book is a different, personal-use situation.
- **File import.** Accept MusicXML (`.musicxml`, `.mxl`) and MIDI (`.mid`) files. Anyone using MuseScore, Flat or Noteflight can export these. MusicXML is exact. MIDI needs rhythm snapping and a left/right hand split, both of which the existing music21 sanity pass can do.
- **"We already have this song."** Before running a slow scan, read the title off the page (cheap) and offer the catalog version if it exists.
- **Chord-chart mode.** For pop lead sheets, read the chord symbols printed above the staff (plain text) instead of the notes. Text recognition is far more reliable than note recognition, and it produces exactly the "8 chords, key of G" output the design already shows.

### 5.2 When you do scan, stack the odds

Each step below either exists on a branch or is a small addition.

1. **Capture.** Guided camera: staff-alignment overlay, edge detection, auto-shutter when steady, one page per shot, in reading order. Prefer PDFs and screenshots of digital sheet music, which are near-perfect input. Exists partly (multi-page picker, PDF).
2. **Cleanup.** Perspective fix, deskew, shadow flattening. Exists (`preprocess.py`).
3. **Engine routing.** Different input, different engine:
   - Phone photo → **homr** (transformer-based, tolerant of camera shots). Exists.
   - Clean PDF or screenshot → **Audiveris** (open-source engine with a strong record on clean print, handles hundreds of pages, exports MusicXML 4.0). Not yet tried in this repo.
   - Paying users → **commercial API** (klang.io sells one) behind the same server endpoint, so the app never knows which engine ran. Per-scan cost is covered by the Pro tier.
   - Optional: run two engines and keep bars where they agree; flag the bars where they disagree.
4. **Musical sanity.** Exists (`postprocess.py`: piano range, rhythm quantizing). Add: every bar must add up to the time signature, left and right hand must have the same number of bars, accidentals must fit the key. Bars that fail get a low confidence score.
5. **AI reading pass.** Use a vision-capable language model for the things recognition engines ignore or botch: title, composer, key and time signature text, tempo words, chord symbols, lyrics, fingering numbers, repeat signs. Not as the main note reader, as the metadata reader and as a second opinion on flagged bars.
6. **Confidence per bar, then review by ear.** The review screen (exists, with real notation) highlights doubtful bars. The learner taps a bar and hears it. If it sounds wrong they can re-shoot just that bar, or **press the correct key on the lit piano to fix the note**. Our BLE piano already sends played notes back to the app, so the instrument becomes the editor. Scan2Notes cannot do this; it has no piano.
7. **Measure everything.** Build a golden test set cheaply: take 40 public-domain scores, print them, photograph each with three phones in different lighting. The answers are known perfectly, no hand-labeling. Add 10 hand-labeled photos of real store-bought books. Run every engine against it nightly and publish pitch accuracy, rhythm accuracy, bar count and hand assignment. Promote an engine only when the numbers say so.

### 5.3 Make the wait feel right

- **Background jobs.** A page takes about a minute on CPU. Do not make the learner stare at a spinner. Upload, show "Maestro is reading your music, we'll ping you", send a push notification when it is ready. The Firebase `library` status document was designed for this; the server branch's job pattern is the seed.
- **Deploy for real.** Run the server on Cloud Run, bake the address into the app, and move the "server URL" field into a hidden developer menu.
- **Speed when volume arrives.** Cloud Run supports NVIDIA L4 GPUs with scale-to-zero (minimum 4 CPU and 16 GiB memory per instance, instance-based billing). On GPU a page takes seconds instead of a minute. Start on CPU, switch when scan volume justifies the warm-instance cost.

### 5.4 Where we beat Scan2Notes

| | Scan2Notes | Piano Professor |
|---|---|---|
| Raw recognition | Proprietary, strong | Free engine now; can rent theirs for Pro users |
| Fixing mistakes | Edit notes on a web page | Hear the bar, press the right key on the lit piano |
| What you get | A file (MusicXML, MIDI, PDF) | A full course: key, chords, left hand, right hand, hands together, lights on your piano |
| Most songs | Must be scanned | Come from the catalog or a file import, perfectly |
| Chords | Not the focus | The brand: "Chords first" |
| Platform | Web app | Phone app plus physical LED strip |

### 5.5 Target architecture

```
PHONE APP
  Get music ─┬─ Catalog (public domain, our arrangements)    ─┐
             ├─ Import file (.mxl / .musicxml / .mid)         ├─→ MusicXML
             └─ Scan (camera / photos / PDF, pages in order) ─┘      │
                    │ upload pages to Storage                         │
                    │ create library/{item} status=uploaded           │
                    ▼                                                 │
  Listen to library/{item} ── processing ── ready / failed ◄──────────┤
                    │                                                 │
  Review: notation + doubtful bars + hear it + fix by playing a key   │
                    │                                                 │
  Learn: A-to-Z course │ falling notes │ chord chart │ LED lights ◄───┘
                    │
  Save to My Songs (Firestore index + MusicXML in Storage)

CLOUD
  Cloud Function on library create ──► queue job (Cloud Tasks)
  Scan worker (Cloud Run, from backend/omr):
      cleanup photo → route engine (homr photo / Audiveris pdf / paid API pro)
      → merge pages → musical sanity → confidence per bar
      → AI metadata pass (title, chords, lyrics, fingering)
      → write MusicXML to Storage → set library status=ready
  Eval harness: golden photo set, nightly accuracy report per engine
```

The app only ever speaks to the server through one whole-song endpoint. Every engine change, paid or free, happens behind it.

### 5.6 What the learner experiences

1. Songs tab → **Add a song** → Catalog, Import file, or Scan.
2. Scan: guided camera, add pages, reorder, tap Done. Maestro says he is reading. Notification when ready.
3. Review: engraved notation with two bars tinted yellow. Tap one, hear it, press the right key on the piano, the bar turns green.
4. **Learn**: key and circle of fifths, left-hand chords lit one by one, right-hand melody by section, hands together, dynamics, perform with metronome.
5. Song lands in My Songs, synced across devices.

---

## 6. Phased plan

### Status (updated 2026-09-30)

**Phase 0 decided and Phase 1 built** on branch `claude/jolly-turing-8imx09`, based on the July rebuild with
chords-first as the default result of a scan. What is in the branch now:

- Import screen is real: pick and order pages (camera, photo library, PDF), read them through the scan server, and
  show the detected chords and key with Play / Review / Learn A-to-Z. With no server address set it shows the bundled
  demo score and says so.
- Review screen renders the recognised score as engraved notation (needs internet for the notation library), with
  title and tempo edits that are saved with the song.
- Song Player: falling notes over the piano, audio, metronome, speed, seek, and the LED strip lit per hand in sync.
- Learn A-to-Z: the course generator now emits the Lesson 1 engine's own segments and the Lesson screen runs it.
  A test drives a generated course through the real engine with simulated key presses to completion.
- My songs shelf on the Songs tab, backed by an on-device library.
- Scan-server field moved behind Developer options (tap the version row seven times). `backend/omr/deploy.sh` deploys
  the server to Cloud Run and prints the address to paste into `src/omr/omrConfig.ts`.
- Checks: typecheck and lint clean, 44 test suites, 526 tests.

**Not done in Phase 1, on purpose or by constraint:**

- The server is not deployed. Running `deploy.sh` needs your Google Cloud account; the Docker image build has not been
  proven end to end (this sandbox could not reach PyPI through Docker). Budget 10 to 15 minutes for the first run.
- No device testing. Layout was reasoned for the 852×394 landscape canvas and covered by component tests, not viewed on
  a phone. Adding react-native-webview changes the native fingerprint, so a new EAS build is required.
- Known small gaps left for Phase 2/3: the library's index is not rebuilt if it gets corrupted; long-press delete on
  My songs has no confirmation; play-along tempo in a course uses the engine's fixed 104 BPM.


Sizes are relative (S = days, M = a couple of weeks, L = more). Each phase ends with something you can demo.

| Phase | What | Size | You can demo |
|---|---|---|---|
| **0. Decide the base** | Confirm the July rebuild (`claude/debug-test-yesterdays-update-4ovbsv`) is the app going forward. Everything below targets it. | decision | — |
| **1. Make it real** | Replace the mock import screen with the real client already on the branch. Port the review screen, falling-notes player and course generator from the June branch onto the rebuild's lesson format. Deploy the homr server to Cloud Run and bake in the address. Hide the server-URL field. | M | Scan a two-page PDF on your phone, review it as real notation, play it with lights. |
| **2. Copy before scan** | MusicXML and MIDI file import. Catalog of 30 to 50 public-domain songs in Storage. Title match against the catalog. | S–M | Import a MuseScore file and get a perfect lesson instantly. |
| **3. Trust** | Golden photo set and nightly accuracy report. Confidence per bar. Review by ear with fix-by-playing-a-key. Background jobs with push notification. Audiveris route for PDFs, chosen only if the numbers say so. | M | Doubtful bars highlighted; correct one by pressing the key; accuracy dashboard. |
| **4. Beat Scan2Notes** | Chords-first mode with AI metadata pass. Paid engine option for Pro users, adopted only if it wins on the golden set. GPU when volume justifies it. Polish the A-to-Z course voice. | M–L | Photo of a pop lead sheet → chord chart in seconds → full course in Maestro's voice. |

---

## 7. Decisions needed from you

1. **Base app.** Build on the July rebuild? My recommendation: yes. It has billing, languages, crash reporting and half the scan pipeline; `main` has none of those.
2. **Output priority.** Chords-first as the default result of a scan, full notation as the Pro layer? Recommendation: yes, it matches the brand and is more robust.
3. **Hosting budget.** Start CPU-only on Cloud Run (near zero when idle, about a minute per page), move to GPU when scans per day justify it. Recommendation: CPU first.
4. **Paid engine for Pro users.** Rent klang.io's API only if it beats homr on our golden set by a margin that matters. Recommendation: decide with data in Phase 3, not now.
5. **Catalog licensing.** Public domain and our own arrangements only at launch. Recommendation: yes. Get a music-licensing lawyer before any pop title enters the catalog.
6. **Open-source licenses.** homr and Audiveris are AGPL-3.0. We run them unmodified as separate processes behind our own server, which is the safe pattern, but have a lawyer confirm before commercial launch.

---

## Appendix A — Technical map for the coding agent

### Server contracts (all on `backend/omr/`)

| Endpoint | Exists on | Body → Result |
|---|---|---|
| `GET /health` | all | `{ok, engine}` |
| `POST /omr` | main, all branches | one image or PDF → MusicXML |
| `POST /omr/score` | xml branch, rebuild | all pages (`files[]`) → one merged MusicXML |
| `POST /omr/song` + `GET /omr/song/{jobId}` | server branch | pages + `order` + `title` + `format=lesson` → `202 {jobId}`, poll for `processing|ready|failed` |
| `POST /lesson/from-musicxml` | server branch | MusicXML → professor Lesson JSON |

Recommended v1 contract for the rebuild: keep `POST /omr/score`, add the async pair from the server branch, drive status through Firestore `users/{uid}/library/{itemId}` per `SCHEMA.md` §1f instead of in-process polling.

### Files by branch

**`main`**
- `backend/omr/app.py`, `Dockerfile`, `README.md` — oemer, single page.
- `src/omr/omrClient.ts`, `pickImage.ts`, `musicxmlToLesson.ts` — regex pitch extraction, 24-group cap.
- `src/screens/OmrImportScreen.tsx` — single photo, server-URL field.
- `src/lessons/schema.ts` — segments: `say`, `pause`, `chord`, `seq`/`seqAll`, `quiz`.

**`claude/mcr-sheet-music-xml-00eqaa`** (port source)
- `backend/omr/app.py` (homr, `/omr`, `/omr/score`), `preprocess.py`, `postprocess.py`, `Dockerfile` (weights baked with `homr --init`).
- `src/omr/musicxmlScore.ts` (timed parser), `mergeMusicXml.ts`, `analyzeSong.ts`, `songLessonGenerator.ts` (A-to-Z course), `songLibrary.ts` (local persistence), `importedSongs.ts`, `omrClient.ts`, `pickImage.ts`.
- `src/screens/ReviewScoreScreen.tsx` (OpenSheetMusicDisplay in WebView, edit title/tempo), `SongPlayerScreen.tsx` (falling notes, metronome, speed), `OmrImportScreen.tsx` (multi-page, per-page cache and re-scan).
- `src/services/firebaseSync.ts` (REST, anonymous auth, upload MusicXML, library doc).
- Tests: `analyzeSong.test.ts`, `musicxmlScore.test.ts`, 57 total.

**`claude/mcr-sheet-music-server-Fd8GH`** (ideas to steal)
- `backend/omr/jobs.py` (job store), `merge.py` (music21 merge), `pdf.py`, `analyze.py` (hands, chords, loops), `instruct.py` (professor lesson), `static/index.html` (upload portal), tests.
- `src/lessons/schema.ts` additions: `hand` on segments, `count` and `arpeggio` segments, `Lesson.meta`.

**`claude/debug-test-yesterdays-update-4ovbsv`** (target base)
- Already there: `src/omr/{musicxmlScore, mergeMusicXml, analyzeSong, importedSongs, omrClient, omrConfig, demoScore, pickImage}.ts`, `src/views/OmrServer.tsx` (settings with health test), `backend/omr/` (homr version), `docs/OMR_SETUP.md`, `src/__tests__/{omrClient, mergeMusicXml, musicxmlScore, analyzeSong}.test.ts`. 419 tests, lint and typecheck clean per commit message.
- Still mock: `src/views/ImportSheet.tsx` (hard-coded `DETECTED` chords, `setTimeout` 1800 ms).
- Missing: course generator, falling-notes player, review screen. The generator targets the old `src/lessons/schema.ts`; the rebuild's lesson data lives in `src/lesson1/` and `src/data/content.ts`, so the port is a retarget, not a rewrite.
- Song model in `src/data/content.ts` is chord-chart oriented (`SongPreview.tsx` plays a hard-coded I–V–vi–IV chart), which fits the chords-first direction.

**Firebase** — `backend/firebase/SCHEMA.md`: §1f `library` (status, `omrJobId`, `musicXmlPath`, `source: pdfUpload|photoOmr|import`), §2b `songs.musicXmlPath`, Storage paths `users/{uid}/uploads/`, `users/{uid}/musicxml/`, `catalog/songs/`. Rules on the xml branch allow owners to write their own MusicXML objects.

**Legacy Flutter** — `legacy/mobile/lib/omr/omr_service.dart`, `music/musicxml.dart`, `widgets/notation_view.dart`. Reference only.

### Porting order for Phase 1

1. Wire `ImportSheet.tsx` to `runOmrScore` (already on the branch) with multi-page picking from `pickImage.ts`.
2. Port `ReviewScoreScreen` as `src/views/ReviewScore.tsx` (needs `react-native-webview`, Expo SDK 52 pin 13.12.5).
3. Port `SongPlayerScreen` as `src/views/SongPlayer.tsx`.
4. Port `songLessonGenerator.ts` and retarget its output to the rebuild's lesson format; bring `analyzeSong.test.ts`'s generator half back with it.
5. Deploy `backend/omr` to Cloud Run; set `OMR_CONFIG.serverUrl` in `omrConfig.ts`; move `OmrServer.tsx` behind a developer toggle.

---

## Appendix B — Engine comparison

| Engine | Kind | License | Best input | Speed (CPU) | Cost | Status in repo |
|---|---|---|---|---|---|---|
| oemer | Deep-learning segmentation | MIT | Clean scans | Slow, heavy | Free | `main` |
| homr | Transformer on oemer's segmentation | AGPL-3.0 | Phone photos, PDFs | ~1 min/page | Free | June branch, July rebuild |
| Audiveris | Classical OMR + editor, MusicXML 4.0 export | AGPL-3.0 | Clean print, long scores | Fast | Free | Not tried |
| klang.io API | Proprietary, powers Scan2Notes | Commercial | Photos, PDFs | Fast | Per use (pricing not published on site) | Not tried |
| Vision LLM (Claude) | General vision model | Commercial | Text, symbols, metadata, spot checks | Seconds | Per image | Not tried |

None of these numbers are ours. Phase 3's golden set replaces this table with measured accuracy.

---

## Appendix C — Test assets and accuracy claims today

- `legacy/mobile/assets/songs/demo_song.musicxml` — one demo score.
- `src/omr/demoScore.ts` (rebuild) — four bars, two hands, inlined.
- Real photographs with known answers: **none**.
- June commit claims: 121/121 pitches on a 4-page synthetic piece; an 8-note scale recovered after synthetic distortion. Both used computer-rendered pages with artificial rotation, shadow and noise. Treat as "pipeline works", not "accuracy known".
