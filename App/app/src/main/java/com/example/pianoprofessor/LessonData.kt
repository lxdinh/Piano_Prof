package com.example.pianoprofessor

data class Lesson(
    val id: Int,
    val title: String,
    val complete: String,
    val steps: List<Step>
)

data class Step(
    val segments: List<Segment>
)

sealed class Segment {
    data class Say(val text: String, val rate: Float = 0.88f, val pitch: Float = 1.05f, val gap: Long = 200) : Segment()
    data class Pause(val ms: Long) : Segment()
    data class Chord(val notes: List<String>, val color: String = "cyan", val wait: Long = 1400, val snd: Boolean = true) : Segment()
    data class Seq(val notes: List<String>, val color: String = "cyan", val delay: Long = 420, val wait: Long = 500, val snd: Boolean = true) : Segment()
    data class SeqAll(val notes: List<String>, val color: String = "cyan", val delay: Long = 420, val wait: Long = 500, val snd: Boolean = true) : Segment()
    data class Quiz(val quiz: QuizData) : Segment()
}

sealed class QuizData {
    abstract val question: String
    abstract val sub: String

    data class MCQ(
        override val question: String,
        override val sub: String = "",
        val options: List<String>,
        val answer: String,
        val explain: String = ""
    ) : QuizData()

    data class Key(
        override val question: String,
        override val sub: String = "",
        val target: String
    ) : QuizData()
}

