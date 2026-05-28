import 'package:flutter/material.dart';

/// "Maestro Penguini" sticker. Renders one of the bundled mood PNGs
/// (assets/mascots/<mood>.png). Falls back gracefully if an asset is missing.
class MascotImage extends StatelessWidget {
  const MascotImage({super.key, this.mood = 'teach', this.size = 96});

  final String mood;
  final double size;

  static const _available = {
    'teach', 'cheer', 'trophy', 'confused', 'nervous', 'wow', 'conduct',
  };

  @override
  Widget build(BuildContext context) {
    final name = _available.contains(mood) ? mood : 'teach';
    return Image.asset(
      'assets/mascots/$name.png',
      width: size,
      fit: BoxFit.contain,
      errorBuilder: (_, __, ___) => SizedBox(
        width: size,
        height: size,
        child: const Icon(Icons.music_note, color: Colors.white),
      ),
    );
  }
}
