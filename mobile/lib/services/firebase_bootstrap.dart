import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

/// Initializes Firebase and reports whether it succeeded.
///
/// The app is designed to keep working (BLE pairing still runs) even when
/// Firebase has not been configured on this machine yet. Once you run
/// `flutterfire configure`, switch the call below to
/// `Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)`
/// and import the generated `firebase_options.dart`.
Future<bool> initializeFirebase() async {
  try {
    await Firebase.initializeApp();
    return true;
  } catch (e) {
    debugPrint('Firebase not initialized (run `flutterfire configure`): $e');
    return false;
  }
}
