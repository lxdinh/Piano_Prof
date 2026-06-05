import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

/// One sampled note: the MIDI pitch it was recorded at and its asset path.
class SampleEntry {
  const SampleEntry(this.midi, this.assetPath);
  final int midi;
  final String assetPath;
}

/// A real multi-sampled piano, described by `assets/piano_samples/manifest.json`:
///
/// ```json
/// { "samples": [ {"midi": 36, "file": "C2.ogg"}, {"midi": 39, "file": "Eb2.ogg"}, ... ] }
/// ```
///
/// For any requested note we play the **nearest** recorded sample and the audio
/// engine pitch-shifts it to the exact pitch. If the manifest is absent (no pack
/// dropped in yet) the bank is simply empty and the engine falls back to its
/// built-in synth — so the app always builds and is never silent.
class SampleBank {
  SampleBank._(this._entries);

  /// Sorted by MIDI ascending. Empty when no pack is installed.
  final List<SampleEntry> _entries;

  bool get isLoaded => _entries.isNotEmpty;
  int get count => _entries.length;

  static Future<SampleBank> load({String dir = 'assets/piano_samples'}) async {
    try {
      final raw = await rootBundle.loadString('$dir/manifest.json');
      final data = jsonDecode(raw) as Map<String, dynamic>;
      final list = (data['samples'] as List).cast<dynamic>();
      final entries = <SampleEntry>[];
      for (final item in list) {
        final s = (item as Map).cast<String, dynamic>();
        final midi = (s['midi'] as num).toInt();
        final file = s['file'] as String;
        entries.add(SampleEntry(midi, '$dir/$file'));
      }
      entries.sort((a, b) => a.midi.compareTo(b.midi));
      return SampleBank._(entries);
    } catch (_) {
      return SampleBank._(const []); // no pack installed → synth fallback
    }
  }

  /// The recorded sample closest in pitch to [midi] (or null if empty).
  /// Binary search over the MIDI-sorted entries — O(log n) per note onset.
  SampleEntry? nearest(int midi) {
    final n = _entries.length;
    if (n == 0) return null;
    if (midi <= _entries.first.midi) return _entries.first;
    if (midi >= _entries.last.midi) return _entries.last;
    var lo = 0, hi = n - 1;
    while (lo + 1 < hi) {
      final mid = (lo + hi) >> 1;
      final m = _entries[mid].midi;
      if (m == midi) return _entries[mid];
      if (m < midi) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    final dLo = (midi - _entries[lo].midi).abs();
    final dHi = (_entries[hi].midi - midi).abs();
    return dLo <= dHi ? _entries[lo] : _entries[hi];
  }
}
