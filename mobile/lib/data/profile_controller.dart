import 'dart:async';

import 'package:flutter/foundation.dart';

import '../billing/subscription_controller.dart';
import '../lessons/lesson_data.dart';
import '../lessons/lesson_models.dart';
import 'achievements.dart';
import 'engagement.dart';
import 'models/user_profile.dart';
import 'user_repository.dart';

/// Single live source of truth for the user's profile + gamification, shared by
/// the home header, profile screen, and in-lesson UI (replaces the per-screen
/// `watchProfile` StreamBuilders).
///
/// All engagement math is computed here from the live profile using the pure
/// helpers in [engagement] and persisted as **absolute** merge-writes, so it is
/// offline-safe and the Firestore stream simply echoes what we already applied.
/// When Firebase isn't configured it runs fully in-memory (demo mode).
class ProfileController extends ChangeNotifier {
  ProfileController(this._repo, {SubscriptionController? subscription})
      : _subscription = subscription;

  final UserRepository _repo;
  final SubscriptionController? _subscription;
  StreamSubscription<UserProfile?>? _sub;
  StreamSubscription<Map<String, int>>? _starsSub;

  UserProfile _profile = UserProfile.demo();
  final Map<String, int> _lessonStars = {}; // lessonId → best stars (0–3)
  String _todayKey = dayKey(DateTime.now());
  int _todayXp = 0;
  bool _initialRefillDone = false;

  // --- read API ---------------------------------------------------------
  UserProfile get profile => _profile;

  /// Effective hearts — a subscription grants unlimited hearts even if the
  /// stored profile doc hasn't been updated yet.
  HeartsState get hearts {
    final base = _profile.heartsState;
    if (_subscription?.unlimitedHearts == true && !base.unlimited) {
      return HeartsState(
        count: base.count,
        max: base.max,
        nextRefillAt: base.nextRefillAt,
        unlimited: true,
      );
    }
    return base;
  }
  int get totalXp => _profile.totalXp;
  int get streakCount => _profile.streakCount;
  int get longestStreak => _profile.longestStreak;
  int get gems => _profile.gems;
  String get handle => _profile.handle;

  /// lessonId → best stars earned (drives achievements + path nodes in demo).
  Map<String, int> get lessonStars => _lessonStars;

  int get todayXp => _todayXp;
  int get dailyGoalXp => kDailyGoalXp;
  double get dailyProgress =>
      kDailyGoalXp <= 0 ? 1 : (_todayXp / kDailyGoalXp).clamp(0.0, 1.0);
  bool get dailyGoalMet => _todayXp >= kDailyGoalXp;

  /// True when the learner has hearts (or unlimited) to begin/continue a lesson.
  bool get canStartLesson => !hearts.isEmpty;

  /// When the next heart refills (null if full or unlimited).
  Duration? get refillIn {
    final next = hearts.nextRefillAt;
    if (hearts.unlimited || hearts.isFull || next == null) return null;
    final d = next.difference(DateTime.now());
    return d.isNegative ? Duration.zero : d;
  }

  Future<void> init() async {
    _todayKey = dayKey(DateTime.now());
    _subscription?.addListener(notifyListeners); // hearts react to entitlement
    if (_repo.isReady) {
      _todayXp = await _repo.readDailyXp(_todayKey);
      _sub = _repo.watchProfile().listen((p) {
        _profile = p ?? UserProfile(uid: _repo.uid ?? 'me');
        if (!_initialRefillDone) {
          _initialRefillDone = true;
          // Defer so we don't write back inside the first stream event.
          scheduleMicrotask(refillHeartsIfDue);
        }
        notifyListeners();
      });
      _starsSub = _repo.watchLessonStars().listen((m) {
        _lessonStars
          ..clear()
          ..addAll(m);
        notifyListeners();
      });
    } else {
      _profile = UserProfile.demo();
      notifyListeners();
    }
  }

  // --- engagement actions ----------------------------------------------

  /// Credit any hearts that refilled while the app was closed.
  Future<void> refillHeartsIfDue() async {
    final next = refillHearts(hearts, DateTime.now());
    if (next.count == hearts.count && next.nextRefillAt == hearts.nextRefillAt) {
      return;
    }
    await _applyHearts(next);
  }

