import 'dart:typed_data';

import 'package:http/http.dart' as http;

/// Sends a sheet-music image/PDF to a self-hosted OMR server (the oemer
/// FastAPI wrapper in `backend/omr/`) and returns the MusicXML it produces.
///
/// Contract: `POST {serverUrl}/omr` as multipart with a `file` field; the
/// response body is the MusicXML document (200 OK). Returns null on any failure
/// so callers can fall back to the demo score.
class OmrService {
  Future<String?> transcribe({
    required String serverUrl,
    required Uint8List bytes,
    required String filename,
  }) async {
    if (serverUrl.trim().isEmpty) return null;
    final base = serverUrl.trim().replaceAll(RegExp(r'/+$'), '');
    final uri = Uri.parse('$base/omr');
    try {
      final req = http.MultipartRequest('POST', uri)
        ..files.add(http.MultipartFile.fromBytes('file', bytes, filename: filename));
      final streamed = await req.send().timeout(const Duration(seconds: 180));
      if (streamed.statusCode == 200) {
        final body = await streamed.stream.bytesToString();
        if (body.contains('<score-partwise') || body.contains('<score-timewise')) {
          return body;
        }
      }
    } catch (_) {/* network/timeout/parse → fall back */}
    return null;
  }
}
