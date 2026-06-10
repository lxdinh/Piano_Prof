# Piano Professor — App Architecture (React Native / Expo)

The app is a **React Native + Expo (SDK 52, TypeScript)** rebuild that supersedes the
retired Flutter (`legacy/mobile/`) and Kotlin (`legacy/App/`) apps. It preserves the
cream-paper / Duolingo-green / Maestro-Penguini design from the web prototype
(`index.html`, `styles.css`, `lessons.js`) and is wired into the existing EAS + GitHub
Actions APK pipeline (`.github/workflows/build-eas.yml`).

## Run it

```bash
npm install
npm run typecheck     # tsc --noEmit (clean)
npm test              # jest — 23 pure-logic tests
npm run android       # or: npm run ios / npm run web (dev build)
```

APK builds happen in the cloud: push to `main` → `build-eas.yml` submits an EAS build
and commits the install URL to `.build-info/last-build-url.txt`.

## Source map (`src/`)

> **UI shells (2026-06 restructure).** Everything visual lives in a *versioned UI
> shell* — `src/ui/shells/v2/{screens,components,navigation,theme}` — selected by the
> one-line switch `src/ui/activeShell.ts`. Shells may import core logic **only** via
> `src/core/contract.ts` (enforced by `npm run check:imports`). Design drops from
> claude.ai/design land in `designs/<version>/`. See `docs/UI_MASTER_PLAN.md` and
> `docs/DESIGN_ADOPTION_PLAYBOOK.md` for how a new design is adopted.

| Area | Files | Notes |
|---|---|---|
| Theme | `ui/shells/v2/theme/tokens.ts`, `…/theme/ThemeContext.tsx` | colors / fonts / spacing; `useTheme()` |
| Components | `ui/shells/v2/components/*` | `ChunkyButton`, `PpCard`, `StatChip`, `HeartsRow`, `XpBar`, `DailyGoalBar`, `GradeBadge`, `MascotImage`, `LedStripArt`, `PianoKeyboard`, `TopStatsBar`, `PremiumGate`, `AchievementCelebration` |
| Navigation | `ui/shells/v2/navigation/RootNavigator.tsx`, `…/MainTabs.tsx`, `…/types.ts` | 5 tabs (Learn / Path / Songbook / Profile / Settings) + modal stack |
| Screens | `ui/shells/v2/screens/*` | Onboarding, Learn, Path, Songbook, Profile, Settings, Lesson, LessonComplete, VoiceSettings, OmrImport, Paywall, BLE pairing |
| UI contract | `core/contract.ts` | the only core surface shells may import |
| Lessons | `lessons/schema.ts`, `lessons/engine.ts`, `lessons/loader.ts`, `lessons/data/grade*.json`, `lessons/noteToMidi.ts`, `lessons/colors.ts`, `lessons/midiToLed.ts` | **data-driven** lesson content; `useLessonEngine()` orchestrates voice + audio + LEDs + quiz |
| Audio | `audio/pianoSamples.ts`, `audio/pitchShift.ts`, `audio/instructorVoice.ts` | sample playback (pitch-shift from anchors) + ElevenLabs/expo-speech narration |
| BLE | `ble/*` (`useBLE`, `protocol`, `constants`, `BLEContext`) | pre-existing GATT contract; pairing screen + lesson engine share one `BLEProvider` instance |
| Gamification | `gamification/UserProvider.tsx`, `gamification/hearts.ts`, `gamification/achievements.ts` | XP / streak / hearts / gems / 8 badges (unlock celebration UI lives in the shell) |
| Data layer | `services/*` (`types`, `ProgressBackend`, `localBackend`, `dateKey`, `analytics`) | local-authoritative store; field names mirror `backend/firebase/SCHEMA.md` |
| OMR | `omr/pickImage.ts`, `omr/omrClient.ts`, `omr/musicxmlToLesson.ts` | photo → oemer service (`backend/omr/`) → MusicXML → playable preview |
| Billing | `billing/entitlement.ts` | local entitlement read; paywall purchase mocked for v1 |
| Notifications | `notifications/streakReminder.ts`, `notifications/useReminders.ts` | on-device daily practice reminder |

## Key architectural decisions

**Local-authoritative data (v1).** Gamification + progress live in AsyncStorage
(`services/localBackend.ts`) behind the `ProgressBackend` interface. This keeps the app
fully offline and — critically — keeps the **EAS Android build green without any Firebase
config files**. The data model (`services/types.ts`) is named field-for-field after
`backend/firebase/SCHEMA.md`, so a Firestore-backed `ProgressBackend` drops in later with
no model changes.

> **Enabling Firebase later:** add `google-services.json` / `GoogleService-Info.plist`,
> install `@react-native-firebase/*` (or the `firebase` JS SDK for web parity), add the
> config plugins to `app.json`, then implement `FirestoreBackend implements ProgressBackend`
> and swap it in. Do **not** add the native Firebase plugins before the config files exist —
> the prebuild/EAS Android build will fail. Reuse `backend/firebase/firestore.rules`.

**Local dates, never UTC.** Streaks bucket on `services/dateKey.ts#todayKey()`, built from
`getFullYear/getMonth/getDate` (not `toISOString().slice(0,10)`) so evenings west of UTC
don't roll the day forward. Covered by `dateKey.test.ts`.

**No reanimated.** We use `@react-navigation/native-stack` + `bottom-tabs` (neither needs
Reanimated) and RN's built-in `Animated`, avoiding the Reanimated babel-plugin landmine.

## Assets still to add (graceful no-ops until then)

- `assets/audio/piano/*.mp3` anchor samples — register them in `audio/pianoSamples.ts`
  (`ANCHOR_SAMPLES`). Until then note playback is a silent no-op; the lesson flow, LED
  sync, voice narration, and quizzes all still work.
- `assets/mascots/<mood>.png` — `MascotImage` currently renders an SVG placeholder penguin.
- Real `assets/icon.png` / `splash.png` / `adaptive-icon.png` (placeholders generated).
- OMR server URL — set in Settings → Import (self-host `backend/omr/`).
