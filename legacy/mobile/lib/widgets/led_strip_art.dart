import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Illustration of the physical LED strip + controller + piano keys.
/// Ports `LedStripArt` from `pp-screens-hardware.jsx`. Pass [ledColors] to
/// drive specific LEDs (e.g. calibration), else a rainbow demo is shown.
class LedStripArt extends StatelessWidget {
  const LedStripArt({
    super.key,
    this.width = 340,
    this.height = 210,
    this.glow = true,
    this.ledColors,
  });

  final double width;
  final double height;
  final bool glow;
  final List<Color>? ledColors;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: CustomPaint(
        painter: _LedStripPainter(glow: glow, ledColors: ledColors),
      ),
    );
  }
}

class _LedStripPainter extends CustomPainter {
  _LedStripPainter({required this.glow, this.ledColors});

  final bool glow;
  final List<Color>? ledColors;

  static const _defaults = [
    AppColors.brand,
    AppColors.sky,
    AppColors.coral,
    AppColors.butter,
    AppColors.rust,
    AppColors.plum,
  ];

  @override
  void paint(Canvas canvas, Size size) {
    // design is authored on a 320x200 grid; scale to the given size.
    final sx = size.width / 320.0;
    final sy = size.height / 200.0;
    Offset p(double x, double y) => Offset(x * sx, y * sy);
    Rect r(double x, double y, double w, double h) =>
        Rect.fromLTWH(x * sx, y * sy, w * sx, h * sy);

    final body = Paint()..color = AppColors.pianoBlack;
    final keyPaint = Paint()..color = AppColors.cardBg;
    final keyStroke = Paint()
      ..color = AppColors.pianoBlack
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.4 * sx;

    // shadow under the assembly
    canvas.drawOval(
      Rect.fromCenter(center: p(160, 190), width: 240 * sx, height: 12 * sy),
      Paint()..color = const Color(0x2E2A1D11),
    );

    // controller block (left)
    canvas.drawRRect(
      RRect.fromRectAndRadius(r(8, 108, 48, 42), Radius.circular(6 * sx)),
      body,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(r(14, 114, 20, 14), Radius.circular(2 * sx)),
      Paint()..color = const Color(0xFF0A0805),
    );
    // green status LED
    canvas.drawCircle(p(46, 120), 3 * sx, Paint()..color = AppColors.brand);

    // LED strip body
    canvas.drawRRect(
      RRect.fromRectAndRadius(r(56, 120, 256, 22), Radius.circular(3 * sx)),
      body,
    );

    // LEDs (32 across the strip)
    final leds = List<Color>.generate(
      32,
      (i) => (ledColors != null && i < ledColors!.length)
          ? ledColors![i]
          : _defaults[i % _defaults.length],
    );
    for (var i = 0; i < 32; i++) {
      final cx = (56 + 6 + i * (244 / 32)) * sx;
      final cy = (120 + 11) * sy;
      final c = leds[i];
      if (glow && c.value != AppColors.pianoBlack.value) {
        canvas.drawCircle(
          Offset(cx, cy),
          12 * sx,
          Paint()..color = c.withOpacity(0.35),
        );
      }
      canvas.drawCircle(Offset(cx, cy), 3 * sx, Paint()..color = c);
      canvas.drawCircle(Offset(cx, cy), 1.4 * sx, Paint()..color = Colors.white);
    }

    // piano keys below (white)
    for (var i = 0; i < 35; i++) {
      final rect = r(56 + i * 7.3, 148, 7, 40);
      canvas.drawRect(rect, keyPaint);
      canvas.drawRect(rect, keyStroke);
    }
    // black keys at the usual pattern positions
    const blackIdx = [
      0, 1, 3, 4, 5, 7, 8, 10, 11, 12, 14, 15, 17, 18, 19,
      21, 22, 24, 25, 26, 28, 29, 31, 32, 33,
    ];
    for (final i in blackIdx) {
      canvas.drawRect(r(56 + i * 7.3 + 5, 148, 4.6, 22), body);
    }
  }

  @override
  bool shouldRepaint(covariant _LedStripPainter old) =>
      old.glow != glow || old.ledColors != ledColors;
}
