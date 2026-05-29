# Piano Prof — Project Plan

**Project:** Piano Prof — an interactive piano-teaching system
**App name:** Piano Professor (formerly "LuminaKeys")
**Document date:** 2026-05-17 (software sections updated 2026-05-24)

---

## 1. Concept

Piano Prof teaches piano by pairing a lesson app with physical LED guidance. The **LuminaKeys** app delivers structured lessons; a strip of addressable RGB LEDs mounted above the piano keys lights up to show the student exactly which keys to play. As a lesson progresses, the app sends LED commands wirelessly over Bluetooth to a controller, which drives the LEDs in real time.

## 2. System Architecture

```
┌──────────────────┐   Bluetooth LE   ┌──────────────────┐   4-wire cable   ┌────────────────────────┐
│  LuminaKeys App   │ ───────────────► │  Controller PCB   │ ───────────────► │  5 × Octave LED Strips  │
│  (phone / tablet) │ ◄─────────────── │  (ESP32-S3)       │                  │  60 WS2812B RGB LEDs    │
└──────────────────┘   note events    └──────────────────┘                  └────────────────────────┘
   delivers lessons                      ▲          ▲                          one LED above each key
                                         │ USB MIDI │ TRS MIDI (Type A)
                                         │ (Host)   │ (opto-isolated)
                                  ┌──────┴──────────┴──────┐
                                  │       Piano             │
                                  │  USB-B  or  DIN MIDI    │
                                  └─────────────────────────┘
```

The controller reads played notes directly from the piano — via USB-MIDI (Host mode) for USB-B-only pianos, or via 3.5 mm TRS MIDI IN (Type A pinout, with included TRS-to-DIN adapter) for traditional pianos with 5-pin DIN MIDI OUT. Note events flow back to the app over BLE for lesson scoring.

The 5 octave strips daisy-chain end to end (each strip's output connector feeds the next strip's input), covering 5 octaves = 60 keys.

## 3. Hardware

### 3.1 Octave LED Strip (×5 — identical flexible PCBs)

| Spec | Value |
|---|---|
| Size | 164.5 × 12 mm, flexible (polyimide) PCB |
| LEDs | 12 × WS2812B-2020 addressable RGB (one per key) |
| LED placement | At exact piano-key X-coordinates, near the bottom edge |
| Decoupling | 12 × 0.1µF (one per LED) |
| Connectors | 2 × JST SH 4-pin (J1 input, J2 output) for daisy-chaining |
| Per board | 12 keys (one octave) |
| Full system | 5 boards chained = 60 LEDs, 5 octaves |

LED X-coordinates (mm from octave start): white keys on 23.5 mm pitch (11.75, 35.25, 58.75, 82.25, 105.75, 129.25, 152.75); black keys at geometric positions (21.22, 49.28, 90.58, 117.50, 144.43).

### 3.2 Controller PCB (×1 — rigid FR4, 2-layer)

| Block | Parts |
|---|---|
| MCU | ESP32-S3-MINI-1-N4R2 (4 MB flash + 2 MB PSRAM; Bluetooth LE 5.0, native USB OTG with **Host** support) |
| Power input | USB-C receptacle (5V power + USB-device programming), 3A polyfuse, SMAJ5.0CA TVS diode |
| USB MIDI input | USB-A host receptacle, USBLC6 ESD array, 500 mA polyfuse on VBUS |
| USB mux | TS3USB221A — shares S3 USB pins between USB-C (programming) and USB-A (host) |
| MIDI IN (DIN/TRS) | 3.5 mm TRS jack (Type A pinout) + H11L1 logic-output optocoupler (built-in Schmitt) for galvanic isolation |
| Regulator | AMS1117-3.3 (5V → 3.3V) |
| Level shifter | 74AHCT1G125 single-gate buffer (3.3V → 5V LED data) |
| LED output | JST SH 4-pin connector to the first octave strip |
| Controls | BOOT + RESET tactile buttons, status LED |
| Bulk caps | 100µF, 10µF, 470µF (LED inrush), 22µF (regulator) |
| Size | ~60 × 45 mm |

