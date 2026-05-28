import 'package:firebase_auth/firebase_auth.dart';

/// Thin wrapper over Firebase Auth. For this turn we use **anonymous** sign-in
/// so every install has a stable `uid` to hang Firestore data off of; a full
/// email/OAuth flow comes later. All members are guarded by [ready] so the app
/// is safe to construct even when Firebase isn't configured.
class AuthService {
  AuthService(this.ready);

  final bool ready;

  // Lazy: only touches FirebaseAuth.instance after a successful init.
  FirebaseAuth get _auth => FirebaseAuth.instance;

  String? get uid => ready ? _auth.currentUser?.uid : null;

  Stream<String?> authState() =>
      ready ? _auth.authStateChanges().map((u) => u?.uid) : const Stream.empty();

  Future<String?> ensureSignedIn() async {
    if (!ready) return null;
    try {
      if (_auth.currentUser == null) {
        await _auth.signInAnonymously();
      }
      return _auth.currentUser?.uid;
    } catch (e) {
      return null;
    }
  }
}
