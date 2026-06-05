import 'lesson_models.dart';

/// The 6-level self-learning pathway (Kindergarten → Master). The detailed
/// Grade 1–12 instructor lessons are the spine; Grade 1 (the welcome + 1-3-5)
/// comes first, before the Posture lesson, then the rest, with practice songs
/// woven in.
const levels = <Level>[
  Level(
    id: 'kindergarten',
    index: 1,
    name: 'Level 1 · Kindergarten',
    objective:
        'Meet the keyboard, your hands, and your first chord shape. Overcome the fear and play.',
    duration: '2–4 weeks',
  ),
  Level(
    id: 'elementary',
    index: 2,
    name: 'Level 2 · Elementary',
    objective:
        'Scales and rhythm: the major/minor formulas and steady two-hand playing.',
    duration: '1–2 months',
  ),
  Level(
    id: 'middle',
    index: 3,
    name: 'Level 3 · Middle School',
    objective: 'Chords and the universal progression; accompany real pop songs.',
    duration: '2–3 months',
  ),
  Level(
    id: 'high',
    index: 4,
    name: 'Level 4 · High School',
    objective: 'Minor chords, the Axis progression, and Roman-numeral thinking.',
    duration: '3–6 months',
  ),
  Level(
    id: 'university',
    index: 5,
    name: 'Level 5 · University',
    objective: 'Circle of fifths, seventh chords, and your first real solo pieces.',
    duration: '6 months–1 year',
  ),
  Level(
    id: 'master',
    index: 6,
    name: 'Level 6 · Master',
    objective: 'Inversions, voice leading, and bringing every tool together.',
    duration: 'Lifetime mastery',
  ),
];

/// Path order. Grade 1 (g1) is first — before Posture — per the lesson design.
const lessonCatalog = <LessonMeta>[
  // Level 1
  LessonMeta(id: 'g1', levelId: 'kindergarten', order: 1, title: 'Grade 1: Layout & 1-3-5 Chords'),
  LessonMeta(id: 'l1-posture', levelId: 'kindergarten', order: 2, title: 'Posture & Hand Position'),
  LessonMeta(id: 'g2', levelId: 'kindergarten', order: 3, title: 'Grade 2: Landmarks & Navigation'),
  LessonMeta(id: 'l1-mary', levelId: 'kindergarten', order: 4, title: 'Mary Had a Little Lamb', kind: LessonKind.song),
  LessonMeta(id: 'l1-frere', levelId: 'kindergarten', order: 5, title: 'Frère Jacques', kind: LessonKind.song),
  // Level 2
  LessonMeta(id: 'g3', levelId: 'elementary', order: 1, title: 'Grade 3: Half & Whole Steps'),
  LessonMeta(id: 'g4', levelId: 'elementary', order: 2, title: 'Grade 4: Major Scale Formula'),
  LessonMeta(id: 'l2-twinkle', levelId: 'elementary', order: 3, title: 'Twinkle Twinkle', kind: LessonKind.song),
  LessonMeta(id: 'l2-birthday', levelId: 'elementary', order: 4, title: 'Happy Birthday', kind: LessonKind.song),
  // Level 3
  LessonMeta(id: 'g5', levelId: 'middle', order: 1, title: 'Grade 5: Minor Scale & Emotions'),
  LessonMeta(id: 'g6', levelId: 'middle', order: 2, title: 'Grade 6: Major Chords (I, IV, V)'),
  LessonMeta(id: 'l3-letitbe', levelId: 'middle', order: 3, title: 'Let It Be', kind: LessonKind.song),
  // Level 4
  LessonMeta(id: 'g7', levelId: 'high', order: 1, title: 'Grade 7: Minor Chords & Axis'),
  LessonMeta(id: 'g8', levelId: 'high', order: 2, title: 'Grade 8: Progressions & Roman Numerals'),
  LessonMeta(id: 'l4-canon', levelId: 'high', order: 3, title: 'Canon in D', kind: LessonKind.song),
  // Level 5
  LessonMeta(id: 'g9', levelId: 'university', order: 1, title: 'Grade 9: Circle of Fifths'),
  LessonMeta(id: 'g10', levelId: 'university', order: 2, title: 'Grade 10: Seventh Chords & Jazz'),
  LessonMeta(id: 'l5-river', levelId: 'university', order: 3, title: 'River Flows in You', kind: LessonKind.song),
  LessonMeta(id: 'l5-kiss', levelId: 'university', order: 4, title: 'Kiss the Rain', kind: LessonKind.song),
  // Level 6
  LessonMeta(id: 'g11', levelId: 'master', order: 1, title: 'Grade 11: Inversions & Voice Leading'),
  LessonMeta(id: 'g12', levelId: 'master', order: 2, title: 'Grade 12: Bringing It All Together'),
  LessonMeta(id: 'l6-improv', levelId: 'master', order: 3, title: 'Improvising over LH Loops', kind: LessonKind.exercise),
  LessonMeta(id: 'l6-jazz', levelId: 'master', order: 4, title: 'Jazz & Blues Voicings'),
];

