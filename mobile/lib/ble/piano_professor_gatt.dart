import 'dart:typed_data';

/// The Piano Professor BLE GATT contract — the shared interface between this
/// app (BLE **central / client**) and the ESP32-S3 controller (BLE
/// **peripheral / GATT server**).
///
/// The firmware does not exist yet (hardware Phase 3), so this file is the
/// authoritative definition of the protocol. Mirrors PROJECT_PLAN.md §7:
/// "the app writes LED commands (LED index + RGB) AND subscribes to note
/// events", and maps lesson notes to LED indices 0–59 (5 octaves × 12).
class PianoProfessorGatt {
  PianoProfessorGatt._();

  /// Devices advertise as `Piano-Prof-XXXX` (XXXX = last 2 bytes of the MAC).
  static const String deviceNamePrefix = 'Piano-Prof-';

  /// Custom 128-bit service + characteristic UUIDs.
  static const String serviceUuid = 'f0a1d2c3-0001-4a5b-8c9d-1a2b3c4d5e6f';
  static const String ledCommandCharUuid =
      'f0a1d2c3-0002-4a5b-8c9d-1a2b3c4d5e6f'; // writeWithoutResponse
  static const String noteEventCharUuid =
      'f0a1d2c3-0003-4a5b-8c9d-1a2b3c4d5e6f'; // notify
  static const String deviceStatusCharUuid =
      'f0a1d2c3-0004-4a5b-8c9d-1a2b3c4d5e6f'; // read + notify

  /// Default LED count for a 5-octave system (overridden by Device-Status).
  static const int defaultLedCount = 60;

  // ---- LED-Command op-codes (app → device) -----------------------------
  static const int opSetLed = 0x01; // [0x01, index, r, g, b]
  static const int opSetMany = 0x02; // [0x02, count, (index,r,g,b) * count]
  static const int opClearAll = 0x03; // [0x03]
  static const int opSetBrightness = 0x04; // [0x04, level 0..255]

  /// Light a single LED.
  static Uint8List setLed(int index, int r, int g, int b) =>
      Uint8List.fromList([opSetLed, index & 0xFF, r & 0xFF, g & 0xFF, b & 0xFF]);

  /// Light several LEDs in one frame. Each entry is (index, r, g, b).
  /// Keep frames within the negotiated MTU (default ATT MTU carries ~5 LEDs).
  static Uint8List setMany(List<({int index, int r, int g, int b})> leds) {
    final out = <int>[opSetMany, leds.length & 0xFF];
    for (final l in leds) {
      out.addAll([l.index & 0xFF, l.r & 0xFF, l.g & 0xFF, l.b & 0xFF]);
    }
    return Uint8List.fromList(out);
  }

  static Uint8List clearAll() => Uint8List.fromList([opClearAll]);

  static Uint8List setBrightness(int level) =>
      Uint8List.fromList([opSetBrightness, level.clamp(0, 255)]);

  // ---- Note-Event parsing (device → app, notify) -----------------------
  // Frame: [type(0=off,1=on), midiNote, velocity, source(0=USB,1=TRS)]
  static NoteEvent? parseNoteEvent(List<int> data) {
    if (data.length < 4) return null;
    return NoteEvent(
      on: data[0] == 1,
      midiNote: data[1],
      velocity: data[2],
      source: data[3] == 1 ? MidiSource.trs : MidiSource.usb,
    );
  }

  // ---- Device-Status parsing (device → app, read/notify) ---------------
  // Frame: [ledCount, fwMajor, fwMinor, activeSource]
  static DeviceStatus parseDeviceStatus(List<int> data) {
    if (data.length < 4) {
      return const DeviceStatus(ledCount: defaultLedCount, firmware: '0.0');
    }
    return DeviceStatus(
      ledCount: data[0] == 0 ? defaultLedCount : data[0],
      firmware: '${data[1]}.${data[2]}',
      activeSource: data[3] == 1 ? MidiSource.trs : MidiSource.usb,
    );
  }
}

enum MidiSource { usb, trs }

/// A note played on the piano, forwarded by the controller for lesson scoring.
class NoteEvent {
  const NoteEvent({
    required this.on,
    required this.midiNote,
    required this.velocity,
    required this.source,
  });

  final bool on;
  final int midiNote;
  final int velocity;
  final MidiSource source;

  @override
  String toString() =>
      'NoteEvent(${on ? "on" : "off"} midi=$midiNote vel=$velocity src=$source)';
}

class DeviceStatus {
  const DeviceStatus({
    required this.ledCount,
    required this.firmware,
    this.activeSource,
  });

  final int ledCount;
  final String firmware;
  final MidiSource? activeSource;
}
