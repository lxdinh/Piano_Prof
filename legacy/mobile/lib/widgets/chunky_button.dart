import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Duolingo-style chunky button with a solid bottom "shadow" that compresses
/// on press. Ports `.btn-chunk` from `pp-styles.css`.
class ChunkyButton extends StatefulWidget {
  const ChunkyButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.color = AppColors.brand,
    this.shadowColor = AppColors.brandDark,
    this.textColor = Colors.white,
    this.large = false,
    this.expand = false,
    this.icon,
    this.ghost = false,
    this.enabled = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final Color color;
  final Color shadowColor;
  final Color textColor;
  final bool large;
  final bool expand;
  final IconData? icon;
  final bool ghost;
  final bool enabled;

  @override
  State<ChunkyButton> createState() => _ChunkyButtonState();
}

class _ChunkyButtonState extends State<ChunkyButton> {
  bool _down = false;

  bool get _interactive => widget.enabled && widget.onPressed != null;

  @override
  Widget build(BuildContext context) {
    final depth = widget.large ? 6.0 : 5.0;
    final bg = widget.ghost ? Colors.transparent : widget.color;
    final fg = widget.ghost ? AppColors.ink500 : widget.textColor;
    final shadow = widget.ghost ? AppColors.inkLine : widget.shadowColor;
    final pressed = _down && _interactive;

    final child = Container(
      padding: EdgeInsets.symmetric(
        horizontal: widget.large ? 26 : 22,
        vertical: widget.large ? 18 : 14,
      ),
      decoration: BoxDecoration(
        color: _interactive ? bg : bg.withOpacity(0.5),
        borderRadius: BorderRadius.circular(widget.large ? 20 : 16),
        border: widget.ghost
            ? Border.all(color: AppColors.inkLine, width: 2)
            : null,
        boxShadow: pressed
            ? [BoxShadow(color: shadow, offset: const Offset(0, 2))]
            : [BoxShadow(color: shadow, offset: Offset(0, depth))],
      ),
      child: Row(
        mainAxisSize: widget.expand ? MainAxisSize.max : MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (widget.icon != null) ...[
            Icon(widget.icon, color: fg, size: 18),
            const SizedBox(width: 8),
          ],
          Text(
            widget.label.toUpperCase(),
            style: TextStyle(
              color: fg,
              fontWeight: FontWeight.w900,
              fontSize: widget.large ? 17 : 15,
              letterSpacing: 0.6,
            ),
          ),
        ],
      ),
    );

    return GestureDetector(
      onTapDown: _interactive ? (_) => setState(() => _down = true) : null,
      onTapCancel: _interactive ? () => setState(() => _down = false) : null,
      onTapUp: _interactive ? (_) => setState(() => _down = false) : null,
      onTap: _interactive ? widget.onPressed : null,
      child: AnimatedSlide(
        duration: const Duration(milliseconds: 80),
        offset: pressed ? const Offset(0, 0.06) : Offset.zero,
        child: child,
      ),
    );
  }
}
