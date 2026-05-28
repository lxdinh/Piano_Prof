import 'lesson_models.dart';

/// The 6-level self-learning pathway (Kindergarten → Master).
const levels = <Level>[
  Level(
    id: 'kindergarten',
    index: 1,
    name: 'Level 1 · Kindergarten',
    objective:
        'Overcome fear of the keyboard, learn the black/white key map, posture, and your first one-hand notes.',
    duration: '2–4 weeks',
  ),
  Level(
    id: 'elementary',
    index: 2,
    name: 'Level 2 · Elementary',
    objective:
        'Master basic rhythm, read the bass clef, build finger strength, and play hands-together slowly.',
    duration: '1–2 months',
  ),
  Level(
    id: 'middle',
    index: 3,
    name: 'Level 3 · Middle School',
    objective:
        'Understand chords and the universal progression; accompany real pop songs.',
    duration: '2–3 months',
  ),
  Level(
    id: 'high',
    index: 4,
    name: 'Level 4 · High School',
    objective:
        'Use inversions and color chords, vary accompaniment styles, and frame songs with intros/outros.',
    duration: '3–6 months',
  ),
  Level(
    id: 'university',
    index: 5,
    name: 'Level 5 · University',
    objective:
        'Play by ear, identify progressions on the fly, and arrange your own solo covers with full expression.',
    duration: '6 months–1 year',
  ),
  Level(
    id: 'master',
    index: 6,
    name: 'Level 6 · Master',
    objective:
        'Improvise, compose, re-harmonize, and tackle elite genres — jazz, blues, and the classical masters.',
    duration: 'Lifetime mastery',
  ),
];

