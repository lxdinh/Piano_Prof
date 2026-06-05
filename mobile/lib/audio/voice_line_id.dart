import 'dart:convert';

import 'package:crypto/crypto.dart';

/// Stable id for an instructor line, used to name its pre-baked audio file
/// (`assets/voice/lines/<id>.ogg`).
///
/// Kept flutter-free so the line dumper (`tool/dump_lines.dart`) can `dart run`
/// it, and shared with the in-app [VoiceService] so the ids always match. The
/// Python generator only reuses ids from the manifest — it never recomputes.
String voiceLineId(String text) {
  final norm = text.trim().replaceAll(RegExp(r'\s+'), ' ');
  return sha1.convert(utf8.encode(norm)).toString().substring(0, 16);
}
