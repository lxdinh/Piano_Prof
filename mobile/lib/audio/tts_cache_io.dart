import 'dart:io';
import 'dart:typed_data';

import 'package:path_provider/path_provider.dart';

/// On-disk cache for synthesized voice clips (native/desktop). Keyed by a stable
/// id (voice+style+text hash) so a line is fetched from Gemini **once** and then
/// replayed from disk forever — across app restarts and script edits.
Directory? _dir;
bool _init = false;

Future<Directory?> _cacheDir() async {
  if (_init) return _dir;
  _init = true;
  try {
    final base = await getApplicationSupportDirectory();
    final d = Directory('${base.path}/tts_cache');
    if (!await d.exists()) await d.create(recursive: true);
    _dir = d;
  } catch (_) {
    _dir = null;
  }
  return _dir;
}

Future<Uint8List?> ttsCacheRead(String id) async {
  final d = await _cacheDir();
  if (d == null) return null;
  try {
    final f = File('${d.path}/$id.wav');
    if (await f.exists()) return await f.readAsBytes();
  } catch (_) {}
  return null;
}

Future<void> ttsCacheWrite(String id, Uint8List bytes) async {
  final d = await _cacheDir();
  if (d == null) return;
  try {
    await File('${d.path}/$id.wav').writeAsBytes(bytes, flush: true);
  } catch (_) {}
}
