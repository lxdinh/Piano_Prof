# Piano Professor — ESP32 firmware

Flash this to the board so the app can find it over Bluetooth and drive the LED strip.

**A bare ESP32 advertises nothing.** If you powered the board up and your phone found no
Bluetooth device, that is expected — there was no firmware on it yet. This is that firmware.

---

## ⚠️ Read this first: C3 vs S3

| | ESP32-**C3** mini | ESP32-**S3** |
|---|---|---|
| Bluetooth + LED strip | ✅ works | ✅ works |
| MIDI from a DIN cable / serial | ✅ works | ✅ works |
| **USB-MIDI from the piano's USB-B "To Host" port** | ❌ **impossible** | ✅ works |

The C3 has only a USB Serial/JTAG peripheral (for programming and the console) — **it has no USB
host controller**, so it cannot read the piano over a USB cable no matter how it is wired. That is a
silicon limitation, not a firmware one.

**What this means:** the C3 will pair with the app and light the strip beautifully. To capture what
the learner *plays*, you need one of:

1. **An ESP32-S3** — the intended board. Set `USE_USB_MIDI_HOST 1` and add a USB-host MIDI library.
2. **MIDI DIN out** on the piano (the round 5-pin socket), into `PIN_MIDI_RX` through an optocoupler
   (6N138 or H11L1) — works on the C3 today with this firmware as written.
3. **A USB-host shield** (MAX3421E) over SPI — works on the C3, extra hardware.

Check the back of the Casio: if it has round 5-pin **MIDI OUT**, option 2 is the cheap path.

---

## Flashing (Arduino IDE)

1. **Install the ESP32 boards package**
   `File → Preferences → Additional Board Manager URLs`:
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
   Then `Tools → Board → Boards Manager` → install **esp32 by Espressif**.

2. **Install the LED library**
   `Tools → Manage Libraries` → search **Adafruit NeoPixel** → Install.
   (Bluetooth needs no extra library — it ships with the board package.)

3. **Select the board**
   - C3 mini / SuperMini → `Tools → Board → ESP32 Arduino → ESP32C3 Dev Module`
   - S3 → `ESP32S3 Dev Module`
   - `Tools → USB CDC On Boot → Enabled` (so the serial monitor works)

4. **Open** `piano-professor/piano-professor.ino`, pick the port, press **Upload**.
   If upload fails: hold **BOOT**, tap **RESET**, release **BOOT**, upload again.

5. **Confirm it worked** — on boot the strip does a **green sweep**. Serial monitor (115200) prints
   `Piano Professor firmware ready`.

---

## Wiring

| Signal | Pin | Notes |
|---|---|---|
| LED strip **DATA** | `GPIO 2` | change `PIN_LED_DATA` if you prefer another pin |
| LED strip **5V** | external 5V supply | **not** the board's 3.3V |
| LED strip **GND** | supply GND **and** board GND | grounds must be common |
| MIDI in | `GPIO 3` | `PIN_MIDI_RX`, via optocoupler, 31250 baud |

A 60-LED strip at full white can draw ~3.6 A — power it from its own 5 V supply, never from the
ESP32's pin. Add a 300–500 Ω resistor on DATA and a 1000 µF capacitor across the strip's 5 V/GND if
you see flicker.

`LED_COUNT` is **60**, mapping `ledIndex = midiNote - 36` (C2 → 0 … B6 → 59). C7 has no LED.

---

## Still no Bluetooth after flashing?

1. **Did the green sweep run?** No sweep = firmware isn't running, or the strip's data/ground wiring
   is wrong. Check the serial monitor for the ready line.
2. **Android needs Location permission** for BLE scanning — grant it to the app, and turn Location on.
   This is an Android requirement, not the app being fussy.
3. **The app scans by service UUID**, so the board only appears while this firmware advertises. Other
   BLE scanner apps will show `PianoProf` too — a good way to isolate whether the problem is the
   board or the phone. (nRF Connect is a free one.)
4. **Power-cycle the board** after flashing.
5. C3 boards with a chip antenna have short range — keep the phone within a metre for the first test.

---

## Firmware updates over Bluetooth (OTA)

Yes — and it's already built in. The catch worth understanding:

> **The first flash must be over USB.** OTA works by talking to firmware that is *already running*, so
> it can never install the very first copy. After this one USB flash, the board can be updated
> wirelessly forever.

The firmware exposes an OTA characteristic (`7e400004-…`) that accepts:

| Write | Meaning |
|---|---|
| `0xA0` + 4-byte little-endian size | begin an update |
| `0xA1` + chunk bytes | firmware data |
| `0xA2` | finish, verify, reboot into the new firmware |
| `0xA3` | abort |

During an update the whole strip glows **amber** so nobody unplugs it mid-write. If an update fails
or is interrupted, `Update.end()` rejects the image and the board reboots into the **existing**
firmware — a half-written update cannot brick it.

The app side (bundling a `.bin`, checking the version from the `0x00` handshake, and pushing chunks)
is **not built yet** — say the word and I'll add it, now that the board end is ready for it.
