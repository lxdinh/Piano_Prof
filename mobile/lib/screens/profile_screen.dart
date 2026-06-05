import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../audio/voice_service.dart';
import '../billing/subscription_controller.dart';
import '../data/achievements.dart';
import '../data/profile_controller.dart';
import '../lessons/lesson_data.dart';
import '../lessons/lesson_models.dart';
import '../services/app_settings.dart';
import '../theme/app_theme.dart';
import '../widgets/chunky_button.dart';
import '../widgets/mascot_image.dart';
import '../widgets/pp_card.dart';
import 'ble_connect_screen.dart';
import 'paywall_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final profile = context.watch<ProfileController>();
    final sub = context.watch<SubscriptionController>();

    return Scaffold(
      backgroundColor: AppColors.cream50,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          children: [
            Row(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  clipBehavior: Clip.antiAlias,
                  decoration: const BoxDecoration(
                      shape: BoxShape.circle, color: AppColors.cream200),
                  child: const MascotImage(mood: 'cheer', size: 64),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(profile.handle,
                        style: const TextStyle(
                            fontSize: 20, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 4),
                    Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: sub.isSubscribed
                            ? AppColors.brandSoft
                            : AppColors.cream200,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                          sub.isSubscribed
                              ? '★ ${sub.tier.toUpperCase()} MEMBER'
                              : 'FREE PLAN',
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              color: sub.isSubscribed
                                  ? AppColors.brandDeep
                                  : AppColors.ink500)),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                _stat('🔥', '${profile.streakCount}', 'STREAK'),
                _stat('⭐', '${profile.totalXp}', 'XP'),
                _stat('💎', '${profile.gems}', 'GEMS'),
                _stat(
                    '❤️',
                    profile.hearts.unlimited ? '∞' : '${profile.hearts.count}',
                    'HEARTS'),
              ],
            ),
            const SizedBox(height: 16),

            if (!sub.isSubscribed)
              PpCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.workspace_premium, color: AppColors.butter),
                        SizedBox(width: 8),
                        Text('Go Premium',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w900)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text('Unlimited hearts, OMR uploads, and AI feedback.',
                        style: AppTheme.subtitle),
                    const SizedBox(height: 12),
                    ChunkyButton(
                      label: 'See plans',
                      expand: true,
                      color: AppColors.butter,
                      shadowColor: AppColors.butterDark,
                      textColor: AppColors.ink900,
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(builder: (_) => const PaywallScreen()),
                      ),
                    ),
                  ],
                ),
              )
            else
              PpCard(
                child: Row(
                  children: [
                    const Icon(Icons.verified, color: AppColors.brand),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text('You are a ${sub.tier.toUpperCase()} member 🎉',
                          style: const TextStyle(
                              fontWeight: FontWeight.w900, fontSize: 14)),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 16),
            _AchievementsSection(profile: profile),
            const SizedBox(height: 16),

            _settingsTile(Icons.bluetooth, 'Piano Lights (LED strip)',
                () => Navigator.of(context).push(
                      MaterialPageRoute<void>(builder: (_) => const BleConnectScreen()),
                    )),
            _settingsTile(Icons.document_scanner, 'OMR scan server', () => _omrServerDialog(context)),
            _settingsTile(Icons.record_voice_over, 'AI Voice (Google Gemini)', () => _voiceDialog(context)),
            _settingsTile(Icons.help_outline, 'Help center', () {}),
            _settingsTile(Icons.privacy_tip_outlined, 'Terms & privacy', () {}),
            const SizedBox(height: 16),
            Center(
              child: Text('Piano Professor v0.8.6 · made with ♥ for slow learners',
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: AppColors.ink300)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stat(String emoji, String value, String label) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.inkLine, width: 1.5),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 2),
            Text(value,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
            Text(label,
                style: TextStyle(
                    fontSize: 8.5,
                    fontWeight: FontWeight.w900,
                    color: AppColors.ink500,
                    letterSpacing: 0.5)),
          ],
        ),
      ),
    );
  }

  void _omrServerDialog(BuildContext context) {
    final settings = context.read<AppSettings>();
    final ctrl = TextEditingController(text: settings.omrServerUrl);
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('OMR scan server'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'URL of your self-hosted oemer server (see backend/omr). '
              'Leave blank to use the offline demo score.',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: ctrl,
              autofocus: true,
              keyboardType: TextInputType.url,
              decoration: const InputDecoration(hintText: 'https://omr.example.com'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              await settings.setOmrServerUrl(ctrl.text);
              if (context.mounted) Navigator.of(context).pop();
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _voiceDialog(BuildContext context) {
    final settings = context.read<AppSettings>();
    final voice = context.read<VoiceService>();
    var voiceName = settings.voiceName;
    if (!VoiceService.voices.containsValue(voiceName)) {
      voiceName = AppSettings.defaultVoiceName;
    }
    var style = settings.voiceStyle;
    if (!VoiceService.styles.containsKey(style)) {
      style = AppSettings.defaultVoiceStyle;
    }
    var speed = settings.voiceSpeed;
    var status = '';
    showDialog<void>(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setLocal) => AlertDialog(
          title: const Text('AI Voice'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('VOICE',
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: AppColors.ink500)),
                DropdownButton<String>(
                  value: voiceName,
                  isExpanded: true,
                  items: [
                    for (final e in VoiceService.voices.entries)
                      DropdownMenuItem(value: e.value, child: Text(e.key)),
                  ],
                  onChanged: (v) => setLocal(() => voiceName = v ?? voiceName),
                ),
                const SizedBox(height: 10),
                const Text('TONE',
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: AppColors.ink500)),
                DropdownButton<String>(
                  value: style,
                  isExpanded: true,
                  items: [
                    for (final e in VoiceService.styles.entries)
                      DropdownMenuItem(value: e.key, child: Text(e.value)),
                  ],
                  onChanged: (v) => setLocal(() => style = v ?? style),
                ),
                const SizedBox(height: 10),
                const Text('SPEED',
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: AppColors.ink500)),
                Row(
                  children: [
                    const Text('0.5×',
                        style: TextStyle(fontSize: 12, color: AppColors.ink500)),
                    Expanded(
                      child: Slider(
                        value: speed,
                        min: 0.5,
                        max: 2.0,
                        divisions: 6,
                        label: '${speed.toStringAsFixed(2)}×',
                        onChanged: (v) => setLocal(() => speed = v),
                      ),
                    ),
                    const Text('2×',
                        style: TextStyle(fontSize: 12, color: AppColors.ink500)),
                  ],
                ),
                if (status.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: Text(status,
                        style: const TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w800)),
                  ),
              ],
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel')),
            TextButton(
              onPressed: () async {
                await settings.setVoiceName(voiceName);
                await settings.setVoiceStyle(style);
                await settings.setVoiceSpeed(speed);
                setLocal(() => status = '🔄 Testing…');
                final err = await voice.test(settings.voiceApiKey, voiceName, style);
                setLocal(() =>
                    status = err ?? '✅ Voice is active.');
                if (err == null) {
                  await Future<void>.delayed(const Duration(milliseconds: 1400));
                  if (context.mounted) Navigator.of(context).pop();
                }
              },
              child: const Text('Save & test'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _settingsTile(IconData icon, String label, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: onTap,
        child: PpCard(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          child: Row(
            children: [
              Icon(icon, color: AppColors.ink700, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(label,
                    style: const TextStyle(
                        fontWeight: FontWeight.w900, fontSize: 14)),
              ),
              const Icon(Icons.chevron_right, color: AppColors.ink300),
            ],
          ),
        ),
      ),
    );
  }
}

