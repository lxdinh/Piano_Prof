import 'package:shared_preferences/shared_preferences.dart';

/// Small persistent settings store. Holds the self-hosted OMR (oemer) server
/// URL so the app can send sheet-music photos for transcription.
class AppSettings {
  AppSettings(this._prefs);
  final SharedPreferences _prefs;

  static const _kOmrUrl = 'omr_server_url';

  static Future<AppSettings> load() async =>
      AppSettings(await SharedPreferences.getInstance());

  /// Base URL of your oemer service, e.g. https://omr.example.com
  String get omrServerUrl => _prefs.getString(_kOmrUrl) ?? '';
  bool get hasOmrServer => omrServerUrl.trim().isNotEmpty;

  Future<void> setOmrServerUrl(String value) =>
      _prefs.setString(_kOmrUrl, value.trim());
}
