import 'dart:typed_data';

/// Web fallback: no filesystem, so the disk cache is a no-op (in-memory cache
/// in VoiceService still applies for the session).
Future<Uint8List?> ttsCacheRead(String id) async => null;

Future<void> ttsCacheWrite(String id, Uint8List bytes) async {}
