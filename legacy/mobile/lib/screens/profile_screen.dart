import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../billing/subscription_controller.dart';
import '../data/models/user_profile.dart';
import '../data/user_repository.dart';
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
    final repo = context.read<UserRepository>();
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
                    const Text('maya_keys',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
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
            StreamBuilder<UserProfile?>(
              stream: repo.watchProfile(),
              builder: (context, snap) {
                final p = snap.data;
                return Row(
                  children: [
                    _stat('🔥', '${p?.streakCount ?? 0}', 'STREAK'),
                    _stat('⭐', '${p?.totalXp ?? 0}', 'XP'),
                    _stat('💎', '${p?.gems ?? 0}', 'GEMS'),
                    _stat('❤️', '${p?.hearts ?? 5}', 'HEARTS'),
                  ],
                );
              },
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

            _settingsTile(Icons.bluetooth, 'Piano Lights (LED strip)',
                () => Navigator.of(context).push(
                      MaterialPageRoute<void>(builder: (_) => const BleConnectScreen()),
                    )),
            _settingsTile(Icons.document_scanner, 'OMR scan server', () => _omrServerDialog(context)),
            _settingsTile(Icons.help_outline, 'Help center', () {}),
            _settingsTile(Icons.privacy_tip_outlined, 'Terms & privacy', () {}),
            const SizedBox(height: 16),
            Center(
              child: Text('Piano Professor v0.3.0 · made with ♥ for slow learners',
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
