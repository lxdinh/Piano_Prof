# Piano Prof — firmware

Two images share one flash layout (`partitions_pianoprof.csv`):

| | What it is | How it gets on the board |
|---|---|---|
| **factory** | Minimal BLE + OTA recovery image. Advertises the OTA service only — no LEDs, no note events. | Flashed **once over USB**. Nothing ever overwrites it, because OTA only cycles `ota_0`/`ota_1`. |
| **controller** | The real LED + MIDI firmware. | Delivered **over Bluetooth** by the app, into `ota_0`/`ota_1`. |

That split is what makes a failed update survivable: with empty or invalid
otadata the bootloader falls back to `factory`, so the board always comes up
advertising BLE and can be re-flashed from the phone.

## ⚠️ Incomplete in git

This folder currently has the **build configuration only**. Still missing:

```
firmware/factory/src/main.cpp          firmware/controller/src/main.cpp
firmware/factory/platformio.ini        firmware/controller/arduino/
firmware/factory/erase_otadata.py      firmware/factory/README.md
firmware/factory/tools/ota_push.py
```

GitHub's web uploader flattens directories, so the `firmware/` tree did not
survive the upload — only the loose `.ts` files did. Push it with git rather
than the web UI:

```bash
git add firmware/
git commit -m "firmware: factory + controller sources"
git push
```

## Building the controller image

```bash
cd firmware/controller
pio run                  # → .pio/build/controller_v2/firmware.bin
```

Hand that `firmware.bin` to the app's **Update module** screen (Pair → a board
in recovery routes there automatically).

`pio run -t upload` also works over USB-C, but note it writes to the **factory**
slot and therefore replaces the recovery image. Restore it afterwards with
`cd ../factory && pio run -t upload`.

## The app side of the contract

The GATT contract lives in [`src/ble/constants.ts`](../src/ble/constants.ts) and
[`src/ble/protocol.ts`](../src/ble/protocol.ts); the byte formats are pinned by
[`src/__tests__/bleProtocol.test.ts`](../src/__tests__/bleProtocol.test.ts), so
changing an opcode on one side fails a test instead of silently doing nothing.

| | UUID | Direction |
|---|---|---|
| Service | `f0a1d2c3-0001-…` | — |
| LED command | `f0a1d2c3-0002-…` | app → board (write) |
| Note event | `f0a1d2c3-0003-…` | board → app (notify) |
| Device status | `f0a1d2c3-0004-…` | read + notify |
| OTA service | `f0a1d2c3-0010-…` | present alone in recovery |

**Board support:** the controller targets the **ESP32-S3**-MINI-1-N4R2. An
ESP32-**C3** has no USB host controller, so it cannot read the piano's USB-B
"To Host" port — C3 can do BLE, LEDs and TRS/DIN MIDI only.