val LESSONS = mapOf(
    1 to Lesson(
        id = 1,
        title = "Grade 1: Piano Layout & 1-3-5 Chords",
        complete = "Amazing work! You have completed Grade 1. You understand the piano layout and the 1-3-5 chord pattern. 50 XP earned!",
        steps = listOf(
            Step(segments = listOf(
                Segment.Say("Hello everyone, welcome! I am your AI piano instructor."),
                Segment.Pause(500),
                Segment.Say("Our goal in this course is simple: to play real songs you actually love.", rate = 0.87f),
                Segment.Pause(400),
                Segment.Say("And the secret to that? Chords. Not scales. Not sheet music. Chords first.", rate = 0.86f),
                Segment.Pause(400),
                Segment.Say("But before chords, let me show you something beautiful.", rate = 0.85f, gap = 700),
                Segment.Chord(listOf("C4", "E4", "G4", "B4"), color = "cyan", wait = 2500),
                Segment.Say("That is a C Major 7 chord. Four notes. One moment. Already beautiful.", rate = 0.86f),
                Segment.Pause(400),
                Segment.Say("By the end of this course, that is the level you will play at.", rate = 0.88f, pitch = 1.1f)
            )),
            Step(segments = listOf(
                Segment.Say("First, let me show you the layout of this instrument.", rate = 0.87f),
                Segment.Pause(400),
                Segment.Say("A piano has only seven letter names. A, B, C, D, E, F, G. Then it repeats.", rate = 0.86f),
                Segment.Pause(300),
                Segment.Say("That repeating group of 12 keys is called an octave. Watch.", rate = 0.85f, gap = 700),
                Segment.SeqAll(listOf("C2", "C3", "C4", "C5", "C6"), color = "cyan", delay = 700),
                Segment.Say("Every glowing key is called C. Same note, different octave.", rate = 0.86f, pitch = 1.05f),
                Segment.Pause(500),
                Segment.Say("C is always to the LEFT of the group of two black keys. That is your anchor.", rate = 0.85f)
            )),
            Step(segments = listOf(
                Segment.Say("Now. The finger exercise. This is how we build the connection between your brain and your fingers.", rate = 0.86f),
                Segment.Pause(400),
                Segment.Say("We call this the 1 through 8 exercise. Starting on Middle C, you play eight notes up the scale.", rate = 0.85f, gap = 700),
                Segment.SeqAll(listOf("C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"), color = "cyan", delay = 380),
                Segment.Say("C, D, E, F, G, A, B, C. Eight notes. All white keys.", rate = 0.86f),
                Segment.Pause(500),
                Segment.Say("The requirement? It must be even. Continuous. Smooth. Like a machine, but with feeling.", rate = 0.85f),
                Segment.Pause(400),
                Segment.Say("Not fast. Not impressive. Just steady. That is what passing looks like.", rate = 0.84f)
            )),
            Step(segments = listOf(
                Segment.Say("Now here is where it gets interesting.", rate = 0.9f, pitch = 1.1f),
                Segment.Pause(400),
                Segment.Say("Instead of playing consecutive notes like Do Re Mi Fa Sol...", rate = 0.86f, gap = 700),
                Segment.Seq(listOf("C4", "D4", "E4", "F4", "G4"), color = "cyan", delay = 380),
                Segment.Say("...we are going to skip fingers. Like this.", rate = 0.85f, gap = 700),
                Segment.Seq(listOf("C4", "E4", "G4", "E4", "C4"), color = "yellow", delay = 480),
                Segment.Say("Do, Mi, Sol, Mi, Do. We call this the 1-3-5 pattern.", rate = 0.86f),
                Segment.Pause(500),
                Segment.Say("Thumb is finger 1. Middle finger is finger 3. Pinky is finger 5.", rate = 0.85f),
                Segment.Pause(400),
                Segment.Say("So 1-3-5 means: thumb, middle, pinky. Those three fingers form a chord shape.", rate = 0.85f, pitch = 1.05f)
            )),
            Step(segments = listOf(
                Segment.Say("Why are we doing this? Great question. Let me show you.", rate = 0.88f, pitch = 1.1f, gap = 700),
                Segment.Chord(listOf("C3", "G3"), color = "magenta", wait = 2000),
                Segment.Say("That is a left hand chord bass note. Now add the right hand melody.", rate = 0.86f, gap = 700),
                Segment.Seq(listOf("E5", "D5", "C5", "G4"), color = "cyan", delay = 500),
                Segment.Say("Now combine them together. This is how River Flows in You starts.", rate = 0.85f, gap = 800),
                Segment.Chord(listOf("C3", "C4", "E4", "G4"), color = "cyan", wait = 2200),
                Segment.Chord(listOf("G2", "D4", "Gb4", "A4"), color = "yellow", wait = 2200),
                Segment.Chord(listOf("A2", "C4", "E4", "A4"), color = "magenta", wait = 2200),
                Segment.Chord(listOf("E2", "B3", "E4", "G4"), color = "green", wait = 2200),
                Segment.Say("Beautiful, right? The left hand plays chords. The right hand plays melody. That is all it is.", rate = 0.85f),
                Segment.Pause(400),
                Segment.Say("To reach that level, you must play chords very well. So let us build that foundation now.", rate = 0.86f, pitch = 1.05f)
            )),
            Step(segments = listOf(
                Segment.Say("Here is the core exercise for today. Let me break it down step by step.", rate = 0.87f),
                Segment.Pause(400),
                Segment.Say("Right hand position. Place your thumb on Middle C. That is finger 1.", rate = 0.86f, gap = 700),
                Segment.Chord(listOf("C4"), color = "yellow", wait = 1200),
                Segment.Say("Skip a finger. Middle finger on E. That is finger 3.", rate = 0.86f, gap = 700),
                Segment.Chord(listOf("E4"), color = "yellow", wait = 1200),
                Segment.Say("Skip again. Pinky on G. That is finger 5.", rate = 0.86f, gap = 700),
                Segment.Chord(listOf("G4"), color = "yellow", wait = 1200),
                Segment.Say("1, 3, 5. C, E, G. Those three keys form a C Major chord.", rate = 0.86f, pitch = 1.05f),
                Segment.Pause(500),
                Segment.Say("Now you will play them one at a time in a broken pattern. C, E, G, E. Count: 1, 2, 3, 4.", rate = 0.85f, gap = 700),
                Segment.Seq(listOf("C4", "E4", "G4", "E4"), color = "cyan", delay = 500),
                Segment.Say("That is your right hand exercise. Steady count. 1, 2, 3, 4.", rate = 0.86f)
            )),
            Step(segments = listOf(
                Segment.Say("Now we add the left hand.", rate = 0.88f, pitch = 1.1f),
                Segment.Pause(400),
                Segment.Say("The left hand is simple. It plays the root note on beat 1 only.", rate = 0.86f),
                Segment.Pause(300),
                Segment.Say("So when your right thumb plays C on beat 1, your left hand also plays C at the same time.", rate = 0.85f, gap = 800),
                Segment.Chord(listOf("C3", "C4"), color = "cyan", wait = 2000),
                Segment.Say("Then the right hand continues: 2, 3, 4. Left hand holds.", rate = 0.86f, gap = 700),
                Segment.Seq(listOf("E4", "G4", "E4"), color = "cyan", delay = 500),
                Segment.Say("Left hand down together on 1. Right hand alone for 2, 3, 4. That is the pattern.", rate = 0.85f, pitch = 1.05f)
            )),
            Step(segments = listOf(
                Segment.Say("Now we move through the scale. We start on Do. Then shift to Re.", rate = 0.86f, gap = 800),
                Segment.Chord(listOf("C3", "C4"), color = "cyan", wait = 1200),
                Segment.Seq(listOf("E4", "G4", "E4"), color = "cyan", delay = 400),
                Segment.Chord(listOf("D3", "D4"), color = "yellow", wait = 1200),
                Segment.Seq(listOf("F4", "A4", "F4"), color = "yellow", delay = 400),
                Segment.Chord(listOf("E3", "E4"), color = "green", wait = 1200),
                Segment.Seq(listOf("G4", "B4", "G4"), color = "green", delay = 400),
                Segment.Say("Do to Re to Mi. Each time, your whole hand shifts one note to the right.", rate = 0.85f),
                Segment.Pause(500),
                Segment.Say("Continue up to Sol, then back down to Do. That is the full exercise.", rate = 0.86f, gap = 800),
                Segment.Chord(listOf("F3", "F4"), color = "magenta", wait = 1200),
                Segment.Seq(listOf("A4", "C5", "A4"), color = "magenta", delay = 400),
                Segment.Chord(listOf("G3", "G4"), color = "orange", wait = 1200),
                Segment.Seq(listOf("B4", "D5", "B4"), color = "orange", delay = 400),
                Segment.Say("Up to Sol. Now back down.", rate = 0.85f, gap = 700),
                Segment.Chord(listOf("F3", "F4"), color = "magenta", wait = 1200),
                Segment.Chord(listOf("E3", "E4"), color = "green", wait = 1200),
                Segment.Chord(listOf("D3", "D4"), color = "yellow", wait = 1200),
                Segment.Chord(listOf("C3", "C4"), color = "cyan", wait = 1500),
                Segment.Say("And back to Do. The hardest part? Going from Sol back down without losing the beat.", rate = 0.85f, pitch = 1.05f)
            )),
            Step(segments = listOf(
                Segment.Say("Now the standard. The requirement for this lesson.", rate = 0.87f, pitch = 1.05f),
                Segment.Pause(400),
                Segment.Say("You must play continuously. No stopping. No pausing between chords.", rate = 0.86f),
                Segment.Pause(300),
                Segment.Say("If you stop between chords, you are losing the beat. That is the one thing we do not do.", rate = 0.85f),
                Segment.Pause(500),
                Segment.Say("Start slow. Count out loud first: 1, 2, 3, 4. Then add the notes.", rate = 0.85f),
                Segment.Pause(400),
                Segment.Say("Slow and steady beats fast and sloppy. Every single time.", rate = 0.88f, pitch = 1.1f)
            )),
            Step(segments = listOf(
                Segment.Say("Once you can do Do to Sol and back without mistakes, try chord progressions.", rate = 0.86f),
                Segment.Pause(400),
                Segment.Say("You can jump from any chord to any chord. Like this.", rate = 0.85f, gap = 700),
                Segment.Chord(listOf("C3", "C4"), color = "cyan", wait = 1400),
                Segment.Chord(listOf("G3", "G4"), color = "green", wait = 1400),
                Segment.Chord(listOf("A3", "A4"), color = "magenta", wait = 1400),
                Segment.Chord(listOf("E3", "E4"), color = "yellow", wait = 1400),
                Segment.Say("Do, Sol, La, Mi. Already sounds musical.", rate = 0.86f),
                Segment.Pause(500),
                Segment.Say("Here is a famous one. This is Canon in D.", rate = 0.87f, pitch = 1.1f, gap = 700),
                Segment.Chord(listOf("D4", "Gb4", "A4"), color = "cyan", wait = 1600),
                Segment.Chord(listOf("A3", "Db4", "E4"), color = "yellow", wait = 1600),
                Segment.Chord(listOf("B3", "Eb4", "Gb4"), color = "magenta", wait = 1600),
                Segment.Chord(listOf("Gb3", "A3", "Db4"), color = "green", wait = 1600),
                Segment.Chord(listOf("G3", "B3", "D4"), color = "cyan", wait = 1600),
                Segment.Chord(listOf("D3", "Gb3", "A3"), color = "yellow", wait = 1600),
                Segment.Chord(listOf("G3", "B3", "D4"), color = "magenta", wait = 1600),
                Segment.Chord(listOf("A3", "Db4", "E4"), color = "orange", wait = 1600),
                Segment.Say("That progression is Canon in D. One of the most used progressions in all of music.", rate = 0.85f),
                Segment.Pause(400),
                Segment.Say("Your goal is to play any progression like that. Smooth. Continuous. No gaps.", rate = 0.86f, pitch = 1.05f)
            )),
            Step(segments = listOf(
                Segment.Say("Let me end with a quiz to check your understanding.", rate = 0.88f),
                Segment.Quiz(QuizData.MCQ(
                    question = "In the 1-3-5 exercise starting on C, which three keys do you play?",
                    sub = "Think: finger 1 is thumb, finger 3 is middle, finger 5 is pinky",
                    options = listOf("C, D, E", "C, E, G", "C, F, G", "D, F, A"),
                    answer = "C, E, G",
                    explain = "Finger 1 (thumb) on C, finger 3 (middle) on E, finger 5 (pinky) on G. That is the C Major chord shape — the foundation of everything!"
                ))
            )),
            Step(segments = listOf(
                Segment.Say("Excellent! C, E, G. The C Major chord. You have got it.", rate = 0.88f, pitch = 1.1f),
                Segment.Pause(400),
                Segment.Chord(listOf("C4", "E4", "G4"), color = "green", wait = 2000),
                Segment.Say("Practice the exercise from Do up to Sol and back. Slow first, then gradually faster.", rate = 0.86f),
                Segment.Pause(400),
                Segment.Say("Master this, and we will move on to Lesson 2. Happy practicing!", rate = 0.87f, pitch = 1.05f),
                Segment.Pause(500),
                Segment.Chord(listOf("C4", "E4", "G4", "C5"), color = "cyan", wait = 2500)
            ))
        )
    ),
    2 to Lesson(
        id = 2,
        title = "Grade 2: Landmarks & Navigation",
        complete = "Grade 2 done! You can navigate the keyboard like a pro. 50 XP!",
        steps = listOf(
            Step(segments = listOf(
                Segment.Say("Now let us fill in your map.", rate = 0.88f, pitch = 1.05f),
                Segment.Pause(300),
                Segment.Say("You know C. Now meet the other landmark: F.", rate = 0.87f, gap = 500),
                Segment.Chord(listOf("F4"), color = "yellow", wait = 1200),
                Segment.Say("F is always to the LEFT of the group of three black keys.", rate = 0.88f),
                Segment.Pause(400),
                Segment.Say("C and F. Two anchors. The whole keyboard flows from just these two.", rate = 0.86f, pitch = 1.05f)
            )),
            Step(segments = listOf(
                Segment.Say("Between the 2 black keys you have C, D, E.", rate = 0.87f, gap = 600),
                Segment.SeqAll(listOf("C4", "D4", "E4"), color = "cyan", delay = 500),
                Segment.Say("Around the 3 black keys you have F, G, A, B.", rate = 0.87f, gap = 600),
                Segment.SeqAll(listOf("F4", "G4", "A4", "B4"), color = "yellow", delay = 500),
                Segment.Say("Seven notes. Then it repeats. That is the whole pattern.", rate = 0.86f)
            )),
            Step(segments = listOf(
                Segment.Say("Now I want YOU to find a note. Ready?", rate = 0.9f, pitch = 1.1f),
                Segment.Pause(400),
                Segment.Say("Find Middle C on the keyboard below and press it.", rate = 0.87f),
                Segment.Quiz(QuizData.Key(question = "Press Middle C (C4) on the keyboard!", sub = "Look for the group of 2 black keys at the center", target = "C4"))
            )),
            Step(segments = listOf(
                Segment.Say("Now find F4. Left of the 3 black keys.", rate = 0.9f, pitch = 1.1f, gap = 500),
                Segment.Quiz(QuizData.Key(question = "Press F4 on the keyboard!", sub = "Left of the group of 3 black keys", target = "F4"))
            ))
        )
    ),
    3 to Lesson(
        id = 3,
        title = "Grade 3: Half Steps & Whole Steps",
        complete = "Half steps and whole steps. You have got the DNA of music now. Grade 3 done! 50 XP!",
        steps = listOf(
            Step(segments = listOf(
                Segment.Say("This is where music theory actually clicks.", rate = 0.88f, pitch = 1.08f),
                Segment.Pause(300),
                Segment.Say("Everything in music is built from just two distances.", rate = 0.86f),
                Segment.Pause(400),
                Segment.Say("A half step. And a whole step. That is it.", rate = 0.84f, pitch = 1.1f)
            )),
            Step(segments = listOf(
                Segment.Say("A half step is the smallest possible move. One key over.", rate = 0.87f, gap = 600),
                Segment.Seq(listOf("E4", "F4"), color = "cyan", delay = 700),
                Segment.Say("E to F. One half step. No black key between them.", rate = 0.86f),
                Segment.Pause(500),
                Segment.Say("Same here.", rate = 0.85f, gap = 600),
                Segment.Seq(listOf("B4", "C5"), color = "yellow", delay = 700),
                Segment.Say("B to C. Another natural half step. No black key.", rate = 0.86f, pitch = 1.05f)
            )),
            Step(segments = listOf(
                Segment.Say("A whole step skips one key.", rate = 0.87f, gap = 600),
                Segment.Seq(listOf("C4", "D4"), color = "cyan", delay = 700),
                Segment.Say("C to D. One whole step. There is a black key in between.", rate = 0.86f),
                Segment.Pause(400),
                Segment.Say("Now the chromatic scale. Every single half step in order.", rate = 0.85f, gap = 700),
                Segment.Seq(listOf("C4", "Db4", "D4", "Eb4", "E4", "F4", "Gb4", "G4", "Ab4", "A4", "Bb4", "B4", "C5"), color = "cyan", delay = 280),
                Segment.Say("Twelve half steps. One octave.", rate = 0.87f, pitch = 1.1f)
            )),
            Step(segments = listOf(
                Segment.Quiz(QuizData.MCQ(
                    question = "E to F is which kind of step?",
                    sub = "There is no black key between E and F",
                    options = listOf("Whole step", "Half step", "Octave", "Third"),
                    answer = "Half step",
                    explain = "E to F is a half step, one of only two natural half steps on the keyboard. The other is B to C."
                ))
            ))
        )
    ),
    4 to Lesson(
        id = 4,
        title = "Grade 4: Major Scale Formula",
        complete = "You learned the formula that unlocks every major scale. Grade 4 done! 50 XP!",
        steps = listOf(
            Step(segments = listOf(
                Segment.Say("Ready for the most powerful formula in music?", rate = 0.9f, pitch = 1.1f),
                Segment.Pause(400),
                Segment.Say("Every major scale follows the exact same pattern.", rate = 0.87f),
                Segment.Pause(300),
                Segment.Say("Whole, Whole, Half, Whole, Whole, Whole, Half.", rate = 0.82f, pitch = 1.05f),
                Segment.Pause(500),
                Segment.Say("Learn this once and you can build a major scale from any note.", rate = 0.86f)
            )),
            Step(segments = listOf(
                Segment.Say("C Major is the easiest. All white keys.", rate = 0.88f, gap = 500),
                Segment.SeqAll(listOf("C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"), color = "cyan", delay = 420),
                Segment.Say("C, D, E, F, G, A, B, C. Eight notes. All white.", rate = 0.86f)
            )),
            Step(segments = listOf(
                Segment.Say("Now G Major. Same formula, different start.", rate = 0.87f, gap = 600),
                Segment.SeqAll(listOf("G4", "A4", "B4", "C5", "D5", "E5", "Gb5", "G5"), color = "yellow", delay = 420),
                Segment.Say("Almost all white keys, but one black key sneaks in.", rate = 0.86f, pitch = 1.05f, gap = 500),
                Segment.Chord(listOf("Gb5"), color = "orange", wait = 1200),
                Segment.Say("F sharp. The formula forced a half step there, landing on a black key.", rate = 0.85f)
            )),
            Step(segments = listOf(
                Segment.Quiz(QuizData.MCQ(
                    question = "What is the major scale formula?",
                    sub = "This pattern works starting on any note",
                    options = listOf("W-H-W-W-H-W-W", "W-W-H-W-W-W-H", "H-W-W-H-W-W-W", "W-W-W-H-W-W-H"),
                    answer = "W-W-H-W-W-W-H",
                    explain = "W-W-H-W-W-W-H is the major scale formula. Learn it once, use it in all 12 keys forever!"
                ))
            ))
        )
    ),
    5 to Lesson(
        id = 5,
        title = "Grade 5: Minor Scale & Emotions",
        complete = "You hear the difference now. That is real ear training. Grade 5 done! 50 XP!",
        steps = listOf(
            Step(segments = listOf(
                Segment.Say("If major is sunshine, minor is the golden hour.", rate = 0.85f, pitch = 1.05f),
                Segment.Pause(500),
                Segment.Say("Same idea. Different formula. Totally different feeling.", rate = 0.86f),
                Segment.Pause(300),
                Segment.Say("Minor formula: Whole, Half, Whole, Whole, Half, Whole, Whole.", rate = 0.82f)
            )),
            Step(segments = listOf(
                Segment.Say("Listen to C Major first.", rate = 0.87f, gap = 600),
                Segment.SeqAll(listOf("C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"), color = "cyan", delay = 400),
                Segment.Say("Bright. Happy. Resolved.", rate = 0.84f, pitch = 1.05f),
                Segment.Pause(600),
                Segment.Say("Now C Natural Minor.", rate = 0.87f, gap = 600),
                Segment.SeqAll(listOf("C4", "D4", "Eb4", "F4", "G4", "Ab4", "Bb4", "C5"), color = "magenta", delay = 400),
                Segment.Say("Darker. More emotional. Three black keys now.", rate = 0.84f)
            )),
            Step(segments = listOf(
                Segment.Say("Here is the key insight. Listen closely.", rate = 0.87f, pitch = 1.1f, gap = 700),
                Segment.Chord(listOf("C4", "E4", "G4"), color = "cyan", wait = 1800),
                Segment.Say("C Major. Now I change just one note.", rate = 0.85f, gap = 800),
                Segment.Chord(listOf("C4", "Eb4", "G4"), color = "magenta", wait = 1800),
                Segment.Say("C Minor. One half step lower on the middle note. That is the entire emotional shift.", rate = 0.85f, pitch = 1.08f)
            )),
            Step(segments = listOf(
                Segment.Quiz(QuizData.MCQ(
                    question = "What changes C Major into C Minor?",
                    sub = "C Major is C E G. C Minor is C Eb G",
                    options = listOf("Lower the root by a half step", "Lower the 3rd by a half step", "Raise the 5th by a half step", "Lower all notes"),
                    answer = "Lower the 3rd by a half step",
                    explain = "Lowering the 3rd from E to Eb creates the minor sound. This works for any chord!"
                ))
            ))
        )
    ),
    6 to Lesson(
        id = 6,
        title = "Grade 6: Major Chords (I, IV, V)",
        complete = "Three chords. Hundreds of songs. Grade 6 is yours! 50 XP!",
        steps = listOf(
            Step(segments = listOf(
                Segment.Say("Now we are cooking.", rate = 0.9f, pitch = 1.1f),
                Segment.Pause(300),
                Segment.Say("A chord is three or more notes played at the same time.", rate = 0.87f),
                Segment.Pause(300),
                Segment.Say("Every major chord uses the same shape. Root, plus 4 half steps, plus 3 more.", rate = 0.85f)
            )),
            Step(segments = listOf(
                Segment.Say("C Major.", rate = 0.87f, gap = 700),
                Segment.Chord(listOf("C4", "E4", "G4"), color = "cyan", wait = 2000),
                Segment.Say("C, E, G. Full and resolved.", rate = 0.86f, pitch = 1.05f),
                Segment.Pause(500),
                Segment.Say("F Major. Same shape, new root.", rate = 0.87f, gap = 700),
                Segment.Chord(listOf("F4", "A4", "C5"), color = "yellow", wait = 2000),
                Segment.Say("F, A, C. Warmer. More open.", rate = 0.86f)
            )),
            Step(segments = listOf(
                Segment.Say("G Major. The third of the trio.", rate = 0.87f, gap = 700),
                Segment.Chord(listOf("G4", "B4", "D5"), color = "green", wait = 2000),
                Segment.Say("G, B, D. Feels like it wants to go somewhere.", rate = 0.86f, pitch = 1.05f),
                Segment.Pause(500),
                Segment.Say("These three are the I, IV, and V chords of C Major. Used in hundreds of songs. Listen.", rate = 0.84f, gap = 800),
                Segment.Chord(listOf("C4", "E4", "G4"), color = "cyan", wait = 1600),
                Segment.Chord(listOf("F4", "A4", "C5"), color = "yellow", wait = 1600),
                Segment.Chord(listOf("G4", "B4", "D5"), color = "green", wait = 1600),
                Segment.Chord(listOf("C4", "E4", "G4"), color = "cyan", wait = 1600),
                Segment.Say("I, IV, V, I. The backbone of rock, blues, and pop.", rate = 0.86f)
            )),
            Step(segments = listOf(
                Segment.Quiz(QuizData.MCQ(
                    question = "What 3 notes make up C Major?",
                    options = listOf("C D E", "C F G", "C E G", "C Eb G"),
                    answer = "C E G",
                    explain = "C (root) plus E (4 half steps = major 3rd) plus G (3 more half steps = perfect 5th). That is the major chord formula!"
                ))
            ))
        )
    ),
    7 to Lesson(
        id = 7,
        title = "Grade 7: Minor Chords & Axis Progression",
        complete = "You unlocked the most played chord progression in pop history. Grade 7 done! 50 XP!",
        steps = listOf(
            Step(segments = listOf(
                Segment.Say("Minor chords. This is where emotion lives.", rate = 0.86f, pitch = 1.05f),
                Segment.Pause(400),
                Segment.Say("Same formula as major, but flipped. 3 half steps first, then 4.", rate = 0.85f)
            )),
            Step(segments = listOf(
                Segment.Say("A Minor. Possibly the most iconic chord in pop music.", rate = 0.87f, gap = 700),
                Segment.Chord(listOf("A3", "C4", "E4"), color = "magenta", wait = 2000),
                Segment.Say("A, C, E. Instantly emotional.", rate = 0.85f, pitch = 1.05f),
                Segment.Pause(500),
                Segment.Say("Now the Axis Progression. Am, F, C, G. Used in Despacito, Faded, Someone Like You.", rate = 0.86f, gap = 700),
                Segment.Chord(listOf("A3", "C4", "E4"), color = "magenta", wait = 1600),
                Segment.Chord(listOf("F3", "A3", "C4"), color = "yellow", wait = 1600),
                Segment.Chord(listOf("C4", "E4", "G4"), color = "cyan", wait = 1600),
                Segment.Chord(listOf("G3", "B3", "D4"), color = "green", wait = 1600),
                Segment.Say("Four chords. Thousands of songs.", rate = 0.86f, pitch = 1.08f)
            )),
            Step(segments = listOf(
                Segment.Quiz(QuizData.MCQ(
                    question = "What makes A Minor different from A Major?",
                    sub = "A Major is A C# E. A Minor is A C E",
                    options = listOf("The root is different", "The 3rd is lower by a half step", "The 5th is higher", "All notes change"),
                    answer = "The 3rd is lower by a half step",
                    explain = "C# becomes C, one half step drop. Same root, same 5th, just a flattened 3rd creates the minor sound."
                ))
            ))
        )
    ),
    8 to Lesson(
        id = 8,
        title = "Grade 8: Chord Progressions & Roman Numerals",
        complete = "Chord progressions, the grammar of music. You speak it now. Grade 8 done! 50 XP!",
        steps = listOf(
            Step(segments = listOf(
                Segment.Say("Music follows patterns that feel natural to our ears.", rate = 0.86f),
                Segment.Pause(400),
                Segment.Say("These are called progressions. Theorists label them with Roman numerals.", rate = 0.85f),
                Segment.Pause(300),
                Segment.Say("In C Major: I is C, IV is F, V is G, vi is A minor.", rate = 0.83f)
            )),
            Step(segments = listOf(
                Segment.Say("The most used progression in recorded music. I, V, six, IV.", rate = 0.87f, gap = 700),
                Segment.Chord(listOf("C4", "E4", "G4"), color = "cyan", wait = 1500),
                Segment.Chord(listOf("G3", "B3", "D4"), color = "green", wait = 1500),
                Segment.Chord(listOf("A3", "C4", "E4"), color = "magenta", wait = 1500),
                Segment.Chord(listOf("F3", "A3", "C4"), color = "yellow", wait = 1500),
                Segment.Say("Let It Be. No Woman No Cry. Someone Like You. All of them.", rate = 0.85f, pitch = 1.08f)
            )),
            Step(segments = listOf(
                Segment.Quiz(QuizData.MCQ(
                    question = "In C Major, what chord is the vi?",
                    options = listOf("F Major", "G Major", "D Minor", "A Minor"),
                    answer = "A Minor",
                    explain = "Count from C: I is C, ii is D, iii is E, IV is F, V is G, vi is A. The 6th note is A, and vi is always minor."
                ))
            ))
        )
    ),
    9 to Lesson(
        id = 9,
        title = "Grade 9: Circle of Fifths",
        complete = "The Circle of Fifths is in your toolkit now. Grade 9 done! 50 XP!",
        steps = listOf(
            Step(segments = listOf(
                Segment.Say("One diagram. Rules everything in music theory.", rate = 0.87f, pitch = 1.08f),
                Segment.Pause(400),
                Segment.Say("The Circle of Fifths. All 12 keys in a circle, each a perfect 5th apart.", rate = 0.84f)
            )),
            Step(segments = listOf(
                Segment.Say("Watch. C Major, then G, then D, then A.", rate = 0.87f, gap = 700),
                Segment.Chord(listOf("C4", "E4", "G4"), color = "cyan", wait = 1800),
                Segment.Chord(listOf("G3", "B3", "D4"), color = "yellow", wait = 1800),
                Segment.Chord(listOf("D4", "Gb4", "A4"), color = "green", wait = 1800),
                Segment.Chord(listOf("A3", "Db4", "E4"), color = "orange", wait = 1800),
                Segment.Say("Keys next to each other always sound great together.", rate = 0.85f)
            )),
            Step(segments = listOf(
                Segment.Say("Relative minors. C Major and A Minor share all the same notes.", rate = 0.87f, pitch = 1.08f, gap = 700),
                Segment.Chord(listOf("C4", "E4", "G4"), color = "cyan", wait = 1800),
                Segment.Chord(listOf("A3", "C4", "E4"), color = "magenta", wait = 1800),
                Segment.Say("C Major is the day. A Minor is the night.", rate = 0.84f, pitch = 1.08f)
            )),
            Step(segments = listOf(
                Segment.Quiz(QuizData.MCQ(
                    question = "What is the relative minor of C Major?",
                    sub = "They share the exact same notes",
                    options = listOf("C Minor", "G Minor", "E Minor", "A Minor"),
                    answer = "A Minor",
                    explain = "A Minor uses the same notes as C Major but starts on A, giving it a darker mood."
                ))
            ))
        )
    ),
    10 to Lesson(
        id = 10,
        title = "Grade 10: Seventh Chords & Jazz",
        complete = "Seventh chords, welcome to jazz and R&B. Grade 10 done! 50 XP!",
        steps = listOf(
            Step(segments = listOf(
                Segment.Say("You know triads. Three notes. Add one more on top.", rate = 0.87f),
                Segment.Pause(300),
                Segment.Say("Seventh chords. Four notes. Instantly more sophisticated.", rate = 0.86f, pitch = 1.08f)
            )),
            Step(segments = listOf(
                Segment.Say("C Major 7. Dreamy. Floating.", rate = 0.87f, gap = 700),
                Segment.Chord(listOf("C4", "E4", "G4", "B4"), color = "cyan", wait = 2200),
                Segment.Say("C Minor 7. Smooth. Soulful.", rate = 0.87f, gap = 700),
                Segment.Chord(listOf("C4", "Eb4", "G4", "Bb4"), color = "magenta", wait = 2200),
                Segment.Say("C Dominant 7. Tense. Wants to resolve.", rate = 0.87f, gap = 700),
                Segment.Chord(listOf("C4", "E4", "G4", "Bb4"), color = "orange", wait = 2200)
            )),
            Step(segments = listOf(
                Segment.Say("The ii-V-I. The most important jazz progression.", rate = 0.87f, pitch = 1.1f, gap = 700),
                Segment.Chord(listOf("D4", "F4", "A4", "C5"), color = "yellow", wait = 1800),
                Segment.Chord(listOf("G3", "B3", "D4", "F4"), color = "orange", wait = 1800),
                Segment.Chord(listOf("C4", "E4", "G4", "B4"), color = "cyan", wait = 2000),
                Segment.Say("Tension and release. That is the heartbeat of jazz.", rate = 0.85f, pitch = 1.08f)
            )),
            Step(segments = listOf(
                Segment.Quiz(QuizData.MCQ(
                    question = "Which 7th chord creates the most tension and demands resolution?",
                    options = listOf("Major 7", "Minor 7", "Dominant 7", "Minor Major 7"),
                    answer = "Dominant 7",
                    explain = "Dominant 7 creates intense tension that demands resolution. It is the engine of jazz harmony."
                ))
            ))
        )
    ),
    11 to Lesson(
        id = 11,
        title = "Grade 11: Inversions & Voice Leading",
        complete = "Voice leading is what makes pianists sound effortless. Grade 11 done! 50 XP!",
        steps = listOf(
            Step(segments = listOf(
                Segment.Say("Here is what separates beginners from polished pianists.", rate = 0.87f, pitch = 1.08f),
                Segment.Pause(400),
                Segment.Say("Inversions. Same chord, different note on the bottom.", rate = 0.86f)
            )),
            Step(segments = listOf(
                Segment.Say("C Major root position.", rate = 0.87f, gap = 700),
                Segment.Chord(listOf("C4", "E4", "G4"), color = "cyan", wait = 1800),
                Segment.Say("First inversion. E on the bottom.", rate = 0.87f, gap = 700),
                Segment.Chord(listOf("E4", "G4", "C5"), color = "yellow", wait = 1800),
                Segment.Say("Second inversion. G on the bottom.", rate = 0.87f, gap = 700),
                Segment.Chord(listOf("G4", "C5", "E5"), color = "orange", wait = 1800),
                Segment.Say("Same three notes. Three different flavors.", rate = 0.85f, pitch = 1.05f)
            )),
            Step(segments = listOf(
                Segment.Say("Smooth voice leading. C to F to G with inversions.", rate = 0.86f, gap = 800),
                Segment.Chord(listOf("C4", "E4", "G4"), color = "cyan", wait = 1600),
                Segment.Chord(listOf("C4", "F4", "A4"), color = "yellow", wait = 1600),
                Segment.Chord(listOf("B3", "D4", "G4"), color = "green", wait = 1600),
                Segment.Say("Smooth. Effortless. That is voice leading.", rate = 0.84f, pitch = 1.08f)
            )),
            Step(segments = listOf(
                Segment.Quiz(QuizData.MCQ(
                    question = "In 1st inversion of C Major, which note is on the bottom?",
                    options = listOf("C", "G", "E", "B"),
                    answer = "E",
                    explain = "1st inversion puts the 3rd on the bottom. E is lowest, giving it a lighter feel."
                ))
            ))
        )
    ),
    12 to Lesson(
        id = 12,
        title = "Grade 12: Bringing It All Together",
        complete = "All 12 grades complete! You think like a musician now. Go sit at a real piano and play!",
        steps = listOf(
            Step(segments = listOf(
                Segment.Say("Grade 12. Everything comes together right here.", rate = 0.87f, pitch = 1.1f),
                Segment.Pause(400),
                Segment.Say("Notes, scales, chords, progressions, circle of fifths, sevenths, inversions.", rate = 0.84f),
                Segment.Pause(400),
                Segment.Say("Let us use it all to play real music.", rate = 0.88f, pitch = 1.1f)
            )),
            Step(segments = listOf(
                Segment.Say("Let It Be by The Beatles. Four chords. That is the whole song.", rate = 0.87f, gap = 700),
                Segment.Chord(listOf("C4", "E4", "G4"), color = "cyan", wait = 1600),
                Segment.Chord(listOf("G3", "B3", "D4"), color = "green", wait = 1600),
                Segment.Chord(listOf("A3", "C4", "E4"), color = "magenta", wait = 1600),
                Segment.Chord(listOf("F3", "A3", "C4"), color = "yellow", wait = 1600),
                Segment.Say("One of the most beloved songs ever. Four chords.", rate = 0.86f, pitch = 1.08f)
            )),
            Step(segments = listOf(
                Segment.Say("Axis Progression. Thousands of hits.", rate = 0.86f, gap = 800),
                Segment.Chord(listOf("A3", "C4", "E4"), color = "magenta", wait = 1600),
                Segment.Chord(listOf("F3", "A3", "C4"), color = "yellow", wait = 1600),
                Segment.Chord(listOf("C4", "E4", "G4"), color = "cyan", wait = 1600),
                Segment.Chord(listOf("G3", "B3", "D4"), color = "green", wait = 1600),
                Segment.Say("Despacito. Faded. Apologize. All of them.", rate = 0.85f, pitch = 1.05f)
            )),
            Step(segments = listOf(
                Segment.Quiz(QuizData.MCQ(
                    question = "The vi chord in C Major is which chord?",
                    sub = "Count: I is C, ii is D, iii is E, IV is F, V is G, vi is?",
                    options = listOf("F Major", "G Major", "A Minor", "B Diminished"),
                    answer = "A Minor",
                    explain = "The 6th degree of C Major is A, and vi is always minor. That is why Am is called the relative minor of C Major."
                ))
            ))
        )
    )
)
