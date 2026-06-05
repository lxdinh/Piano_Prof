import '../lessons/lesson_models.dart';

/// Pure, Firebase-free gamification math (client-authoritative v1, see
/// backend/firebase/firestore.rules + SCHEMA.md §1). Kept side-effect free so
/// it's unit-testable and can be lifted into Cloud Functions later unchanged.

/// Hearts replenish one at a time on this cadence.
const Duration kHeartsRefillInterval = Duration(minutes: 30);

/// Default heart capacity (Duolingo-style: 5).
const int kMaxHearts = 5;

/// XP a learner must earn in a local day to keep the streak / close the ring.
const int kDailyGoalXp = 50;

/// Local calendar day as the `YYYY-MM-DD` key the schema uses for streak
/// buckets (device timezone — stable across restarts, ignores time-of-day).
String dayKey(DateTime now) {
  final d = DateTime(now.year, now.month, now.day);
  final y = d.year.toString().padLeft(4, '0');
  final m = d.month.toString().padLeft(2, '0');
  final day = d.day.toString().padLeft(2, '0');
  return '$y-$m-$day';
}

/// Immutable hearts snapshot (mirrors the `hearts` map in the user doc).
class HeartsState {
  const HeartsState({
    required this.count,
    this.max = kMaxHearts,
    this.nextRefillAt,
    this.unlimited = false,
  });

  final int count;
  final int max;
  final DateTime? nextRefillAt;
  final bool unlimited;

  bool get isEmpty => !unlimited && count <= 0;
  bool get isFull => count >= max;

  HeartsState _copy({int? count, DateTime? nextRefillAt, bool clearRefill = false}) =>
      HeartsState(
        count: count ?? this.count,
        max: max,
        nextRefillAt: clearRefill ? null : (nextRefillAt ?? this.nextRefillAt),
        unlimited: unlimited,
      );

  /// Firestore `hearts` map for a merge write.
  Map<String, dynamic> toMap() => {
        'count': count,
        'max': max,
        'nextRefillAt': nextRefillAt,
        'unlimited': unlimited,
      };
}

/// Credit any hearts that have refilled at-or-before [now]. Pure.
HeartsState refillHearts(HeartsState s, DateTime now,
    {Duration interval = kHeartsRefillInterval}) {
  if (s.unlimited || s.isFull) return s.isFull ? s._copy(clearRefill: true) : s;
  if (s.nextRefillAt == null) return s;
  var count = s.count;
  var next = s.nextRefillAt!;
  while (count < s.max && !now.isBefore(next)) {
    count++;
    next = next.add(interval);
  }
  return count >= s.max
      ? s._copy(count: count, clearRefill: true)
      : s._copy(count: count, nextRefillAt: next);
}

/// Spend one heart on a mistake. Starts the refill clock when leaving full.
HeartsState loseHeart(HeartsState s, DateTime now,
    {Duration interval = kHeartsRefillInterval}) {
  if (s.unlimited || s.count <= 0) return s;
  final count = s.count - 1;
  final next = s.nextRefillAt ?? now.add(interval);
  return count >= s.max
      ? s._copy(count: count, clearRefill: true)
      : s._copy(count: count, nextRefillAt: next);
}

/// Result of advancing the daily streak.
class StreakResult {
  const StreakResult({
    required this.streakCount,
    required this.longestStreak,
    required this.changed,
  });

  final int streakCount;
  final int longestStreak;

  /// False when the day was already counted (no celebration / no re-award).
  final bool changed;
}

/// Streak rules: same local day → unchanged; consecutive day → +1; any gap →
/// reset to 1. Pure (the caller supplies "now" so it's testable).
StreakResult advanceStreak({
  required String? lastActiveDate,
  required DateTime now,
  required int streakCount,
  required int longestStreak,
}) {
  final today = dayKey(now);
  if (lastActiveDate == today) {
    return StreakResult(
        streakCount: streakCount, longestStreak: longestStreak, changed: false);
  }
  final yesterday = dayKey(DateTime(now.year, now.month, now.day)
      .subtract(const Duration(days: 1)));
  final next = (lastActiveDate == yesterday) ? streakCount + 1 : 1;
  final longest = next > longestStreak ? next : longestStreak;
  return StreakResult(streakCount: next, longestStreak: longest, changed: true);
}

/// Stars for a lesson run: flawless = 3, a slip or two = 2, otherwise 1.
int starsForMistakes(int mistakes) =>
    mistakes <= 0 ? 3 : (mistakes <= 2 ? 2 : 1);

/// Base XP by lesson kind (songs are worth the most; concepts the least).
int baseXpForKind(LessonKind kind) => switch (kind) {
      LessonKind.concept => 20,
      LessonKind.exercise => 30,
      LessonKind.song => 40,
    };

/// Total XP for a completed lesson, with a flawless-run bonus.
int xpForLesson(LessonKind kind, int stars) =>
    baseXpForKind(kind) + (stars >= 3 ? 10 : 0);

/// Gems awarded for a completed lesson (bonus for a flawless run).
int gemsForLesson(int stars) => 5 + (stars >= 3 ? 5 : 0);
