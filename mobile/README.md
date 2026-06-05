# Piano Professor — Flutter app (`mobile/`)

Cross-platform (iOS / Android / Web) **gamified piano-learning app** — the active product in this repo. A
Duolingo-style lesson path teaches piano; an instructor mascot speaks (Google Gemini TTS) and sings the solfège
in tune with each key; the on-screen keyboard and a physical **ESP32 "Piano-Prof" LED strip** (over BLE) light the
notes to play. Sheet music can be imported and turned into a playable, chord-annotated lesson via OMR.

> The legacy native Android app lives in `../App/` (Kotlin/Gradle) and predates this Flutter rewrite. **All current
> software work happens here in `mobile/`.** (`../App/mobile` is a symlink back to this folder.)

## What the app does

- **Learn** — a 6-level path (Kindergarten → Master, ~23 lessons). An interactive lesson engine speaks, lights the
  keys, plays audio, sings solfège, runs quizzes, and drives the LED strip in sync.
- **Gamification (client-authoritative v1)** — XP, daily streaks, hearts (spent on mistakes, refill over time),
  gems, per-lesson stars, lesson gating/locks, a daily-goal ring, and achievement badges. See
  `backend/firebase/firestore.rules` (rules deliberately allow client writes for v1).
- **Sheet (OMR)** — upload a PDF/photo → Cloud Storage → a Cloud Function runs OMR → MusicXML → a faithful,
  chord-analyzed preview you can learn by chords.
- **Practice** — note input via the BLE LED module (USB-MIDI / TRS-MIDI) or on-screen keyboard.
- **Profile** — stats, achievements, subscription, and settings (LED module, OMR server, AI voice).

## Architecture

State is plain **Provider / ChangeNotifier**. Engagement logic is **pure + unit-tested** and persists through one
controller, so it runs fully **in-memory when Firebase isn't configured** (demo mode).

```
lib/
├─ main.dart                 # Firebase init + anon sign-in + providers; home = HomeShell (4 tabs)
├─ theme/app_theme.dart      # design tokens (cream/ink/brand…) + Nunito
├─ screens/
│  ├─ home_shell.dart        # bottom nav: Learn · Sheet · Practice · Profile
│  ├─ lesson_path_screen.dart# the path: XP/streak/gems/hearts header, daily-goal bar, stars, gating
│  ├─ lesson_screen.dart     # in-lesson: mascot, keyboard, hearts, reward + achievement card
│  ├─ omr_library_screen.dart, song_preview_screen.dart
│  ├─ practice_screen.dart, profile_screen.dart, paywall_screen.dart
│  └─ ble_connect_screen.dart → calibration_screen.dart → connected_screen.dart
├─ data/
│  ├─ engagement.dart        # PURE math: streaks, hearts, stars, XP, gems (unit-tested)
│  ├─ achievements.dart      # PURE badge catalog + evaluation (unit-tested)
│  ├─ profile_controller.dart# single live profile + engagement orchestration (offline-safe)
│  ├─ user_repository.dart   # Firestore read/writes (no-op when unconfigured)
│  ├─ firestore_refs.dart    # central collection paths (match backend/firebase/SCHEMA.md)
│  └─ models/                # user_profile, paired_device, library_item
├─ lessons/                  # lesson_data (content), lesson_controller (engine), models, note_mapping
├─ audio/
│  ├─ piano_audio.dart       # SoLoud polyphony: samples or synth, sustain, reverb, sung solfège
│  ├─ voice_service.dart     # Google Gemini TTS (instructor voice + solfège syllables)
│  ├─ sample_bank.dart, tone_synth.dart, voice_line_id.dart
├─ music/                    # musicxml parser, song_analyzer (chords), song_player
├─ omr/omr_service.dart      # upload → self-hosted oemer server
├─ input/note_input_service.dart   # BLE note events → lesson input
├─ ble/                      # GATT contract + transport (native/web) + BleController
└─ widgets/                  # ChunkyButton, PpCard, StatPill, MascotImage, PpKeyboard, NotationView…
```

### Gamification design (where to extend)
- Put **pure logic** in `data/engagement.dart` / `data/achievements.dart` and unit-test it (`test/`).
- Route **persistence** through `ProfileController` → `UserRepository` using **absolute merge-writes** (offline-safe,
  no transactions; the Firestore stream simply echoes them). Keep the no-Firebase demo path working.
