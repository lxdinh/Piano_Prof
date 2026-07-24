# Piano Professor — ESP32 ⇄ App BLE protocol (v2)

The ESP32 is a **USB-MIDI host** plugged into the Casio's USB-B ("To Host") port and a **BLE
peripheral** the app connects to. It bridges the piano's MIDI to the app (key presses) and applies the
app's LED commands to the strip. This is the contract the firmware must implement; the app side lives
in `src/lesson1/hal.ts` + `src/lesson1/midi.ts`.

## GATT layout

| Role | UUID | Properties |
|------|------|-----------|
| Service | `7e400001-b5a3-f393-e0a9-e50e24dcca9e` | — |
| `CHAR_KEYS` (board → app) | `7e400002-b5a3-f393-e0a9-e50e24dcca9e` | **Notify** |
| `CHAR_LED` (app → board) | `7e400003-b5a3-f393-e0a9-e50e24dcca9e` | **Write Without Response** |

Advertise the service UUID so the app's scanner (`startDeviceScan([SERVICE])`) finds it. The app
requests MTU 185; keep notify/write payloads ≤ 180 bytes.

## Input — CHAR_KEYS notify (board → app)

Forward the Casio's MIDI as **discrete 3-byte messages**, back to back in one notify (the app strides
by 3). **Do not use running status.** Channel nibble is ignored by the app, so any channel is fine.

| Message | Bytes | Meaning |
|---------|-------|---------|
| Note on | `0x90, note, velocity` | key pressed; `velocity` 1–127 = how hard |
| Note off | `0x80, note, releaseVel` | key released (`releaseVel` 0 if the Casio doesn't send it) |
| Note off (alt) | `0x90, note, 0` | velocity-0 note-on, also treated as note-off |
| Sustain pedal | `0xB0, 0x40, value` | CC64; `value ≥ 64` = pedal down, else up |

- `note` is the MIDI number (Middle C = 60). The playable range the app cares about is 36–96 (C2–C7).
- Velocity is **required** for the dynamics grading — pass the Casio's real note-on velocity through
  unchanged. Do not normalize or clamp it.
- Duration and rhythm are derived app-side from note-on/off arrival times, so **no timestamp byte is
  needed**. Just forward events promptly (low, consistent latency matters more than a clock).
- Other CC / system messages may be dropped.

## Output — CHAR_LED write (app → board)

The app sends per-LED RGB frames. `ledIndex = note − 36` (C2 → 0 … B6 → 59). C7 (index 60) has no LED.
The app already chunks sets to ≤ 14 LEDs per write.

| Command | Bytes | Meaning |
|---------|-------|---------|
| Set LEDs | `0x01, count, (idx, r, g, b) × count` | set these LEDs to RGB |
| Clear | `0x02` | all LEDs off |
| Effect | `0x03, effectId, count, idx × count` | board-side effect on these LEDs |

`effectId`: `1` redFlash · `2` pulse · `3` rainbow · `4` celebration.

### What v2 changes on the app side (no new command needed)

- **Brightness = dynamics.** The app scales the RGB it sends: a note it wants played *forte* is sent
  bright, *piano* is sent dim. The firmware just displays the RGB it receives — **apply it verbatim**
  (optionally through a gamma curve for smoothness). Do **not** re-normalize brightness.
- **Gradual on/off (fades).** The app streams RGB frames at up to ~30 fps to ramp a note up (attack)
  and down (release). Firmware must apply incoming `0x01` frames promptly so the fade looks smooth.

### Optional firmware helpers (reduce BLE traffic — implement if easy)

| Command | Bytes | Meaning |
|---------|-------|---------|
| Ramp | `0x04, idx, r, g, b, durLo, durHi` | fade LED `idx` to RGB over `dur` ms (firmware interpolates) |
| Global brightness | `0x05, level` | master brightness 0–255 applied to all LEDs |

If you implement `0x04`, the app can send one command per note instead of many fade frames. Until then
the app drives fades frame-by-frame over `0x01`, which works with the current firmware.

## Version handshake (recommended)

On connect, the app may write `0x00` to `CHAR_LED`; reply with a one-byte notify `0x00, protocolVersion`
on `CHAR_KEYS` (current = `2`). This lets the app enable `0x04`/`0x05` only when the firmware supports
them. If unimplemented, the app falls back to the v1 behavior above.

## Firmware loop (pseudocode)

```
setup():
  usb_midi_host.begin()
  ble.advertise(SERVICE, [CHAR_KEYS notify, CHAR_LED writeNR])
  leds.begin(60)

loop():
  # Casio → app
  while (msg = usb_midi.read()):
    if msg is NoteOn/NoteOff/CC64:
      ble.notify(CHAR_KEYS, [msg.status, msg.data1, msg.data2])   # 3 bytes, no running status

  # app → strip
  on ble.write(CHAR_LED, buf):
    switch buf[0]:
      0x01: for each (idx,r,g,b) in buf: leds[idx] = gamma(r,g,b)
      0x02: leds.clear()
      0x03: runEffect(buf[1], indices(buf))
      0x04: startRamp(idx, rgb, durMs)     # optional
      0x05: leds.setGlobalBrightness(buf[1]) # optional
    leds.show()
```

## Test checklist (on hardware)

1. Press a Casio key → app registers the correct note **and** a velocity that tracks how hard you play.
2. Hold vs. tap the same key → the app's note duration differs accordingly.
3. Press the sustain pedal → the app sees pedal-down (notes sustain in lessons).
4. App lights a target note → the right LED lights in the right color; a *forte* target is visibly
   brighter than a *piano* one; the LED fades in and out rather than snapping.
5. Right-hand vs left-hand targets show warm vs cool colors.
