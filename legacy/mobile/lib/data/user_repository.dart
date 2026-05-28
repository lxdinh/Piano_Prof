import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';

import '../services/auth_service.dart';
import 'firestore_refs.dart';
import 'models/library_item.dart';
import 'models/paired_device.dart';
import 'models/user_profile.dart';

/// Reads/writes the signed-in user's Firestore tree. Every method is a no-op
/// when Firebase isn't ready / there's no uid, so the app stays usable offline
/// or before `flutterfire configure`.
class UserRepository {
  UserRepository(this._auth);

  final AuthService _auth;

  bool get _ready => _auth.ready && _auth.uid != null;
  bool get isReady => _ready;
  String? get uid => _auth.uid;

  /// Create the profile doc on first run if it doesn't exist yet.
  Future<void> ensureProfile() async {
    if (!_ready) return;
    try {
      final ref = Db.user(uid!);
      final snap = await ref.get();
      if (!snap.exists) {
        await ref.set(UserProfile.initialDoc(uid!));
      }
    } catch (_) {/* non-fatal during bring-up */}
  }

  /// Live profile (streak / XP / gems / hearts) for the home + headers.
  Stream<UserProfile?> watchProfile() {
    if (!_ready) return const Stream<UserProfile?>.empty();
    return Db.user(uid!).snapshots().map(
          (s) => s.exists ? UserProfile.fromDoc(s) : null,
        );
  }

  /// Completed lesson ids (for path checkmarks). Single-field query, no index.
  Stream<Set<String>> watchCompletedLessonIds() {
    if (!_ready) return const Stream<Set<String>>.empty();
    return Db.lessonProgress(uid!)
        .where('status', isEqualTo: 'completed')
        .snapshots()
        .map((q) => q.docs.map((d) => d.id).toSet());
  }

  /// Mark a lesson complete: award XP on the profile + record progress.
  Future<void> completeLesson({
    required String lessonId,
    required int xp,
  }) async {
    if (!_ready) return;
    try {
      await Db.user(uid!).set({
        'totalXp': FieldValue.increment(xp),
        'currentLessonId': lessonId,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
      await Db.lessonProgress(uid!).doc(lessonId).set({
        'status': 'completed',
        'xpEarned': xp,
        'stars': 3,
        'lastPlayedAt': FieldValue.serverTimestamp(),
        'firstCompletedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    } catch (_) {/* non-fatal during bring-up */}
  }

  /// Uploaded sheet-music library (newest first).
  Stream<List<LibraryItem>> watchLibrary() {
    if (!_ready) return const Stream<List<LibraryItem>>.empty();
    return Db.library(uid!)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((q) => q.docs.map(LibraryItem.fromDoc).toList());
  }

  /// Upload a PDF/photo to Storage and create the library doc (status
  /// `processing`). A Cloud Function then runs OMR and writes the MusicXML +
  /// flips status to `ready` (that Function is out of scope here).
  Future<void> uploadSheet({
    required String title,
    required String source,
    required Uint8List bytes,
    required bool isPdf,
  }) async {
    if (!_ready) return;
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    final ext = isPdf ? 'pdf' : 'jpg';
    final path = 'users/$uid/uploads/$id.$ext';
    try {
      await FirebaseStorage.instance.ref(path).putData(
            bytes,
            SettableMetadata(contentType: isPdf ? 'application/pdf' : 'image/jpeg'),
          );
      await Db.library(uid!).doc(id).set({
        'title': title,
        'source': source,
        'status': 'processing',
        'originalAssetPath': path,
        'musicXmlPath': null,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (_) {/* non-fatal during bring-up */}
  }

  /// Persist a paired LED module under users/{uid}/devices (called on connect).
  Future<void> savePairedDevice({
    required String bleId,
    required String name,
    required int ledCount,
    required String firmware,
  }) async {
    if (!_ready) return;
    final docId = bleId.replaceAll(RegExp(r'[^A-Za-z0-9_-]'), '_');
    final device = PairedDevice(
      deviceId: docId,
      name: name,
      bleId: bleId,
      ledCount: ledCount,
      firmwareVersion: firmware,
    );
    try {
      await Db.device(uid!, docId).set(device.toMap(), SetOptions(merge: true));
    } catch (_) {/* non-fatal during bring-up */}
  }
}