/// Badge wall — computed live from the learner's progress (lessons, perfect
/// runs, songs, streak, XP). Works with or without Firebase (demo mode).
class _AchievementsSection extends StatelessWidget {
  const _AchievementsSection({required this.profile});
  final ProfileController profile;

  @override
  Widget build(BuildContext context) {
    final stars = profile.lessonStars;
    final stats = AchievementStats(
      lessons: stars.length,
      perfectLessons: stars.values.where((s) => s >= 3).length,
      songs: stars.keys
          .where((id) => lessonKindFor(id) == LessonKind.song)
          .length,
      streak: profile.longestStreak,
      xp: profile.totalXp,
    );
    final items = evaluateAchievements(stats);
    final unlocked = items.where((a) => a.unlocked).length;

    return PpCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.military_tech, color: AppColors.butter),
              const SizedBox(width: 8),
              const Text('Achievements',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
              const Spacer(),
              Text('$unlocked/${items.length}',
                  style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      color: AppColors.ink500)),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 12,
            children: [for (final a in items) _Badge(status: a)],
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.status});
  final AchievementStatus status;

  @override
  Widget build(BuildContext context) {
    final def = status.def;
    final on = status.unlocked;
    return SizedBox(
      width: 72,
      child: Column(
        children: [
          Container(
            width: 54,
            height: 54,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: on ? def.color : AppColors.cream200,
              border: Border.all(
                  color: on ? def.color : AppColors.inkLine, width: 2),
            ),
            child: Icon(def.icon,
                color: on ? Colors.white : AppColors.ink300, size: 26),
          ),
          const SizedBox(height: 4),
          Text(def.title,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  height: 1.1,
                  color: on ? AppColors.ink900 : AppColors.ink500)),
          if (!on)
            Text('${status.current}/${def.threshold}',
                style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink300)),
        ],
      ),
    );
  }
}
