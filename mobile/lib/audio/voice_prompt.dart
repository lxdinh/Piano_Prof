/// The instructor "Scene"/persona + per-style delivery prompts for Gemini TTS.
///
/// Pure Dart (no Flutter imports) so BOTH the app ([VoiceService]) and the
/// offline bake tool (`tool/gen_voice_pack.dart`) import the exact same prompt —
/// guaranteeing the baked clips match what the app would request (same audio,
/// same cache ids).
///
/// Bump [kVoicePromptVersion] whenever you change the Scene or any prompt below:
/// it's part of the cache id, so old cached/baked clips are invalidated and the
/// new expressive voice is fetched fresh.
const String kVoicePromptVersion = 'coach1';

/// The coach persona (mirrors the Google AI Studio "Scene" the user liked).
const String _coach =
    'As a warm, friendly and highly encouraging piano coach with clear, '
    'patient pronunciation, ';

/// Delivery prompt for a given style key (see VoiceService.styles).
String stylePromptFor(String key) => switch (key) {
      'cheerful' => '${_coach}say this cheerfully and brightly: ',
      'calm' => '${_coach}say this calmly and gently: ',
      'energetic' => '${_coach}say this with upbeat, lively energy: ',
      'neutral' => '${_coach}say this clearly and naturally: ',
      _ => '${_coach}say this warmly and encouragingly: ', // warm / default
    };
