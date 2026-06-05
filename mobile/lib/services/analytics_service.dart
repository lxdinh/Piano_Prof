import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/foundation.dart';

/// Thin wrapper over Firebase Analytics. Safe to call even when Firebase isn't
/// configured — it logs to the debug console instead of throwing, so the app
/// (and these call sites) work the same with or without a backend.
class AnalyticsService {
  AnalyticsService(this._enabled);

  /// True only when Firebase initialized successfully (see firebase_bootstrap).
  final bool _enabled;
  FirebaseAnalytics? _fa;

  FirebaseAnalytics? get _analytics {
    if (!_enabled) return null;
    return _fa ??= FirebaseAnalytics.instance;
  }

  Future<void> log(String name, [Map<String, Object>? params]) async {
    final a = _analytics;
    if (a == null) {
      if (kDebugMode) debugPrint('[analytics] $name ${params ?? ''}');
      return;
    }
    try {
      await a.logEvent(name: name, parameters: params);
    } catch (e) {
      if (kDebugMode) debugPrint('[analytics] $name failed: $e');
    }
  }

  // --- convenience events ---------------------------------------------
  Future<void> lessonStart(String lessonId) =>
      log('lesson_start', {'lesson_id': lessonId});

  Future<void> lessonComplete(String lessonId, int stars, int xp) =>
      log('lesson_complete', {'lesson_id': lessonId, 'stars': stars, 'xp': xp});

  Future<void> paywallView(String source) =>
      log('paywall_view', {'source': source});

  Future<void> subscribe(String tier, {required bool mock}) =>
      log('subscribe', {'tier': tier, 'mock': mock.toString()});

  Future<void> omrUpload(String source) => log('omr_upload', {'source': source});

  Future<void> omrUploadBlocked() => log('omr_upload_blocked');
}
