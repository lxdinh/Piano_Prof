import '../lessons/lesson_models.dart';
import 'musicxml.dart';

const _names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const _colors = ['cyan', 'green', 'magenta', 'yellow', 'orange'];

String _noteName(int midi) => '${_names[midi % 12]}${(midi ~/ 12) - 1}';

/// Name a chord from its pitch classes using major/minor triad templates.
/// Falls back to a generic description for richer/unknown voicings.
String detectChord(List<int> midis) {
  final pcs = midis.map((m) => m % 12).toSet();
  if (pcs.length == 1) return '${_names[pcs.first]} (single note)';
  for (final root in pcs) {
    final major = {root % 12, (root + 4) % 12, (root + 7) % 12};
    final minor = {root % 12, (root + 3) % 12, (root + 7) % 12};
    if (pcs.length == 3 && pcs.containsAll(major)) return '${_names[root]} major';
    if (pcs.length == 3 && pcs.containsAll(minor)) return '${_names[root]} minor';
  }
  return 'a ${pcs.length}-note chord';
}

/// Turn a parsed [Score] into a step-by-step lesson that teaches the song by
/// its chords (the "don't learn by heart" approach). Each distinct moment
/// becomes a teaching step; this plays in the normal LessonScreen, so it also
/// lights the on-screen piano + the LED strip and records completion.
Lesson lessonFromScore(Score score, {String? id}) {
  final steps = <Step>[
    Step([
      Say('Let us learn "${score.title}" the smart way — by chords, not by heart.'),
      const PauseSeg(300),
      Say('It is just ${score.events.where((e) => !e.isRest).length} moments. '
          'Each one is a chord you already know.'),
    ]),
  ];

  var n = 1;
  String? lastChordName;
  for (final e in score.events) {
    if (e.isRest) continue;
    final notes = (e.midiNotes.toList()..sort()).map(_noteName).toList();
    final chord = detectChord(e.midiNotes);
    final repeat = chord == lastChordName ? ' (again)' : '';
    lastChordName = chord;
    steps.add(Step([
      Say('Part $n: $chord$repeat. Play ${notes.join(', ')}.'),
      Chord(notes, color: _colors[(n - 1) % _colors.length], waitMs: 1800),
    ]));
    n++;
  }

  steps.add(Step([
    Say('That is the whole song — just those chords in order.'),
    const PauseSeg(300),
    Say('Now play it through, slow and steady. You have got it!'),
  ]));

  return Lesson(
    id: id ?? 'omr-song',
    title: score.title,
    complete: 'You learned "${score.title}" by its chords — not by heart! 50 XP!',
    steps: steps,
  );
}
