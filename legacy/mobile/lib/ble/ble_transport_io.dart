import 'dart:async';
import 'dart:typed_data';

import 'package:flutter_blue_plus/flutter_blue_plus.dart';

import 'ble_transport.dart';
import 'piano_professor_gatt.dart';

/// Native (iOS / Android) BLE transport backed by `flutter_blue_plus`.
BleTransport createBleTransport() => _IoBleTransport();

class _IoBleTransport implements BleTransport {
  @override
  bool get supportsContinuousScan => true;

  @override
  Future<bool> isSupported() => FlutterBluePlus.isSupported;

  @override
  Stream<bool> adapterEnabled() => FlutterBluePlus.adapterState
      .map((s) => s == BluetoothAdapterState.on);

  @override
  Stream<List<DiscoveredDevice>> scanResults() =>
      FlutterBluePlus.scanResults.map((results) => results
          .where(_isPianoProf)
          .map((r) => DiscoveredDevice(
                id: r.device.remoteId.str,
                name: _nameOf(r),
                rssi: r.rssi,
                raw: r.device,
              ))
          .toList());

  @override
  Future<void> startScan() => FlutterBluePlus.startScan(
        // Scan broadly, then filter in Dart by name-prefix OR advertised
        // service UUID — robust for both real firmware and an nRF Connect
        // peripheral simulator during bring-up.
        timeout: const Duration(seconds: 12),
        androidScanMode: AndroidScanMode.lowLatency,
      );

  @override
  Future<void> stopScan() => FlutterBluePlus.stopScan();

  @override
  Future<DiscoveredDevice> requestDevice() =>
      throw UnsupportedError('requestDevice() is the web-only chooser path');

  @override
  Future<ConnectedPeripheral> connect(DiscoveredDevice device) async {
    final d = device.raw as BluetoothDevice;
    await d.connect(timeout: const Duration(seconds: 15));

    // Ask for a bigger MTU so multi-LED frames fit (Android only; iOS ignores).
    try {
      await d.requestMtu(185);
    } catch (_) {/* not fatal */}

    final services = await d.discoverServices();
    final svc = services.firstWhere(
      (s) => s.uuid == Guid(PianoProfessorGatt.serviceUuid),
      orElse: () => throw const BleException('Piano Professor service not found'),
    );

    BluetoothCharacteristic? find(String uuid) {
      for (final c in svc.characteristics) {
        if (c.uuid == Guid(uuid)) return c;
      }
      return null;
    }

    final ledChar = find(PianoProfessorGatt.ledCommandCharUuid);
    final noteChar = find(PianoProfessorGatt.noteEventCharUuid);
    final statusChar = find(PianoProfessorGatt.deviceStatusCharUuid);
    if (ledChar == null || noteChar == null) {
      await d.disconnect();
      throw const BleException('Required characteristics missing');
    }

    // Read device status (LED count, firmware).
    var status = const DeviceStatus(
      ledCount: PianoProfessorGatt.defaultLedCount,
      firmware: '0.0',
    );
    if (statusChar != null) {
      try {
        status = PianoProfessorGatt.parseDeviceStatus(await statusChar.read());
      } catch (_) {/* keep default */}
    }

    // Subscribe to note events.
    final notes = StreamController<NoteEvent>.broadcast();
    await noteChar.setNotifyValue(true);
    final sub = noteChar.onValueReceived.listen((value) {
      final e = PianoProfessorGatt.parseNoteEvent(value);
      if (e != null) notes.add(e);
    });

    return _IoPeripheral(
      device: d,
      ledChar: ledChar,
      status: status,
      notes: notes,
      noteSub: sub,
    );
  }

  @override
  void dispose() {
    FlutterBluePlus.stopScan();
  }

  // --- helpers ---
  static String _nameOf(ScanResult r) {
    final adv = r.advertisementData.advName;
    if (adv.isNotEmpty) return adv;
    final plat = r.device.platformName;
    return plat.isNotEmpty ? plat : r.device.remoteId.str;
  }

  static bool _isPianoProf(ScanResult r) {
    if (_nameOf(r).startsWith(PianoProfessorGatt.deviceNamePrefix)) return true;
    return r.advertisementData.serviceUuids
        .contains(Guid(PianoProfessorGatt.serviceUuid));
  }
}

class _IoPeripheral implements ConnectedPeripheral {
  _IoPeripheral({
    required BluetoothDevice device,
    required BluetoothCharacteristic ledChar,
    required this.status,
    required StreamController<NoteEvent> notes,
    required StreamSubscription<List<int>> noteSub,
  })  : _device = device,
        _ledChar = ledChar,
        _notes = notes,
        _noteSub = noteSub;

  final BluetoothDevice _device;
  final BluetoothCharacteristic _ledChar;
  final StreamController<NoteEvent> _notes;
  final StreamSubscription<List<int>> _noteSub;

  @override
  final DeviceStatus status;

  @override
  String get id => _device.remoteId.str;

  @override
  String get name => _device.platformName.isNotEmpty
      ? _device.platformName
      : _device.remoteId.str;

  @override
  Stream<NoteEvent> get noteEvents => _notes.stream;

  @override
  Future<void> writeLed(Uint8List frame) =>
      _ledChar.write(frame, withoutResponse: true);

  @override
  Future<void> disconnect() async {
    await _noteSub.cancel();
    await _notes.close();
    await _device.disconnect();
  }
}

class BleException implements Exception {
  const BleException(this.message);
  final String message;
  @override
  String toString() => message;
}
