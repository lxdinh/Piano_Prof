# Piano Prof — Progress Report

**Document date:** 2026-05-20
**Phase:** 1b — Hardware redesign (controller v2: add MIDI input)

---

## Summary

The **octave LED strip** is finalized and ready for fab (one connector-orientation re-check pending). The **controller** was finalized as v1 (ESP32-C3, no MIDI input) but is being revised to **v2** to add MIDI input from the piano — both USB-MIDI (Host mode, for USB-B-only pianos) and TRS MIDI IN (Type A, for DIN-MIDI pianos via an included adapter). This requires swapping the MCU to ESP32-S3-MINI-1 (the C3's USB peripheral is device-only and cannot host). Fab files have not been generated yet, so the v2 changes are made before tooling cost is incurred.

---

## Octave LED Strip — status

| Task | Status |
|---|---|
| Schematic capture (12 LEDs, 12 caps, 2 connectors) | ✅ Done |
| WS2812B-2020 symbol & footprint sourced (easyeda2kicad) | ✅ Done |
| ERC — electrical rules check | ✅ Clean |
| Footprint assignment | ✅ Done |
| PCB layout — 164.5 × 12 mm board outline | ✅ Done |
| LED placement at piano-key X-coordinates | ✅ Done |
| Routing (data chain, +5V rail, GND pour) | ✅ Done |
| DRC — design rules check | ✅ Clean |
| Fab files generated (Fabrication Toolkit) | ✅ Done (first version) |
| Re-layout — LEDs moved to bottom edge for key alignment | 🔄 Finalizing (connector orientation) |

**Note:** the strip was re-laid out so the LEDs hug the bottom edge (closer to the keys). Re-routing is done; the last item is confirming J1/J2 connector orientation (J1 cable faces left, J2 faces right) and regenerating the fab files.

---

## Controller PCB — status

**v1 (ESP32-C3, no MIDI input)** — was essentially complete and ready for fab. Superseded by v2 before fab files were generated.

**v2 (ESP32-S3, USB MIDI Host + TRS MIDI IN)** — in progress.

| Task | Status |
|---|---|
| v1 schematic + PCB + ERC + DRC | ✅ Done (superseded) |
| v2 design spec written (BOM, netlist reference, layout plan) | ✅ Done — see `controller-netlist.txt`, `BOM.csv` |
| Import ESP32-S3-MINI-1 symbol + footprint (easyeda2kicad C2913201) | ⬜ Next |
| Schematic update: swap U1 (S3-MINI-1-N4R2), swap J1 (TYPE-C-31-M-12), add U3 (USB mux), U5 (H11L1 opto), J3 (USB-A hybrid), J4 (TRS), D3 (USBLC6), D4 (reverse-bias diode, optional), F2, R8 (×1), R10, R11 (IO0 pull-up), C16–C18 | ⬜ |
| Re-route USB-C D+/D- through the mux | ⬜ |
| ERC clean on v2 schematic | ⬜ |
| PCB outline grow to ~60×45 mm; antenna keepout updated for S3 | ⬜ |
| PCB re-layout (place new connectors along one edge; place USBLC6 next to J3) | ⬜ |
| Routing (USB diff pair 90Ω target; maintain GND pour gap under TRS opto LED loop) | ⬜ |
| DRC clean on v2 PCB | ⬜ |
| 3D visual review | ⬜ |
| Fab files (Fabrication Toolkit) | ⬜ |

## Why the v2 redesign

The project added a new requirement: the controller must **read MIDI directly from the piano** (instead of only receiving lesson timing from the app over BLE). And because the system is being designed for resale, it must work with both modern USB-MIDI pianos (like the developer's own, USB-B only) and traditional pianos with 5-pin DIN MIDI OUT.

The ESP32-C3 from v1 has USB-device-mode hardware only — it physically cannot be a USB Host. Swapping to the ESP32-S3-MINI-1 unlocks native USB Host while staying in the same module family. The added TRS MIDI IN (Type A) handles DIN-MIDI pianos via a $3 TRS-to-DIN adapter shipped with the product.

---

## Design Evolution (decisions made during the project)

The controller design changed significantly as the requirements clarified:

1. **MCU: ESP32-WROOM-32E → ESP32-C3-MINI-1.** The C3 is cheaper, has Bluetooth, and has **native USB** — which let the entire CH340C USB-serial section be deleted. Simpler, cheaper board.

2. **Connectivity: Wi-Fi → Bluetooth LE.** Bluetooth gives simple direct phone pairing with no router/network setup. (Implication: the lesson app must be a wrapped native app, not a plain website, for Bluetooth to work on iPhone.)

3. **Level shifter: 74AHCT125 quad → 74AHCT1G125 single-gate.** Only one data line needs shifting, so a single-gate chip is smaller and cheaper than the 4-gate part.

4. **LED hardware: considered an off-the-shelf 144 LED/m strip, decided against it.** A pre-made strip's LED spacing doesn't match piano-key spacing — custom octave PCBs give exact per-key alignment.

5. **Auto-reset circuit: omitted.** The ESP32-C3's native USB handles flashing; the board uses manual BOOT+RESET buttons instead of an auto-reset transistor circuit. Fewer parts, less to go wrong.

6. **470µF bulk cap moved from the octave strip to the controller** — keeps the LED strips thin and low-profile.

7. **MCU: ESP32-C3-MINI-1 → ESP32-S3-MINI-1-N8 (v2).** The C3's USB is device-mode only, so it cannot read MIDI from a piano's USB-B port. The S3 has native USB OTG with Host mode, same module family, same BLE 5.0. Trade-off: ~$1.50 more per board, and a USB mux (TS3USB221A) is needed because the S3 has only one USB peripheral shared between USB-C (programming) and USB-A (host).

8. **MIDI input added (v2): USB-A host + 3.5 mm TRS MIDI IN.** USB-A covers modern USB-MIDI pianos; TRS Type A covers traditional DIN-MIDI pianos via a $3 TRS-to-DIN adapter shipped in the box. TRS is much smaller than a 5-pin DIN and saves significant board area. An H11L1 optocoupler provides MMA-spec galvanic isolation on the TRS path.

9. **Cost-optimization pass on the v2 BOM (saves ~$0.70/board + 2 fewer JLCPCB Extended-part fees):**
   - **ESP32-S3-MINI-1-N4R2** (4 MB flash + 2 MB PSRAM, LCSC C3013941) instead of -N8 — firmware fits in 4 MB; PSRAM is a free bonus on the in-stock variant.
   - **TYPE-C-31-M-12** USB-C receptacle (JLCPCB Basic part) instead of GCT USB4105 — same function, no SMT-assembly setup fee.
   - **H11L1S(TA)** MIDI optocoupler (EVERLIGHT, SOP-6-2.54mm, LCSC C78589) instead of 6N137 — built-in Schmitt-trigger logic output means no external pull-up resistor (R9 deleted). Note: SOP-6-2.54mm ≠ standard SOIC-6; needs the easyeda2kicad-imported footprint.
   - Rejected swaps (kept for engineering reasons): the TS3USB221A USB mux is **kept** to preserve JTAG-over-USB debugging on the ESP32-S3; the SMAJ5.0CA TVS and 470 µF inrush cap are kept for safety margin.

10. **Design-review pass — four bugs found and fixed before KiCad schematic capture:**
    - **GPIO3 strap conflict**: the USB-mux SEL signal was originally on GPIO3, which is the ESP32-S3 JTAG-source strapping pin. Pulling it LOW at boot would have *disabled* USB-JTAG — defeating the whole reason we kept the mux. Moved SEL to **IO10** (a non-strapping GPIO).
    - **TRS MIDI wiring was wrong**: the original draft had Tip going to opto LED anode and Ring connected to receiver-side +3V3. Per the MMA Type A MIDI receiver spec, **Ring → LED anode (current from piano), Tip → 220Ω → LED cathode (current return)**, and Sleeve → NC. Wiring corrected; R8 quantity dropped from 2 to 1.
    - **No external pull-up on IO0 (BOOT)**: relied solely on the ESP32-S3's weak internal pull-up — risks intermittent boot failures. Added **R11 (10 kΩ)** from IO0 to +3V3.
    - **USB-A receptacle assembly note**: the chosen TE 292303-1 has SMD signal contacts but through-hole mechanical retention tabs (industry standard for USB-A). JLC SMT cannot place hybrid parts; documented that the USB-A must be hand-soldered after assembly (or use JLC's hand-solder service).
    - **Optional improvement**: added **D4 (1N4148W)** in reverse-bias across the H11L1 opto LED for reverse-polarity protection on the MIDI input.

---

## Supporting Files Created

| File | Purpose |
|---|---|
| `hardware/BOM.csv` | Bill of materials — both boards, with manufacturer/LCSC part numbers |
| `hardware/octave-led-positions.csv` | Exact LED X/Y coordinates for the octave strip |
| `hardware/controller-netlist.txt` | Controller net-by-net connection reference |
| `hardware/octave-netlist.txt` | Octave strip net connection reference |
| `hardware/controller/` | Controller KiCad project (schematic + PCB) |
| `hardware/octave-module/` | Octave strip KiCad project (schematic + PCB) |

---

## Outstanding Items / Next Steps

1. **Octave strip:** confirm J1/J2 connector orientation, regenerate fab files
2. **Controller v2 KiCad work** (in order):
   - Run `easyeda2kicad --full --lcsc_id=C2913201` to import ESP32-S3-MINI-1 symbol + footprint
   - Update schematic: replace U1 with ESP32-S3-MINI-1-**N4**; swap J1 to TYPE-C-31-M-12 (JLC Basic); add U3 (TS3USB221A), U5 (**H11L1**), J3 (USB-A), J4 (TRS), D3 (USBLC6), F2, R8a/R8b, R10, C16–C18; reroute USB-C D+/D- through U3
   - Annotate and assign footprints, ERC clean
   - Resize PCB outline to ~60×45 mm, update antenna keepout for S3
   - Place new connectors along one edge; place D3 right at J3; keep MIDI opto loop GND-free
   - Re-route (USB diff pair target 90Ω); DRC clean
   - 3D visual review
   - Generate fab files (Fabrication Toolkit)
3. **Order PCBs from JLCPCB:**
   - Octave strips: 5× flexible PCBs
   - Controller v2: 5× rigid FR-4 PCBs
4. **Assemble** the boards (hand-solder or JLCPCB SMT assembly service)
5. **ESP32-S3 firmware** — BLE server + FastLED + TinyUSB MIDI Host + UART MIDI parser + note→LED mapping (Phase 3)
6. **App software** — add Bluetooth to LuminaKeys + Capacitor wrap + note-feedback UI (Phase 4)
7. **Integration & testing** — flash, pair, end-to-end test with both USB and TRS MIDI sources, mount on the piano (Phase 5)
8. **Source the in-box accessory** — TRS-to-5-pin-DIN MIDI adapter cable (Type A polarity) for shipping with units sold to users with DIN-MIDI pianos

---

## Skills / Tools Used

- **KiCad 9** — schematic capture, PCB layout, routing, ERC/DRC
- **easyeda2kicad** — importing the WS2812B-2020, ESP32-C3-MINI-1, and (for v2) ESP32-S3-MINI-1 footprints from LCSC
- **Fabrication Toolkit plugin** — generating Gerber/BOM/placement files for JLCPCB
