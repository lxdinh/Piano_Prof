// Dart port of the lesson engine data model (was App/.../LessonData.kt).

sealed class Segment {
  const Segment();
}

/// Spoken instruction shown in the speech bubble (TTS comes later).
class Say extends Segment {
  const Say(this.text, {this.gapMs = 200});
  final String text;
  final int gapMs;
}

class PauseSeg extends Segment {
  const PauseSeg(this.ms);
  final int ms;
}

/// Which hand plays the notes — drives the key/LED color (left = cyan/blue,
/// right = orange). [auto] decides per note by pitch (below middle C = left).
enum Hand { left, right, both, auto }

/// Notes played together (a chord) — lights all matching LEDs at once.
///
/// [hand] sets the color convention; [pedal] holds the sustain so the chord
/// rings (released on the next clear). The legacy [color] is kept for the
/// chord-chip accent but no longer drives key/LED color (hand does).
class Chord extends Segment {
  const Chord(this.notes,
      {this.color = 'cyan',
      this.waitMs = 1400,
      this.hand = Hand.auto,
      this.pedal = false});
  final List<String> notes;
  final String color;
  final int waitMs;
  final Hand hand;
  final bool pedal;
}

/// Notes played one at a time, each cleared before the next.
///
/// When [solfege] is true the instructor "sings" Do-Re-Mi in tune with each
/// note as it lights (see PianoAudio.singSolfege).
class Seq extends Segment {
  const Seq(this.notes,
      {this.color = 'cyan',
      this.delayMs = 420,
      this.waitMs = 500,
      this.hand = Hand.auto,
      this.solfege = false,
      this.pedal = false});
  final List<String> notes;
  final String color;
  final int delayMs;
  final int waitMs;
  final Hand hand;
  final bool solfege;
  final bool pedal;
}

/// Notes played one at a time but kept lit cumulatively.
class SeqAll extends Segment {
  const SeqAll(this.notes,
      {this.color = 'cyan',
      this.delayMs = 420,
      this.waitMs = 500,
      this.hand = Hand.auto,
      this.solfege = false,
      this.pedal = false});
  final List<String> notes;
  final String color;
  final int delayMs;
  final int waitMs;
  final Hand hand;
  final bool solfege;
  final bool pedal;
}

class QuizSeg extends Segment {
  const QuizSeg(this.quiz);
  final QuizData quiz;
}

// ---- quizzes ----
sealed class QuizData {
  const QuizData({required this.question, this.sub = ''});
  final String question;
  final String sub;
}

class Mcq extends QuizData {
  const Mcq({
    required super.question,
    super.sub,
    required this.options,
    required this.answer,
    this.explain = '',
  });
  final List<String> options;
  final String answer;
  final String explain;
}

class KeyQuiz extends QuizData {
  const KeyQuiz({
    required super.question,
    super.sub,
    required this.target,
  });
  final String target;
}

// ---- lesson structure ----
class Step {
  const Step(this.segments);
  final List<Segment> segments;
}

class Lesson {
  const Lesson({
    required this.id,
    required this.title,
    required this.complete,
    required this.steps,
  });

  final String id;
  final String title;
  final String complete;
  final List<Step> steps;
}

/// Lesson kind drives the node icon on the path.
enum LessonKind { concept, exercise, song }

/// A stage in the 6-level pathway (Kindergarten → Master).
class Level {
  const Level({
    required this.id,
    required this.index,
    required this.name,
    required this.objective,
    required this.duration,
  });
  final String id;
  final int index;
  final String name; // e.g. "Kindergarten"
  final String objective;
  final String duration;
}

/// Lightweight metadata for the path screen (one per lesson).
class LessonMeta {
  const LessonMeta({
    required this.id,
    required this.levelId,
    required this.order,
    required this.title,
    this.kind = LessonKind.concept,
  });
  final String id;
  final String levelId;
  final int order;
  final String title;
  final LessonKind kind;
}
