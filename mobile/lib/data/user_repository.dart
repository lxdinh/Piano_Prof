import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';

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

  void _log(String op, Object e) {
    if (kDebugMode) debugPrint('[UserRepository.$op] $e');
  }

  /// Create the profile doc on first run if it doesn't exist yet.
  Future<void> ensureProfile() async {
    if (!_ready) return;
    try {
      final ref = Db.user(uid!);
      final snap = await ref.get();
      if (!snap.exists) {
        await ref.set(UserProfile.initialDoc(uid!));
      }
    } catch (e) {/* non-fatal during bring-up */ _log('ensureProfile', e); }
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

  /// Per-lesson star ratings (lessonId → 0–3) for the path nodes.
  Stream<Map<String, int>> watchLessonStars() {
    if (!_ready) return const Stream<Map<String, int>>.empty();
    return Db.lessonProgress(uid!).snapshots().map((q) => {
          for (final d in q.docs)
            d.id: ((d.data()['stars'] as num?)?.toInt() ?? 0),
        });
  }

  /// Merge absolute gamification fields onto the user doc. The caller computes
  /// the new values from the live profile (client-authoritative v1), so this
  /// stays offline-safe (no transactions) and the live stream echoes the write.
  Future<void> mergeUser(Map<String, dynamic> data) async {
    if (!_ready) return;
    try {
      await Db.user(uid!).set(
        {...data, 'updatedAt': FieldValue.serverTimestamp()},
        SetOptions(merge: true),
      );
    } catch (e) {/* non-fatal during bring-up */ _log('mergeUser', e); }
  }

  /// Record a completed lesson run. Keeps the best star rating, counts attempts,
  /// and stamps `firstCompletedAt` only once. Returns the best stars on record.
  Future<int> recordLessonProgress({
    required String lessonId,
    required int stars,
    required int xpEarned,
  }) async {
    if (!_ready) return stars;
    try {
      final ref = Db.lessonProgress(uid!).doc(lessonId);
      final prev = await ref.get();
      final prevStars = (prev.data()?['stars'] as num?)?.toInt() ?? 0;
      final bestStars = stars > prevStars ? stars : prevStars;
      final firstTime = !(prev.exists && prev.data()?['firstCompletedAt'] != null);
      await ref.set({
        'status': 'completed',
        'stars': bestStars,
        'xpEarned': xpEarned,
        'attempts': FieldValue.increment(1),
        'lastPlayedAt': FieldValue.serverTimestamp(),
        if (firstTime) 'firstCompletedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
      return bestStars;
    } catch (e) {
      _log('recordLessonProgress', e);
      return stars;
    }
  }

  /// Bump the per-day activity bucket (powers the streak calendar + daily ring).
  Future<void> bumpDailyActivity(
    String day, {
    required int xpEarned,
    required int lessonsCompleted,
    required bool goalMet,
  }) async {
    if (!_ready) return;
    try {
      await Db.dailyActivity(uid!).doc(day).set({
        'date': day,
        'xpEarned': FieldValue.increment(xpEarned),
        'lessonsCompleted': FieldValue.increment(lessonsCompleted),
        if (goalMet) 'streakMaintained': true,
      }, SetOptions(merge: true));
    } catch (e) {/* non-fatal */ _log('bumpDailyActivity', e); }
  }

  /// XP already earned today (to initialise the daily-goal ring on launch).
  Future<int> readDailyXp(String day) async {
    if (!_ready) return 0;
    try {
      final snap = await Db.dailyActivity(uid!).doc(day).get();
      return (snap.data()?['xpEarned'] as num?)?.toInt() ?? 0;
    } catch (e) {
      _log('readDailyXp', e);
      return 0;
    }
  }

  /// Live entitlement (read-only; written by the store webhook → Cloud Function,
  /// per firestore.rules — clients can read but never write `private/`).
  Stream<({String tier, String status})> watchSubscription() {
    if (!_ready) return const Stream<({String tier, String status})>.empty();
    return Db.subscription(uid!).snapshots().map((s) {
      final d = s.data() ?? const <String, dynamic>{};
      return (
        tier: d['tier'] as String? ?? 'free',
        status: d['status'] as String? ?? 'none',
      );
    });
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
    } catch (e) {/* non-fatal during bring-up */ _log('uploadSheet', e); }
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
    } catch (e) {/* non-fatal during bring-up */ _log('savePairedDevice', e); }
  }
}
