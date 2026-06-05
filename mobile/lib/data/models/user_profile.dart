import 'package:cloud_firestore/cloud_firestore.dart';

import '../engagement.dart';

/// Mirror of the `users/{uid}` doc (see backend/firebase/SCHEMA.md §1).
/// Carries the hot gamification counters every screen reads. Unmapped fields
/// round-trip untouched via merge writes.
class UserProfile {
  const UserProfile({
    required this.uid,
    this.username = '',
    this.displayName = 'Player',
    this.streakCount = 0,
    this.longestStreak = 0,
    this.lastActiveDate,
    this.totalXp = 0,
    this.gems = 0,
    this.hearts = kMaxHearts,
    this.heartsMax = kMaxHearts,
    this.heartsNextRefillAt,
    this.heartsUnlimited = false,
    this.currentLessonId,
  });

  final String uid;
  final String username;
  final String displayName;
  final int streakCount;
  final int longestStreak;
  final String? lastActiveDate; // YYYY-MM-DD (local)
  final int totalXp;
  final int gems;
  final int hearts;
  final int heartsMax;
  final DateTime? heartsNextRefillAt;
  final bool heartsUnlimited;
  final String? currentLessonId;

  HeartsState get heartsState => HeartsState(
        count: hearts,
        max: heartsMax,
        nextRefillAt: heartsNextRefillAt,
        unlimited: heartsUnlimited,
      );

  /// A friendly handle for the header (username → displayName → "Player").
  String get handle =>
      username.isNotEmpty ? username : (displayName.isNotEmpty ? displayName : 'Player');

  factory UserProfile.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final d = doc.data() ?? const <String, dynamic>{};
    final h = (d['hearts'] as Map<String, dynamic>?) ?? const <String, dynamic>{};
    return UserProfile(
      uid: doc.id,
      username: d['username'] as String? ?? '',
      displayName: d['displayName'] as String? ?? 'Player',
      streakCount: (d['streakCount'] as num?)?.toInt() ?? 0,
      longestStreak: (d['longestStreak'] as num?)?.toInt() ?? 0,
      lastActiveDate: d['lastActiveDate'] as String?,
      totalXp: (d['totalXp'] as num?)?.toInt() ?? 0,
      gems: (d['gems'] as num?)?.toInt() ?? 0,
      hearts: (h['count'] as num?)?.toInt() ?? kMaxHearts,
      heartsMax: (h['max'] as num?)?.toInt() ?? kMaxHearts,
      heartsNextRefillAt: (h['nextRefillAt'] as Timestamp?)?.toDate(),
      heartsUnlimited: h['unlimited'] as bool? ?? false,
      currentLessonId: d['currentLessonId'] as String?,
    );
  }

  /// In-memory profile used when Firebase isn't configured, so the engagement
  /// loop is fully playable in a local/demo build.
  factory UserProfile.demo() => const UserProfile(uid: 'demo');

  UserProfile copyWith({
    String? username,
    String? displayName,
    int? streakCount,
    int? longestStreak,
    String? lastActiveDate,
    int? totalXp,
    int? gems,
    HeartsState? hearts,
    String? currentLessonId,
  }) {
    return UserProfile(
      uid: uid,
      username: username ?? this.username,
      displayName: displayName ?? this.displayName,
      streakCount: streakCount ?? this.streakCount,
      longestStreak: longestStreak ?? this.longestStreak,
      lastActiveDate: lastActiveDate ?? this.lastActiveDate,
      totalXp: totalXp ?? this.totalXp,
      gems: gems ?? this.gems,
      hearts: hearts?.count ?? this.hearts,
      heartsMax: hearts?.max ?? heartsMax,
      heartsNextRefillAt: hearts != null ? hearts.nextRefillAt : heartsNextRefillAt,
      heartsUnlimited: hearts?.unlimited ?? heartsUnlimited,
      currentLessonId: currentLessonId ?? this.currentLessonId,
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
        'lastActiveDate': null,
        'totalXp': 0,
        'gems': 0,
        'hearts': {
          'count': kMaxHearts,
          'max': kMaxHearts,
          'nextRefillAt': null,
          'unlimited': false,
        },
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
