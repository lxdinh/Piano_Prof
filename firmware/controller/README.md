# controller_v2 firmware

BLE-peripheral firmware for the Piano Prof controller (ESP32-S3-MINI-1-N4R2).
Implements the GATT contract defined in `mobile/lib/ble/piano_professor_gatt.dart`.

## What it does
- Advertises as `Piano-Prof-XXXX` (last 2 bytes of the BT MAC).
- **LED-Command** char (`…0002…`, write): drives the WS2812B strip on IO4
  (op-codes `setLed` / `setMany` / `clearAll` / `setBrightness`).
- **Note-Event** char (`…0003…`, notify): forwards TRS-MIDI note on/off.
- **Device-Status** char (`…0004…`, read+notify): `[ledCount, fwMajor, fwMinor, source]`.
- Power-on: R→G→B wipe down the strip as a self-test.

## Pin map (from `hardware/controller-netlist.txt`)
| Signal | GPIO | Net |
|--------|------|-----|
| LED data | IO4 | → U2 level shifter → J2 Din |
| Status LED | IO9 | → R4 → D2 |
| MIDI RX | IO5 | ← U5 (H11L1 opto), UART1, 31250 baud |
| USB mux SEL | IO10 | → U3 (0=USB-C, 1=USB-A); held LOW here |

## Toolchain
[PlatformIO](https://platformio.org/) (VS Code extension or `pip install platformio`).

```bash
cd firmware/controller
pio run                 # build
pio run -t upload       # flash over USB-C
pio device monitor      # serial log @ 115200
```

If upload doesn't auto-enter download mode: **hold SW2 (BOOT), tap SW1 (RESET), release BOOT**, then upload.

## Bench bring-up order
1. Flash. Watch the serial log for `advertising as Piano-Prof-XXXX`.
2. Status LED (D2) should **slow-blink** (advertising).
3. Strip does the R/G/B startup wipe → data path + LEDs proven.
4. Connect from the app (or nRF Connect). D2 goes **solid** on connect.
5. Write `01 00 FF 00 00` to the LED-Command char → LED 0 turns red.
6. Play a key on the TRS-MIDI source → a Note-Event notification fires.

## Known follow-ups
- **USB-A host MIDI** (IO10 = HIGH, TinyUSB host) is not implemented — TRS only.
- If MIDI bytes come through inverted/garbled, set `MIDI_INVERT = true` in `main.cpp`.
- Firmware version is hard-coded `0.1` in `main.cpp` (`FW_MAJOR`/`FW_MINOR`).
