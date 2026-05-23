import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/models/user_profile.dart';
import '../data/user_repository.dart';
import '../lessons/lesson_data.dart';
import '../lessons/lesson_models.dart';
import '../theme/app_theme.dart';
import '../widgets/chunky_button.dart';
import '../widgets/mascot_image.dart';
import '../widgets/stat_pill.dart';
import 'ble_connect_screen.dart';
import 'lesson_screen.dart';

/// Home — the Duolingo-style lesson path. Header stat pills are live from
/// Firestore (`watchProfile`); lesson completion drives node state.
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
            _Header(repo: repo),
            Expanded(
              child: StreamBuilder<Set<String>>(
                stream: repo.watchCompletedLessonIds(),
                builder: (context, snap) {
                  final completed = snap.data ?? const <String>{};
                  return _PathList(completed: completed);
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
  const _Header({required this.repo});
  final UserRepository repo;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 10, 12, 12),
      decoration: const BoxDecoration(
        color: AppColors.cardBg,
        border: Border(bottom: BorderSide(color: AppColors.inkLine, width: 1.5)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            clipBehavior: Clip.antiAlias,
            decoration:
                const BoxDecoration(shape: BoxShape.circle, color: AppColors.cream200),
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
          StreamBuilder<UserProfile?>(
            stream: repo.watchProfile(),
            builder: (context, snap) {
              final p = snap.data;
              return Row(
                children: [
                  StatPill(
                      icon: Icons.local_fire_department,
                      value: '${p?.streakCount ?? 0}',
                      color: const Color(0xFFFF7A1C)),
                  const SizedBox(width: 6),
                  StatPill(icon: Icons.diamond, value: '${p?.gems ?? 0}', color: AppColors.sky),
                  const SizedBox(width: 6),
                  StatPill(
                      icon: Icons.favorite,
                      value: '${p?.hearts ?? 5}',
                      color: AppColors.heart),
                ],
              );
            },
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
    );
  }
}

class _PathList extends StatelessWidget {
  const _PathList({required this.completed});
  final Set<String> completed;

  @override
  Widget build(BuildContext context) {
    // current = first lesson not yet completed
    String? currentId;
    for (final m in lessonCatalog) {
      if (!completed.contains(m.id)) {
        currentId = m.id;
        break;
      }
    }

    final children = <Widget>[];
    for (final level in levels) {
      children.add(_LevelHeader(level: level));
      for (final m in lessonsForLevel(level.id)) {
        children.add(_LessonNode(
          meta: m,
          done: completed.contains(m.id),
          current: m.id == currentId,
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute<void>(builder: (_) => LessonScreen(lesson: lessonFor(m))),
          ),
        ));
      }
    }
    children.add(const SizedBox(height: 24));
    children.add(Center(
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
    required this.onTap,
  });

  final LessonMeta meta;
  final bool done;
  final bool current;
  final VoidCallback onTap;

  IconData get _icon => switch (meta.kind) {
        LessonKind.song => Icons.music_note,
        LessonKind.exercise => Icons.fitness_center,
        LessonKind.concept => Icons.lightbulb_outline,
      };

  @override
  Widget build(BuildContext context) {
    final bg = done
        ? AppColors.brand
        : current
            ? AppColors.cardBg
            : AppColors.cream100;
    final fg = done ? Colors.white : AppColors.ink900;
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
                  done ? Icons.check : _icon,
                  color: done || current ? Colors.white : AppColors.ink500,
                  size: current ? 22 : 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(meta.title,
                    style: TextStyle(
                        fontSize: current ? 16 : 14,
                        fontWeight: FontWeight.w900,
                        color: fg)),
              ),
              if (current) ChunkyButton(label: 'Start', onPressed: onTap),
            ],
          ),
        ),
      ),
    );
  }
}
