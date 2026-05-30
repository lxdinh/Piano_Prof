# Piano Professor — Claude Code session notes

Short, sharp context so a new session can pick up without re-discovering everything.

## What this is

A React Native + Expo (SDK 52, TypeScript) rebuild of Piano Professor — a
Duolingo-style learn-piano app with a paired BLE LED strip. Cream paper /
green / Maestro-Penguini mascot. Repo is `lxdinh/piano_prof`.

## Current state (what's done)

- **APK pipeline**: `.github/workflows/build-eas.yml` — push to `main` → EAS
  cloud build → install URL committed to `.build-info/last-build-url.txt`.
  Owned by Expo account `htdinh`. `EAS projectId` already pinned in `app.json`
  (`75c6cb4a-9f15-4b3c-b236-4d6ae0e09edc`). `EXPO_TOKEN` secret is set in the
  repo. Workflow URL parser updated to grep `See logs:` (the old
  `buildDetailsPageUrl` regex never matched).
- **Last EAS build**: `https://expo.dev/accounts/htdinh/projects/piano-professor/builds/a785d65f-2993-4f4b-87fc-53f51103a377`
  (from commit `dd65929`). User's `legacy/**` pushes after that are excluded by
  `paths-ignore` so no re-build was triggered.
- **PR #1** (full RN v1) and **PR #2** (4-tab pathway, landscape lessons, full
  piano) are both merged into `main`.
- Working branches: `polish/welcome-screen` is the most recent work branch;
  `main` is canonical.

## Current priority (what the next session should do)

The user pushed their design source of truth into `legacy/` and wants the RN
app's UI ported to match it pixel-for-pixel. The user said the current piano
"looks terrible" compared to their existing app — that existing app's source
is `legacy/`. **Port from `legacy/`, do not invent.**

Key files to read first:

- `legacy/mobile/lib/screens/lesson_screen.dart` — the lesson screen from the
  user's screenshot (Maestro speech bubble, BigPiano, REPLAY/CONTINUE).
- `legacy/mobile/lib/screens/lesson_path_screen.dart` — the Learn pathway
  (Kindergarten → Master).
- `legacy/mobile/lib/widgets/big_piano.dart` — single-octave magnified piano
  with finger-hint dots (1, 3, 5).
- `legacy/mobile/lib/widgets/range_piano.dart` — full-range mini keyboard
  (used as a slide-bar context strip below BigPiano).
- `legacy/mobile/lib/widgets/{chunky_button,pp_card,mascot_image,led_strip_art,stat_pill}.dart`
- `legacy/mobile/lib/theme/app_theme.dart` — exact colors / measurements.
- `legacy/index.html` + `legacy/styles.css` + `legacy/app.js` + `legacy/lessons.js`
  — web prototype v0.8.6 of the same design.

The current `src/components/PianoKeyboard.tsx` is wrong: it tries to cram all
29 keys into one strip. The design is **two stacked widgets**: a magnified
8-key BigPiano on top + a slim 88-key Mini88Keyboard slide bar underneath with
a "MAGNIFIED ABOVE" viewfinder bracket.

## Tech stack — what's in, what's out

In: Expo 52, RN 0.76, TypeScript, `expo-av` (audio), `expo-haptics`,
`expo-linear-gradient`, `expo-speech` (TTS fallback), `expo-screen-orientation`,
`react-native-svg`, `react-native-ble-plx`, `@react-navigation/native-stack`,
`@react-navigation/bottom-tabs`, `@react-native-async-storage/async-storage`.

OUT — do not add:

- `react-native-reanimated` — babel-plugin landmine, breaks EAS builds. All
  animation uses RN's built-in `Animated`.
- `@react-native-firebase/*` — requires `google-services.json` /
  `GoogleService-Info.plist` which we don't have; adding the config plugins
  fails the EAS Android build. Local-authoritative storage instead (see
  `src/services/localBackend.ts`).
- Web Audio API — RN doesn't have it. Piano sound uses offline-synthesized
  WAV samples through `expo-av`.

