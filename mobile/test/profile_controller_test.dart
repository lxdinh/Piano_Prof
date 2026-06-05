import 'package:flutter_test/flutter_test.dart';
import 'package:piano_professor/data/engagement.dart';
import 'package:piano_professor/data/profile_controller.dart';
import 'package:piano_professor/data/user_repository.dart';
import 'package:piano_professor/lessons/lesson_models.dart';
import 'package:piano_professor/services/auth_service.dart';

/// Exercises the full reward orchestration in demo mode (Firebase not ready →
/// everything runs in-memory, so no emulator is needed).
Future<ProfileController> _demoController() async {
  final repo = UserRepository(AuthService(false));
  final p = ProfileController(repo);
  await p.init();
  return p;
}

void main() {
  test('flawless concept lesson awards XP + gems + starts the streak', () async {
    final p = await _demoController();
    final r = await p.completeLesson(
        lessonId: 'g1', kind: LessonKind.concept, mistakes: 0);
    expect(r.stars, 3);
    expect(r.xpEarned, 30);
    expect(r.gemsEarned, 10);
    expect(p.totalXp, 30);
    expect(p.gems, 10);
    expect(p.streakCount, 1);
    expect(p.todayXp, 30);
    expect(p.dailyGoalMet, false); // 30 < 50
  });

  test('mistakes reduce stars and XP', () async {
    final p = await _demoController();
    final r = await p.completeLesson(
        lessonId: 'g1', kind: LessonKind.concept, mistakes: 2);
    expect(r.stars, 2);
    expect(r.xpEarned, 20);
  });

  test('a second lesson the same day keeps streak at 1 and closes the ring',
      () async {
    final p = await _demoController();
    await p.completeLesson(lessonId: 'g1', kind: LessonKind.song, mistakes: 0);
    final r = await p.completeLesson(
        lessonId: 'l1-mary', kind: LessonKind.song, mistakes: 0);
    expect(p.totalXp, 100); // (40 + 10 flawless bonus) x 2
    expect(p.streakCount, 1); // same calendar day
    expect(p.todayXp, 100);
    expect(p.dailyGoalMet, true); // 100 >= 50
    expect(r.dailyGoalMet, true);
  });

  test('spending hearts empties them and blocks new lessons', () async {
    final p = await _demoController();
    expect(p.canStartLesson, true);
    HeartsState? h;
    for (var i = 0; i < 5; i++) {
      h = await p.spendHeart();
    }
    expect(h!.count, 0);
    expect(p.canStartLesson, false);
  });
}
