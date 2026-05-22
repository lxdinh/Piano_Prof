# Piano Professor — Flutter app (`mobile/`)

Cross-platform (iOS / Android / Web) Flutter app. This first turn ships the **BLE pairing screen** + controller
that scans for and pairs with the ESP32 "Piano-Prof" LED module, styled to the design prototype. Other screens,
Firebase wiring, MIDI/mic input, and OMR come later.

```
mobile/
├─ pubspec.yaml
├─ analysis_options.yaml
├─ assets/mascots/            # Maestro Penguini stickers (copied from the design)
└─ lib/
   ├─ main.dart               # launches BleConnectScreen
   ├─ theme/app_theme.dart    # design tokens (cream/ink/brand…) + Nunito
   ├─ widgets/                # ChunkyButton, PpCard, StatPill, MascotImage, LedStripArt
   ├─ ble/
   │  ├─ piano_professor_gatt.dart   # the app↔ESP32 GATT contract (UUIDs + frame codecs)
   │  ├─ ble_transport.dart          # abstract transport + platform factory
   │  ├─ ble_transport_io.dart       # native impl (flutter_blue_plus)
   │  ├─ ble_transport_web.dart      # web impl (flutter_web_bluetooth / Web Bluetooth)
   │  └─ ble_controller.dart         # sealed BleState + ChangeNotifier
   └─ screens/ble_connect_screen.dart
```

## 1. Prerequisites
Flutter is **not installed on this machine** — install it first:
- Flutter SDK ≥ 3.19 (Dart ≥ 3.3): https://docs.flutter.dev/get-started/install
- Then: `flutter doctor`

## 2. One-time bootstrap (generates the native shells)
`lib/`, `pubspec.yaml`, `analysis_options.yaml`, and `assets/` are already authored. Run `flutter create` **inside
this folder** to generate the `android/`, `ios/`, and `web/` platform projects — it will **not** overwrite the
files that already exist:
```bash
cd mobile
flutter create . --org com.pianoprofessor --project-name piano_professor --platforms=android,ios,web
flutter pub get
```

## 3. Apply native config (after bootstrap)

### Android — `android/app/src/main/AndroidManifest.xml`
Add inside `<manifest>` (above `<application>`):
```xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<!-- legacy / pre-Android-12 -->
<uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" android:maxSdkVersion="30" />
```
In `android/app/build.gradle` (or `.kts`) set `minSdk = 23` (flutter_blue_plus + `neverForLocation`).

### iOS — `ios/Runner/Info.plist`
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Piano Professor uses Bluetooth to connect to your Piano Lights LED strip.</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>Piano Professor uses Bluetooth to connect to your Piano Lights LED strip.</string>
```
In `ios/Podfile` set `platform :ios, '13.0'`.

### Web — `web/index.html`
No permission entries are needed, but note: **Web Bluetooth requires HTTPS (or `localhost`) and a user gesture**,
and is supported in **Chrome/Edge** (not Firefox/Safari). On web the app cannot list devices silently — the PAIR
flow opens the browser's device chooser (`requestDevice`) filtered to `Piano-Prof-…`; this is handled by
`ble_transport_web.dart` and surfaced as a "Choose device" button.

## 4. Run
```bash
flutter analyze              # static check
flutter run -d chrome        # web — tap "Choose device" → browser BLE chooser
flutter run                  # Android/iOS device — live scan list
```

## 5. Verify pairing without hardware (no firmware exists yet)
Use **nRF Connect** (Nordic, free on Android/iOS) as a BLE **peripheral simulator**:
1. In nRF Connect → *Advertiser/GATT server*, create a server advertising:
   - Device name: `Piano-Prof-SIM`
   - Service UUID: `f0a1d2c3-0001-4a5b-8c9d-1a2b3c4d5e6f`
   - Characteristics:
     - `…0002…` LED-Command — Write Without Response
     - `…0003…` Note-Event — Notify
     - `…0004…` Device-Status — Read (value e.g. `3C 00 01 00` → 60 LEDs, fw 0.1, USB)
2. Start advertising.
3. In the app, the device appears in the scanning list → tap **PAIR** → it connects, reads LED count, and
   subscribes to notifications. Push a Note-Event value from nRF Connect to confirm the notify pipe.

## Notes / follow-ups
- `google_fonts` fetches **Nunito** at runtime (needs network on first launch); bundle the TTF in `assets/fonts/`
  later for fully-offline first run.
- The GATT UUIDs + frame formats in `piano_professor_gatt.dart` are the source of truth for the upcoming ESP32-S3
  firmware (Phase 3) — keep both in sync.
- `ble_transport_web.dart` targets `flutter_web_bluetooth` ^0.3; if you install a different version, a couple of
  method names may need adjusting (the native path is the primary tested one).
