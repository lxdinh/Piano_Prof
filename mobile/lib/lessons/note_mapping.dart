import 'dart:ui';

/// Maps lesson note names to MIDI numbers, LED indices, pitch classes, and the
/// lesson colors to RGB. The LED strip covers 5 octaves (60 LEDs); we anchor
/// LED 0 at C2 (MIDI 36) so middle-C (C4 = 60) lands mid-strip.
class NoteMapping {
  NoteMapping._();

  static const int ledBaseMidi = 36; // C2
  static const int ledCount = 60;

  static const _pitchClass = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
  };

  /// Parse e.g. "C4", "Gb4", "D#5" → MIDI number, or null if unparseable.
  static int? toMidi(String note) {
    if (note.isEmpty) return null;
    final letter = note[0].toUpperCase();
    final base = _pitchClass[letter];
    if (base == null) return null;
    var i = 1;
    var accidental = 0;
    if (i < note.length && (note[i] == 'b' || note[i] == '#')) {
      accidental = note[i] == 'b' ? -1 : 1;
      i++;
    }
    final octave = int.tryParse(note.substring(i));
    if (octave == null) return null;
    return (octave + 1) * 12 + base + accidental;
  }

  /// MIDI → LED index on the 60-LED strip (clamped), or null if off-strip.
  static int? toLedIndex(String note) {
    final midi = toMidi(note);
    if (midi == null) return null;
    final idx = midi - ledBaseMidi;
    if (idx < 0 || idx >= ledCount) return null;
    return idx;
  }

  /// "C4" → "C", "Gb4" → "Gb" (pitch class label for the on-screen piano).
  static String pitchClass(String note) {
    if (note.isEmpty) return note;
    var pc = note[0].toUpperCase();
    if (note.length > 1 && (note[1] == 'b' || note[1] == '#')) {
      pc += note[1];
    }
    return pc;
  }

  /// White-key pitch-class letter for highlighting the on-screen octave piano
  /// (sharps/flats fold onto their natural for the simple 8-key view).
  static String whiteKeyOf(String note) => note.isEmpty ? note : note[0].toUpperCase();

  // ---- hand → color (left = cyan/blue, right = orange) ------------------
  static const String leftHandColor = 'cyan';
  static const String rightHandColor = 'orange';

  /// Middle C. In [Hand.auto], notes strictly below this are the left hand.
  static const int middleC = 60; // C4

  /// True for the five black keys in any octave (C#, D#, F#, G#, A#).
  static bool isBlackKey(int midi) => const {1, 3, 6, 8, 10}.contains(midi % 12);

  // ---- sung solfège (fixed-do, anchored to C) --------------------------
  /// Syllable clips are synthesized once near this reference pitch; the audio
  /// engine pitch-shifts each to the note actually played.
  static const int solfegeRefMidi = 60; // C4

  static const Map<int, String> _solfege = {
    0: 'do', 2: 're', 4: 'mi', 5: 'fa', 7: 'sol', 9: 'la', 11: 'ti',
  };

  /// Phonetic spelling so a TTS voice pronounces the syllables as solfège
  /// ("Mi" → "Mee", not "my"; "Re" → "Ray"; "Ti" → "Tee").
  static const Map<String, String> solfegeSpoken = {
    'do': 'Doh',
    're': 'Ray',
    'mi': 'Mee',
    'fa': 'Fah',
    'sol': 'Soh',
    'la': 'Lah',
    'ti': 'Tee',
  };

  /// "do".."ti" for a diatonic note (C major), or null for a chromatic note.
  static String? solfegeSyllable(int midi) => _solfege[midi % 12];

  static const Map<String, Color> _colors = {
    'cyan': Color(0xFF00F0FF),
    'green': Color(0xFF58CC02),
    'magenta': Color(0xFFD600FF),
    'yellow': Color(0xFFFFC800),
    'orange': Color(0xFFFF9600),
    'brand': Color(0xFF58CC02),
  };

  static Color color(String name) => _colors[name] ?? const Color(0xFF58CC02);

  static (int r, int g, int b) rgb(String name) {
    final c = color(name);
    return ((c.r * 255).round(), (c.g * 255).round(), (c.b * 255).round());
  }
}