- Align fields to `backend/firebase/SCHEMA.md` (`users/{uid}`, `lessonProgress`, `dailyActivity/{YYYY-MM-DD}`,
  `achievements`). v1 is client-authoritative; the pure functions can move to Cloud Functions later unchanged.

### AI instructor voice (Google Gemini TTS)
`voice_service.dart` calls the **Generative Language API** (`generativelanguage.googleapis.com`, model
`gemini-2.5-flash-preview-tts`), wraps the returned 24 kHz PCM in a WAV header, and plays it via SoLoud. The same
service synthesizes the **solfège syllables**, which `piano_audio.dart` caches and **pitch-shifts to the played
key** (the piano carries the exact pitch). Set the key in **Profile → AI Voice** (a **Google AI Studio** key from
aistudio.google.com). No key → lessons fall back to on-screen text + a timed wait, so the app always runs.

## 1. Prerequisites
- Flutter SDK ≥ 3.19 (Dart ≥ 3.3). On this machine the SDK is at `C:\Users\thaih\flutter\bin` (not on PATH —
  prepend it, e.g. PowerShell: `$env:Path += ";C:\Users\thaih\flutter\bin"`).
- `flutter doctor`

## 2. One-time bootstrap (generates the native shells)
`lib/`, `pubspec.yaml`, `analysis_options.yaml`, and `assets/` are authored. If `android/`, `ios/`, `web/` are
missing, generate them (won't overwrite existing files):
```bash
cd mobile
flutter create . --org com.pianoprofessor --project-name piano_professor --platforms=android,ios,web
flutter pub get
```

## 3. Native config (after bootstrap)

### Android — `android/app/src/main/AndroidManifest.xml`
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```
Set `minSdk = 23` (flutter_blue_plus + `neverForLocation`).

### iOS — `ios/Runner/Info.plist`
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Piano Professor connects to your Piano Lights LED strip over Bluetooth.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Piano Professor can listen to your playing for practice feedback.</string>
```
Set `platform :ios, '13.0'` in `ios/Podfile`.

### Web
Web Bluetooth needs HTTPS (or `localhost`) + a user gesture, and works in Chrome/Edge only. The PAIR flow opens the
browser device chooser filtered to `Piano-Prof-…` (`ble_transport_web.dart`).

## 4. Firebase (optional — the app runs without it)
Without Firebase, auth/Firestore no-op and the gamification loop runs in-memory (demo mode). To enable sync:
```bash
dart pub global activate flutterfire_cli
flutterfire configure        # generates lib/firebase_options.dart
```
Enable **Anonymous** auth, then deploy rules: `firebase deploy --only firestore:rules,storage` (from
`backend/firebase/`).

## 5. Run & verify
```bash
flutter analyze
flutter test                 # pure engagement/achievements/GATT unit tests
flutter run -d chrome        # web (BLE via "Choose device")
flutter run                  # Android/iOS device
```
Golden path: complete a lesson → XP rises on the home header, streak increments, stars render on the node, gems are
awarded, hearts drop on wrong answers (and gate at 0), locked lessons reject taps, the daily-goal bar advances, and
new achievement badges appear on the completion card + Profile.

### Pairing without hardware (no firmware yet)
Use **nRF Connect** as a BLE peripheral simulator advertising name `Piano-Prof-SIM`, service
`f0a1d2c3-0001-4a5b-8c9d-1a2b3c4d5e6f`, with characteristics `…0002…` (LED-Command, Write-No-Response), `…0003…`
(Note-Event, Notify), `…0004…` (Device-Status, Read, e.g. `3C 00 01 00` → 60 LEDs, fw 0.1, USB). The GATT contract
in `ble/piano_professor_gatt.dart` is the source of truth for the upcoming ESP32-S3 firmware.

## Notes / follow-ups
- `google_fonts` fetches **Nunito** at runtime (network on first launch); bundle the TTF later for offline first run.
- Premium **feature gating** (OMR uploads, unlimited hearts, AI feedback by tier) + **usage analytics**
  (`firebase_analytics`, no-op until Firebase is configured) are wired. The **store purchase SDK** (RevenueCat
  recommended — it verifies entitlements without your own backend) and **Crashlytics** still need store/native
  setup + device testing; purchases are currently mocked via the paywall. **Local notifications** are planned.
- Lesson content is currently hardcoded in `lessons/lesson_data.dart` (a move to data-driven JSON/Firestore is a
  planned follow-up).