## Source map (`src/`)

| Area | Notable files |
|---|---|
| Audio | `audio/pianoEngine.ts` (polyphonic, expo-av cache, `playMidi/playChord/playSequence/preloadCore/stopAll`), `audio/pianoSampleMap.ts` (49 static `require()`s for C2..C6 WAVs), `audio/instructorVoice.ts` (ElevenLabs + `expo-speech` fallback) |
| BLE | `ble/useBLE.ts`, `ble/protocol.ts`, `ble/constants.ts`, `ble/BLEContext.tsx` — leave alone, hardware-correct already |
| Components | `ChunkyButton`, `PpCard`, `PianoKeyboard` (needs rebuild — see priority), `MascotImage`, `LedStripArt`, `HeartsRow`, `XpBar`, `StatChip`, `DailyGoalRing`, `AnimatedCounter`, `TopStatsBar`, `Confetti`, `HeroHalo`, `Sparkles`, `FloatingNotes`, `EmptyState`, `GradeBadge`, `PremiumGate` |
| Feedback | `feedback/haptics.ts`, `feedback/motion.ts` (`useBreathing/usePulse/useSpin/useEntrance/usePop/useShake`), `feedback/useOrientation.ts` (`useLockPortraitOnMount`, `useLandscapeWhileFocused`) |
| Gamification | `UserProvider.tsx` (XP / streak / hearts / gems / today activity / completeLesson / loseHeart), `hearts.ts`, `achievements.ts` (8 badges), `AchievementCelebration.tsx` |
| Lessons | `lessons/schema.ts`, `lessons/engine.ts` (status: `idle / playing / awaiting-quiz / awaiting-continue / complete`; actions: `start / submitQuiz / continueLesson / replayStep / stop`), `lessons/loader.ts`, `lessons/data/grade1.json` + `grade2.json` (more grades stub to "Coming soon"), `lessons/pathway.ts` (typed Kindergarten→Master pathway with state cascade), `lessons/noteToMidi.ts`, `lessons/colors.ts`, `lessons/midiToLed.ts`, `lessons/importedLessons.ts` |
| Navigation | `navigation/RootNavigator.tsx`, `navigation/MainTabs.tsx`, `navigation/types.ts`. **4 tabs**: Learn / Sheet / Practice / Profile. Lesson is a full-screen card (not modal sheet) so landscape reads clean. Settings is a root-stack modal opened by the gear on Profile. |
| Screens | `OnboardingScreen` (3 pages with halo + sparkles + floating notes + `welcome-piano.png` hero), `LearnScreen` (pathway — needs more polish from `legacy/`), `LessonScreen` (landscape — needs faithful rebuild from `legacy/lesson_screen.dart`), `PracticeScreen` (landscape free-play full piano), `ProfileScreen`, `SongbookScreen` (Sheet tab), `SettingsScreen`, `LessonCompleteScreen` (confetti + stars + AnimatedCounter), `BLEPairingRoute`, `VoiceSettingsScreen`, `OmrImportScreen`, `PaywallScreen` |
| Services | `services/dateKey.ts` (`todayKey()` — LOCAL date, NEVER UTC), `services/types.ts`, `services/localBackend.ts`, `services/ProgressBackend` interface (Firestore drop-in later), `services/analytics.ts` |
| Types | `types/expo-screen-orientation.d.ts` — minimal shim so local `tsc` resolves the module (real package resolves at EAS install) |

## Critical decisions / invariants

- **Local dates, never UTC.** Streaks bucket on `services/dateKey.ts#todayKey()`
  built from `getFullYear/getMonth/getDate`. Test: `__tests__/dateKey.test.ts`.
- **`ProgressBackend` interface.** Local-authoritative now via AsyncStorage.
  Firestore drops in later by implementing the same interface — schema field
  names already mirror `backend/firebase/SCHEMA.md`.
- **Lesson engine is step-gated.** Between steps it sets
  `status: 'awaiting-continue'` and waits for `continueLesson()` or
  `replayStep()`. Matches the REPLAY / CONTINUE buttons in the design.