final Map<String, Lesson> lessons = {
  // ============================ GRADE 1 ============================
  'g1': const Lesson(
    id: 'g1',
    title: 'Grade 1: Layout & 1-3-5 Chords',
    complete:
        'Amazing work! You have completed Grade 1. You understand the piano layout and the 1-3-5 chord pattern. 50 XP earned!',
    steps: [
      Step([
        Say('Hello everyone, welcome! I am your AI piano instructor.'),
        PauseSeg(500),
        Say('Our goal in this course is simple: to play real songs you actually love.'),
        PauseSeg(400),
        Say('And the secret to that? Chords. Not scales. Not sheet music. Chords first.'),
        PauseSeg(400),
        Say('But before chords, let me show you something beautiful.', gapMs: 700),
        Chord(['C4', 'E4', 'G4', 'B4'], color: 'cyan', waitMs: 2500),
        Say('That is a C Major 7 chord. Four notes. One moment. Already beautiful.'),
        PauseSeg(400),
        Say('By the end of this course, that is the level you will play at.'),
      ]),
      Step([
        Say('First, let me show you the layout of this instrument.'),
        PauseSeg(400),
        Say('A piano has only seven letter names. A, B, C, D, E, F, G. Then it repeats.'),
        PauseSeg(300),
        Say('That repeating group of 12 keys is called an octave. Watch.', gapMs: 700),
        SeqAll(['C2', 'C3', 'C4', 'C5', 'C6'], color: 'cyan', delayMs: 700),
        Say('Every glowing key is called C. Same note, different octave.'),
        PauseSeg(500),
        Say('C is always to the LEFT of the group of two black keys. That is your anchor.'),
      ]),
      Step([
        Say('Now. The finger exercise. This is how we build the connection between your brain and your fingers.'),
        PauseSeg(400),
        Say('We call this the 1 through 8 exercise. Starting on Middle C, you play eight notes up the scale.', gapMs: 700),
        SeqAll(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
            color: 'cyan', delayMs: 380, solfege: true),
        Say('C, D, E, F, G, A, B, C. Eight notes. All white keys.'),
        PauseSeg(500),
        Say('The requirement? It must be even. Continuous. Smooth. Like a machine, but with feeling.'),
        PauseSeg(400),
        Say('Not fast. Not impressive. Just steady. That is what passing looks like.'),
      ]),
      Step([
        Say('Now here is where it gets interesting.'),
        PauseSeg(400),
        Say('Instead of playing consecutive notes like Do Re Mi Fa Sol...', gapMs: 700),
        Seq(['C4', 'D4', 'E4', 'F4', 'G4'], color: 'cyan', delayMs: 380, solfege: true),
        Say('...we are going to skip fingers. Like this.', gapMs: 700),
        Seq(['C4', 'E4', 'G4', 'E4', 'C4'], color: 'yellow', delayMs: 480, solfege: true),
        Say('Do, Mi, Sol, Mi, Do. We call this the 1-3-5 pattern.'),
        PauseSeg(500),
        Say('Thumb is finger 1. Middle finger is finger 3. Pinky is finger 5.'),
        PauseSeg(400),
        Say('So 1-3-5 means: thumb, middle, pinky. Those three fingers form a chord shape.'),
      ]),
      Step([
        Say('Why are we doing this? Great question. Let me show you.', gapMs: 700),
        Chord(['C3', 'G3'], color: 'magenta', waitMs: 2000),
        Say('That is a left hand chord bass note. Now add the right hand melody.', gapMs: 700),
        Seq(['E5', 'D5', 'C5', 'G4'], color: 'cyan', delayMs: 500),
        Say('Now combine them together. This is how River Flows in You starts.', gapMs: 800),
        Chord(['C3', 'C4', 'E4', 'G4'], color: 'cyan', waitMs: 2200),
        Chord(['G2', 'D4', 'Gb4', 'A4'], color: 'yellow', waitMs: 2200),
        Chord(['A2', 'C4', 'E4', 'A4'], color: 'magenta', waitMs: 2200),
        Chord(['E2', 'B3', 'E4', 'G4'], color: 'green', waitMs: 2200),
        Say('Beautiful, right? The left hand plays chords. The right hand plays melody. That is all it is.'),
        PauseSeg(400),
        Say('To reach that level, you must play chords very well. So let us build that foundation now.'),
      ]),
      Step([
        Say('Here is the core exercise for today. Let me break it down step by step.'),
        PauseSeg(400),
        Say('Right hand position. Place your thumb on Middle C. That is finger 1.', gapMs: 700),
        Chord(['C4'], color: 'yellow', waitMs: 1200),
        Say('Skip a finger. Middle finger on E. That is finger 3.', gapMs: 700),
        Chord(['E4'], color: 'yellow', waitMs: 1200),
        Say('Skip again. Pinky on G. That is finger 5.', gapMs: 700),
        Chord(['G4'], color: 'yellow', waitMs: 1200),
        Say('1, 3, 5. C, E, G. Those three keys form a C Major chord.'),
        PauseSeg(500),
        Say('Now you will play them one at a time in a broken pattern. C, E, G, E. Count: 1, 2, 3, 4.', gapMs: 700),
        Seq(['C4', 'E4', 'G4', 'E4'], color: 'cyan', delayMs: 500),
        Say('That is your right hand exercise. Steady count. 1, 2, 3, 4.'),
      ]),
      Step([
        Say('Now we add the left hand.'),
        PauseSeg(400),
        Say('The left hand is simple. It plays the root note on beat 1 only.'),
        PauseSeg(300),
        Say('So when your right thumb plays C on beat 1, your left hand also plays C at the same time.', gapMs: 800),
        Chord(['C3', 'C4'], color: 'cyan', waitMs: 2000),
        Say('Then the right hand continues: 2, 3, 4. Left hand holds.', gapMs: 700),
        Seq(['E4', 'G4', 'E4'], color: 'cyan', delayMs: 500),
        Say('Left hand down together on 1. Right hand alone for 2, 3, 4. That is the pattern.'),
      ]),
      Step([
        Say('Now we move through the scale. We start on Do. Then shift to Re.', gapMs: 800),
        Chord(['C3', 'C4'], color: 'cyan', waitMs: 1200),
        Seq(['E4', 'G4', 'E4'], color: 'cyan', delayMs: 400),
        Chord(['D3', 'D4'], color: 'yellow', waitMs: 1200),
        Seq(['F4', 'A4', 'F4'], color: 'yellow', delayMs: 400),
        Chord(['E3', 'E4'], color: 'green', waitMs: 1200),
        Seq(['G4', 'B4', 'G4'], color: 'green', delayMs: 400),
        Say('Do to Re to Mi. Each time, your whole hand shifts one note to the right.'),
        PauseSeg(500),
        Say('Continue up to Sol, then back down to Do. That is the full exercise.', gapMs: 800),
        Chord(['F3', 'F4'], color: 'magenta', waitMs: 1200),
        Seq(['A4', 'C5', 'A4'], color: 'magenta', delayMs: 400),
        Chord(['G3', 'G4'], color: 'orange', waitMs: 1200),
        Seq(['B4', 'D5', 'B4'], color: 'orange', delayMs: 400),
        Say('Up to Sol. Now back down.', gapMs: 700),
        Chord(['F3', 'F4'], color: 'magenta', waitMs: 1200),
        Chord(['E3', 'E4'], color: 'green', waitMs: 1200),
        Chord(['D3', 'D4'], color: 'yellow', waitMs: 1200),
        Chord(['C3', 'C4'], color: 'cyan', waitMs: 1500),
        Say('And back to Do. The hardest part? Going from Sol back down without losing the beat.'),
      ]),
      Step([
        Say('Now the standard. The requirement for this lesson.'),
        PauseSeg(400),
        Say('You must play continuously. No stopping. No pausing between chords.'),
        PauseSeg(300),
        Say('If you stop between chords, you are losing the beat. That is the one thing we do not do.'),
        PauseSeg(500),
        Say('Start slow. Count out loud first: 1, 2, 3, 4. Then add the notes.'),
        PauseSeg(400),
        Say('Slow and steady beats fast and sloppy. Every single time.'),
      ]),
      Step([
        Say('Once you can do Do to Sol and back without mistakes, try chord progressions.'),
        PauseSeg(400),
        Say('You can jump from any chord to any chord. Like this.', gapMs: 700),
        Chord(['C3', 'C4'], color: 'cyan', waitMs: 1400),
        Chord(['G3', 'G4'], color: 'green', waitMs: 1400),
        Chord(['A3', 'A4'], color: 'magenta', waitMs: 1400),
        Chord(['E3', 'E4'], color: 'yellow', waitMs: 1400),
        Say('Do, Sol, La, Mi. Already sounds musical.'),
        PauseSeg(500),
        Say('Here is a famous one. This is Canon in D.', gapMs: 700),
        Chord(['D4', 'Gb4', 'A4'], color: 'cyan', waitMs: 1600),
        Chord(['A3', 'Db4', 'E4'], color: 'yellow', waitMs: 1600),
        Chord(['B3', 'Eb4', 'Gb4'], color: 'magenta', waitMs: 1600),
        Chord(['Gb3', 'A3', 'Db4'], color: 'green', waitMs: 1600),
        Chord(['G3', 'B3', 'D4'], color: 'cyan', waitMs: 1600),
        Chord(['D3', 'Gb3', 'A3'], color: 'yellow', waitMs: 1600),
        Chord(['G3', 'B3', 'D4'], color: 'magenta', waitMs: 1600),
        Chord(['A3', 'Db4', 'E4'], color: 'orange', waitMs: 1600),
        Say('That progression is Canon in D. One of the most used progressions in all of music.'),
        PauseSeg(400),
        Say('Your goal is to play any progression like that. Smooth. Continuous. No gaps.'),
      ]),
      Step([
        Say('Let me end with a quiz to check your understanding.'),
        QuizSeg(Mcq(
          question: 'In the 1-3-5 exercise starting on C, which three keys do you play?',
          sub: 'Think: finger 1 is thumb, finger 3 is middle, finger 5 is pinky',
          options: ['C, D, E', 'C, E, G', 'C, F, G', 'D, F, A'],
          answer: 'C, E, G',
          explain:
              'Finger 1 (thumb) on C, finger 3 (middle) on E, finger 5 (pinky) on G. That is the C Major chord shape — the foundation of everything!',
        )),
      ]),
      Step([
        Say('Excellent! C, E, G. The C Major chord. You have got it.'),
        PauseSeg(400),
        Chord(['C4', 'E4', 'G4'], color: 'green', waitMs: 2000),
        Say('Practice the exercise from Do up to Sol and back. Slow first, then gradually faster.'),
        PauseSeg(400),
        Say('Master this, and we will move on to Lesson 2. Happy practicing!'),
        PauseSeg(500),
        Chord(['C4', 'E4', 'G4', 'C5'], color: 'cyan', waitMs: 2500),
      ]),
    ],
  ),

  // ============================ GRADE 2 ============================
  'g2': const Lesson(
    id: 'g2',
    title: 'Grade 2: Landmarks & Navigation',
    complete: 'Grade 2 done! You can navigate the keyboard like a pro. 50 XP!',
    steps: [
      Step([
        Say('Now let us fill in your map.'),
        PauseSeg(300),
        Say('You know C. Now meet the other landmark: F.', gapMs: 500),
        Chord(['F4'], color: 'yellow', waitMs: 1200),
        Say('F is always to the LEFT of the group of three black keys.'),
        PauseSeg(400),
        Say('C and F. Two anchors. The whole keyboard flows from just these two.'),
      ]),
      Step([
        Say('Between the 2 black keys you have C, D, E.', gapMs: 600),
        SeqAll(['C4', 'D4', 'E4'], color: 'cyan', delayMs: 500),
        Say('Around the 3 black keys you have F, G, A, B.', gapMs: 600),
        SeqAll(['F4', 'G4', 'A4', 'B4'], color: 'yellow', delayMs: 500),
        Say('Seven notes. Then it repeats. That is the whole pattern.'),
      ]),
      Step([
        Say('Now I want YOU to find a note. Ready?'),
        PauseSeg(400),
        Say('Find Middle C on the keyboard below and press it.'),
        QuizSeg(KeyQuiz(
          question: 'Press Middle C (C4) on the keyboard!',
          sub: 'Look for the group of 2 black keys at the center',
          target: 'C4',
        )),
      ]),
      Step([
        Say('Now find F4. Left of the 3 black keys.', gapMs: 500),
        QuizSeg(KeyQuiz(
          question: 'Press F4 on the keyboard!',
          sub: 'Left of the group of 3 black keys',
          target: 'F4',
        )),
      ]),
    ],
  ),

  // ============================ GRADE 3 ============================
  'g3': const Lesson(
    id: 'g3',
    title: 'Grade 3: Half & Whole Steps',
    complete:
        'Half steps and whole steps. You have got the DNA of music now. Grade 3 done! 50 XP!',
    steps: [
      Step([
        Say('This is where music theory actually clicks.'),
        PauseSeg(300),
        Say('Everything in music is built from just two distances.'),
        PauseSeg(400),
        Say('A half step. And a whole step. That is it.'),
      ]),
      Step([
        Say('A half step is the smallest possible move. One key over.', gapMs: 600),
        Seq(['E4', 'F4'], color: 'cyan', delayMs: 700),
        Say('E to F. One half step. No black key between them.'),
        PauseSeg(500),
        Say('Same here.', gapMs: 600),
        Seq(['B4', 'C5'], color: 'yellow', delayMs: 700),
        Say('B to C. Another natural half step. No black key.'),
      ]),
      Step([
        Say('A whole step skips one key.', gapMs: 600),
        Seq(['C4', 'D4'], color: 'cyan', delayMs: 700),
        Say('C to D. One whole step. There is a black key in between.'),
        PauseSeg(400),
        Say('Now the chromatic scale. Every single half step in order.', gapMs: 700),
        Seq(['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
            color: 'cyan', delayMs: 280),
        Say('Twelve half steps. One octave.'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'E to F is which kind of step?',
          sub: 'There is no black key between E and F',
          options: ['Whole step', 'Half step', 'Octave', 'Third'],
          answer: 'Half step',
          explain:
              'E to F is a half step, one of only two natural half steps on the keyboard. The other is B to C.',
        )),
      ]),
    ],
  ),

  // ============================ GRADE 4 ============================
  'g4': const Lesson(
    id: 'g4',
    title: 'Grade 4: Major Scale Formula',
    complete: 'You learned the formula that unlocks every major scale. Grade 4 done! 50 XP!',
    steps: [
      Step([
        Say('Ready for the most powerful formula in music?'),
        PauseSeg(400),
        Say('Every major scale follows the exact same pattern.'),
        PauseSeg(300),
        Say('Whole, Whole, Half, Whole, Whole, Whole, Half.'),
        PauseSeg(500),
        Say('Learn this once and you can build a major scale from any note.'),
      ]),
      Step([
        Say('C Major is the easiest. All white keys.', gapMs: 500),
        SeqAll(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
            color: 'cyan', delayMs: 420, solfege: true),
        Say('C, D, E, F, G, A, B, C. Eight notes. All white.'),
      ]),
      Step([
        Say('Now G Major. Same formula, different start.', gapMs: 600),
        SeqAll(['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'Gb5', 'G5'], color: 'yellow', delayMs: 420),
        Say('Almost all white keys, but one black key sneaks in.', gapMs: 500),
        Chord(['Gb5'], color: 'orange', waitMs: 1200),
        Say('F sharp. The formula forced a half step there, landing on a black key.'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'What is the major scale formula?',
          sub: 'This pattern works starting on any note',
          options: ['W-H-W-W-H-W-W', 'W-W-H-W-W-W-H', 'H-W-W-H-W-W-W', 'W-W-W-H-W-W-H'],
          answer: 'W-W-H-W-W-W-H',
          explain: 'W-W-H-W-W-W-H is the major scale formula. Learn it once, use it in all 12 keys forever!',
        )),
      ]),
    ],
  ),

  // ============================ GRADE 5 ============================
  'g5': const Lesson(
    id: 'g5',
    title: 'Grade 5: Minor Scale & Emotions',
    complete: 'You hear the difference now. That is real ear training. Grade 5 done! 50 XP!',
    steps: [
      Step([
        Say('If major is sunshine, minor is the golden hour.'),
        PauseSeg(500),
        Say('Same idea. Different formula. Totally different feeling.'),
        PauseSeg(300),
        Say('Minor formula: Whole, Half, Whole, Whole, Half, Whole, Whole.'),
      ]),
      Step([
        Say('Listen to C Major first.', gapMs: 600),
        SeqAll(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
            color: 'cyan', delayMs: 400, solfege: true),
        Say('Bright. Happy. Resolved.'),
        PauseSeg(600),
        Say('Now C Natural Minor.', gapMs: 600),
        SeqAll(['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'], color: 'magenta', delayMs: 400),
        Say('Darker. More emotional. Three black keys now.'),
      ]),
      Step([
        Say('Here is the key insight. Listen closely.', gapMs: 700),
        Chord(['C4', 'E4', 'G4'], color: 'cyan', waitMs: 1800),
        Say('C Major. Now I change just one note.', gapMs: 800),
        Chord(['C4', 'Eb4', 'G4'], color: 'magenta', waitMs: 1800),
        Say('C Minor. One half step lower on the middle note. That is the entire emotional shift.'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'What changes C Major into C Minor?',
          sub: 'C Major is C E G. C Minor is C Eb G',
          options: [
            'Lower the root by a half step',
            'Lower the 3rd by a half step',
            'Raise the 5th by a half step',
            'Lower all notes',
          ],
          answer: 'Lower the 3rd by a half step',
          explain: 'Lowering the 3rd from E to Eb creates the minor sound. This works for any chord!',
        )),
      ]),
    ],
  ),

  // ============================ GRADE 6 ============================
  'g6': const Lesson(
    id: 'g6',
    title: 'Grade 6: Major Chords (I, IV, V)',
    complete: 'Three chords. Hundreds of songs. Grade 6 is yours! 50 XP!',
    steps: [
      Step([
        Say('Now we are cooking.'),
        PauseSeg(300),
        Say('A chord is three or more notes played at the same time.'),
        PauseSeg(300),
        Say('Every major chord uses the same shape. Root, plus 4 half steps, plus 3 more.'),
      ]),
      Step([
        Say('C Major.', gapMs: 700),
        Chord(['C4', 'E4', 'G4'], color: 'cyan', waitMs: 2000),
        Say('C, E, G. Full and resolved.'),
        PauseSeg(500),
        Say('F Major. Same shape, new root.', gapMs: 700),
        Chord(['F4', 'A4', 'C5'], color: 'yellow', waitMs: 2000),
        Say('F, A, C. Warmer. More open.'),
      ]),
      Step([
        Say('G Major. The third of the trio.', gapMs: 700),
        Chord(['G4', 'B4', 'D5'], color: 'green', waitMs: 2000),
        Say('G, B, D. Feels like it wants to go somewhere.'),
        PauseSeg(500),
        Say('These three are the I, IV, and V chords of C Major. Used in hundreds of songs. Listen.', gapMs: 800),
        Chord(['C4', 'E4', 'G4'], color: 'cyan', waitMs: 1600),
        Chord(['F4', 'A4', 'C5'], color: 'yellow', waitMs: 1600),
        Chord(['G4', 'B4', 'D5'], color: 'green', waitMs: 1600),
        Chord(['C4', 'E4', 'G4'], color: 'cyan', waitMs: 1600),
        Say('I, IV, V, I. The backbone of rock, blues, and pop.'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'What 3 notes make up C Major?',
          options: ['C D E', 'C F G', 'C E G', 'C Eb G'],
          answer: 'C E G',
          explain:
              'C (root) plus E (4 half steps = major 3rd) plus G (3 more half steps = perfect 5th). That is the major chord formula!',
        )),
      ]),
    ],
  ),

  // ============================ GRADE 7 ============================
  'g7': const Lesson(
    id: 'g7',
    title: 'Grade 7: Minor Chords & Axis',
    complete: 'You unlocked the most played chord progression in pop history. Grade 7 done! 50 XP!',
    steps: [
      Step([
        Say('Minor chords. This is where emotion lives.'),
        PauseSeg(400),
        Say('Same formula as major, but flipped. 3 half steps first, then 4.'),
      ]),
      Step([
        Say('A Minor. Possibly the most iconic chord in pop music.', gapMs: 700),
        Chord(['A3', 'C4', 'E4'], color: 'magenta', waitMs: 2000),
        Say('A, C, E. Instantly emotional.'),
        PauseSeg(500),
        Say('Now the Axis Progression. Am, F, C, G. Used in Despacito, Faded, Someone Like You.', gapMs: 700),
        Chord(['A3', 'C4', 'E4'], color: 'magenta', waitMs: 1600),
        Chord(['F3', 'A3', 'C4'], color: 'yellow', waitMs: 1600),
        Chord(['C4', 'E4', 'G4'], color: 'cyan', waitMs: 1600),
        Chord(['G3', 'B3', 'D4'], color: 'green', waitMs: 1600),
        Say('Four chords. Thousands of songs.'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'What makes A Minor different from A Major?',
          sub: 'A Major is A C# E. A Minor is A C E',
          options: [
            'The root is different',
            'The 3rd is lower by a half step',
            'The 5th is higher',
            'All notes change',
          ],
          answer: 'The 3rd is lower by a half step',
          explain: 'C# becomes C, one half step drop. Same root, same 5th, just a flattened 3rd creates the minor sound.',
        )),
      ]),
    ],
  ),

  // ============================ GRADE 8 ============================
  'g8': const Lesson(
    id: 'g8',
    title: 'Grade 8: Progressions & Roman Numerals',
    complete: 'Chord progressions, the grammar of music. You speak it now. Grade 8 done! 50 XP!',
    steps: [
      Step([
        Say('Music follows patterns that feel natural to our ears.'),
        PauseSeg(400),
        Say('These are called progressions. Theorists label them with Roman numerals.'),
        PauseSeg(300),
        Say('In C Major: I is C, IV is F, V is G, vi is A minor.'),
      ]),
      Step([
        Say('The most used progression in recorded music. I, V, six, IV.', gapMs: 700),
        Chord(['C4', 'E4', 'G4'], color: 'cyan', waitMs: 1500),
        Chord(['G3', 'B3', 'D4'], color: 'green', waitMs: 1500),
        Chord(['A3', 'C4', 'E4'], color: 'magenta', waitMs: 1500),
        Chord(['F3', 'A3', 'C4'], color: 'yellow', waitMs: 1500),
        Say('Let It Be. No Woman No Cry. Someone Like You. All of them.'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'In C Major, what chord is the vi?',
          options: ['F Major', 'G Major', 'D Minor', 'A Minor'],
          answer: 'A Minor',
          explain:
              'Count from C: I is C, ii is D, iii is E, IV is F, V is G, vi is A. The 6th note is A, and vi is always minor.',
        )),
      ]),
    ],
  ),

  // ============================ GRADE 9 ============================
  'g9': const Lesson(
    id: 'g9',
    title: 'Grade 9: Circle of Fifths',
    complete: 'The Circle of Fifths is in your toolkit now. Grade 9 done! 50 XP!',
    steps: [
      Step([
        Say('One diagram. Rules everything in music theory.'),
        PauseSeg(400),
        Say('The Circle of Fifths. All 12 keys in a circle, each a perfect 5th apart.'),
      ]),
      Step([
        Say('Watch. C Major, then G, then D, then A.', gapMs: 700),
        Chord(['C4', 'E4', 'G4'], color: 'cyan', waitMs: 1800),
        Chord(['G3', 'B3', 'D4'], color: 'yellow', waitMs: 1800),
        Chord(['D4', 'Gb4', 'A4'], color: 'green', waitMs: 1800),
        Chord(['A3', 'Db4', 'E4'], color: 'orange', waitMs: 1800),
        Say('Keys next to each other always sound great together.'),
      ]),
      Step([
        Say('Relative minors. C Major and A Minor share all the same notes.', gapMs: 700),
        Chord(['C4', 'E4', 'G4'], color: 'cyan', waitMs: 1800),
        Chord(['A3', 'C4', 'E4'], color: 'magenta', waitMs: 1800),
        Say('C Major is the day. A Minor is the night.'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'What is the relative minor of C Major?',
          sub: 'They share the exact same notes',
          options: ['C Minor', 'G Minor', 'E Minor', 'A Minor'],
          answer: 'A Minor',
          explain: 'A Minor uses the same notes as C Major but starts on A, giving it a darker mood.',
        )),
      ]),
    ],
  ),

  // ============================ GRADE 10 ===========================
  'g10': const Lesson(
    id: 'g10',
    title: 'Grade 10: Seventh Chords & Jazz',
    complete: 'Seventh chords, welcome to jazz and R&B. Grade 10 done! 50 XP!',
    steps: [
      Step([
        Say('You know triads. Three notes. Add one more on top.'),
        PauseSeg(300),
        Say('Seventh chords. Four notes. Instantly more sophisticated.'),
      ]),
      Step([
        Say('C Major 7. Dreamy. Floating.', gapMs: 700),
        Chord(['C4', 'E4', 'G4', 'B4'], color: 'cyan', waitMs: 2200),
        Say('C Minor 7. Smooth. Soulful.', gapMs: 700),
        Chord(['C4', 'Eb4', 'G4', 'Bb4'], color: 'magenta', waitMs: 2200),
        Say('C Dominant 7. Tense. Wants to resolve.', gapMs: 700),
        Chord(['C4', 'E4', 'G4', 'Bb4'], color: 'orange', waitMs: 2200),
      ]),
      Step([
        Say('The ii-V-I. The most important jazz progression.', gapMs: 700),
        Chord(['D4', 'F4', 'A4', 'C5'], color: 'yellow', waitMs: 1800),
        Chord(['G3', 'B3', 'D4', 'F4'], color: 'orange', waitMs: 1800),
        Chord(['C4', 'E4', 'G4', 'B4'], color: 'cyan', waitMs: 2000),
        Say('Tension and release. That is the heartbeat of jazz.'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'Which 7th chord creates the most tension and demands resolution?',
          options: ['Major 7', 'Minor 7', 'Dominant 7', 'Minor Major 7'],
          answer: 'Dominant 7',
          explain: 'Dominant 7 creates intense tension that demands resolution. It is the engine of jazz harmony.',
        )),
      ]),
    ],
  ),

  // ============================ GRADE 11 ===========================
  'g11': const Lesson(
    id: 'g11',
    title: 'Grade 11: Inversions & Voice Leading',
    complete: 'Voice leading is what makes pianists sound effortless. Grade 11 done! 50 XP!',
    steps: [
      Step([
        Say('Here is what separates beginners from polished pianists.'),
        PauseSeg(400),
        Say('Inversions. Same chord, different note on the bottom.'),
      ]),
      Step([
        Say('C Major root position.', gapMs: 700),
        Chord(['C4', 'E4', 'G4'], color: 'cyan', waitMs: 1800),
        Say('First inversion. E on the bottom.', gapMs: 700),
        Chord(['E4', 'G4', 'C5'], color: 'yellow', waitMs: 1800),
        Say('Second inversion. G on the bottom.', gapMs: 700),
        Chord(['G4', 'C5', 'E5'], color: 'orange', waitMs: 1800),
        Say('Same three notes. Three different flavors.'),
      ]),
      Step([
        Say('Smooth voice leading. C to F to G with inversions.', gapMs: 800),
        Chord(['C4', 'E4', 'G4'], color: 'cyan', waitMs: 1600),
        Chord(['C4', 'F4', 'A4'], color: 'yellow', waitMs: 1600),
        Chord(['B3', 'D4', 'G4'], color: 'green', waitMs: 1600),
        Say('Smooth. Effortless. That is voice leading.'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'In 1st inversion of C Major, which note is on the bottom?',
          options: ['C', 'G', 'E', 'B'],
          answer: 'E',
          explain: '1st inversion puts the 3rd on the bottom. E is lowest, giving it a lighter feel.',
        )),
      ]),
    ],
  ),

  // ============================ GRADE 12 ===========================
  'g12': const Lesson(
    id: 'g12',
    title: 'Grade 12: Bringing It All Together',
    complete:
        'All 12 grades complete! You think like a musician now. Go sit at a real piano and play!',
    steps: [
      Step([
        Say('Grade 12. Everything comes together right here.'),
        PauseSeg(400),
        Say('Notes, scales, chords, progressions, circle of fifths, sevenths, inversions.'),
        PauseSeg(400),
        Say('Let us use it all to play real music.'),
      ]),
      Step([
        Say('Let It Be by The Beatles. Four chords. That is the whole song.', gapMs: 700),
        Chord(['C4', 'E4', 'G4'], color: 'cyan', waitMs: 1600),
        Chord(['G3', 'B3', 'D4'], color: 'green', waitMs: 1600),
        Chord(['A3', 'C4', 'E4'], color: 'magenta', waitMs: 1600),
        Chord(['F3', 'A3', 'C4'], color: 'yellow', waitMs: 1600),
        Say('One of the most beloved songs ever. Four chords.'),
      ]),
      Step([
        Say('Axis Progression. Thousands of hits.', gapMs: 800),
        Chord(['A3', 'C4', 'E4'], color: 'magenta', waitMs: 1600),
        Chord(['F3', 'A3', 'C4'], color: 'yellow', waitMs: 1600),
        Chord(['C4', 'E4', 'G4'], color: 'cyan', waitMs: 1600),
        Chord(['G3', 'B3', 'D4'], color: 'green', waitMs: 1600),
        Say('Despacito. Faded. Apologize. All of them.'),
      ]),
      Step([
        QuizSeg(Mcq(
          question: 'The vi chord in C Major is which chord?',
          sub: 'Count: I is C, ii is D, iii is E, IV is F, V is G, vi is?',
          options: ['F Major', 'G Major', 'A Minor', 'B Diminished'],
          answer: 'A Minor',
          explain:
              'The 6th degree of C Major is A, and vi is always minor. That is why Am is called the relative minor of C Major.',
        )),
      ]),
    ],
  ),

  // ===================== Posture (after Grade 1) ===================
  'l1-posture': const Lesson(
    id: 'l1-posture',
    title: 'Posture & Hand Position',
    complete: 'Great posture! Relaxed shoulders, curved fingers. 50 XP!',
    steps: [
      Step([
        Say('Before more notes, let us sit right — it makes everything easier.'),
        PauseSeg(400),
        Say('Sit tall. Relax your shoulders. Elbows level with the keys.'),
        PauseSeg(300),
        Say('Curve your fingers as if holding an egg — fingertips strike straight down.'),
      ]),
      Step([
        Say('Place your right thumb on Middle C and press gently.', gapMs: 600),
        Chord(['C4'], color: 'green', waitMs: 1800),
        Say('Perfect. That is your home base. Relaxed and round.'),
      ]),
    ],
  ),

  // ===================== Practice songs ============================
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
  'l4-canon': const Lesson(
    id: 'l4-canon',
    title: 'Song: Canon in D',
    complete: 'Pachelbel Canon — the most-used progression ever. 50 XP!',
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
  'l5-river': const Lesson(
    id: 'l5-river',
    title: 'Song: River Flows in You',
    complete: 'Yiruma classic — your first real solo piece. 50 XP!',
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

/// True once a lesson has full authored content (vs. the "coming soon"
/// placeholder). Gates entry + reward so empty lessons don't grant XP.
bool lessonAuthored(String id) => lessons.containsKey(id);

/// Lesson kind for XP scaling (defaults to song for ad-hoc/OMR lessons).
LessonKind lessonKindFor(String id) {
  for (final m in lessonCatalog) {
    if (m.id == id) return m.kind;
  }
  return LessonKind.song;
}
