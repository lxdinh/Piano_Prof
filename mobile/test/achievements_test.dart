import 'package:flutter_test/flutter_test.dart';
import 'package:piano_professor/data/achievements.dart';

void main() {
  test('evaluate marks badges unlocked when totals meet thresholds', () {
    final items = evaluateAchievements(const AchievementStats(
        lessons: 5, perfectLessons: 0, songs: 0, streak: 0, xp: 0));
    final byId = {for (final a in items) a.def.id: a};
    expect(byId['first_steps']!.unlocked, true); // 5 >= 1
    expect(byId['getting_started']!.unlocked, true); // 5 >= 5
    expect(byId['dedicated']!.unlocked, false); // 5 < 10
    expect(byId['dedicated']!.progress, closeTo(0.5, 1e-9));
  });

  test('newlyUnlocked reports only threshold crossings', () {
    const before = AchievementStats(
        lessons: 4, perfectLessons: 0, songs: 0, streak: 2, xp: 240);
    const after = AchievementStats(
        lessons: 5, perfectLessons: 0, songs: 0, streak: 3, xp: 250);
    final ids = newlyUnlocked(before, after);
    expect(ids.contains('getting_started'), true); // 4→5 crosses 5
    expect(ids.contains('on_fire'), true); // 2→3 crosses 3
    expect(ids.contains('virtuoso'), true); // 240→250 crosses 250
    expect(ids.contains('first_steps'), false); // already unlocked before
  });
}