/// Every lesson on the path, ordered by level then `order`.
const lessonCatalog = <LessonMeta>[
  // Level 1 — Kindergarten
  LessonMeta(id: 'l1-posture', levelId: 'kindergarten', order: 1, title: 'Posture & Hand Position'),
  LessonMeta(id: 'l1-geography', levelId: 'kindergarten', order: 2, title: 'Keyboard Geography & Landmarks'),
  LessonMeta(id: 'l1-notes', levelId: 'kindergarten', order: 3, title: 'The 7 Natural Notes'),
  LessonMeta(id: 'l1-treble', levelId: 'kindergarten', order: 4, title: 'Reading the Treble Clef'),
  LessonMeta(id: 'l1-mary', levelId: 'kindergarten', order: 5, title: 'Mary Had a Little Lamb', kind: LessonKind.song),
  LessonMeta(id: 'l1-frere', levelId: 'kindergarten', order: 6, title: 'Frère Jacques', kind: LessonKind.song),
  // Level 2 — Elementary
  LessonMeta(id: 'l2-rhythm', levelId: 'elementary', order: 1, title: 'Note Values & Rhythm'),
  LessonMeta(id: 'l2-metronome', levelId: 'elementary', order: 2, title: 'Feel the Pulse (Metronome)', kind: LessonKind.exercise),
  LessonMeta(id: 'l2-bass', levelId: 'elementary', order: 3, title: 'Reading the Bass Clef'),
  LessonMeta(id: 'l2-hanon', levelId: 'elementary', order: 4, title: 'Hanon 1–5: Finger Strength', kind: LessonKind.exercise),
  LessonMeta(id: 'l2-steps', levelId: 'elementary', order: 5, title: 'Half Steps & Whole Steps'),
  LessonMeta(id: 'l2-hands', levelId: 'elementary', order: 6, title: 'Hands Together Basics'),
  LessonMeta(id: 'l2-twinkle', levelId: 'elementary', order: 7, title: 'Twinkle Twinkle', kind: LessonKind.song),
  LessonMeta(id: 'l2-birthday', levelId: 'elementary', order: 8, title: 'Happy Birthday', kind: LessonKind.song),
  // Level 3 — Middle School
  LessonMeta(id: 'l3-triads', levelId: 'middle', order: 1, title: 'Major & Minor Triads'),
  LessonMeta(id: 'l3-firstchord', levelId: 'middle', order: 2, title: 'Your First Chord: 1-3-5'),
  LessonMeta(id: 'l3-openchords', levelId: 'middle', order: 3, title: 'Open-Position Chords'),
  LessonMeta(id: 'l3-axis', levelId: 'middle', order: 4, title: 'The I–V–vi–IV Progression'),
  LessonMeta(id: 'l3-block', levelId: 'middle', order: 5, title: 'Left Hand: Block Chords', kind: LessonKind.exercise),
  LessonMeta(id: 'l3-arp158', levelId: 'middle', order: 6, title: 'Left Hand: 1-5-8 Arpeggios', kind: LessonKind.exercise),
  LessonMeta(id: 'l3-letitbe', levelId: 'middle', order: 7, title: 'Let It Be', kind: LessonKind.song),
  LessonMeta(id: 'l3-safe', levelId: 'middle', order: 8, title: 'Safe and Sound', kind: LessonKind.song),
  LessonMeta(id: 'l3-perfect', levelId: 'middle', order: 9, title: 'Perfect', kind: LessonKind.song),
  // Level 4 — High School
  LessonMeta(id: 'l4-inversions', levelId: 'high', order: 1, title: 'Chord Inversions'),
  LessonMeta(id: 'l4-color', levelId: 'high', order: 2, title: 'Color Chords: 7ths, sus, add9'),
  LessonMeta(id: 'l4-ballad', levelId: 'high', order: 3, title: 'Ballad Arpeggios (4/4)', kind: LessonKind.exercise),
  LessonMeta(id: 'l4-waltz', levelId: 'high', order: 4, title: 'Waltz & Boston (3/4)', kind: LessonKind.exercise),
  LessonMeta(id: 'l4-slowrock', levelId: 'high', order: 5, title: 'Slow Rock (6/8)', kind: LessonKind.exercise),
  LessonMeta(id: 'l4-pop', levelId: 'high', order: 6, title: 'Pop / Disco (2/4–4/4)', kind: LessonKind.exercise),
  LessonMeta(id: 'l4-sightread', levelId: 'high', order: 7, title: 'Grand Staff Sight-Reading'),
  LessonMeta(id: 'l4-introoutro', levelId: 'high', order: 8, title: 'Intros & Outros'),
  LessonMeta(id: 'l4-mariage', levelId: 'high', order: 9, title: "Mariage d'Amour", kind: LessonKind.song),
  LessonMeta(id: 'l4-canon', levelId: 'high', order: 10, title: 'Canon in D', kind: LessonKind.song),
  // Level 5 — University
  LessonMeta(id: 'l5-intervals', levelId: 'university', order: 1, title: 'Intervals by Ear', kind: LessonKind.exercise),
  LessonMeta(id: 'l5-quality', levelId: 'university', order: 2, title: 'Chord Quality Recognition', kind: LessonKind.exercise),
  LessonMeta(id: 'l5-key', levelId: 'university', order: 3, title: 'Finding the Key Center'),
  LessonMeta(id: 'l5-arrange', levelId: 'university', order: 4, title: 'Solo Cover Arranging'),
  LessonMeta(id: 'l5-dynamics', levelId: 'university', order: 5, title: 'Dynamics & the Sustain Pedal'),
  LessonMeta(id: 'l5-transpose', levelId: 'university', order: 6, title: 'Real-Time Transposition'),
  LessonMeta(id: 'l5-river', levelId: 'university', order: 7, title: 'River Flows in You', kind: LessonKind.song),
  LessonMeta(id: 'l5-kiss', levelId: 'university', order: 8, title: 'Kiss the Rain', kind: LessonKind.song),
  // Level 6 — Master
  LessonMeta(id: 'l6-scales', levelId: 'master', order: 1, title: 'Improv Scales: Pentatonic, Blues, Modes'),
  LessonMeta(id: 'l6-improv', levelId: 'master', order: 2, title: 'Improvising over LH Loops', kind: LessonKind.exercise),
  LessonMeta(id: 'l6-compose', levelId: 'master', order: 3, title: 'Composition: Motif → Structure'),
  LessonMeta(id: 'l6-reharm', levelId: 'master', order: 4, title: 'Re-harmonization'),
  LessonMeta(id: 'l6-jazz', levelId: 'master', order: 5, title: 'Jazz & Blues Voicings'),
  LessonMeta(id: 'l6-classical', levelId: 'master', order: 6, title: 'Classical Masterworks'),
  LessonMeta(id: 'l6-blues12', levelId: 'master', order: 7, title: '12-Bar Blues Improv', kind: LessonKind.exercise),
  LessonMeta(id: 'l6-moonlight', levelId: 'master', order: 8, title: 'Moonlight Sonata / Nocturne', kind: LessonKind.song),
];

