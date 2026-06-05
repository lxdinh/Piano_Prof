import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../audio/voice_service.dart';
import '../data/profile_controller.dart';
import '../data/user_repository.dart';
import '../lessons/lesson_data.dart';
import '../lessons/lesson_models.dart';
import '../theme/app_theme.dart';
import '../widgets/chunky_button.dart';
import '../widgets/mascot_image.dart';
import '../widgets/stat_pill.dart';
import 'ble_connect_screen.dart';
import 'lesson_screen.dart';

/// Home — the Duolingo-style lesson path. Header stats are live from the shared
/// [ProfileController]; completion + stars drive node state and gating.
class LessonPathScreen extends StatelessWidget {
  const LessonPathScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final repo = context.read<UserRepository>();
    return Scaffold(
      backgroundColor: AppColors.cream50,
      body: SafeArea(
        child: Column(
          children: [
            const _Header(),
            Expanded(
              child: StreamBuilder<Set<String>>(
                stream: repo.watchCompletedLessonIds(),
                builder: (context, completedSnap) {
                  final completed = completedSnap.data ?? const <String>{};
                  return StreamBuilder<Map<String, int>>(
                    stream: repo.watchLessonStars(),
                    builder: (context, starsSnap) {
                      return _PathList(
                        completed: completed,
                        stars: starsSnap.data ?? const <String, int>{},
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    final profile = context.watch<ProfileController>();
    final hearts = profile.hearts;
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 12, 12),
      decoration: const BoxDecoration(
        color: AppColors.cardBg,
        border: Border(bottom: BorderSide(color: AppColors.inkLine, width: 1.5)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                clipBehavior: Clip.antiAlias,
                decoration: const BoxDecoration(
                    shape: BoxShape.circle, color: AppColors.cream200),
                child: const MascotImage(mood: 'cheer', size: 40),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('PATHWAY',
                        style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: AppColors.ink500,
                            letterSpacing: 1.2)),
                    Text('Kindergarten → Master',
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: AppColors.ink900)),
                  ],
                ),
              ),
              IconButton(
                tooltip: 'Piano Lights',
                icon: const Icon(Icons.bluetooth, color: AppColors.sky),
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(builder: (_) => const BleConnectScreen()),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              StatPill(
                  icon: Icons.local_fire_department,
                  value: '${profile.streakCount}',
                  color: const Color(0xFFFF7A1C)),
              StatPill(
                  icon: Icons.bolt,
                  value: '${profile.totalXp}',
                  color: AppColors.butter),
              StatPill(
                  icon: Icons.diamond, value: '${profile.gems}', color: AppColors.sky),
              StatPill(
                  icon: Icons.favorite,
                  value: hearts.unlimited ? '∞' : '${hearts.count}',
                  color: AppColors.heart),
            ],
          ),
          const SizedBox(height: 10),
          _DailyGoalBar(profile: profile),
        ],
      ),
    );
  }
}

class _DailyGoalBar extends StatelessWidget {
  const _DailyGoalBar({required this.profile});
  final ProfileController profile;

  @override
  Widget build(BuildContext context) {
    final met = profile.dailyGoalMet;
    return Row(
      children: [
        Icon(met ? Icons.emoji_events : Icons.flag,
            size: 16, color: met ? AppColors.brand : AppColors.ink500),
        const SizedBox(width: 6),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: profile.dailyProgress,
              minHeight: 10,
              backgroundColor: AppColors.cream200,
              color: met ? AppColors.brand : AppColors.butter,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text('${profile.todayXp}/${profile.dailyGoalXp} XP',
            style: const TextStyle(
                fontSize: 11, fontWeight: FontWeight.w900, color: AppColors.ink500)),
      ],
    );
  }
}

class _PathList extends StatelessWidget {
  const _PathList({required this.completed, required this.stars});
  final Set<String> completed;
  final Map<String, int> stars;

