# Piano Prof — Progress Report

**Document date:** 2026-05-17
**Phase:** 1 — Hardware design (KiCad)

---

## Summary

The hardware design phase is essentially complete. Both PCB designs — the **octave LED strip** and the **controller board** — have been taken from concept through schematic capture, ERC verification, footprint assignment, PCB layout, routing, and DRC verification in KiCad 9. The next step is generating fabrication files and ordering the boards.

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

| Task | Status |
|---|---|
| Schematic capture | ✅ Done |
| ERC — electrical rules check | ✅ Clean |
| Footprint assignment | ✅ Done |
| PCB layout (~50 × 40 mm), ESP32 antenna keep-out | ✅ Done |
| Routing (signals, power, GND pour) | ✅ Done |
| DRC — design rules check | ✅ Clean (after relaxing hole-clearance rule for the USB-C footprint) |
| Final visual review (3D) | ✅ Reviewed |
| Fab files generation | ⬜ Pending — immediate next step |

**Note:** a final check flagged that C1 (100µF cap) may sit close to the bottom-left board edge — verify its courtyard is fully inside the outline before generating fab files.

---

## Design Evolution (decisions made during the project)

The controller design changed significantly as the requirements clarified:

1. **MCU: ESP32-WROOM-32E → ESP32-C3-MINI-1.** The C3 is cheaper, has Bluetooth, and has **native USB** — which let the entire CH340C USB-serial section be deleted. Simpler, cheaper board.

2. **Connectivity: Wi-Fi → Bluetooth LE.** Bluetooth gives simple direct phone pairing with no router/network setup. (Implication: the lesson app must be a wrapped native app, not a plain website, for Bluetooth to work on iPhone.)

3. **Level shifter: 74AHCT125 quad → 74AHCT1G125 single-gate.** Only one data line needs shifting, so a single-gate chip is smaller and cheaper than the 4-gate part.

4. **LED hardware: considered an off-the-shelf 144 LED/m strip, decided against it.** A pre-made strip's LED spacing doesn't match piano-key spacing — custom octave PCBs give exact per-key alignment.

5. **Auto-reset circuit: omitted.** The ESP32-C3's native USB handles flashing; the board uses manual BOOT+RESET buttons instead of an auto-reset transistor circuit. Fewer parts, less to go wrong.

6. **470µF bulk cap moved from the octave strip to the controller** — keeps the LED strips thin and low-profile.

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
2. **Controller:** verify C1 is inside the board outline, then generate fab files (Fabrication Toolkit)
3. **Order PCBs from JLCPCB:**
   - Octave strips: 5× flexible PCBs
   - Controller: 5× rigid FR-4 PCBs
4. **Assemble** the boards (hand-solder or JLCPCB SMT assembly service)
5. **ESP32 firmware** — BLE server + FastLED (Phase 3)
6. **App software** — add Bluetooth to LuminaKeys + Capacitor wrap (Phase 4)
7. **Integration & testing** — flash, pair, end-to-end test, mount on the piano (Phase 5)

---

## Skills / Tools Used

- **KiCad 9** — schematic capture, PCB layout, routing, ERC/DRC
- **easyeda2kicad** — importing the WS2812B-2020 and ESP32-C3-MINI-1 footprints from LCSC
- **Fabrication Toolkit plugin** — generating Gerber/BOM/placement files for JLCPCB
