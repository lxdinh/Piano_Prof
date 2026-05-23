import 'package:flutter/foundation.dart';

/// Tracks the active entitlement tier. In production this is read from
/// `users/{uid}/private/subscription` (written by a RevenueCat/store webhook →
/// Cloud Function) and is client read-only. For this turn purchases are mocked
/// locally so the paywall flow is demoable end-to-end.
class SubscriptionController extends ChangeNotifier {
  String _tier = 'free'; // free | super | max
  String get tier => _tier;
  bool get isSubscribed => _tier != 'free';

  /// Mock a successful purchase (real flow goes through the store + webhook).
  void mockSubscribe(String tier) {
    _tier = tier;
    notifyListeners();
  }

  void restore() {
    // Would query the store / entitlement doc. No-op in the mock.
    notifyListeners();
  }
}
