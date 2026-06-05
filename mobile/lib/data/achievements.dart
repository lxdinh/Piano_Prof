import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// What a badge measures. Kept as an enum so evaluation is a pure function of
/// the user's running totals (testable, and identical client/server).
enum AchievementMetric { lessons, perfectLessons, songs, streak, xp }

/// A single-tier achievement definition (Duolingo-style badge). Defined in Dart
/// for v1 — mirrors `achievementsCatalog/{id}` in SCHEMA.md for a later move to
/// remote config.
class AchievementDef {
  const AchievementDef({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
    required this.metric,
    required this.threshold,
  });

  final String id;
  final String title;
  final String description;
  final IconData icon;
  final Color color;
  final AchievementMetric metric;
  final int threshold;
}

/// The learner's running totals that badges are evaluated against.
class AchievementStats {
  const AchievementStats({
    required this.lessons,
    required this.perfectLessons,
    required this.songs,
    required this.streak,
    required this.xp,
  });

  final int lessons;
  final int perfectLessons;
  final int songs;
  final int streak;
  final int xp;

  int valueFor(AchievementMetric m) => switch (m) {
        AchievementMetric.lessons => lessons,
        AchievementMetric.perfectLessons => perfectLessons,
        AchievementMetric.songs => songs,
        AchievementMetric.streak => streak,
        AchievementMetric.xp => xp,
      };
}

/// A badge plus the learner's current progress toward it.
class AchievementStatus {
  const AchievementStatus({required this.def, required this.current});
  final AchievementDef def;
  final int current;

  bool get unlocked => current >= def.threshold;
  double get progress =>
      def.threshold <= 0 ? 1 : (current / def.threshold).clamp(0.0, 1.0);
}

/// The badge catalog. Ordered roughly by how soon a new learner reaches them.
const List<AchievementDef> kAchievements = [
  AchievementDef(
    id: 'first_steps',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: Icons.school,
    color: AppColors.brand,
    metric: AchievementMetric.lessons,
    threshold: 1,
  ),
  AchievementDef(
    id: 'getting_started',
    title: 'Getting Started',
    description: 'Complete 5 lessons',
    icon: Icons.auto_stories,
    color: AppColors.sky,
    metric: AchievementMetric.lessons,
    threshold: 5,
  ),
  AchievementDef(
    id: 'dedicated',
    title: 'Dedicated',
    description: 'Complete 10 lessons',
    icon: Icons.workspace_premium,
    color: AppColors.butter,
    metric: AchievementMetric.lessons,
    threshold: 10,
  ),
  AchievementDef(
    id: 'on_fire',
    title: 'On Fire',
    description: 'Reach a 3-day streak',
    icon: Icons.local_fire_department,
    color: Color(0xFFFF7A1C),
    metric: AchievementMetric.streak,
    threshold: 3,
  ),
  AchievementDef(
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Reach a 7-day streak',
    icon: Icons.whatshot,
    color: AppColors.rust,
    metric: AchievementMetric.streak,
    threshold: 7,
  ),
  AchievementDef(
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Earn 3 stars on 5 lessons',
    icon: Icons.star_rounded,
    color: AppColors.butter,
    metric: AchievementMetric.perfectLessons,
    threshold: 5,
  ),
  AchievementDef(
    id: 'songbird',
    title: 'Songbird',
    description: 'Learn 5 songs',
    icon: Icons.music_note,
    color: AppColors.plum,
    metric: AchievementMetric.songs,
    threshold: 5,
  ),
  AchievementDef(
    id: 'virtuoso',
    title: 'Virtuoso',
    description: 'Earn 250 XP',
    icon: Icons.bolt,
    color: AppColors.coral,
    metric: AchievementMetric.xp,
    threshold: 250,
  ),
];

/// Evaluate every badge against the learner's totals (pure).
List<AchievementStatus> evaluateAchievements(AchievementStats stats) => [
      for (final def in kAchievements)
        AchievementStatus(def: def, current: stats.valueFor(def.metric)),
    ];

/// Ids of badges newly crossed when totals go from [before] to [after] — drives
/// the unlock toast.
Set<String> newlyUnlocked(AchievementStats before, AchievementStats after) => {
      for (final def in kAchievements)
        if (before.valueFor(def.metric) < def.threshold &&
            after.valueFor(def.metric) >= def.threshold)
          def.id,
    };
