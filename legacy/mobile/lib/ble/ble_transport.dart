import 'dart:typed_data';

import 'piano_professor_gatt.dart';

// Platform-specific implementation is chosen at compile time:
//   - native (dart.library.io)  -> flutter_blue_plus       (ble_transport_io.dart)
//   - web    (dart.library.html)-> flutter_web_bluetooth   (ble_transport_web.dart)
// This keeps flutter_blue_plus out of the web build and vice-versa.
import 'ble_transport_io.dart'
    if (dart.library.html) 'ble_transport_web.dart' as impl;

/// Factory — returns the right transport for the current platform.
BleTransport createBleTransport() => impl.createBleTransport();

/// A nearby Piano Professor module found during a scan.
class DiscoveredDevice {
  const DiscoveredDevice({
    required this.id,
    required this.name,
    required this.rssi,
    required this.raw,
  });

  final String id;
  final String name;
  final int rssi; // dBm; ~ -50 strong, -90 weak. 0 = unknown (web).
  final Object raw; // underlying platform device handle

  /// Human label for signal strength, used by the pairing UI.
  String get signalLabel {
    if (rssi == 0) return 'ready to pair';
    if (rssi >= -60) return 'signal strong';
    if (rssi >= -75) return 'signal ok';
    return 'signal weak';
  }
}

/// A live connection to a paired module.
abstract class ConnectedPeripheral {
  String get id;
  String get name;
  DeviceStatus get status;

  /// Note On/Off events forwarded from the piano (USB-MIDI or TRS).
  Stream<NoteEvent> get noteEvents;

  /// Send a raw LED-command frame (build with [PianoProfessorGatt]).
  Future<void> writeLed(Uint8List frame);

  Future<void> disconnect();
}

/// Platform BLE transport. The controller talks only to this interface.
abstract class BleTransport {
  /// Whether BLE is supported on this device/browser at all.
  Future<bool> isSupported();

  /// Emits the current adapter availability and subsequent changes.
  Stream<bool> adapterEnabled();

  /// Native can list devices live; Web Bluetooth can only open the browser's
  /// device chooser (one device at a time) on a user gesture.
  bool get supportsContinuousScan;

  /// Stream of currently-visible Piano Professor devices (native only).
  Stream<List<DiscoveredDevice>> scanResults();

  Future<void> startScan();
  Future<void> stopScan();

  /// Web path: open the browser chooser and return the chosen device.
  Future<DiscoveredDevice> requestDevice();

  /// Connect, discover the service, read status, subscribe to note events.
  Future<ConnectedPeripheral> connect(DiscoveredDevice device);

  void dispose();
}
