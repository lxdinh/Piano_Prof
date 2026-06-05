import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_soloud/flutter_soloud.dart';
import 'package:http/http.dart' as http;

import '../services/app_settings.dart';
import 'tts_cache_stub.dart' if (dart.library.io) 'tts_cache_io.dart';
import 'voice_line_id.dart';
import 'voice_prompt.dart';

/// Realistic instructor voice via **Google Gemini TTS** (Google AI Studio /
/// Generative Language API). Given a line of text it asks Gemini for audio,
/// wraps the returned 24 kHz PCM in a WAV container, plays it through SoLoud,
/// and returns the clip length so the lesson paces itself to the narration.
/// It also synthesizes the sung-solfège syllables (see [synthesizeWav], used by
/// [PianoAudio.singSolfege], which pitch-shifts each to the played key).
///
/// No API key set → `speak` returns null and the lesson falls back to on-screen
/// text + a timed wait, so the app always runs.
class VoiceService {
  VoiceService(this._soloud, this._settings);
  final SoLoud _soloud;
  final AppSettings _settings;

  static const String _model = 'gemini-2.5-flash-preview-tts';

  /// Voices offered in the settings picker (label → Gemini prebuilt voice name).
  /// Characters per Google's voice catalog.
  static const Map<String, String> voices = {
    'Kore · firm, steady': 'Kore',
    'Sulafat · warm': 'Sulafat',
    'Achird · friendly': 'Achird',
    'Aoede · breezy': 'Aoede',
    'Charon · informative': 'Charon',
    'Puck · upbeat': 'Puck',
    'Leda · youthful': 'Leda',
    'Zephyr · bright': 'Zephyr',
    'Fenrir · excitable': 'Fenrir',
    'Vindemiatrix · gentle': 'Vindemiatrix',
    'Sadachbia · lively': 'Sadachbia',
    'Orus · firm, deep': 'Orus',
  };

  /// Delivery styles (key → picker label). The key maps to a natural-language
  /// instruction Gemini follows when speaking (see [stylePrompt]).
  static const Map<String, String> styles = {
    'warm': 'Warm teacher',
    'cheerful': 'Cheerful',
    'calm': 'Calm & gentle',
    'energetic': 'Energetic',
    'neutral': 'Neutral',
  };

  /// The instruction prepended to a line to shape Gemini's delivery (the coach
  /// "Scene"). Shared with the bake tool via voice_prompt.dart.
  static String stylePrompt(String key) => stylePromptFor(key);

  final Map<String, AudioSource> _mem = {}; // cacheKey -> loaded clip
  final Map<String, Future<AudioSource?>> _inflight = {}; // dedupe concurrent fetches
  SoundHandle? _last;

  Set<String>? _baked; // ids present in the bundled pre-baked voice pack

  bool get hasKey => _settings.voiceApiKey.trim().isNotEmpty;

  /// Ids shipped in the bundled pack (`assets/voice/lines/manifest.json`) — the
  /// pre-baked English lessons, so the default voice needs no key and no network.
  Future<Set<String>> _bakedIds() async {
    if (_baked != null) return _baked!;
    try {
      final raw = await rootBundle.loadString('assets/voice/lines/manifest.json');
      _baked = (jsonDecode(raw) as List).cast<String>().toSet();
    } catch (_) {
      _baked = <String>{};
    }
    return _baked!;
  }

  /// Bytes of a bundled clip (or null if this id isn't in the pack).
  Future<Uint8List?> _bundled(String id) async {
    final ids = await _bakedIds();
    if (!ids.contains(id)) return null;
    try {
      final bd = await rootBundle.load('assets/voice/lines/$id.wav');
      return bd.buffer.asUint8List(bd.offsetInBytes, bd.lengthInBytes);
    } catch (_) {
      return null;
    }
  }

