// Pre-bakes the English instructor voice for the built-in lessons into
// `assets/voice/lines/` so the app needs NO Gemini API at runtime for them.
//
// Run once (billing must be enabled on the key):
//   dart run tool/gen_voice_pack.dart <GOOGLE_AI_STUDIO_KEY>
//
// It is resumable — already-baked clips are skipped — and writes a manifest the
// app reads (see VoiceService._bakedIds). Bakes for the DEFAULT voice+style
// (Puck / cheerful); change [_voice]/[_stylePrompt] here if you change defaults.
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:piano_professor/audio/voice_line_id.dart';
import 'package:piano_professor/audio/voice_prompt.dart';
import 'package:piano_professor/lessons/lesson_data.dart';
import 'package:piano_professor/lessons/lesson_models.dart';

const _model = 'gemini-2.5-flash-preview-tts';
const _voice = 'Puck';
const _style = 'cheerful'; // default delivery style for the bundled pack
const _solfege = ['Doh', 'Ray', 'Mee', 'Fah', 'Soh', 'Lah', 'Tee'];
const _outDir = 'assets/voice/lines';

Future<void> main(List<String> args) async {
  final key = args.isNotEmpty ? args.first : Platform.environment['GEMINI_KEY'];
  if (key == null || key.trim().isEmpty) {
    stderr.writeln('Usage: dart run tool/gen_voice_pack.dart <API_KEY>');
    exit(1);
  }

  // Collect every spoken line: id -> text to synthesize.
  final prompt = stylePromptFor(_style);
  String lineId(String text) =>
      voiceLineId('$_voice:$_style:$kVoicePromptVersion:$text');
  final jobs = <String, String>{};
  for (final lesson in lessons.values) {
    jobs[lineId(lesson.complete)] = prompt + lesson.complete;
    for (final step in lesson.steps) {
      for (final seg in step.segments) {
        if (seg is Say) jobs[lineId(seg.text)] = prompt + seg.text;
      }
    }
  }
  for (final syl in _solfege) {
    jobs[voiceLineId('$_voice:solfege:$syl')] = syl;
  }

  final dir = Directory(_outDir);
  if (!dir.existsSync()) dir.createSync(recursive: true);

  final ids = jobs.keys.toList();
  stdout.writeln('Baking ${ids.length} clips into $_outDir (voice=$_voice) ...');
  var done = 0, skipped = 0, failed = 0;
  for (final id in ids) {
    final f = File('$_outDir/$id.wav');
    if (f.existsSync() && f.lengthSync() > 100) {
      skipped++;
      done++;
      continue;
    }
    final wav = await _synth(key.trim(), jobs[id]!);
    if (wav == null) {
      failed++;
      stderr.writeln('FAIL $id');
      continue;
    }
    f.writeAsBytesSync(wav);
    done++;
    if (done % 10 == 0) {
      stdout.writeln('  $done/${ids.length} (skipped $skipped, failed $failed)');
    }
    await Future<void>.delayed(const Duration(milliseconds: 120));
  }

  final present = ids.where((id) => File('$_outDir/$id.wav').existsSync()).toList();
  File('$_outDir/manifest.json').writeAsStringSync(jsonEncode(present));
  stdout.writeln('Done. ${present.length} clips present, $failed failed this run. '
      'Manifest: $_outDir/manifest.json');
}

Future<Uint8List?> _synth(String key, String text) async {
  final uri = Uri.parse(
      'https://generativelanguage.googleapis.com/v1beta/models/$_model:generateContent?key=$key');
  final body = jsonEncode({
    'contents': [
      {
        'parts': [
          {'text': text}
        ]
      }
    ],
    'generationConfig': {
      'responseModalities': ['AUDIO'],
      'speechConfig': {
        'voiceConfig': {
          'prebuiltVoiceConfig': {'voiceName': _voice}
        }
      }
    },
  });
  for (var attempt = 0; attempt < 4; attempt++) {
    try {
      final resp = await http
          .post(uri, headers: {'Content-Type': 'application/json'}, body: body)
          .timeout(const Duration(seconds: 60));
      if (resp.statusCode == 429 || resp.statusCode == 503) {
        await Future<void>.delayed(Duration(seconds: 2 * (attempt + 1)));
        continue;
      }
      if (resp.statusCode != 200) {
        stderr.writeln('HTTP ${resp.statusCode}: '
            '${resp.body.substring(0, resp.body.length.clamp(0, 160))}');
        return null;
      }
      final j = jsonDecode(resp.body) as Map<String, dynamic>;
      final parts = (((j['candidates'] as List?)?.first as Map?)?['content']
          as Map?)?['parts'] as List?;
      if (parts == null) return null;
      for (final p in parts) {
        final inline = (p as Map)['inlineData'] as Map?;
        final data = inline?['data'] as String?;
        if (data != null) {
          return _wav(base64Decode(data), _rate(inline?['mimeType'] as String?));
        }
      }
      return null;
    } catch (e) {
      stderr.writeln('ERR $e');
      return null;
    }
  }
  return null;
}

int _rate(String? mime) {
  if (mime == null) return 24000;
  final m = RegExp(r'rate=(\d+)').firstMatch(mime);
  return m != null ? int.parse(m.group(1)!) : 24000;
}

Uint8List _wav(Uint8List pcm, int sr, {int ch = 1}) {
  final dataLen = pcm.length;
  final h = ByteData(44);
  void s(int o, String x) {
    for (var i = 0; i < x.length; i++) {
      h.setUint8(o + i, x.codeUnitAt(i));
    }
  }

  s(0, 'RIFF');
  h.setUint32(4, 36 + dataLen, Endian.little);
  s(8, 'WAVE');
  s(12, 'fmt ');
  h.setUint32(16, 16, Endian.little);
  h.setUint16(20, 1, Endian.little);
  h.setUint16(22, ch, Endian.little);
  h.setUint32(24, sr, Endian.little);
  h.setUint32(28, sr * ch * 2, Endian.little);
  h.setUint16(32, ch * 2, Endian.little);
  h.setUint16(34, 16, Endian.little);
  s(36, 'data');
  h.setUint32(40, dataLen, Endian.little);
  final out = Uint8List(44 + dataLen);
  out.setRange(0, 44, h.buffer.asUint8List());
  out.setRange(44, 44 + dataLen, pcm);
  return out;
}
