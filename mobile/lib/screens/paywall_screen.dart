import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../billing/subscription_controller.dart';
import '../billing/subscription_plans.dart';
import '../services/analytics_service.dart';
import '../theme/app_theme.dart';
import '../widgets/chunky_button.dart';
import '../widgets/mascot_image.dart';
import '../widgets/pp_card.dart';

/// Subscription paywall — Duolingo-style tiers with regional pricing pulled
/// from [subscriptionPlans]. Region selector demonstrates the price brackets.
/// Purchases are mocked (real flow = store + RevenueCat webhook → entitlement).
class PaywallScreen extends StatefulWidget {
  const PaywallScreen({super.key, this.region = 'US'});
  final String region;

  @override
  State<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends State<PaywallScreen> {
  late String _region = widget.region;
  static const _regions = {'US': '🇺🇸 US', 'JP': '🇯🇵 JP', 'IN': '🇮🇳 IN', 'BR': '🇧🇷 BR'};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<AnalyticsService>().paywallView('paywall_screen');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cream50,
      appBar: AppBar(
        backgroundColor: AppColors.cream50,
        elevation: 0,
        foregroundColor: AppColors.ink900,
        title: const Text('Go Premium',
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            Center(child: MascotImage(mood: 'trophy', size: 96)),
            const SizedBox(height: 8),
            Center(child: Text('Unlock your full potential', style: AppTheme.h2)),
            const SizedBox(height: 6),
            Center(
              child: Text('Unlimited hearts, OMR uploads, and AI feedback.',
                  textAlign: TextAlign.center, style: AppTheme.subtitle),
            ),
            const SizedBox(height: 16),
            // region selector → shows the regional price brackets
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (final entry in _regions.entries) ...[
                  _regionChip(entry.key, entry.value),
                  const SizedBox(width: 6),
                ],
              ],
            ),
            const SizedBox(height: 16),
            for (final plan in subscriptionPlans) _planCard(plan),
            const SizedBox(height: 8),
            Center(
              child: TextButton(
                onPressed: () {
                  context.read<SubscriptionController>().restore();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Nothing to restore (mock).')),
                  );
                },
                child: const Text('Restore purchases',
                    style: TextStyle(
                        color: AppColors.ink500, fontWeight: FontWeight.w800)),
              ),
            ),
            Center(
              child: Text('Mock checkout · real billing via the App Store / Play.',
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink300)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _regionChip(String code, String label) {
    final on = _region == code;
    return GestureDetector(
      onTap: () => setState(() => _region = code),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: on ? AppColors.ink900 : AppColors.cardBg,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.inkLine, width: 1.5),
        ),
        child: Text(label,
            style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: on ? Colors.white : AppColors.ink700)),
      ),
    );
  }

  Widget _planCard(SubPlan plan) {
    final isMax = plan.tier == 'max';
    final price = plan.priceFor(_region);
    final title = '${plan.tier == 'max' ? 'Max' : 'Super'} · ${plan.interval}';
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: PpCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(isMax ? Icons.workspace_premium : Icons.star,
                    color: isMax ? AppColors.plum : AppColors.butter, size: 22),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(title,
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w900)),
                ),
                Text(price.display,
                    style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: AppColors.brandDeep)),
              ],
            ),
            if (plan.trialDays > 0)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text('${plan.trialDays}-day free trial',
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: AppColors.rust)),
              ),
            const SizedBox(height: 10),
            for (final f in plan.features)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: AppColors.brand, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                        child: Text(f,
                            style: const TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w700))),
                  ],
                ),
              ),
            const SizedBox(height: 12),
            ChunkyButton(
              label: plan.trialDays > 0 ? 'Start free trial' : 'Subscribe',
              expand: true,
              color: isMax ? AppColors.plum : AppColors.brand,
              shadowColor: isMax ? AppColors.plumD : AppColors.brandDark,
              onPressed: () {
                context.read<AnalyticsService>().subscribe(plan.tier, mock: true);
                context.read<SubscriptionController>().mockSubscribe(plan.tier);
                Navigator.of(context).maybePop();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('You are now ${plan.tier.toUpperCase()}! (mock)')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
