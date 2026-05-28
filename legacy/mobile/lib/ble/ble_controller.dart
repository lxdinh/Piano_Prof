import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

import 'ble_transport.dart';

/// UI-facing BLE state. Mirrors the sealed `LessonUIState` pattern from the
/// prior native app — the screen switches on these variants.
sealed class BleState {
  const BleState();
}

class BleIdle extends BleState {
  const BleIdle();
}

class BleBluetoothOff extends BleState {
  const BleBluetoothOff();
}

class BleUnauthorized extends BleState {
  const BleUnauthorized();
}

class BleScanning extends BleState {
  const BleScanning(this.devices);
  final List<DiscoveredDevice> devices;
}

class BleConnecting extends BleState {
  const BleConnecting(this.device);
  final DiscoveredDevice device;
}

class BleConnected extends BleState {
  const BleConnected(this.peripheral);
  final ConnectedPeripheral peripheral;
}

class BleFailure extends BleState {
  const BleFailure(this.message);
  final String message;
}

/// Drives BLE discovery + pairing for the Piano Professor LED module.
class BleController extends ChangeNotifier {
  BleController({BleTransport? transport})
      : _transport = transport ?? createBleTransport();

  final BleTransport _transport;

  BleState _state = const BleIdle();
  BleState get state => _state;

  /// Native lists devices live; web uses the browser chooser (single device).
  bool get canListDevices => _transport.supportsContinuousScan;

  StreamSubscription<bool>? _adapterSub;
  StreamSubscription<List<DiscoveredDevice>>? _scanSub;
  bool _adapterOn = true;

  void _set(BleState s) {
    _state = s;
    notifyListeners();
  }

  /// Call once after the screen mounts.
  Future<void> init() async {
    if (!await _transport.isSupported()) {
      _set(const BleFailure('Bluetooth is not supported on this device.'));
      return;
    }
    _adapterSub = _transport.adapterEnabled().listen((on) {
      _adapterOn = on;
      if (!on && _state is! BleConnected) {
        _set(const BleBluetoothOff());
      } else if (on && _state is BleBluetoothOff) {
        _set(const BleIdle());
      }
    });
  }

  /// Begin discovery (native). On web, callers should use [pickAndConnect].
  Future<void> startScan() async {
    if (!canListDevices) return; // web: nothing to list

    if (!await _ensurePermissions()) {
      _set(const BleUnauthorized());
      return;
    }
    if (!_adapterOn) {
      _set(const BleBluetoothOff());
      return;
    }

    await _scanSub?.cancel();
    _set(const BleScanning([]));
    _scanSub = _transport.scanResults().listen((devices) {
      // keep showing the scanning screen while results stream in
      _set(BleScanning(List.unmodifiable(devices)));
    });
    try {
      await _transport.startScan();
    } catch (e) {
      _set(BleFailure('Could not start scanning: $e'));
    }
  }

  Future<void> stopScan() async {
    await _scanSub?.cancel();
    _scanSub = null;
    await _transport.stopScan();
  }

  /// Connect to a device already discovered in the list (native path).
  Future<void> connect(DiscoveredDevice device) async {
    await stopScan();
    _set(BleConnecting(device));
    try {
      final peripheral = await _transport.connect(device);
      _set(BleConnected(peripheral));
    } catch (e) {
      _set(BleFailure('Pairing failed: $e'));
    }
  }

  /// Web path: open the browser chooser, then connect to the chosen device.
  Future<void> pickAndConnect() async {
    try {
      final device = await _transport.requestDevice();
      await connect(device);
    } catch (e) {
      // user cancelled the chooser, or no device matched
      _set(const BleIdle());
    }
  }

  Future<void> disconnect() async {
    final s = _state;
    if (s is BleConnected) {
      await s.peripheral.disconnect();
    }
    _set(const BleIdle());
  }

  /// Retry from a failure/idle/off state.
  Future<void> reset() async {
    await stopScan();
    _set(_adapterOn ? const BleIdle() : const BleBluetoothOff());
  }

  Future<bool> _ensurePermissions() async {
    if (kIsWeb) return true; // browser handles consent via the chooser gesture

    // iOS: a single Bluetooth permission (avoid prompting for location).
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      final s = await Permission.bluetooth.request();
      return s.isGranted || s.isLimited;
    }

    // Android: scan + connect on 12+, location as the fallback on ≤ 11.
    final results = await [
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
      Permission.locationWhenInUse,
    ].request();
    final scanOk = results[Permission.bluetoothScan]?.isGranted ?? false;
    final connectOk = results[Permission.bluetoothConnect]?.isGranted ?? false;
    final locationOk = results[Permission.locationWhenInUse]?.isGranted ?? false;
    return (scanOk && connectOk) || locationOk;
  }

  @override
  void dispose() {
    _adapterSub?.cancel();
    _scanSub?.cancel();
    _transport.dispose();
    super.dispose();
  }
}
