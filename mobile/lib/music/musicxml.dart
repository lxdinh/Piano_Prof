import 'package:xml/xml.dart';

/// One playable moment in a score: the notes sounding together and how long
/// they last (in beats). An empty [midiNotes] is a rest.
class MusicEvent {
  MusicEvent(this.midiNotes, this.beats);
  final List<int> midiNotes; // MIDI numbers sounding together (a chord)
  final double beats;
  bool get isRest => midiNotes.isEmpty;
}

/// A parsed score: an ordered list of events.
class Score {
  Score({required this.title, required this.events});
  final String title;
  final List<MusicEvent> events;
}

const _stepToSemitone = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11};

int _midi(String step, int alter, int octave) =>
    (octave + 1) * 12 + (_stepToSemitone[step] ?? 0) + alter;

String? _text(XmlElement parent, String tag) {
  final els = parent.findElements(tag);
  return els.isEmpty ? null : els.first.innerText.trim();
}

/// Parse a (subset of) MusicXML partwise into a [Score]. Handles pitch
/// step/alter/octave, duration, <chord/> (simultaneous notes), and rests.
Score parseMusicXml(String xmlString, {String title = 'Song'}) {
  final doc = XmlDocument.parse(xmlString);

  // Title: prefer work-title, else the provided fallback.
  var resolvedTitle = title;
  final titleEls = doc.findAllElements('work-title');
  if (titleEls.isNotEmpty && titleEls.first.innerText.trim().isNotEmpty) {
    resolvedTitle = titleEls.first.innerText.trim();
  }

  // Divisions = ticks per quarter note (read first so beats are correct).
  var divisions = 1;
  final divEls = doc.findAllElements('divisions');
  if (divEls.isNotEmpty) {
    divisions = int.tryParse(divEls.first.innerText.trim()) ?? 1;
  }
  if (divisions <= 0) divisions = 1;

  final events = <MusicEvent>[];
  for (final note in doc.findAllElements('note')) {
    final isChord = note.findElements('chord').isNotEmpty;
    final isRest = note.findElements('rest').isNotEmpty;
    final ticks = int.tryParse(_text(note, 'duration') ?? '') ?? divisions;
    final beats = ticks / divisions;

    if (isRest) {
      events.add(MusicEvent([], beats));
      continue;
    }
    final pitchEls = note.findElements('pitch');
    if (pitchEls.isEmpty) continue;
    final pitch = pitchEls.first;
    final step = _text(pitch, 'step') ?? 'C';
    final alter = int.tryParse(_text(pitch, 'alter') ?? '0') ?? 0;
    final octave = int.tryParse(_text(pitch, 'octave') ?? '4') ?? 4;
    final midi = _midi(step, alter, octave);

    if (isChord && events.isNotEmpty) {
      events.last.midiNotes.add(midi); // simultaneous note → same moment
    } else {
      events.add(MusicEvent([midi], beats));
    }
  }

  return Score(title: resolvedTitle, events: events);
}
