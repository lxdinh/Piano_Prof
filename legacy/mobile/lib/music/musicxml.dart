import 'dart:math';

import 'package:xml/xml.dart';

/// A note with an absolute position in the score (in quarter-note "beats").
/// `staff` 1 = right hand (treble), 2 = left hand (bass).
class TimedNote {
  const TimedNote({
    required this.midi,
    required this.startBeat,
    required this.beats,
    required this.staff,
  });
  final int midi;
  final double startBeat;
  final double beats;
  final int staff;
  double get endBeat => startBeat + beats;
}

/// A parsed score with timing + metadata, faithful to two-hand sheet music.
class Score {
  Score({
    required this.title,
    this.genre,
    required this.beatsPerBar,
    required this.beatType,
    required this.tempoBpm,
    required this.notes,
  });

  final String title;
  final String? genre;
  final int beatsPerBar; // numerator of the time signature
  final int beatType; // denominator (4 = quarter, 8 = eighth …)
  final double tempoBpm; // quarter-note BPM
  final List<TimedNote> notes; // sorted by startBeat

  String get timeSignature => '$beatsPerBar/$beatType';
  double get barLengthBeats => beatsPerBar * 4.0 / beatType; // in quarter-beats
  double get totalBeats =>
      notes.isEmpty ? 0 : notes.map((n) => n.endBeat).reduce(max);
  int get barCount =>
      barLengthBeats <= 0 ? 0 : (totalBeats / barLengthBeats).ceil();
  bool get isEmpty => notes.isEmpty;

  /// MIDI notes sounding at a given beat (start ≤ beat < end).
  List<int> notesSoundingAt(double beat) => [
        for (final n in notes)
          if (beat >= n.startBeat && beat < n.endBeat) n.midi,
      ];
}

const _stepToSemitone = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11};
int _midiOf(String step, int alter, int octave) =>
    (octave + 1) * 12 + (_stepToSemitone[step] ?? 0) + alter;

int _intText(XmlElement parent, String tag, int fallback) {
  final e = parent.findElements(tag);
  if (e.isEmpty) return fallback;
  return int.tryParse(e.first.innerText.trim()) ?? fallback;
}

/// Parse partwise MusicXML into a timed [Score]. Handles `<divisions>`,
/// `<time>`, multiple staves/voices, `<chord/>`, `<rest/>`, and `<backup>`/
/// `<forward>` so the two hands line up at the right moments.
Score parseMusicXml(String xmlString, {String title = 'Song'}) {
  final doc = XmlDocument.parse(xmlString);

  var resolvedTitle = title;
  final wt = doc.findAllElements('work-title');
  if (wt.isNotEmpty && wt.first.innerText.trim().isNotEmpty) {
    resolvedTitle = wt.first.innerText.trim();
  }
  String? genre;
  final mt = doc.findAllElements('movement-title');
  if (mt.isNotEmpty && mt.first.innerText.trim().isNotEmpty) {
    genre = mt.first.innerText.trim();
  }
  var tempo = 90.0;
  for (final s in doc.findAllElements('sound')) {
    final t = s.getAttribute('tempo');
    if (t != null) {
      tempo = double.tryParse(t) ?? tempo;
      break;
    }
  }

  var divisions = 1, beats = 4, beatType = 4;
  final notes = <TimedNote>[];

  for (final part in doc.findAllElements('part')) {
    var cursor = 0; // ticks, absolute within this part
    var lastStart = 0; // start tick of the last non-chord note (for chords)
    for (final measure in part.findElements('measure')) {
      for (final el in measure.childElements) {
        switch (el.name.local) {
          case 'attributes':
            divisions = _intText(el, 'divisions', divisions);
            final time = el.findElements('time');
            if (time.isNotEmpty) {
              beats = _intText(time.first, 'beats', beats);
              beatType = _intText(time.first, 'beat-type', beatType);
            }
          case 'note':
            final isChord = el.findElements('chord').isNotEmpty;
            final isRest = el.findElements('rest').isNotEmpty;
            final d = _intText(el, 'duration', 0);
            final staff = _intText(el, 'staff', 1);
            final start = isChord ? lastStart : cursor;
            final pitchEls = el.findElements('pitch');
            if (!isRest && pitchEls.isNotEmpty && divisions > 0) {
              final p = pitchEls.first;
              final stepEls = p.findElements('step');
              final step = stepEls.isNotEmpty ? stepEls.first.innerText.trim() : 'C';
              notes.add(TimedNote(
                midi: _midiOf(step, _intText(p, 'alter', 0), _intText(p, 'octave', 4)),
                startBeat: start / divisions,
                beats: d / divisions,
                staff: staff,
              ));
            }
            if (!isChord) {
              lastStart = cursor;
              cursor += d;
            }
          case 'backup':
            cursor -= _intText(el, 'duration', 0);
            if (cursor < 0) cursor = 0;
          case 'forward':
            cursor += _intText(el, 'duration', 0);
        }
      }
    }
  }

  notes.sort((a, b) => a.startBeat.compareTo(b.startBeat));
  return Score(
    title: resolvedTitle,
    genre: genre,
    beatsPerBar: beats,
    beatType: beatType,
    tempoBpm: tempo,
    notes: notes,
  );
}
