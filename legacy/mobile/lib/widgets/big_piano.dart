import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// One-octave on-screen piano (C D E F G A B C). White keys light up when their
/// pitch-class letter is in [litWhites]; optional finger-number hints.
/// Simplified port of the prototype's BigPiano.
class BigPiano extends StatelessWidget {
  const BigPiano({
    super.key,
    this.litWhites = const {},
    this.fingerHints = const {},
    this.height = 150,
  });

  final Set<String> litWhites;
  final Map<String, int> fingerHints;
  final double height;

  static const _whites = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
  static const _blackAfter = [0, 1, 3, 4, 5];

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppColors.pianoBlack,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [BoxShadow(color: Colors.black, offset: Offset(0, 6))],
      ),
      clipBehavior: Clip.antiAlias,
      child: LayoutBuilder(
        builder: (context, c) {
          final keyW = c.maxWidth / 8;
          return Stack(
            fit: StackFit.expand,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [for (var i = 0; i < 8; i++) _whiteKey(i)],
              ),
              for (final i in _blackAfter)
                Positioned(
                  left: (i + 1) * keyW - keyW * 0.28,
                  top: 0,
                  child: Container(
                    width: keyW * 0.56,
                    height: height * 0.6,
                    decoration: const BoxDecoration(
                      color: Color(0xFF1A1410),
                      borderRadius:
                          BorderRadius.vertical(bottom: Radius.circular(4)),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _whiteKey(int i) {
    final letter = _whites[i];
    final lit = litWhites.contains(letter);
    final hint = fingerHints[letter];
    return Expanded(
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: lit
                ? [AppColors.brand, AppColors.cardBg]
                : const [AppColors.cardBg, AppColors.cream200],
          ),
          border: Border.all(color: AppColors.pianoBlack),
        ),
        child: Stack(
          children: [
            if (hint != null)
              Positioned(
                top: 14,
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    width: 22,
                    height: 22,
                    decoration: const BoxDecoration(
                        shape: BoxShape.circle, color: AppColors.rust),
                    alignment: Alignment.center,
                    child: Text('$hint',
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 12)),
                  ),
                ),
              ),
            Positioned(
              bottom: 6,
              left: 0,
              right: 0,
              child: Center(
                child: Text(letter,
                    style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: lit ? AppColors.ink900 : AppColors.ink500)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
