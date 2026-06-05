import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../lessons/note_mapping.dart';
import '../theme/app_theme.dart';

/// A 5-octave on-screen piano (default C2–B6, so middle C / C4 is included and
/// labelled) with a **glowing LED dot row on top** — one dot per key, mirroring
/// the physical LED strip (dark when idle; lit dots glow in the note's color,
/// cyan = left hand, orange = right hand). Highlights the exact MIDI notes from
/// [litColors] and is **interactive** — touching a key fires [onDown] / [onUp]
/// (multi-touch chords + sliding). Every C is labelled; C4 is "Middle C".
class PpKeyboard extends StatefulWidget {
  const PpKeyboard({
    super.key,
    this.lowMidi = 36, // C2
    this.highMidi = 95, // B6  → 5 octaves, includes C4 (60)
    this.litColors = const {},
    this.height = 160,
    this.onDown,
    this.onUp,
  });

  final int lowMidi;
  final int highMidi;
  final Map<int, String> litColors;
  final double height;
  final void Function(int midi)? onDown;
  final void Function(int midi)? onUp;

  /// Height of the LED dot strip above the keys.
  static const double ledStripH = 18;

  @override
  State<PpKeyboard> createState() => _PpKeyboardState();
}

class _PpKeyboardState extends State<PpKeyboard> {
  final Map<int, int> _pointerMidi = {}; // pointer id -> midi
  final Set<int> _pressed = {}; // midis currently held by touch

  List<int> get _whites {
    final w = <int>[];
    for (var m = widget.lowMidi; m <= widget.highMidi; m++) {
      if (!NoteMapping.isBlackKey(m)) w.add(m);
    }
    return w;
  }

  int? _midiAt(Offset pos, Size size) {
    final whites = _whites;
    if (whites.isEmpty) return null;
    final ww = size.width / whites.length;
    const keyTop = PpKeyboard.ledStripH;
    final keyH = size.height - keyTop;
    final blackH = keyH * 0.62;
    final blackW = ww * 0.62;
    final indexOfWhite = {for (var i = 0; i < whites.length; i++) whites[i]: i};

    // Black keys sit on top in the upper portion (just below the LED strip).
    if (pos.dy >= keyTop && pos.dy <= keyTop + blackH) {
      for (var m = widget.lowMidi; m <= widget.highMidi; m++) {
        if (!NoteMapping.isBlackKey(m)) continue;
        final lw = indexOfWhite[m - 1];
        if (lw == null) continue;
        final cx = (lw + 1) * ww;
        final rect = Rect.fromLTWH(cx - blackW / 2, keyTop, blackW, blackH);
        if (rect.contains(pos)) return m;
      }
    }
    final i = (pos.dx / ww).floor().clamp(0, whites.length - 1);
    return whites[i];
  }

  void _down(PointerDownEvent e, Size size) {
    final m = _midiAt(e.localPosition, size);
    if (m == null) return;
    _pointerMidi[e.pointer] = m;
    setState(() => _pressed.add(m));
    widget.onDown?.call(m);
  }

  void _up(int pointer) {
    final m = _pointerMidi.remove(pointer);
    if (m == null) return;
    setState(() => _pressed.remove(m));
    widget.onUp?.call(m);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: widget.height,
      decoration: BoxDecoration(
        color: AppColors.pianoBlack,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [BoxShadow(color: Colors.black, offset: Offset(0, 6))],
      ),
      clipBehavior: Clip.antiAlias,
      child: LayoutBuilder(
        builder: (context, c) {
          final size = Size(c.maxWidth, c.maxHeight);
          return Listener(
            behavior: HitTestBehavior.opaque,
            onPointerDown: (e) => _down(e, size),
            onPointerUp: (e) => _up(e.pointer),
            onPointerCancel: (e) => _up(e.pointer),
            child: CustomPaint(
              size: size,
              painter: _KeyboardPainter(
                lowMidi: widget.lowMidi,
                highMidi: widget.highMidi,
                litColors: widget.litColors,
                pressed: _pressed,
              ),
            ),
          );
        },
      ),
    );
  }
}

class _KeyboardPainter extends CustomPainter {
  _KeyboardPainter({
    required this.lowMidi,
    required this.highMidi,
    required this.litColors,
    required this.pressed,
  });

  final int lowMidi;
  final int highMidi;
  final Map<int, String> litColors;
  final Set<int> pressed;

