import '../lessons/lesson_models.dart';
import 'musicxml.dart';

const _names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const _colors = ['cyan', 'green', 'magenta', 'yellow', 'orange'];

String noteName(int midi) => '${_names[midi % 12]}${(midi ~/ 12) - 1}';

/// Detect the chord implied by a set of MIDI notes (e.g. a whole bar). Tries
/// major/minor triads, preferring the bass note as root; returns a display
/// name + a clean root-position triad (note names in octave 4) to teach/play.
({String name, List<String> notes}) detectChord(List<int> midis) {
  final sorted = [...midis]..sort();
  final pcs = sorted.map((m) => m % 12).toSet();
  final bassPc = sorted.first % 12;
  final candidates = <int>[bassPc, ...pcs.where((p) => p != bassPc)];

  for (final root in candidates) {
    final major = {root, (root + 4) % 12, (root + 7) % 12};
    final minor = {root, (root + 3) % 12, (root + 7) % 12};
    if (pcs.containsAll(major)) {
      final r = 60 + root;
      return (name: '${_names[root]} major', notes: [noteName(r), noteName(r + 4), noteName(r + 7)]);
    }
    if (pcs.containsAll(minor)) {
      final r = 60 + root;
      return (name: '${_names[root]} minor', notes: [noteName(r), noteName(r + 3), noteName(r + 7)]);
    }
  }
  // fallback: assume a major triad on the bass
  final r = 60 + bassPc;
  return (name: '${_names[bassPc]} (approx)', notes: [noteName(r), noteName(r + 4), noteName(r + 7)]);
}

/// The chord per bar, for display on the preview screen.
List<String> barChords(Score score) {
  final out = <String>[];
  for (var b = 0; b < score.barCount; b++) {
    final start = b * score.barLengthBeats;
    final end = start + score.barLengthBeats;
    final inBar = [
      for (final n in score.notes)
        if (n.startBeat >= start - 1e-6 && n.startBeat < end - 1e-6) n.midi,
    ];
    out.add(inBar.isEmpty ? '–' : detectChord(inBar).name);
  }
  return out;
}

/// Turn a timed [Score] into a step-by-step "learn by chords" lesson. Uses bars
/// + time signature; plays in the normal lesson screen (sound + piano + LED).
Lesson lessonFromScore(Score score, {String? id}) {
  final genre = score.genre != null ? ' (${score.genre})' : '';
  final steps = <Step>[
    Step([
      Say('Let us learn "${score.title}"$genre by its chords — not by heart.'),
      const PauseSeg(300),
      Say('It is in ${score.timeSignature} time, ${score.barCount} bars. '
          'Each bar is one chord you already know.'),
    ]),
  ];

  for (var b = 0; b < score.barCount; b++) {
    final start = b * score.barLengthBeats;
    final end = start + score.barLengthBeats;
    final inBar = [
      for (final n in score.notes)
        if (n.startBeat >= start - 1e-6 && n.startBeat < end - 1e-6) n.midi,
    ];
    if (inBar.isEmpty) continue;
    final chord = detectChord(inBar);
    steps.add(Step([
      Say('Bar ${b + 1}: ${chord.name}. Play ${chord.notes.join(', ')}.'),
      Chord(chord.notes, color: _colors[b % _colors.length], waitMs: 1800),
    ]));
  }

  steps.add(Step([
    Say('That is the whole song — just those chords in order.'),
    const PauseSeg(300),
    Say('Now play it through, both hands, slow and steady. You have got it!'),
  ]));

  return Lesson(
    id: id ?? 'omr-song',
    title: score.title,
    complete: 'You learned "${score.title}" by its chords — not by heart! 50 XP!',
    steps: steps,
  );
}
