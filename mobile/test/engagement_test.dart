import 'package:flutter_test/flutter_test.dart';
import 'package:piano_professor/data/engagement.dart';
import 'package:piano_professor/lessons/lesson_models.dart';

void main() {
  group('dayKey', () {
    test('formats local date as YYYY-MM-DD, ignoring time of day', () {
      expect(dayKey(DateTime(2026, 5, 24, 23, 59)), '2026-05-24');
      expect(dayKey(DateTime(2026, 1, 3, 0, 1)), '2026-01-03');
    });
  });

  group('advanceStreak', () {
    final now = DateTime(2026, 5, 24, 12);

    test('first ever activity starts the streak at 1', () {
      final r = advanceStreak(
          lastActiveDate: null, now: now, streakCount: 0, longestStreak: 0);
      expect(r.streakCount, 1);
      expect(r.longestStreak, 1);
      expect(r.changed, true);
    });

    test('same day does not change the streak', () {
      final r = advanceStreak(
          lastActiveDate: '2026-05-24', now: now, streakCount: 4, longestStreak: 9);
      expect(r.streakCount, 4);
      expect(r.longestStreak, 9);
      expect(r.changed, false);
    });

    test('consecutive day increments and can beat the record', () {
      final r = advanceStreak(
          lastActiveDate: '2026-05-23', now: now, streakCount: 9, longestStreak: 9);
      expect(r.streakCount, 10);
      expect(r.longestStreak, 10);
      expect(r.changed, true);
    });

    test('a gap resets the streak to 1 but keeps the longest', () {
      final r = advanceStreak(
          lastActiveDate: '2026-05-20', now: now, streakCount: 12, longestStreak: 12);
      expect(r.streakCount, 1);
      expect(r.longestStreak, 12);
      expect(r.changed, true);
    });
  });

  group('hearts', () {
    final now = DateTime(2026, 5, 24, 12);

    test('refill is a no-op when full or unlimited', () {
      expect(refillHearts(const HeartsState(count: 5, max: 5), now).count, 5);
      expect(
          refillHearts(
                  HeartsState(count: 1, max: 5, unlimited: true, nextRefillAt: now),
                  now)
              .count,
          1);
    });

    test('refill credits one heart when due and advances the clock', () {
      final s = HeartsState(
          count: 2, max: 5, nextRefillAt: now.subtract(const Duration(minutes: 1)));
      final r = refillHearts(s, now, interval: const Duration(minutes: 30));
      expect(r.count, 3);
      expect(r.nextRefillAt, isNotNull);
    });

    test('refill caps at max and clears the clock', () {
      final s = HeartsState(
          count: 4, max: 5, nextRefillAt: now.subtract(const Duration(hours: 5)));
      final r = refillHearts(s, now);
      expect(r.count, 5);
      expect(r.nextRefillAt, isNull);
    });

    test('losing a heart from full starts the refill clock', () {
      const s = HeartsState(count: 5, max: 5);
      final r = loseHeart(s, now, interval: const Duration(minutes: 30));
      expect(r.count, 4);
      expect(r.nextRefillAt, now.add(const Duration(minutes: 30)));
    });

    test('losing a heart keeps an already-running clock', () {
      final clock = now.add(const Duration(minutes: 10));
      final s = HeartsState(count: 3, max: 5, nextRefillAt: clock);
      final r = loseHeart(s, now);
      expect(r.count, 2);
      expect(r.nextRefillAt, clock);
    });

    test('cannot go below zero; unlimited never loses', () {
      expect(loseHeart(const HeartsState(count: 0, max: 5), now).count, 0);
      expect(loseHeart(const HeartsState(count: 2, max: 5, unlimited: true), now).count, 2);
      expect(const HeartsState(count: 0, max: 5).isEmpty, true);
      expect(const HeartsState(count: 0, max: 5, unlimited: true).isEmpty, false);
    });
  });

  group('rewards', () {
    test('stars: flawless=3, a slip or two=2, more=1', () {
      expect(starsForMistakes(0), 3);
      expect(starsForMistakes(1), 2);
      expect(starsForMistakes(2), 2);
      expect(starsForMistakes(3), 1);
    });

    test('xp scales by kind with a flawless bonus', () {
      expect(xpForLesson(LessonKind.concept, 3), 30); // 20 + 10
      expect(xpForLesson(LessonKind.concept, 2), 20);
      expect(xpForLesson(LessonKind.exercise, 3), 40); // 30 + 10
      expect(xpForLesson(LessonKind.song, 1), 40);
    });

    test('gems reward a flawless run', () {
      expect(gemsForLesson(3), 10);
      expect(gemsForLesson(2), 5);
    });
  });
}