  @override
  void paint(Canvas canvas, Size size) {
    final whites = <int>[];
    for (var m = lowMidi; m <= highMidi; m++) {
      if (!NoteMapping.isBlackKey(m)) whites.add(m);
    }
    if (whites.isEmpty) return;

    const ledTop = PpKeyboard.ledStripH;
    final ww = size.width / whites.length;
    final keyH = size.height - ledTop;
    final blackW = ww * 0.62;
    final blackH = keyH * 0.62;

    final cream = Paint()..color = AppColors.cardBg;
    final cream2 = Paint()..color = AppColors.cream200;
    final stroke = Paint()
      ..color = AppColors.pianoBlack
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.6;
    final blackKey = Paint()..color = const Color(0xFF1A1410);
    final pressShade = Paint()..color = Colors.black.withValues(alpha: 0.18);
    final indexOfWhite = {for (var i = 0; i < whites.length; i++) whites[i]: i};

    // ---- white keys (offset below the LED strip) ----
    for (var i = 0; i < whites.length; i++) {
      final m = whites[i];
      final lit = litColors[m];
      final isDown = lit != null || pressed.contains(m);
      final r = Rect.fromLTWH(i * ww, ledTop, ww - 0.5, keyH);
      // Lit keys get a soft tint (not a full flood) — the LED dot is the cue.
      if (lit != null) {
        canvas.drawRect(r, cream);
        canvas.drawRect(r, Paint()..color = NoteMapping.color(lit).withValues(alpha: 0.30));
      } else {
        canvas.drawRect(r, cream);
      }
      if (isDown) {
        canvas.drawRect(
            Rect.fromLTWH(i * ww, ledTop, ww - 0.5, keyH * 0.10), pressShade);
        if (lit == null) canvas.drawRect(r, cream2);
      }
      canvas.drawRect(r, stroke);

      if (m % 12 == 0) {
        final octave = (m ~/ 12) - 1;
        final isMiddle = m == NoteMapping.middleC;
        // Just "C4" (C4 is middle C) — highlighted, no extra "Middle C" text.
        _label(canvas, 'C$octave', i * ww, ww, size.height,
            bold: isMiddle, accent: isMiddle);
      }
    }

    // ---- black keys ----
    for (var m = lowMidi; m <= highMidi; m++) {
      if (!NoteMapping.isBlackKey(m)) continue;
      final lw = indexOfWhite[m - 1];
      if (lw == null) continue;
      final x = (lw + 1) * ww - blackW / 2;
      final lit = litColors[m];
      final isDown = lit != null || pressed.contains(m);
      final h = isDown ? blackH - 4 : blackH;
      canvas.drawRect(Rect.fromLTWH(x, ledTop, blackW, h), blackKey);
      if (lit != null) {
        canvas.drawRect(Rect.fromLTWH(x, ledTop, blackW, h),
            Paint()..color = NoteMapping.color(lit).withValues(alpha: 0.55));
      }
    }

    // ---- LED dot strip on top (one dot per key; lit dots glow) ----
    _paintLeds(canvas, size, whites, ww, indexOfWhite, ledTop, blackW);
  }

  void _paintLeds(Canvas canvas, Size size, List<int> whites, double ww,
      Map<int, int> indexOfWhite, double ledTop, double blackW) {
    final cy = ledTop / 2;
    final dim = Paint()..color = const Color(0xFF2A2A2A);
    final radius = (ww * 0.16).clamp(2.0, 5.0);

    void dot(double cx, String? lit) {
      if (lit == null) {
        canvas.drawCircle(Offset(cx, cy), radius * 0.8, dim);
        return;
      }
      final color = NoteMapping.color(lit);
      canvas.drawCircle(
          Offset(cx, cy),
          radius * 2.2,
          Paint()
            ..color = color
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4));
      canvas.drawCircle(Offset(cx, cy), radius, Paint()..color = color);
      canvas.drawCircle(
          Offset(cx, cy), radius * 0.45, Paint()..color = Colors.white);
    }

    // white-key dots (centered over each white key)
    for (var i = 0; i < whites.length; i++) {
      dot(i * ww + ww / 2, litColors[whites[i]]);
    }
    // black-key dots (centered over each black key)
    for (var m = lowMidi; m <= highMidi; m++) {
      if (!NoteMapping.isBlackKey(m)) continue;
      final lw = indexOfWhite[m - 1];
      if (lw == null) continue;
      dot((lw + 1) * ww, litColors[m]);
    }
  }

  void _label(Canvas canvas, String text, double x, double ww, double h,
      {bool bold = false, bool accent = false, bool atBottom = true}) {
    final tp = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          fontSize: bold ? 9.5 : 8.5,
          fontWeight: bold ? FontWeight.w900 : FontWeight.w700,
          color: accent ? AppColors.rust : AppColors.ink500,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout(maxWidth: ww);
    final dx = x + (ww - tp.width) / 2;
    final dy = atBottom ? h - tp.height - 4 : h - tp.height - 16;
    tp.paint(canvas, Offset(dx, dy));
  }

  @override
  bool shouldRepaint(covariant _KeyboardPainter old) =>
      !mapEquals(old.litColors, litColors) ||
      !setEquals(old.pressed, pressed) ||
      old.lowMidi != lowMidi ||
      old.highMidi != highMidi;
}
