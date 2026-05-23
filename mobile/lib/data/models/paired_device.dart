import 'package:cloud_firestore/cloud_firestore.dart';

/// Mirror of a `users/{uid}/devices/{deviceId}` doc (SCHEMA.md §1e).
class PairedDevice {
  const PairedDevice({
    required this.deviceId,
    required this.name,
    required this.bleId,
    required this.ledCount,
    required this.firmwareVersion,
  });

  final String deviceId;
  final String name;
  final String bleId;
  final int ledCount;
  final String firmwareVersion;

  Map<String, dynamic> toMap() => {
        'name': name,
        'bleId': bleId,
        'ledCount': ledCount,
        'firmwareVersion': firmwareVersion,
        'lastConnectedAt': FieldValue.serverTimestamp(),
      };
}
