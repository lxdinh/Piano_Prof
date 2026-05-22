import 'dart:async';
import 'dart:typed_data';

import 'package:flutter_web_bluetooth/flutter_web_bluetooth.dart';

import 'ble_transport.dart';
import 'piano_professor_gatt.dart';

/// Web BLE transport backed by the Web Bluetooth API via
/// `flutter_web_bluetooth`. NOTE: the Web Bluetooth API cannot silently list
/// devices — it opens the browser's device chooser on a user gesture and
/// returns a single device. So [supportsContinuousScan] is false and the
/// pairing UI shows a "Choose your Piano Lights" button instead of a live list.
///
/// Targets flutter_web_bluetooth ^0.3; method names may need minor adjustment
/// on other versions. Works in Chrome/Edge over HTTPS (or localhost).
BleTransport createBleTransport() => _WebBleTransport();

class _WebBleTransport implements BleTransport {
  @override
  bool get supportsContinuousScan => false;

  @override
  Future<bool> isSupported() async =>
      FlutterWebBluetooth.instance.isBluetoothApiSupported;

  @override
  Stream<bool> adapterEnabled() => FlutterWebBluetooth.instance.isAvailable;

  @override
  Stream<List<DiscoveredDevice>> scanResults() =>
      const Stream<List<DiscoveredDevice>>.empty();

  @override
  Future<void> startScan() async {/* no-op: web uses the chooser */}

  @override
  Future<void> stopScan() async {/* no-op */}

  @override
  Future<DiscoveredDevice> requestDevice() async {
    final options = RequestOptionsBuilder(
      [RequestFilterBuilder(namePrefix: PianoProfessorGatt.deviceNamePrefix)],
      optionalServices: [PianoProfessorGatt.serviceUuid],
    );
    final device = await FlutterWebBluetooth.instance.requestDevice(options);
    return DiscoveredDevice(
      id: device.id,
      name: device.name ?? 'Piano Professor',
      rssi: 0, // not exposed on web
      raw: device,
    );
  }

  @override
  Future<ConnectedPeripheral> connect(DiscoveredDevice device) async {
    final d = device.raw as BluetoothDevice;
    await d.connect();

    final services = await d.discoverServices();
    final svc = services.firstWhere(
      (s) => s.uuid.toLowerCase() == PianoProfessorGatt.serviceUuid,
      orElse: () =>
          throw const BleWebException('Piano Professor service not found'),
    );

    final ledChar =
        await svc.getCharacteristic(PianoProfessorGatt.ledCommandCharUuid);
    final noteChar =
        await svc.getCharacteristic(PianoProfessorGatt.noteEventCharUuid);

    var status = const DeviceStatus(
      ledCount: PianoProfessorGatt.defaultLedCount,
      firmware: '0.0',
    );
    try {
      final statusChar =
          await svc.getCharacteristic(PianoProfessorGatt.deviceStatusCharUuid);
      final data = await statusChar.readValue();
      status = PianoProfessorGatt.parseDeviceStatus(data.buffer.asUint8List());
    } catch (_) {/* keep default */}

    final notes = StreamController<NoteEvent>.broadcast();
    await noteChar.startNotifications();
    final sub = noteChar.value.listen((data) {
      final e = PianoProfessorGatt.parseNoteEvent(data.buffer.asUint8List());
      if (e != null) notes.add(e);
    });

    return _WebPeripheral(
      device: d,
      ledChar: ledChar,
      status: status,
      notes: notes,
      noteSub: sub,
    );
  }

  @override
  void dispose() {}
}

class _WebPeripheral implements ConnectedPeripheral {
  _WebPeripheral({
    required BluetoothDevice device,
    required BluetoothCharacteristic ledChar,
    required this.status,
    required StreamController<NoteEvent> notes,
    required StreamSubscription<ByteData> noteSub,
  })  : _device = device,
        _ledChar = ledChar,
        _notes = notes,
        _noteSub = noteSub;

  final BluetoothDevice _device;
  final BluetoothCharacteristic _ledChar;
  final StreamController<NoteEvent> _notes;
  final StreamSubscription<ByteData> _noteSub;

  @override
  final DeviceStatus status;

  @override
  String get id => _device.id;

  @override
  String get name => _device.name ?? 'Piano Professor';

  @override
  Stream<NoteEvent> get noteEvents => _notes.stream;

  @override
  Future<void> writeLed(Uint8List frame) =>
      _ledChar.writeValueWithoutResponse(frame);

  @override
  Future<void> disconnect() async {
    await _noteSub.cancel();
    await _notes.close();
    _device.disconnect();
  }
}

class BleWebException implements Exception {
  const BleWebException(this.message);
  final String message;
  @override
  String toString() => message;
}
