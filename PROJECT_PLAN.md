# Piano Prof — Project Plan

**Project:** Piano Prof — an interactive piano-teaching system
**App name:** LuminaKeys
**Document date:** 2026-05-17

---

## 1. Concept

Piano Prof teaches piano by pairing a lesson app with physical LED guidance. The **LuminaKeys** app delivers structured lessons; a strip of addressable RGB LEDs mounted above the piano keys lights up to show the student exactly which keys to play. As a lesson progresses, the app sends LED commands wirelessly over Bluetooth to a controller, which drives the LEDs in real time.

## 2. System Architecture

```
┌──────────────────┐   Bluetooth LE   ┌──────────────────┐   4-wire cable   ┌────────────────────────┐
│  LuminaKeys App   │ ───────────────► │  Controller PCB   │ ───────────────► │  5 × Octave LED Strips  │
│  (phone / tablet) │                  │  (ESP32-C3)       │                  │  60 WS2812B RGB LEDs    │
└──────────────────┘                  └──────────────────┘                  └────────────────────────┘
   delivers lessons                      receives commands,                    one LED above each key
                                         level-shifts LED data
```

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
| MCU | ESP32-C3-MINI-1 (Bluetooth LE 5.0, native USB) |
| Power input | USB-C receptacle (5V power + native USB programming), 3A polyfuse, SMAJ5.0CA TVS diode |
| Regulator | AMS1117-3.3 (5V → 3.3V) |
| Level shifter | 74AHCT1G125 single-gate buffer (3.3V → 5V LED data) |
| Output | JST SH 4-pin connector to the first octave strip |
| Controls | BOOT + RESET tactile buttons, status LED |
| Bulk caps | 100µF, 10µF, 470µF (LED inrush), 22µF (regulator) |
| Size | ~50 × 40 mm |

## 4. Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| LED type | WS2812B-2020 addressable RGB | Full color, single data wire, per-key control |
| LED count | 60 — one per key, 5 octaves | Exact per-key guidance |
| LED form factor | Custom flex PCBs | Off-the-shelf strips don't match piano-key spacing; custom = exact alignment |
| Controller MCU | ESP32-C3-MINI-1 | Cheap, Bluetooth built in, native USB (no separate USB-serial chip needed) |
| Connectivity | Bluetooth LE | Simple direct phone pairing, no Wi-Fi network/router needed |
| Level shifter | 74AHCT1G125 (single-gate) | 3.3V→5V data conversion; single-gate is smallest and cheapest |
| Power | USB-C 5V/3A | Standard phone charger |
| Flashing | Manual BOOT+RESET (no auto-reset circuit) | Simpler board; ESP32-C3 native USB handles flashing |
| App delivery | Website wrapped with Capacitor | Bluetooth works on iPhone only via a native/wrapped app, not a plain website |

## 5. Power Budget

- Constraint: **max 10 LEDs lit simultaneously**
- 10 LEDs at full white ≈ 0.6 A
- ESP32-C3 + Bluetooth peaks ≈ 0.5 A
- **Total ≈ 1.1 A** — comfortably within the USB-C 5V/3A supply

## 6. Project Phases

| Phase | Description | Status |
|---|---|---|
| **1. Hardware design** | KiCad — octave strip + controller PCB | ✅ Essentially complete |
| **2. Fabrication & assembly** | Generate fab files, order from JLCPCB, assemble | ⬜ Next |
| **3. ESP32 firmware** | BLE server + FastLED + note→LED mapping (~200 lines) | ⬜ Pending |
| **4. App software** | Add BLE client to LuminaKeys, wrap with Capacitor | ⬜ Pending |
| **5. Integration & testing** | Flash firmware, pair app, end-to-end test, mount on piano | ⬜ Pending |

## 7. Software Plan

**ESP32-C3 firmware** (Arduino framework):
- BLE server advertising a custom service; the app writes LED commands (LED index + RGB)
- FastLED library drives the WS2812B chain via GPIO4 → level shifter
- Maps the lesson's note data to LED indices (0–59)

**LuminaKeys app:**
- Currently a browser-based web app (HTML/JS/CSS)
- Add a Bluetooth module that sends LED commands per lesson step
- Wrap with **Capacitor** to produce native iOS + Android apps (required for Bluetooth on iPhone)
- Use the `@capacitor-community/bluetooth-le` plugin

## 8. Reference Files

| File | Contents |
|---|---|
| `hardware/BOM.csv` | Full bill of materials, both boards |
| `hardware/octave-led-positions.csv` | LED coordinates for the octave strip |
| `hardware/controller-netlist.txt` | Controller net connection reference |
| `hardware/octave-netlist.txt` | Octave strip net connection reference |
| `hardware/controller/` | Controller KiCad project |
| `hardware/octave-module/` | Octave strip KiCad project |
