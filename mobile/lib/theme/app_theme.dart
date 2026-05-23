import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Piano Professor design tokens — ported 1:1 from the design prototype's
/// `pp-styles.css` (`:root` custom properties).
class AppColors {
  AppColors._();

  // Surfaces — warm cream paper
  static const cream50 = Color(0xFFFBF5E4);
  static const cream100 = Color(0xFFF5EAD0);
  static const cream200 = Color(0xFFECDDB4);
  static const cream300 = Color(0xFFDFCB97);
  static const cardBg = Color(0xFFFFFAEC); // .pp-card surface

  // Ink — warm brown
  static const ink900 = Color(0xFF2A1D11);
  static const ink700 = Color(0xFF4A3622);
  static const ink500 = Color(0xFF7C6446);
  static const ink300 = Color(0xFFB6A382);
  static const inkLine = Color(0x242A1D11); // rgba(42,29,17,0.14)
  static const inkSoft = Color(0x142A1D11); // rgba(42,29,17,0.08)

  // Brand — Duolingo green
  static const brand = Color(0xFF58CC02);
  static const brandDark = Color(0xFF46A302);
  static const brandDeep = Color(0xFF357A00);
  static const brandSoft = Color(0xFFDCF5BB);

  // Accents (from the mascot palette)
  static const rust = Color(0xFFC2410C);
  static const rustDark = Color(0xFF9A3206);
  static const butter = Color(0xFFF5B800);
  static const butterDark = Color(0xFFC28C00);
  static const sky = Color(0xFF5BB8E3);
  static const skyDark = Color(0xFF3F8FB6);
  static const coral = Color(0xFFFF7A9C);
  static const plum = Color(0xFF8B5CF6);
  static const plumD = Color(0xFF6E40D8);

  // Piano
  static const pianoBlack = Color(0xFF1A1410);
  static const heart = Color(0xFFFF4B4B);
}

class AppTheme {
  AppTheme._();

  /// Nunito text theme (the prototype uses Nunito 900 for headlines).
  static TextTheme _textTheme(TextTheme base) =>
      GoogleFonts.nunitoTextTheme(base).apply(
        bodyColor: AppColors.ink900,
        displayColor: AppColors.ink900,
      );

  static ThemeData get light {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.brand,
        primary: AppColors.brand,
        surface: AppColors.cream50,
        onSurface: AppColors.ink900,
      ),
      scaffoldBackgroundColor: AppColors.cream50,
    );
    return base.copyWith(
      textTheme: _textTheme(base.textTheme),
      splashColor: AppColors.brandSoft,
    );
  }

  // Common text styles used across screens.
  static TextStyle get eyebrow => GoogleFonts.nunito(
        fontSize: 11,
        fontWeight: FontWeight.w900,
        color: AppColors.rust,
        letterSpacing: 2.0,
      );

  static TextStyle get h2 => GoogleFonts.nunito(
        fontSize: 24,
        fontWeight: FontWeight.w900,
        color: AppColors.ink900,
        height: 1.05,
      );

  static TextStyle get subtitle => GoogleFonts.nunito(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: AppColors.ink500,
        height: 1.5,
      );
}