- **Landscape on demand.** App locks portrait at startup
  (`useLockPortraitOnMount` in `App.tsx`). `LessonScreen` and `PracticeScreen`
  call `useLandscapeWhileFocused()` to flip + restore.
- **Polyphony via cached `Audio.Sound`s.** Per MIDI note one Sound is created
  once and `replayAsync()`ed. `preloadCore()` runs once at app start so the
  first tap is instant.
- **Mascot moods.** 13 mood slots wired in `MascotImage.tsx#PNG_SOURCES`.
  Current mapping (from `assets/mascots/`):
  `happy→teach`, `wave→classical`, `thinking→idea`, `wow→wow`,
  `sad→sad`, `sleepy→tired`, `laugh→showman`, `wink→star`,
  `cheer→cheer`, `love→love`, `shocked→shocked`, `cool→cool`,
  `trophy→trophy`. `welcome-piano.png` (Beethoven penguin at the keys, white
  background stripped + defringed) is used directly on Onboarding page 1.
  ~28 other PNGs are still unmapped — use them when the design calls for a
  pose we don't have (e.g. `conduct.png` for the speaking-teacher mood the
  Flutter screen uses).
- **Audio assets.** 49 offline-synthesized WAVs in `assets/audio/piano/`
  (C2..C6). Generation logic is in the commit message of the audio commit —
  additive synth matching the LuminaKeys timbre (fundamental triangle +
  harmonics at multiples 2,3,4,6 with gains .18/.09/.05/.02). Total ~3.3 MB.
- **EAS-safe.** `metro.config.js` pins `wav/mp3/m4a/ogg` as bundled asset
  extensions. `paths-ignore` in `build-eas.yml` excludes `legacy/**`,
  `docs/**`, `chats/**`, `project/**`, `hardware/**`, `backend/**` so doc /
  legacy pushes don't burn EAS credits.

## Build / verify

```bash
npm install
npm run typecheck     # tsc --noEmit (currently clean)
npm test              # jest — 23 pure-logic tests passing
npm run android       # Expo dev build
```

EAS APK: push to `main` and watch `https://github.com/lxdinh/Piano_Prof/actions`.

## Don'ts

- Don't force-push to `main`. The auto-mode classifier blocks it anyway.
- Don't push directly to `main` for code changes — open a PR.
- Don't change `"owner"` in `app.json` (it's `"htdinh"`).
- Don't add Firebase / Reanimated / Web Audio (see "Tech stack" above).
- Don't replace `welcome-piano.png` — its alpha was hand-tuned (flood-fill
  from corners + 2 defringe passes). Regen will reintroduce the white halo.
- Don't `toISOString().slice(0,10)` for streak keys — use `todayKey()`.

## Recent commits (newest first)

```
62c759c Rebuild legacy/ web UI to match Flutter v0.8.6 design     (user)
8a3a3ce Strip audio from legacy/ web UI                            (user)
a1314f2 Remove sfx.js from legacy/                                  (user)
d32df5b Add index.html to legacy/ web UI folder                     (user)
29820ef Add files via upload                                        (user)
db4eae4 ci: update build info [skip ci]                             (bot)
dd65929 Landscape lessons, full playable piano, 4-tab pathway app  (PR #2)
1bb4c51 Piano Professor React Native rebuild — full app v1         (PR #1)
```

`docs/APP_ARCHITECTURE.md` was restored by the user to its earlier wording
(references to `legacy/mobile/` and `legacy/App/` are back) — leave it.

## Useful one-liners

```bash
# Smallest path to see your last lesson edit on a real phone:
git add -A && git commit -m "..." && git push origin main
# Then open the Actions tab; the build URL lands in .build-info/last-build-url.txt.

# Where the piano sound lives:
ls assets/audio/piano/ | wc -l   # 49 (C2..C6)

# All path items in the Kindergarten→Master curriculum:
grep -E "^\s*\{ id:" src/lessons/pathway.ts
```