/// Authored, fully-playable lessons. Others fall back to a short placeholder.
final Map<String, Lesson> lessons = {
  // ---------------- Level 1 ----------------
  'l1-posture': const Lesson(
    id: 'l1-posture',
    title: 'Posture & Hand Position',
    complete: 'Great posture! Relaxed shoulders, curved fingers. 50 XP!',
    steps: [
      Step([
        Say('Welcome! Before any notes, let us sit right.'),
        PauseSeg(400),
        Say('Sit tall. Relax your shoulders. Elbows level with the keys.'),
        PauseSeg(300),
        Say('Curve your fingers as if holding an egg — fingertips strike straight down.'),
      ]),
      Step([
        Say('Now place your right thumb on Middle C and press gently.', gapMs: 600),
        Chord(['C4'], color: 'green', waitMs: 1800),
        Say('Perfect. That is your home base. Relaxed and round.'),
      ]),
    ],
  ),
  'l1-geography': const Lesson(
    id: 'l1-geography',
    title: 'Keyboard Geography & Landmarks',
    complete: 'You can read the keyboard map now. C and F are your anchors. 50 XP!',
    steps: [
      Step([
        Say('Black keys come in groups of two and three. That is your map.'),
        PauseSeg(400),
        Say('C is always just LEFT of a group of two black keys.', gapMs: 600),
        Chord(['C4'], color: 'green', waitMs: 1500),
        Say('Find every C — same note, different octaves.', gapMs: 600),
        SeqAll(['C2', 'C3', 'C4', 'C5', 'C6'], delayMs: 600),
      ]),
      Step([
        Say('The other landmark is F — just LEFT of a group of three black keys.', gapMs: 600),
        Chord(['F4'], color: 'yellow', waitMs: 1500),
        Say('Two anchors, C and F. The whole keyboard flows from them.'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'Where is C?',
          sub: 'Look at the black-key groups',
          options: [
            'Left of the 2 black keys',
            'Left of the 3 black keys',
            'Right of the 3 black keys',
            'Between two whites with no pattern',
          ],
          answer: 'Left of the 2 black keys',
          explain: 'C sits just to the left of every group of two black keys.',
        )),
      ]),
    ],
  ),
  'l1-notes': const Lesson(
    id: 'l1-notes',
    title: 'The 7 Natural Notes',
    complete: 'C D E F G A B — then it repeats. You know the alphabet of music! 50 XP!',
    steps: [
      Step([
        Say('Music uses only seven letters: C D E F G A B. Then it repeats.', gapMs: 700),
        SeqAll(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], delayMs: 420),
        Say('Eight keys, all white. The eighth is C again, one octave up.'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'Which note comes right after G?',
          options: ['H', 'A', 'F', 'C'],
          answer: 'A',
          explain: 'After G we wrap back to A — the letters only go C through B.',
        )),
      ]),
    ],
  ),
  'l1-treble': const Lesson(
    id: 'l1-treble',
    title: 'Reading the Treble Clef',
    complete: 'Every Good Boy Does Fine — the treble lines are yours. 50 XP!',
    steps: [
      Step([
        Say('The right hand reads the treble clef. The five lines are E G B D F.', gapMs: 700),
        SeqAll(['E4', 'G4', 'B4', 'D5', 'F5'], delayMs: 500),
        Say('Remember them as "Every Good Boy Does Fine".'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'What are the treble-clef lines, bottom to top?',
          options: ['E G B D F', 'F A C E', 'C D E F G', 'G B D F A'],
          answer: 'E G B D F',
          explain: '"Every Good Boy Does Fine" — the spaces spell FACE.',
        )),
      ]),
    ],
  ),
  'l1-mary': const Lesson(
    id: 'l1-mary',
    title: 'Song: Mary Had a Little Lamb',
    complete: 'Your first song! Right hand, five fingers. 50 XP!',
    steps: [
      Step([
        Say('Your first song — right hand only, within five fingers.', gapMs: 600),
        Seq(['E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4'], color: 'green', delayMs: 420),
        Seq(['D4', 'D4', 'D4'], color: 'green', delayMs: 420),
        Seq(['E4', 'G4', 'G4'], color: 'green', delayMs: 420),
      ]),
      Step([
        Say('Now the whole line. Follow the lights.', gapMs: 500),
        Seq(['E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4', 'D4', 'D4', 'E4', 'D4', 'C4'],
            color: 'green', delayMs: 380),
        Say('Beautiful! That is Mary Had a Little Lamb.'),
      ]),
    ],
  ),
  'l1-frere': const Lesson(
    id: 'l1-frere',
    title: 'Song: Frère Jacques',
    complete: 'Frère Jacques — a perfect round. 50 XP!',
    steps: [
      Step([
        Say('Frère Jacques. Four short phrases.', gapMs: 500),
        Seq(['C4', 'D4', 'E4', 'C4'], color: 'cyan', delayMs: 420),
        Seq(['E4', 'F4', 'G4'], color: 'cyan', delayMs: 420),
      ]),
      Step([
        Say('Now the run-down and ending.', gapMs: 500),
        Seq(['G4', 'A4', 'G4', 'F4', 'E4', 'C4'], color: 'cyan', delayMs: 360),
        Seq(['C4', 'G3', 'C4'], color: 'green', delayMs: 460),
        Say('You played a melody that crosses both hands. Wonderful.'),
      ]),
    ],
  ),

  // ---------------- Level 2 ----------------
  'l2-rhythm': const Lesson(
    id: 'l2-rhythm',
    title: 'Note Values & Rhythm',
    complete: 'Whole, half, quarter, eighth — rhythm is the skeleton of music. 50 XP!',
    steps: [
      Step([
        Say('Rhythm is the skeleton of music. Notes have durations.'),
        PauseSeg(300),
        Say('A whole note lasts 4 beats.', gapMs: 400),
        Chord(['C4'], color: 'green', waitMs: 2400),
        Say('A half note, 2 beats.', gapMs: 400),
        Chord(['C4'], color: 'yellow', waitMs: 1200),
        Say('A quarter note, 1 beat each.', gapMs: 400),
        Seq(['C4', 'C4', 'C4', 'C4'], color: 'cyan', delayMs: 600),
        Say('And eighth notes, two per beat — twice as fast.', gapMs: 400),
        Seq(['C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'C4'], color: 'magenta', delayMs: 300),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'How many beats does a half note last?',
          options: ['1', '2', '3', '4'],
          answer: '2',
          explain: 'A half note = 2 beats; a whole note = 4; a quarter = 1.',
        )),
      ]),
    ],
  ),
  'l2-bass': const Lesson(
    id: 'l2-bass',
    title: 'Reading the Bass Clef',
    complete: 'The left hand has a home now — below Middle C. 50 XP!',
    steps: [
      Step([
        Say('The left hand reads the bass clef, below Middle C.', gapMs: 600),
        SeqAll(['C3', 'D3', 'E3', 'F3', 'G3'], color: 'magenta', delayMs: 480),
        Say('Lines are G B D F A — "Good Boys Do Fine Always".'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'The bass clef is mostly for which hand?',
          options: ['Right hand', 'Left hand', 'Both equally', 'Neither'],
          answer: 'Left hand',
          explain: 'The bass clef notates the lower notes — your left hand.',
        )),
      ]),
    ],
  ),
  'l2-hanon': const Lesson(
    id: 'l2-hanon',
    title: 'Hanon 1–5: Finger Strength',
    complete: 'Even, independent fingers. Especially 4 and 5! 50 XP!',
    steps: [
      Step([
        Say('Hanon builds finger independence. Keep it even and steady.', gapMs: 600),
        Seq(['C4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4', 'D4'], color: 'cyan', delayMs: 320),
        Say('Up and back down. The weak 4th and 5th fingers get stronger.'),
        PauseSeg(300),
        Seq(['D4', 'E4', 'F4', 'G4', 'A4', 'G4', 'F4', 'E4'], color: 'cyan', delayMs: 320),
        Say('Shift one note and repeat. Slow and even beats fast and sloppy.'),
      ]),
    ],
  ),
  'l2-steps': const Lesson(
    id: 'l2-steps',
    title: 'Half Steps & Whole Steps',
    complete: 'Half steps and whole steps — the DNA of every scale. 50 XP!',
    steps: [
      Step([
        Say('Everything is built from two distances: half steps and whole steps.'),
        PauseSeg(300),
        Say('A half step is the smallest move — one key over.', gapMs: 500),
        Seq(['E4', 'F4'], delayMs: 700),
        Say('E to F. No black key between them.'),
      ]),
      Step([
        Say('A whole step skips one key.', gapMs: 500),
        Seq(['C4', 'D4'], delayMs: 700),
        Say('C to D — a black key sits between them.'),
        PauseSeg(300),
        Say('Here is the chromatic scale — every half step.', gapMs: 600),
        Seq(['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
            delayMs: 260),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'E to F is which kind of step?',
          sub: 'There is no black key between them',
          options: ['Whole step', 'Half step', 'Octave', 'Third'],
          answer: 'Half step',
          explain: 'E–F and B–C are the only natural half steps.',
        )),
      ]),
    ],
  ),
  'l2-hands': const Lesson(
    id: 'l2-hands',
    title: 'Hands Together Basics',
    complete: 'Left-hand anchor under a right-hand melody. No lazy left hand! 50 XP!',
    steps: [
      Step([
        Say('Step one: right hand plays the melody.', gapMs: 500),
        Seq(['C4', 'E4', 'G4', 'E4'], color: 'cyan', delayMs: 460),
        Say('Step two: left hand holds a low anchor note.', gapMs: 500),
        Chord(['C3'], color: 'magenta', waitMs: 1800),
      ]),
      Step([
        Say('Step three: together. Left lands on beat 1, right keeps moving.', gapMs: 700),
        Chord(['C3', 'C4'], color: 'green', waitMs: 1400),
        Seq(['E4', 'G4', 'E4'], color: 'cyan', delayMs: 460),
        Say('That coordination is the whole game. Slow and steady.'),
      ]),
    ],
  ),
  'l2-twinkle': const Lesson(
    id: 'l2-twinkle',
    title: 'Song: Twinkle Twinkle',
    complete: 'Twinkle Twinkle — hands can join once you are steady. 50 XP!',
    steps: [
      Step([
        Say('Twinkle Twinkle Little Star. Right hand melody.', gapMs: 500),
        Seq(['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4'], color: 'green', delayMs: 380),
        Seq(['F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'], color: 'green', delayMs: 380),
      ]),
      Step([
        Say('The middle phrase.', gapMs: 400),
        Seq(['G4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4'], color: 'cyan', delayMs: 380),
        Seq(['G4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4'], color: 'cyan', delayMs: 380),
        Say('Add a left-hand C on each beat 1 when you are ready.'),
      ]),
    ],
  ),
  'l2-birthday': const Lesson(
    id: 'l2-birthday',
    title: 'Song: Happy Birthday',
    complete: 'Now you can play Happy Birthday for someone. 50 XP!',
    steps: [
      Step([
        Say('Happy Birthday — everyone needs this one.', gapMs: 500),
        Seq(['G4', 'G4', 'A4', 'G4', 'C5', 'B4'], color: 'green', delayMs: 380),
        Seq(['G4', 'G4', 'A4', 'G4', 'D5', 'C5'], color: 'green', delayMs: 380),
      ]),
      Step([
        Say('The big line — reach up!', gapMs: 400),
        Seq(['G4', 'G4', 'G5', 'E5', 'C5', 'B4', 'A4'], color: 'yellow', delayMs: 360),
        Seq(['F5', 'F5', 'E5', 'C5', 'D5', 'C5'], color: 'yellow', delayMs: 360),
      ]),
    ],
  ),

  // ---------------- Level 3 ----------------
  'l3-triads': const Lesson(
    id: 'l3-triads',
    title: 'Major & Minor Triads',
    complete: 'One note flips the mood from happy to sad. 50 XP!',
    steps: [
      Step([
        Say('A triad is three notes. C major is bright.', gapMs: 600),
        Chord(['C4', 'E4', 'G4'], color: 'green', waitMs: 2000),
        Say('Lower the middle note a half step — C minor. Darker.', gapMs: 600),
        Chord(['C4', 'Eb4', 'G4'], color: 'magenta', waitMs: 2000),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'What turns C Major into C Minor?',
          sub: 'C major is C E G; C minor is C Eb G',
          options: [
            'Lower the root',
            'Lower the 3rd a half step',
            'Raise the 5th',
            'Lower everything',
          ],
          answer: 'Lower the 3rd a half step',
          explain: 'Flattening the 3rd (E→Eb) creates the minor sound.',
        )),
      ]),
    ],
  ),
  'l3-firstchord': const Lesson(
    id: 'l3-firstchord',
    title: 'Your First Chord: 1-3-5',
    complete: 'Thumb-middle-pinky: C E G, the C major chord. 50 XP!',
    steps: [
      Step([
        Say('Skip a finger each time: thumb on C, middle on E, pinky on G.', gapMs: 700),
        Chord(['C4'], color: 'yellow', waitMs: 1000),
        Chord(['E4'], color: 'yellow', waitMs: 1000),
        Chord(['G4'], color: 'yellow', waitMs: 1000),
        Say('Now all together — the C major chord.', gapMs: 500),
        Chord(['C4', 'E4', 'G4'], color: 'green', waitMs: 2200),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'Which three keys are the 1-3-5 on C?',
          options: ['C D E', 'C E G', 'C F G', 'D F A'],
          answer: 'C E G',
          explain: 'Fingers 1-3-5 = thumb, middle, pinky = C, E, G.',
        )),
      ]),
    ],
  ),
  'l3-openchords': const Lesson(
    id: 'l3-openchords',
    title: 'Open-Position Chords',
    complete: 'C, G, Am, F — four chords, hundreds of songs. 50 XP!',
    steps: [
      Step([
        Say('Four chords unlock most pop songs. C major.', gapMs: 500),
        Chord(['C4', 'E4', 'G4'], color: 'green', waitMs: 1500),
        Say('G major.', gapMs: 400),
        Chord(['G3', 'B3', 'D4'], color: 'cyan', waitMs: 1500),
        Say('A minor.', gapMs: 400),
        Chord(['A3', 'C4', 'E4'], color: 'magenta', waitMs: 1500),
        Say('F major.', gapMs: 400),
        Chord(['F3', 'A3', 'C4'], color: 'yellow', waitMs: 1500),
      ]),
    ],
  ),
  'l3-axis': const Lesson(
    id: 'l3-axis',
    title: 'The I–V–vi–IV Progression',
    complete: 'The most-used progression in pop. You own it now. 50 XP!',
    steps: [
      Step([
        Say('In C: I is C, V is G, vi is A minor, IV is F.', gapMs: 700),
        Chord(['C4', 'E4', 'G4'], color: 'cyan', waitMs: 1400),
        Chord(['G3', 'B3', 'D4'], color: 'green', waitMs: 1400),
        Chord(['A3', 'C4', 'E4'], color: 'magenta', waitMs: 1400),
        Chord(['F3', 'A3', 'C4'], color: 'yellow', waitMs: 1400),
        Say('That loop is in thousands of songs.'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'In C major, the vi chord is…',
          options: ['F major', 'G major', 'A minor', 'D minor'],
          answer: 'A minor',
          explain: 'The 6th degree of C is A, and vi is always minor.',
        )),
      ]),
    ],
  ),
  'l3-arp158': const Lesson(
    id: 'l3-arp158',
    title: 'Left Hand: 1-5-8 Arpeggios',
    complete: 'Rolling 1-5-8 gives your left hand motion. 50 XP!',
    steps: [
      Step([
        Say('Instead of blocking a chord, roll it: root, fifth, octave.', gapMs: 600),
        Seq(['C3', 'G3', 'C4'], color: 'magenta', delayMs: 420),
        Say('On G:', gapMs: 300),
        Seq(['G2', 'D3', 'G3'], color: 'cyan', delayMs: 420),
        Say('Smooth, flowing motion under any melody.'),
      ]),
    ],
  ),
  'l3-letitbe': const Lesson(
    id: 'l3-letitbe',
    title: 'Song: Let It Be',
    complete: 'Let It Be — four chords, one classic. 50 XP!',
    steps: [
      Step([
        Say('Let It Be is C, G, Am, F. Sound familiar?', gapMs: 600),
        Chord(['C4', 'E4', 'G4'], color: 'cyan', waitMs: 1400),
        Chord(['G3', 'B3', 'D4'], color: 'green', waitMs: 1400),
        Chord(['A3', 'C4', 'E4'], color: 'magenta', waitMs: 1400),
        Chord(['F3', 'A3', 'C4'], color: 'yellow', waitMs: 1400),
        Say('Add the right-hand melody over the top and you are playing the song.'),
      ]),
    ],
  ),

  // ---------------- Level 4 ----------------
  'l4-inversions': const Lesson(
    id: 'l4-inversions',
    title: 'Chord Inversions',
    complete: 'Same chord, smoother transitions. 50 XP!',
    steps: [
      Step([
        Say('C major in root position.', gapMs: 500),
        Chord(['C4', 'E4', 'G4'], color: 'cyan', waitMs: 1600),
        Say('First inversion — E on the bottom.', gapMs: 500),
        Chord(['E4', 'G4', 'C5'], color: 'yellow', waitMs: 1600),
        Say('Second inversion — G on the bottom.', gapMs: 500),
        Chord(['G4', 'C5', 'E5'], color: 'orange', waitMs: 1600),
        Say('Same three notes, tiny hand moves between chords.'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'In 1st inversion of C major, what is on the bottom?',
          options: ['C', 'E', 'G', 'B'],
          answer: 'E',
          explain: 'First inversion puts the 3rd (E) lowest.',
        )),
      ]),
    ],
  ),
  'l4-color': const Lesson(
    id: 'l4-color',
    title: 'Color Chords: 7ths, sus, add9',
    complete: 'Richer colors: maj7, m7, sus4. 50 XP!',
    steps: [
      Step([
        Say('Add a 4th note for color. C major 7 — dreamy.', gapMs: 500),
        Chord(['C4', 'E4', 'G4', 'B4'], color: 'cyan', waitMs: 2000),
        Say('C minor 7 — smooth.', gapMs: 400),
        Chord(['C4', 'Eb4', 'G4', 'Bb4'], color: 'magenta', waitMs: 2000),
        Say('C suspended 4 — unresolved, wants to move.', gapMs: 400),
        Chord(['C4', 'F4', 'G4'], color: 'yellow', waitMs: 2000),
      ]),
    ],
  ),
  'l4-canon': const Lesson(
    id: 'l4-canon',
    title: 'Song: Canon in D',
    complete: "Pachelbel's Canon — the most-used progression ever. 50 XP!",
    steps: [
      Step([
        Say('Canon in D — eight chords that loop forever.', gapMs: 700),
        Chord(['D4', 'Gb4', 'A4'], color: 'cyan', waitMs: 1300),
        Chord(['A3', 'Db4', 'E4'], color: 'yellow', waitMs: 1300),
        Chord(['B3', 'Eb4', 'Gb4'], color: 'magenta', waitMs: 1300),
        Chord(['Gb3', 'A3', 'Db4'], color: 'green', waitMs: 1300),
        Chord(['G3', 'B3', 'D4'], color: 'cyan', waitMs: 1300),
        Chord(['D3', 'Gb3', 'A3'], color: 'yellow', waitMs: 1300),
        Chord(['G3', 'B3', 'D4'], color: 'magenta', waitMs: 1300),
        Chord(['A3', 'Db4', 'E4'], color: 'orange', waitMs: 1300),
        Say('Loop it and add a melody on top — instant beauty.'),
      ]),
    ],
  ),

  // ---------------- Level 5 ----------------
  'l5-river': const Lesson(
    id: 'l5-river',
    title: 'Song: River Flows in You',
    complete: "Yiruma's classic — your first real solo piece. 50 XP!",
    steps: [
      Step([
        Say('River Flows in You. A flowing right-hand figure.', gapMs: 600),
        Seq(['Gb4', 'E4', 'Gb4', 'A4', 'B4', 'A4', 'Gb4', 'E4'], color: 'cyan', delayMs: 300),
        Say('Under it, a gentle left-hand arpeggio.', gapMs: 500),
        Seq(['A2', 'E3', 'A3', 'Db4'], color: 'magenta', delayMs: 360),
        Say('Weave them together slowly. This is solo piano.'),
      ]),
    ],
  ),
};

/// Short placeholder for lessons whose full content isn't authored yet.
Lesson placeholderLesson(LessonMeta m) => Lesson(
      id: m.id,
      title: m.title,
      complete: 'Nice! "${m.title}" complete. 50 XP!',
      steps: [
        Step([
          Say('"${m.title}" — full interactive content is coming soon.'),
          const PauseSeg(400),
          const Say('Here is a taste — the bright C major chord.', gapMs: 500),
          const Chord(['C4', 'E4', 'G4'], color: 'green', waitMs: 2000),
        ]),
      ],
    );

Lesson lessonFor(LessonMeta m) => lessons[m.id] ?? placeholderLesson(m);

List<LessonMeta> lessonsForLevel(String levelId) =>
    lessonCatalog.where((m) => m.levelId == levelId).toList();
