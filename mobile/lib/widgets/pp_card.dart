import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Cream card with hairline border + soft bottom shadow. Ports `.pp-card`.
class PpCard extends StatelessWidget {
  const PpCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.fromLTRB(16, 14, 16, 14),
    this.radius = 22,
  });

  final Widget child;
  final EdgeInsets padding;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: AppColors.inkLine, width: 1.5),
        boxShadow: const [
          BoxShadow(color: AppColors.inkSoft, offset: Offset(0, 3)),
        ],
      ),
      child: child,
    );
  }
}