  /// Fetch (or reuse) the clip for [text] in the current voice + style. Dedupes
  /// concurrent calls (so prefetch + speak don't both hit the network).
  Future<AudioSource?> _source(String text) {
    final voice = _settings.voiceName;
    final style = _settings.voiceStyle;
    // Version is part of the id so changing the Scene/prompt invalidates old
    // cached + baked clips and re-fetches the new expressive voice.
    final id = voiceLineId('$voice:$style:$kVoicePromptVersion:$text');
    final cached = _mem[id];
    if (cached != null) return Future.value(cached);
    final existing = _inflight[id];
    if (existing != null) return existing;
    final fut = () async {
      // Source order: bundled pre-baked pack (no key/network) → on-disk cache →
      // Gemini API (needs a key; result cached to disk so it's a one-time cost).
      var wav = await _bundled(id);
      wav ??= await ttsCacheRead(id);
      if (wav == null) {
        final key = _settings.voiceApiKey.trim();
        if (key.isEmpty) return null;
        wav = await _synthWav(key, voice, text, style: style);
        if (wav == null) return null;
        await ttsCacheWrite(id, wav);
      }
      final src = await _soloud.loadMem('$id.wav', wav);
      _mem[id] = src;
      return src;
    }();
    _inflight[id] = fut;
    fut.whenComplete(() => _inflight.remove(id));
    return fut;
  }

  /// Speak [text]; returns the clip length, or null if there's no key or the
  /// request fails (caller should fall back to a timed wait).
  Future<Duration?> speak(String text) async {
    try {
      final src = await _source(text);
      if (src == null) return null;
      final len = _soloud.getLength(src);
      _last = await _soloud.play(src);
      final speed = _settings.voiceSpeed;
      if (speed != 1.0 && _last != null) {
        _soloud.setRelativePlaySpeed(_last!, speed);
      }
      return len;
    } catch (e) {
      if (kDebugMode) debugPrint('VoiceService.speak failed: $e');
      return null;
    }
  }

  /// Fetch + cache a line ahead of time (no playback) so [speak] is instant.
  Future<void> prefetch(String text) async {
    try {
      await _source(text);
    } catch (_) {}
  }

  /// Sequentially pre-fetch a list of lines. Sequential (not parallel) to avoid
  /// tripping the API rate limit. Fire-and-forget from the call site.
  Future<void> prefetchAll(Iterable<String> texts) async {
    for (final t in texts) {
      await prefetch(t);
    }
  }

  /// Synthesize arbitrary text to WAV bytes (used for the sung solfège syllables;
  /// the audio engine caches + pitch-shifts the result). Disk-cached so each
  /// syllable is only ever fetched from Gemini once. Null on failure.
  Future<Uint8List?> synthesizeWav(String text) async {
    final voice = _settings.voiceName;
    final id = voiceLineId('$voice:solfege:$text');
    final bundled = await _bundled(id);
    if (bundled != null) return bundled;
    final cached = await ttsCacheRead(id);
    if (cached != null) return cached;
    final key = _settings.voiceApiKey.trim();
    if (key.isEmpty) return null;
    final wav = await _synthWav(key, voice, text);
    if (wav != null) await ttsCacheWrite(id, wav);
    return wav;
  }

  /// Play a one-off test line in the chosen voice + style; returns null on
  /// success or an error message (used by the settings dialog's "Save & test").
  Future<String?> test(String key, String voice, String style) async {
    final wav = await _synthWav(key.trim(), voice,
        'Hi! I am your piano teacher. Let us play.', style: style);
    if (wav == null) {
      return 'Connection failed — check your Google AI Studio key.';
    }
    try {
      final src = await _soloud.loadMem('g_tts_test.wav', wav);
      _last = await _soloud.play(src);
      return null;
    } catch (e) {
      return 'Audio error: $e';
    }
  }

