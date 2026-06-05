import 'package:shared_preferences/shared_preferences.dart';

/// Small persistent settings store. Holds the self-hosted OMR (oemer) server
/// URL and the Google AI Studio (Gemini) TTS settings (API key + chosen voice)
/// so the instructor can speak — and sing the solfège — with a realistic voice.
class AppSettings {
  AppSettings(this._prefs);
  final SharedPreferences _prefs;

  // Company-paid Google AI Studio key — customers never need to provide their own.
  static const _builtInApiKey = 'AIzaSyDDZNRI5L5apI8zfZc1OrMsJLGpRPbheSc';

  static const _kOmrUrl = 'omr_server_url';
  static const _kVoiceKey = 'google_ai_key';
  static const _kVoiceName = 'google_voice';
  static const _kVoiceStyle = 'google_voice_style';
  static const _kVoiceSpeed = 'google_voice_speed';

  /// Default Gemini TTS voice — upbeat so the instructor doesn't sound sleepy.
  static const String defaultVoiceName = 'Puck';

  /// Default delivery style (see VoiceService.styles) — lively by default.
  static const String defaultVoiceStyle = 'cheerful';

  static Future<AppSettings> load() async =>
      AppSettings(await SharedPreferences.getInstance());

  /// Base URL of your oemer service, e.g. https://omr.example.com
  String get omrServerUrl => _prefs.getString(_kOmrUrl) ?? '';
  bool get hasOmrServer => omrServerUrl.trim().isNotEmpty;

  Future<void> setOmrServerUrl(String value) =>
      _prefs.setString(_kOmrUrl, value.trim());

  // ---- Google AI Studio (Gemini) TTS ----
  /// Returns the active API key — built-in company key, or a user-supplied
  /// override stored in prefs (useful for dev/testing with a personal key).
  String get voiceApiKey => _prefs.getString(_kVoiceKey)?.trim().isNotEmpty == true
      ? _prefs.getString(_kVoiceKey)!
      : _builtInApiKey;

  /// Always true — the built-in key is always available.
  bool get hasVoice => true;

  /// Selected Gemini prebuilt voice name (e.g. "Kore").
  String get voiceName => _prefs.getString(_kVoiceName) ?? defaultVoiceName;

  /// Selected delivery style key (warm | cheerful | calm | energetic | neutral).
  String get voiceStyle => _prefs.getString(_kVoiceStyle) ?? defaultVoiceStyle;

  Future<void> setVoiceApiKey(String value) =>
      _prefs.setString(_kVoiceKey, value.trim());
  Future<void> setVoiceName(String value) =>
      _prefs.setString(_kVoiceName, value);
  Future<void> setVoiceStyle(String value) =>
      _prefs.setString(_kVoiceStyle, value);

  /// Playback speed multiplier for the instructor voice (0.5 – 2.0).
  double get voiceSpeed =>
      (_prefs.getDouble(_kVoiceSpeed) ?? 1.0).clamp(0.5, 2.0);

  Future<void> setVoiceSpeed(double value) =>
      _prefs.setDouble(_kVoiceSpeed, value.clamp(0.5, 2.0));
}
