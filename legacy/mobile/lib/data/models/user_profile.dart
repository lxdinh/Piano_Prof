import 'package:cloud_firestore/cloud_firestore.dart';

/// Mirror of the `users/{uid}` doc (see backend/firebase/SCHEMA.md §1).
/// Only the fields the UI currently needs are mapped; the rest round-trip
/// untouched via merge writes.
class UserProfile {
  const UserProfile({
    required this.uid,
    this.username = '',
    this.displayName = 'Player',
    this.streakCount = 0,
    this.totalXp = 0,
    this.gems = 0,
    this.hearts = 5,
    this.currentLessonId,
  });

  final String uid;
  final String username;
  final String displayName;
  final int streakCount;
  final int totalXp;
  final int gems;
  final int hearts;
  final String? currentLessonId;

  factory UserProfile.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? const <String, dynamic>{};
    return UserProfile(
      uid: doc.id,
      username: d['username'] as String? ?? '',
      displayName: d['displayName'] as String? ?? 'Player',
      streakCount: (d['streakCount'] as num?)?.toInt() ?? 0,
      totalXp: (d['totalXp'] as num?)?.toInt() ?? 0,
      gems: (d['gems'] as num?)?.toInt() ?? 0,
      hearts: ((d['hearts'] as Map<String, dynamic>?)?['count'] as num?)?.toInt() ?? 5,
      currentLessonId: d['currentLessonId'] as String?,
    );
  }

  /// Default document written on first sign-in. Satisfies firestore.rules
  /// `validUserDoc()` (streakCount/totalXp/gems are non-negative ints).
  static Map<String, dynamic> initialDoc(String uid) => {
        'uid': uid,
        'username': '',
        'displayName': 'Player',
        'streakCount': 0,
        'longestStreak': 0,
        'totalXp': 0,
        'gems': 0,
        'hearts': {'count': 5, 'max': 5, 'nextRefillAt': null, 'unlimited': false},
        'settings': {
          'ledBrightness': 80,
          'colorTheme': 'rainbow',
          'darkMode': false,
          'dailyGoalMinutes': 10,
        },
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      };
}