## 4. Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| LED type | WS2812B-2020 addressable RGB | Full color, single data wire, per-key control |
| LED count | 60 — one per key, 5 octaves | Exact per-key guidance |
| LED form factor | Custom flex PCBs | Off-the-shelf strips don't match piano-key spacing; custom = exact alignment |
| Controller MCU | ESP32-S3-MINI-1-N4R2 | Same module family as C3 + native USB **Host** for reading piano USB-MIDI. C3 was device-only and could not host. N4R2 (4 MB flash + 2 MB PSRAM) chosen over N8 — firmware fits comfortably in 4 MB; PSRAM is a free bonus on the in-stock variant at LCSC. |
| Piano MIDI input | USB Host (USB-A) + TRS MIDI IN (Type A) | Covers both modern USB-only pianos and traditional DIN-MIDI pianos. TRS-to-DIN adapter cable shipped in box. |
| USB programming path | USB-C via TS3USB221A mux | S3 has only one USB peripheral; mux lets us share it between USB-C (programming) and USB-A (host). |
| MIDI isolation | H11L1 logic-output optocoupler | MMA-spec galvanic isolation for the TRS MIDI input. Built-in Schmitt trigger means no external pull-up needed, simpler than 6N137. |
| Connectivity | Bluetooth LE | Simple direct phone pairing, no Wi-Fi network/router needed |
| Level shifter | 74AHCT1G125 (single-gate) | 3.3V→5V data conversion; single-gate is smallest and cheapest |
| Power | USB-C 5V/3A | Standard phone charger |
| Flashing | Manual BOOT+RESET (no auto-reset circuit) | Simpler board; ESP32-S3 native USB handles flashing |
| App delivery | Website wrapped with Capacitor | Bluetooth works on iPhone only via a native/wrapped app, not a plain website |

## 5. Power Budget

- Constraint: **max 10 LEDs lit simultaneously**
- 10 LEDs at full white ≈ 0.6 A
- ESP32-C3 + Bluetooth peaks ≈ 0.5 A
- **Total ≈ 1.1 A** — comfortably within the USB-C 5V/3A supply

## 6. Project Phases

| Phase | Description | Status |
|---|---|---|
| **1. Hardware design (v1)** | KiCad — octave strip + controller v1 PCB (no MIDI input) | ✅ Complete |
| **1b. Hardware redesign (v2)** | Add USB Host + TRS MIDI IN; swap MCU C3 → S3 | 🔄 In progress |
| **2. Fabrication & assembly** | Generate fab files, order from JLCPCB, assemble | ⬜ Blocked on 1b |
| **3. ESP32-S3 firmware** | BLE server + FastLED + USB MIDI Host + UART MIDI parser + note→LED mapping | ⬜ Pending |
| **4. App software** | **Flutter app "Piano Professor"** (`mobile/`) — lessons, gamification, audio, OMR, BLE client, AI voice | 🔄 In progress |
| **5. Integration & testing** | Flash firmware, pair app, end-to-end test, mount on piano | ⬜ Pending |

## 7. Software Plan

**ESP32-S3 firmware** (Arduino framework):
- BLE server advertising a custom service; the app writes LED commands (LED index + RGB) AND subscribes to note events
- FastLED library drives the WS2812B chain via GPIO4 → level shifter
- **SAFETY-CRITICAL: `FastLED.setMaxPowerInVoltsAndMilliamps(5, 900)`** — caps total LED draw at 900 mA so the JST SH connector (1 A), thin flex traces, and inter-board cable are never overdriven. 60 LEDs at full white would otherwise pull 3.6 A. Not optional.
- **USB MIDI Host** via TinyUSB MIDI Host class — enumerates the piano on the USB-A port, parses Note On/Off
- **TRS MIDI IN** via UART1 RX @ 31250 baud — standard MIDI byte parser
- Both inputs feed a unified Note event queue → forwarded over BLE to the app for lesson scoring
- USB-mux select (**IO10**): boots LOW (USB-C active for programming), firmware drives HIGH after startup to enable USB-A host. (IO10, not IO3 — IO3 is a strapping pin.)
- Maps the lesson's note data to LED indices (0–59) for guidance, and matches incoming notes for feedback

**Piano Professor app** (Flutter — `mobile/`; supersedes the earlier "web app + Capacitor" plan):
- Cross-platform Flutter (iOS / Android / Web). BLE client implemented for both native (`flutter_blue_plus`) and
  Web Bluetooth, speaking the GATT contract in `mobile/lib/ble/piano_professor_gatt.dart`.
- 6-level lesson path with an interactive engine (speak + light keys + audio + quizzes + LED sync).
- Client-authoritative gamification (XP, streaks, hearts, gems, stars, lesson gating, daily goal, achievements) on
  Firebase Auth + Firestore (`backend/firebase/SCHEMA.md`); runs in-memory when Firebase is absent (demo mode).
- Audio via SoLoud (real samples or synth fallback, sustain, reverb); instructor voice + sung solfège via
  **Google Gemini TTS** (Google AI Studio key).
- OMR import (PDF/photo → Cloud Storage → oemer → MusicXML → chord-annotated playable preview).
- See `mobile/README.md` for the full architecture + run instructions.

> Note: the original plan was a browser web app wrapped with Capacitor; it was superseded by a native **Flutter**
> rewrite (single codebase for iOS/Android/Web, better audio/BLE control).

## 8. Reference Files

| File | Contents |
|---|---|
| `hardware/BOM.csv` | Full bill of materials, both boards |
| `hardware/octave-led-positions.csv` | LED coordinates for the octave strip |
| `hardware/controller-netlist.txt` | Controller net connection reference |
| `hardware/octave-netlist.txt` | Octave strip net connection reference |
| `hardware/controller/` | Controller KiCad project |
| `hardware/octave-module/` | Octave strip KiCad project |
