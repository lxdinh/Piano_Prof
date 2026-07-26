/*
 * Piano Professor — ESP32 firmware (BLE LED strip + MIDI bridge)
 * ---------------------------------------------------------------
 * Implements the app's BLE protocol v2 (see docs/esp32-ble-protocol.md).
 *
 * BOARD SUPPORT
 *   ESP32-C3 (SuperMini / C3 mini)  — BLE + LED strip + MIDI over UART.
 *                                     CANNOT read USB-MIDI: the C3 has no USB
 *                                     host peripheral, only USB Serial/JTAG.
 *   ESP32-S3                        — everything above, plus USB-MIDI host
 *                                     from the piano's "To Host" USB-B port
 *                                     (set USE_USB_MIDI_HOST to 1).
 *
 * WHAT WORKS WITHOUT ANY PIANO CONNECTION
 *   The app can pair, and every LED command works. Key input simply stays
 *   silent until a MIDI source is wired up.
 *
 * LIBRARIES (Arduino IDE → Library Manager)
 *   - Adafruit NeoPixel
 *   BLE comes with the ESP32 board package; nothing extra to install.
 */

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <Adafruit_NeoPixel.h>
#include <Update.h>

#if !defined(ESP_ARDUINO_VERSION_MAJOR) || ESP_ARDUINO_VERSION_MAJOR < 3
  #include <BLE2902.h>   // core 2.x needs the CCCD descriptor added by hand
  #define NEEDS_BLE2902 1
#endif

// ── configuration ───────────────────────────────────────────────────────────
#define USE_USB_MIDI_HOST 0      // 1 only on ESP32-S3 with a USB-host MIDI lib

static const uint8_t  PIN_LED_DATA = 2;   // WS2812B strip DATA
static const uint8_t  PIN_MIDI_RX  = 3;   // MIDI-in (DIN via optocoupler, 31250 baud)
static const uint16_t LED_COUNT    = 60;  // C2..B6 — index = midiNote - 36
static const uint8_t  MIDI_LOW     = 36;  // C2
static const uint8_t  MIDI_HIGH    = 95;  // B6  (C7 = 96 has no LED)
static const uint8_t  PROTOCOL_VERSION = 2;
static const char*    DEVICE_NAME  = "PianoProf";

// UUIDs — must match src/lesson1/hal.ts BLE_IDS exactly.
#define SVC_UUID       "7e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define CHAR_KEYS_UUID "7e400002-b5a3-f393-e0a9-e50e24dcca9e"  // board → app (notify)
#define CHAR_LED_UUID  "7e400003-b5a3-f393-e0a9-e50e24dcca9e"  // app → board (write NR)
#define CHAR_OTA_UUID  "7e400004-b5a3-f393-e0a9-e50e24dcca9e"  // app → board (firmware)

Adafruit_NeoPixel strip(LED_COUNT, PIN_LED_DATA, NEO_GRB + NEO_KHZ800);

BLECharacteristic* chKeys = nullptr;
bool     deviceConnected  = false;
uint8_t  globalBrightness = 255;

// ── LED effects (board-side, triggered by opcode 0x03) ───────────────────────
enum Effect { FX_NONE = 0, FX_RED_FLASH = 1, FX_PULSE = 2, FX_RAINBOW = 3, FX_CELEBRATION = 4 };
Effect        activeFx      = FX_NONE;
uint32_t      fxUntil       = 0;
uint8_t       fxIdx[LED_COUNT];
uint8_t       fxIdxCount    = 0;

// ── gamma so brightness ramps look linear to the eye ────────────────────────
static uint8_t gamma8(uint8_t v) {
  return (uint8_t)((uint16_t)v * v / 255);
}

static void showScaled() {
  strip.setBrightness(globalBrightness);
  strip.show();
}

// ── BLE server callbacks ────────────────────────────────────────────────────
class ServerCB : public BLEServerCallbacks {
  void onConnect(BLEServer*) override { deviceConnected = true; }
  void onDisconnect(BLEServer* s) override {
    deviceConnected = false;
    strip.clear();
    showScaled();
    s->startAdvertising();          // always become findable again
  }
};

// ── LED characteristic — the app's command channel ──────────────────────────
class LedCB : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* c) override {
    uint8_t* d = c->getData();
    size_t   n = c->getLength();
    if (n == 0) return;

    switch (d[0]) {
      case 0x00: {                                   // version handshake
        uint8_t reply[2] = { 0x00, PROTOCOL_VERSION };
        if (chKeys) { chKeys->setValue(reply, 2); chKeys->notify(); }
        break;
      }
      case 0x01: {                                   // set LEDs
        if (n < 2) break;
        uint8_t count = d[1];
        for (uint8_t i = 0; i < count; i++) {
          size_t off = 2 + i * 4;
          if (off + 3 >= n) break;
          uint8_t idx = d[off];
          if (idx >= LED_COUNT) continue;
          strip.setPixelColor(idx, strip.Color(gamma8(d[off + 1]), gamma8(d[off + 2]), gamma8(d[off + 3])));
        }
        activeFx = FX_NONE;
        showScaled();
        break;
      }
      case 0x02:                                     // clear
        activeFx = FX_NONE;
        strip.clear();
        showScaled();
        break;
      case 0x03: {                                   // effect
        if (n < 3) break;
        activeFx   = (Effect)d[1];
        fxIdxCount = d[2];
        if (fxIdxCount > LED_COUNT) fxIdxCount = LED_COUNT;
        for (uint8_t i = 0; i < fxIdxCount && (3 + i) < n; i++) fxIdx[i] = d[3 + i];
        fxUntil = millis() + (activeFx == FX_RED_FLASH ? 150 : 2000);
        break;
      }
      case 0x05:                                     // global brightness
        if (n >= 2) { globalBrightness = d[1]; showScaled(); }
        break;
      default: break;                                // 0x04 ramp: app streams frames
    }
  }
};

