// Dumps every unique spoken instructor line to assets/voice/lines.manifest.json,
// each keyed by the same stable id the app uses (see lib/audio/voice_line_id.dart).
//
// Run from the `mobile/` folder:
//   dart run tool/dump_lines.dart
//
// Then generate the audio with backend/tts/generate_voice.py. This script is
// pure Dart (no Flutter), so it runs on the plain Dart VM.
import 'dart:convert';
import 'dart:io';

import 'package:piano_professor/audio/voice_line_id.dart';
import 'package:piano_professor/audio/voice_prompt.dart';
import 'package:piano_professor/lessons/lesson_data.dart';
import 'package:piano_professor/lessons/lesson_models.dart';

// Must match generate_voice.py --voice default and the style used for baking.
// If you change the bake voice/style, update these and re-run dump_lines.
const _bakeVoice = 'Sulafat';
const _bakeStyle = 'warm';

void main() {
  final seen = <String>{};
  final lines = <Map<String, String>>[];

  void add(String raw) {
    final t = raw.trim();
    if (t.isEmpty) return;
    // ID must match VoiceService._source() lookup: voice:style:version:text
    final id = voiceLineId('$_bakeVoice:$_bakeStyle:$kVoicePromptVersion:$t');
    if (seen.add(id)) lines.add({'id': id, 'text': t});
  }

  for (final lesson in lessons.values) {
    for (final step in lesson.steps) {
      for (final seg in step.segments) {
        if (seg is Say) add(seg.text);
      }
    }
    add(lesson.complete); // the completion message is spoken too
  }

  lines.sort((a, b) => a['id']!.compareTo(b['id']!));
  final json = const JsonEncoder.withIndent('  ').convert({'lines': lines});
  final file = File('assets/voice/lines.manifest.json');
  file.writeAsStringSync('$json\n');
  stdout.writeln('Wrote ${lines.length} unique instructor lines → ${file.path}');
}