  @override
  Widget build(BuildContext context) {
    // current = first authored lesson not yet completed; lessons after it lock.
    final order = {
      for (var i = 0; i < lessonCatalog.length; i++) lessonCatalog[i].id: i
    };
    var currentIndex = lessonCatalog.length; // none current (all done) by default
    for (var i = 0; i < lessonCatalog.length; i++) {
      final m = lessonCatalog[i];
      if (!completed.contains(m.id) && lessonAuthored(m.id)) {
        currentIndex = i;
        break;
      }
    }
    final currentId =
        currentIndex < lessonCatalog.length ? lessonCatalog[currentIndex].id : null;

    final children = <Widget>[];
    for (final level in levels) {
      children.add(_LevelHeader(level: level));
      for (final m in lessonsForLevel(level.id)) {
        final done = completed.contains(m.id);
        final comingSoon = !lessonAuthored(m.id);
        final isCurrent = m.id == currentId;
        final locked =
            !done && !isCurrent && !comingSoon && (order[m.id] ?? 0) > currentIndex;
        children.add(_LessonNode(
          meta: m,
          done: done,
          current: isCurrent,
          locked: locked,
          comingSoon: comingSoon,
          stars: stars[m.id] ?? 0,
          onTap: () => _onTap(context, m,
              done: done, locked: locked, comingSoon: comingSoon),
        ));
      }
    }
    children.add(const SizedBox(height: 24));
    children.add(const Center(
      child: Text('~ MASTERY ~',
          style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              color: AppColors.ink300,
              letterSpacing: 2)),
    ));
    children.add(const SizedBox(height: 24));

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      children: children,
    );
  }

  void _onTap(BuildContext context, LessonMeta m,
      {required bool done, required bool locked, required bool comingSoon}) {
    final messenger = ScaffoldMessenger.of(context);
    if (comingSoon) {
      messenger.showSnackBar(const SnackBar(
          content: Text('Full lesson coming soon! 🎵'),
          duration: Duration(seconds: 2)));
      return;
    }
    if (locked) {
      messenger.showSnackBar(const SnackBar(
          content: Text('Finish the earlier lessons to unlock this one.'),
          duration: Duration(seconds: 2)));
      return;
    }
    final profile = context.read<ProfileController>();
    if (!profile.canStartLesson) {
      _showOutOfHearts(context, profile);
      return;
    }
    final lesson = lessonFor(m);
    // Fire-and-forget: start fetching all Say lines the instant the user taps
    // so audio is cached before the first line needs to play.
    final allTexts = [
      for (final step in lesson.steps)
        for (final seg in step.segments)
          if (seg is Say) seg.text,
      lesson.complete,
    ];
    context.read<VoiceService>().prefetchAll(allTexts);
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => LessonScreen(lesson: lesson)),
    );
  }

  void _showOutOfHearts(BuildContext context, ProfileController profile) {
    final refill = profile.refillIn;
    final mins = refill == null ? null : refill.inMinutes + 1;
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Out of hearts'),
        content: Text(mins == null
            ? 'You are out of hearts. Go Premium for unlimited hearts.'
            : 'You are out of hearts. The next one refills in about $mins min — '
                'or go Premium for unlimited.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('OK')),
        ],
      ),
    );
  }
}

class _LevelHeader extends StatelessWidget {
  const _LevelHeader({required this.level});
  final Level level;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(2, 18, 2, 10),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.cream100,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.inkLine, width: 1.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 30,
                  height: 30,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                      shape: BoxShape.circle, color: AppColors.rust),
                  child: Text('${level.index}',
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                          fontSize: 15)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(level.name,
                      style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: AppColors.ink900)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(level.objective, style: AppTheme.subtitle),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.cream50,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppColors.inkLine),
              ),
              child: Text('⏱ ${level.duration}',
                  style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: AppColors.ink500)),
            ),
          ],
        ),
      ),
    );
  }
}

class _LessonNode extends StatelessWidget {
  const _LessonNode({
    required this.meta,
    required this.done,
    required this.current,
    required this.locked,
    required this.comingSoon,
    required this.stars,
    required this.onTap,
  });

  final LessonMeta meta;
  final bool done;
  final bool current;
  final bool locked;
  final bool comingSoon;
  final int stars;
  final VoidCallback onTap;

  IconData get _kindIcon => switch (meta.kind) {
        LessonKind.song => Icons.music_note,
        LessonKind.exercise => Icons.fitness_center,
        LessonKind.concept => Icons.lightbulb_outline,
      };

  @override
  Widget build(BuildContext context) {
    final muted = locked || comingSoon;
    final bg = done
        ? AppColors.brand
        : current
            ? AppColors.cardBg
            : AppColors.cream100;
    final fg = done
        ? Colors.white
        : muted
            ? AppColors.ink300
            : AppColors.ink900;

    final IconData leadingIcon = done
        ? Icons.check
        : comingSoon
            ? Icons.schedule
            : locked
                ? Icons.lock
                : _kindIcon;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: current ? AppColors.butter : AppColors.inkLine,
              width: current ? 2.5 : 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: current ? AppColors.butterDark : AppColors.inkSoft,
                offset: Offset(0, current ? 5 : 3),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: current ? 44 : 36,
                height: current ? 44 : 36,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: done
                      ? Colors.white24
                      : current
                          ? AppColors.brand
                          : AppColors.cream300,
                ),
                child: Icon(
                  leadingIcon,
                  color: done || current ? Colors.white : AppColors.ink500,
                  size: current ? 22 : 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(meta.title,
                        style: TextStyle(
                            fontSize: current ? 16 : 14,
                            fontWeight: FontWeight.w900,
                            color: fg)),
                    if (done && stars > 0) ...[
                      const SizedBox(height: 4),
                      _Stars(stars: stars),
                    ],
                  ],
                ),
              ),
              if (current)
                ChunkyButton(label: 'Start', onPressed: onTap)
              else if (comingSoon)
                const _Chip(label: 'SOON', color: AppColors.ink300),
            ],
          ),
        ),
      ),
    );
  }
}

class _Stars extends StatelessWidget {
  const _Stars({required this.stars});
  final int stars;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < 3; i++)
          Icon(
            i < stars ? Icons.star_rounded : Icons.star_outline_rounded,
            size: 15,
            color: Colors.white,
          ),
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.cream50,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.inkLine),
      ),
      child: Text(label,
          style: TextStyle(
              fontSize: 10, fontWeight: FontWeight.w900, color: color, letterSpacing: 1)),
    );
  }
}