  Future<Uint8List?> _synthWav(String key, String voice, String text,
      {String style = ''}) async {
    final uri = Uri.parse(
      'https://generativelanguage.googleapis.com/v1beta/models/'
      '$_model:generateContent?key=$key',
    );
    final bodyMap = <String, dynamic>{
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
            'prebuiltVoiceConfig': {'voiceName': voice},
          },
        },
      },
    };
    // Coaching instructions go in systemInstruction so Gemini never reads them
    // aloud — only the text content is spoken.
    if (style.isNotEmpty) {
      bodyMap['systemInstruction'] = {
        'parts': [
          {'text': stylePrompt(style)}
        ]
      };
    }
    final body = jsonEncode(bodyMap);
    // Retry on rate-limit / transient errors with backoff — the free tier is
    // easily tripped, which otherwise leaves lines silent.
    for (var attempt = 0; attempt < 3; attempt++) {
      try {
        final resp = await http
            .post(uri, headers: {'Content-Type': 'application/json'}, body: body)
            .timeout(const Duration(seconds: 25));
        if (resp.statusCode == 429 || resp.statusCode == 503) {
          if (kDebugMode) {
            debugPrint('Gemini TTS ${resp.statusCode} — retry ${attempt + 1}/3');
          }
          await Future<void>.delayed(Duration(milliseconds: 1000 * (attempt + 1)));
          continue;
        }
        if (resp.statusCode != 200) {
          if (kDebugMode) debugPrint('Gemini TTS ${resp.statusCode}: ${resp.body}');
          return null;
        }
        final json = jsonDecode(resp.body) as Map<String, dynamic>;
        final candidates = json['candidates'] as List?;
        if (candidates == null || candidates.isEmpty) return null;
        final content = (candidates.first as Map<String, dynamic>)['content']
            as Map<String, dynamic>?;
        final parts = content?['parts'] as List?;
        if (parts == null) return null;
        for (final p in parts) {
          final inline =
              (p as Map<String, dynamic>)['inlineData'] as Map<String, dynamic>?;
          final data = inline?['data'] as String?;
          if (data != null) {
            final pcm = base64Decode(data);
            final rate = _rateFromMime(inline?['mimeType'] as String?);
            return _pcm16ToWav(pcm, rate);
          }
        }
        return null;
      } catch (e) {
        if (kDebugMode) debugPrint('Gemini TTS fetch failed: $e');
        return null;
      }
    }
    return null; // retries exhausted
  }

  /// Parse the sample rate out of a mime like "audio/L16;codec=pcm;rate=24000".
  int _rateFromMime(String? mime) {
    if (mime == null) return 24000;
    final m = RegExp(r'rate=(\d+)').firstMatch(mime);
    return m != null ? int.parse(m.group(1)!) : 24000;
  }

  /// Wrap signed-16-bit mono PCM in a minimal WAV container SoLoud can load.
  Uint8List _pcm16ToWav(Uint8List pcm, int sampleRate, {int channels = 1}) {
    final dataLen = pcm.length;
    final h = ByteData(44);
    void str(int off, String s) {
      for (var i = 0; i < s.length; i++) {
        h.setUint8(off + i, s.codeUnitAt(i));
      }
    }

    str(0, 'RIFF');
    h.setUint32(4, 36 + dataLen, Endian.little);
    str(8, 'WAVE');
    str(12, 'fmt ');
    h.setUint32(16, 16, Endian.little); // PCM fmt chunk size
    h.setUint16(20, 1, Endian.little); // audio format = PCM
    h.setUint16(22, channels, Endian.little);
    h.setUint32(24, sampleRate, Endian.little);
    h.setUint32(28, sampleRate * channels * 2, Endian.little); // byte rate
    h.setUint16(32, channels * 2, Endian.little); // block align
    h.setUint16(34, 16, Endian.little); // bits per sample
    str(36, 'data');
    h.setUint32(40, dataLen, Endian.little);

    final out = Uint8List(44 + dataLen);
    out.setRange(0, 44, h.buffer.asUint8List());
    out.setRange(44, 44 + dataLen, pcm);
    return out;
  }

  /// Stop the currently-playing line (e.g. when the student skips ahead).
  void stop() {
    final h = _last;
    _last = null;
    if (h == null) return;
    try {
      _soloud.stop(h);
    } catch (_) {}
  }
}
