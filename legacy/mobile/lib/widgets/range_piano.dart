import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// A multi-octave keyboard (for songs / two-hand playback). Lights the exact
/// MIDI notes in [litMidis]. Default range C2 (36) … C6 (84).
class RangePiano extends StatelessWidget {
  const RangePiano({
    super.key,
    this.lowMidi = 36,
    this.highMidi = 84,
    this.litMidis = const {},
    this.height = 96,
  });

  final int lowMidi;
  final int highMidi;
  final Set<int> litMidis;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppColors.pianoBlack,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [BoxShadow(color: Colors.black, offset: Offset(0, 5))],
      ),
      clipBehavior: Clip.antiAlias,
      child: CustomPaint(
        painter: _RangePainter(lowMidi: lowMidi, highMidi: highMidi, lit: litMidis),
        size: Size.infinite,
      ),
    );
  }
}

class _RangePainter extends CustomPainter {
  _RangePainter({required this.lowMidi, required this.highMidi, required this.lit});
  final int lowMidi;
  final int highMidi;
  final Set<int> lit;

  static bool _isBlack(int midi) => const {1, 3, 6, 8, 10}.contains(midi % 12);

  @override
  void paint(Canvas canvas, Size size) {
    final whites = <int>[];
    for (var m = lowMidi; m <= highMidi; m++) {
      if (!_isBlack(m)) whites.add(m);
    }
    if (whites.isEmpty) return;

    final ww = size.width / whites.length;
    final blackW = ww * 0.62;
    final blackH = size.height * 0.62;

    final cream = Paint()..color = AppColors.cardBg;
    final green = Paint()..color = AppColors.brand;
    final stroke = Paint()
      ..color = AppColors.pianoBlack
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.6;
    final black = Paint()..color = AppColors.pianoBlack;
    final blackLit = Paint()..color = AppColors.brand;

    // white keys
    for (var i = 0; i < whites.length; i++) {
      final r = Rect.fromLTWH(i * ww, 0, ww - 0.5, size.height);
      canvas.drawRect(r, lit.contains(whites[i]) ? green : cream);
      canvas.drawRect(r, stroke);
    }

    // black keys (sit between the white below and above)
    final indexOfWhite = {for (var i = 0; i < whites.length; i++) whites[i]: i};
    for (var m = lowMidi; m <= highMidi; m++) {
      if (!_isBlack(m)) continue;
      final leftWhite = indexOfWhite[m - 1];
      if (leftWhite == null) continue;
      final x = (leftWhite + 1) * ww - blackW / 2;
      canvas.drawRect(
        Rect.fromLTWH(x, 0, blackW, blackH),
        lit.contains(m) ? blackLit : black,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _RangePainter old) =>
      old.lit != lit || old.lowMidi != lowMidi || old.highMidi != highMidi;
}
