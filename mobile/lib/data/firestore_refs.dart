import 'package:cloud_firestore/cloud_firestore.dart';

/// Centralized Firestore paths — the single place that knows the collection
/// layout from backend/firebase/SCHEMA.md. Keep in sync with the rules.
class Db {
  Db._();

  static FirebaseFirestore get _fs => FirebaseFirestore.instance;

  static DocumentReference<Map<String, dynamic>> user(String uid) =>
      _fs.collection('users').doc(uid);

  static CollectionReference<Map<String, dynamic>> devices(String uid) =>
      user(uid).collection('devices');

  static DocumentReference<Map<String, dynamic>> device(
          String uid, String deviceId) =>
      devices(uid).doc(deviceId);

  static CollectionReference<Map<String, dynamic>> lessonProgress(String uid) =>
      user(uid).collection('lessonProgress');

  /// One doc per active local day (`YYYY-MM-DD`) — streak calendar + daily ring.
  static CollectionReference<Map<String, dynamic>> dailyActivity(String uid) =>
      user(uid).collection('dailyActivity');

  static CollectionReference<Map<String, dynamic>> achievements(String uid) =>
      user(uid).collection('achievements');

  static CollectionReference<Map<String, dynamic>> library(String uid) =>
      user(uid).collection('library');

  // client read-only (entitlement is written by a backend webhook)
  static DocumentReference<Map<String, dynamic>> subscription(String uid) =>
      user(uid).collection('private').doc('subscription');

  // catalog (read-only to clients)
  static CollectionReference<Map<String, dynamic>> get lessons =>
      _fs.collection('lessons');
  static CollectionReference<Map<String, dynamic>> get subscriptionPlans =>
      _fs.collection('subscriptionPlans');
}