  /// Spend a heart on a mistake; returns the resulting hearts state so the
  /// caller can decide whether the lesson can continue.
  Future<HeartsState> spendHeart() async {
    if (hearts.unlimited) return hearts; // subscribers never lose hearts
    final next = loseHeart(hearts, DateTime.now());
    await _applyHearts(next);
    return next;
  }

  /// Finish a lesson: compute stars/XP/gems, advance the streak, and persist.
  /// Returns a summary for the completion screen.
  Future<LessonReward> completeLesson({
    required String lessonId,
    required LessonKind kind,
    required int mistakes,
  }) async {
    final stars = starsForMistakes(mistakes);
    final xp = xpForLesson(kind, stars);
    final gemsEarned = gemsForLesson(stars);
    final now = DateTime.now();
    final before = _statsSnapshot(); // for new-achievement detection
    _rolloverDayIfNeeded(now);

    final streak = advanceStreak(
      lastActiveDate: _profile.lastActiveDate,
      now: now,
      streakCount: _profile.streakCount,
      longestStreak: _profile.longestStreak,
    );

    final newXp = _profile.totalXp + xp;
    final newGems = _profile.gems + gemsEarned;
    _todayXp += xp;

    // Optimistic in-memory update (authoritative in demo mode; echoed by the
    // stream when Firebase is live).
    _profile = _profile.copyWith(
      totalXp: newXp,
      gems: newGems,
      streakCount: streak.streakCount,
      longestStreak: streak.longestStreak,
      lastActiveDate: dayKey(now),
      currentLessonId: lessonId,
    );
    notifyListeners();

    final bestStars = await _repo.recordLessonProgress(
      lessonId: lessonId,
      stars: stars,
      xpEarned: xp,
    );
    _lessonStars[lessonId] = bestStars;
    notifyListeners();
    await _repo.mergeUser({
      'totalXp': newXp,
      'gems': newGems,
      'streakCount': streak.streakCount,
      'longestStreak': streak.longestStreak,
      'lastActiveDate': dayKey(now),
      'currentLessonId': lessonId,
    });
    await _repo.bumpDailyActivity(
      _todayKey,
      xpEarned: xp,
      lessonsCompleted: 1,
      goalMet: dailyGoalMet,
    );

    final newly = newlyUnlocked(before, _statsSnapshot());
    final unlocked =
        kAchievements.where((d) => newly.contains(d.id)).toList();

    return LessonReward(
      stars: bestStars,
      xpEarned: xp,
      gemsEarned: gemsEarned,
      streakCount: streak.streakCount,
      streakIncreased: streak.changed,
      dailyGoalMet: dailyGoalMet,
      unlockedAchievements: unlocked,
    );
  }

  /// Snapshot of the totals badges are measured against (current in-memory).
  AchievementStats _statsSnapshot() => AchievementStats(
        lessons: _lessonStars.length,
        perfectLessons: _lessonStars.values.where((s) => s >= 3).length,
        songs: _lessonStars.keys
            .where((id) => lessonKindFor(id) == LessonKind.song)
            .length,
        streak: _profile.longestStreak,
        xp: _profile.totalXp,
      );

  Future<void> _applyHearts(HeartsState h) async {
    _profile = _profile.copyWith(hearts: h);
    notifyListeners();
    await _repo.mergeUser({'hearts': h.toMap()});
  }

  void _rolloverDayIfNeeded(DateTime now) {
    final key = dayKey(now);
    if (key != _todayKey) {
      _todayKey = key;
      _todayXp = 0;
    }
  }

  @override
  void dispose() {
    _subscription?.removeListener(notifyListeners);
    _sub?.cancel();
    _starsSub?.cancel();
    super.dispose();
  }
}

/// What a finished lesson awarded — drives the completion screen.
class LessonReward {
  const LessonReward({
    required this.stars,
    required this.xpEarned,
    required this.gemsEarned,
    required this.streakCount,
    required this.streakIncreased,
    required this.dailyGoalMet,
    this.unlockedAchievements = const [],
  });

  final int stars;
  final int xpEarned;
  final int gemsEarned;
  final int streakCount;
  final bool streakIncreased;
  final bool dailyGoalMet;

  /// Badges newly earned by this lesson (for the unlock celebration).
  final List<AchievementDef> unlockedAchievements;
}