// ── OTA characteristic — update firmware over BLE ───────────────────────────
// [0xA0, len32] begin · [0xA1, ...chunk] data · [0xA2] finish+reboot · [0xA3] abort
class OtaCB : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* c) override {
    uint8_t* d = c->getData();
    size_t   n = c->getLength();
    if (n == 0) return;

    if (d[0] == 0xA0 && n >= 5) {
      uint32_t size = (uint32_t)d[1] | ((uint32_t)d[2] << 8) | ((uint32_t)d[3] << 16) | ((uint32_t)d[4] << 24);
      Update.begin(size);
      // amber = updating, so it is obvious the board must not lose power
      for (uint16_t i = 0; i < LED_COUNT; i++) strip.setPixelColor(i, strip.Color(60, 30, 0));
      showScaled();
    } else if (d[0] == 0xA1 && n > 1) {
      Update.write(d + 1, n - 1);
    } else if (d[0] == 0xA2) {
      if (Update.end(true)) { delay(200); ESP.restart(); }
    } else if (d[0] == 0xA3) {
      Update.abort();
      strip.clear();
      showScaled();
    }
  }
};

// ── MIDI in → app ───────────────────────────────────────────────────────────
static void sendMidi(uint8_t status, uint8_t d1, uint8_t d2) {
  if (!deviceConnected || !chKeys) return;
  uint8_t pkt[3] = { status, d1, d2 };
  chKeys->setValue(pkt, 3);
  chKeys->notify();                 // 3-byte messages, no running status
}

// Parse the UART MIDI stream (DIN MIDI *does* use running status; expand it).
static void pumpUartMidi() {
  static uint8_t runningStatus = 0, buf[2], have = 0;
  while (Serial1.available()) {
    uint8_t b = Serial1.read();
    if (b & 0x80) {                             // status byte
      if (b >= 0xF8) continue;                  // ignore realtime clock bytes
      runningStatus = b;
      have = 0;
      continue;
    }
    if (!runningStatus) continue;
    buf[have++] = b;
    if (have < 2) continue;
    have = 0;
    uint8_t type = runningStatus & 0xF0;
    if (type == 0x90 || type == 0x80 || (type == 0xB0 && buf[0] == 0x40)) {
      sendMidi(runningStatus, buf[0], buf[1]);
    }
  }
}

#if USE_USB_MIDI_HOST
// ESP32-S3 only. Add your USB-host MIDI library here and call sendMidi() for
// each note-on / note-off / CC64 message it produces.
static void pumpUsbMidi() { /* TODO on S3 */ }
#endif

// ── effect animation ────────────────────────────────────────────────────────
static void runEffects() {
  if (activeFx == FX_NONE) return;
  uint32_t now = millis();
  if (now > fxUntil && activeFx != FX_RAINBOW) { activeFx = FX_NONE; strip.clear(); showScaled(); return; }

  if (activeFx == FX_RED_FLASH) {
    for (uint8_t i = 0; i < fxIdxCount; i++) strip.setPixelColor(fxIdx[i], strip.Color(255, 40, 40));
  } else if (activeFx == FX_PULSE) {
    uint8_t v = 60 + (uint8_t)(120 * (1 + sin(now / 150.0)) / 2);
    for (uint8_t i = 0; i < fxIdxCount; i++) strip.setPixelColor(fxIdx[i], strip.Color(v, v, 0));
  } else {                                        // rainbow / celebration
    for (uint16_t i = 0; i < LED_COUNT; i++) {
      strip.setPixelColor(i, strip.ColorHSV(((i * 7 + now / 4) % 360) * 182));
    }
    if (now > fxUntil) { activeFx = FX_NONE; strip.clear(); }
  }
  showScaled();
}

// ── setup / loop ────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial1.begin(31250, SERIAL_8N1, PIN_MIDI_RX, -1);   // MIDI in (RX only)

  strip.begin();
  strip.clear();
  strip.show();

  BLEDevice::init(DEVICE_NAME);
  BLEDevice::setMTU(185);
  BLEServer* server = BLEDevice::createServer();
  server->setCallbacks(new ServerCB());

  BLEService* svc = server->createService(SVC_UUID);

  chKeys = svc->createCharacteristic(CHAR_KEYS_UUID, BLECharacteristic::PROPERTY_NOTIFY);
#ifdef NEEDS_BLE2902
  chKeys->addDescriptor(new BLE2902());
#endif

  BLECharacteristic* chLed = svc->createCharacteristic(
    CHAR_LED_UUID, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  chLed->setCallbacks(new LedCB());

  BLECharacteristic* chOta = svc->createCharacteristic(
    CHAR_OTA_UUID, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  chOta->setCallbacks(new OtaCB());

  svc->start();

  // The app scans BY SERVICE UUID, so it must be in the advertisement.
  BLEAdvertising* adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(SVC_UUID);
  adv->setScanResponse(true);
  BLEDevice::startAdvertising();

  Serial.println("Piano Professor firmware ready — advertising as " + String(DEVICE_NAME));

  // Green sweep on boot = firmware alive, strip wired correctly.
  for (uint16_t i = 0; i < LED_COUNT; i++) {
    strip.setPixelColor(i, strip.Color(0, 80, 0));
    strip.show();
    delay(8);
  }
  delay(150);
  strip.clear();
  strip.show();
}

void loop() {
  pumpUartMidi();
#if USE_USB_MIDI_HOST
  pumpUsbMidi();
#endif
  runEffects();
  delay(2);
}
