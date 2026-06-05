import 'dart:async';

import 'package:flutter/foundation.dart';

import '../data/user_repository.dart';

/// Tracks the active entitlement tier + the capabilities it unlocks.
///
/// In production the tier is read from `users/{uid}/private/subscription`
/// (written by a RevenueCat/store webhook → Cloud Function; client read-only per
/// firestore.rules). [mockSubscribe] flips it locally so the paywall + gating
/// are demoable end-to-end before the store SDK is wired up.
class SubscriptionController extends ChangeNotifier {
  String _tier = 'free'; // free | super | max
  String _status = 'none'; // none | active | trialing | grace | expired
  StreamSubscription<({String tier, String status})>? _sub;

  String get tier => _tier;
  String get status => _status;

  bool get _active =>
      _status == 'active' || _status == 'trialing' || _status == 'grace';
  bool get isSubscribed => _tier != 'free' && _active;

  // ---- capabilities (the single source of truth for feature gating) ----
  bool get unlimitedHearts => isSubscribed; // Super + Max
  bool get canUploadOmr => isSubscribed; // Super + Max
  bool get aiFeedback => _tier == 'max' && _active; // Max only

  /// Bind to the read-only entitlement doc when Firebase is available. No-op
  /// (stays free) until configured — [mockSubscribe] still works for testing.
  void bindEntitlement(UserRepository repo) {
    if (!repo.isReady) return;
    _sub = repo.watchSubscription().listen((e) {
      _tier = e.tier;
      _status = e.status;
      notifyListeners();
    });
  }

  /// Mock a successful purchase (dev/demo). Real flow: store SDK → webhook →
  /// Cloud Function writes the entitlement doc, which [bindEntitlement] reads.
  void mockSubscribe(String tier) {
    _tier = tier;
    _status = 'active';
    notifyListeners();
  }

  void restore() {
    // Real flow re-queries the store / entitlement doc. No-op in the mock.
    notifyListeners();
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
