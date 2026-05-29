// Piano Prof - Lesson Data
// Grade 1: Full structured lesson based on instructor guide
const LESSONS = {};

LESSONS[1] = {
  complete: "Amazing work! You have completed Grade 1. You understand the piano layout and the 1-3-5 chord pattern. 50 XP earned!",
  steps: [
    { segments: [
      { type:'say', text:"Hello everyone, welcome! I am your AI piano instructor." },
      { type:'pause', ms:500 },
      { type:'say', text:"Our goal in this course is simple: to play real songs you actually love.", rate:0.87 },
      { type:'pause', ms:400 },
      { type:'say', text:"And the secret to that? Chords. Not scales. Not sheet music. Chords first.", rate:0.86 },
      { type:'pause', ms:400 },
      { type:'say', text:"But before chords, let me show you something beautiful.", rate:0.85, gap:700 },
      { type:'chord', notes:['C4','E4','G4','B4'], color:'cyan', wait:2500 },
      { type:'say', text:"That is a C Major 7 chord. Four notes. One moment. Already beautiful.", rate:0.86 },
      { type:'pause', ms:400 },
      { type:'say', text:"By the end of this course, that is the level you will play at.", rate:0.88, pitch:1.1 },
    ]},
    { segments: [
      { type:'say', text:"First, let me show you the layout of this instrument.", rate:0.87 },
      { type:'pause', ms:400 },
      { type:'say', text:"A piano has only seven letter names. A, B, C, D, E, F, G. Then it repeats.", rate:0.86 },
      { type:'pause', ms:300 },
      { type:'say', text:"That repeating group of 12 keys is called an octave. Watch.", rate:0.85, gap:700 },
      { type:'seqAll', notes:['C2','C3','C4','C5','C6'], color:'cyan', delay:700 },
      { type:'say', text:"Every glowing key is called C. Same note, different octave.", rate:0.86, pitch:1.05 },
      { type:'pause', ms:500 },
      { type:'say', text:"C is always to the LEFT of the group of two black keys. That is your anchor.", rate:0.85 },
    ]},
    { segments: [
      { type:'say', text:"Now. The finger exercise. This is how we build the connection between your brain and your fingers.", rate:0.86 },
      { type:'pause', ms:400 },
      { type:'say', text:"We call this the 1 through 8 exercise. Starting on Middle C, you play eight notes up the scale.", rate:0.85, gap:700 },
      { type:'seqAll', notes:['C4','D4','E4','F4','G4','A4','B4','C5'], color:'cyan', delay:380 },
      { type:'say', text:"C, D, E, F, G, A, B, C. Eight notes. All white keys.", rate:0.86 },
      { type:'pause', ms:500 },
      { type:'say', text:"The requirement? It must be even. Continuous. Smooth. Like a machine, but with feeling.", rate:0.85 },
      { type:'pause', ms:400 },
      { type:'say', text:"Not fast. Not impressive. Just steady. That is what passing looks like.", rate:0.84 },
    ]},
    { segments: [
      { type:'say', text:"Now here is where it gets interesting.", rate:0.9, pitch:1.1 },
      { type:'pause', ms:400 },
      { type:'say', text:"Instead of playing consecutive notes like Do Re Mi Fa Sol...", rate:0.86, gap:700 },
      { type:'seq', notes:['C4','D4','E4','F4','G4'], color:'cyan', delay:380 },
      { type:'say', text:"...we are going to skip fingers. Like this.", rate:0.85, gap:700 },
      { type:'seq', notes:['C4','E4','G4','E4','C4'], color:'yellow', delay:480 },
      { type:'say', text:"Do, Mi, Sol, Mi, Do. We call this the 1-3-5 pattern.", rate:0.86 },
      { type:'pause', ms:500 },
      { type:'say', text:"Thumb is finger 1. Middle finger is finger 3. Pinky is finger 5.", rate:0.85 },
      { type:'pause', ms:400 },
      { type:'say', text:"So 1-3-5 means: thumb, middle, pinky. Those three fingers form a chord shape.", rate:0.85, pitch:1.05 },
    ]},
    { segments: [
      { type:'say', text:"Why are we doing this? Great question. Let me show you.", rate:0.88, pitch:1.1, gap:700 },
      { type:'chord', notes:['C3','G3'], color:'magenta', wait:2000 },
      { type:'say', text:"That is a left hand chord bass note. Now add the right hand melody.", rate:0.86, gap:700 },
      { type:'seq', notes:['E5','D5','C5','G4'], color:'cyan', delay:500 },
      { type:'say', text:"Now combine them together. This is how River Flows in You starts.", rate:0.85, gap:800 },
      { type:'chord', notes:['C3','C4','E4','G4'], color:'cyan', wait:2200 },
      { type:'chord', notes:['G2','D4','Gb4','A4'], color:'yellow', wait:2200 },
      { type:'chord', notes:['A2','C4','E4','A4'], color:'magenta', wait:2200 },
      { type:'chord', notes:['E2','B3','E4','G4'], color:'green', wait:2200 },
      { type:'say', text:"Beautiful, right? The left hand plays chords. The right hand plays melody. That is all it is.", rate:0.85 },
      { type:'pause', ms:400 },
      { type:'say', text:"To reach that level, you must play chords very well. So let us build that foundation now.", rate:0.86, pitch:1.05 },
    ]},
    { segments: [
      { type:'say', text:"Here is the core exercise for today. Let me break it down step by step.", rate:0.87 },
      { type:'pause', ms:400 },
      { type:'say', text:"Right hand position. Place your thumb on Middle C. That is finger 1.", rate:0.86, gap:700 },
      { type:'chord', notes:['C4'], color:'yellow', wait:1200 },
      { type:'say', text:"Skip a finger. Middle finger on E. That is finger 3.", rate:0.86, gap:700 },
      { type:'chord', notes:['E4'], color:'yellow', wait:1200 },
      { type:'say', text:"Skip again. Pinky on G. That is finger 5.", rate:0.86, gap:700 },
      { type:'chord', notes:['G4'], color:'yellow', wait:1200 },
      { type:'say', text:"1, 3, 5. C, E, G. Those three keys form a C Major chord.", rate:0.86, pitch:1.05 },
      { type:'pause', ms:500 },
      { type:'say', text:"Now you will play them one at a time in a broken pattern. C, E, G, E. Count: 1, 2, 3, 4.", rate:0.85, gap:700 },
      { type:'seq', notes:['C4','E4','G4','E4'], color:'cyan', delay:500 },
      { type:'say', text:"That is your right hand exercise. Steady count. 1, 2, 3, 4.", rate:0.86 },
    ]},
    { segments: [
      { type:'say', text:"Now we add the left hand.", rate:0.88, pitch:1.1 },
      { type:'pause', ms:400 },
      { type:'say', text:"The left hand is simple. It plays the root note on beat 1 only.", rate:0.86 },
      { type:'pause', ms:300 },
      { type:'say', text:"So when your right thumb plays C on beat 1, your left hand also plays C at the same time.", rate:0.85, gap:800 },
      { type:'chord', notes:['C3','C4'], color:'cyan', wait:2000 },
      { type:'say', text:"Then the right hand continues: 2, 3, 4. Left hand holds.", rate:0.86, gap:700 },
      { type:'seq', notes:['E4','G4','E4'], color:'cyan', delay:500 },
      { type:'say', text:"Left hand down together on 1. Right hand alone for 2, 3, 4. That is the pattern.", rate:0.85, pitch:1.05 },
    ]},
    { segments: [
      { type:'say', text:"Now we move through the scale. We start on Do. Then shift to Re.", rate:0.86, gap:800 },
      { type:'chord', notes:['C3','C4'], color:'cyan', wait:1200 },
      { type:'seq', notes:['E4','G4','E4'], color:'cyan', delay:400 },
      { type:'chord', notes:['D3','D4'], color:'yellow', wait:1200 },
      { type:'seq', notes:['F4','A4','F4'], color:'yellow', delay:400 },
      { type:'chord', notes:['E3','E4'], color:'green', wait:1200 },
      { type:'seq', notes:['G4','B4','G4'], color:'green', delay:400 },
      { type:'say', text:"Do to Re to Mi. Each time, your whole hand shifts one note to the right.", rate:0.85 },
      { type:'pause', ms:500 },
      { type:'say', text:"Continue up to Sol, then back down to Do. That is the full exercise.", rate:0.86, gap:800 },
      { type:'chord', notes:['F3','F4'], color:'magenta', wait:1200 },
      { type:'seq', notes:['A4','C5','A4'], color:'magenta', delay:400 },
      { type:'chord', notes:['G3','G4'], color:'orange', wait:1200 },
      { type:'seq', notes:['B4','D5','B4'], color:'orange', delay:400 },
      { type:'say', text:"Up to Sol. Now back down.", rate:0.85, gap:700 },
      { type:'chord', notes:['F3','F4'], color:'magenta', wait:1200 },
      { type:'chord', notes:['E3','E4'], color:'green', wait:1200 },
      { type:'chord', notes:['D3','D4'], color:'yellow', wait:1200 },
      { type:'chord', notes:['C3','C4'], color:'cyan', wait:1500 },
      { type:'say', text:"And back to Do. The hardest part? Going from Sol back down without losing the beat.", rate:0.85, pitch:1.05 },
    ]},
    { segments: [
      { type:'say', text:"Now the standard. The requirement for this lesson.", rate:0.87, pitch:1.05 },
      { type:'pause', ms:400 },
      { type:'say', text:"You must play continuously. No stopping. No pausing between chords.", rate:0.86 },
      { type:'pause', ms:300 },
      { type:'say', text:"If you stop between chords, you are losing the beat. That is the one thing we do not do.", rate:0.85 },
      { type:'pause', ms:500 },
      { type:'say', text:"Start slow. Count out loud first: 1, 2, 3, 4. Then add the notes.", rate:0.85 },
      { type:'pause', ms:400 },
      { type:'say', text:"Slow and steady beats fast and sloppy. Every single time.", rate:0.88, pitch:1.1 },
    ]},
    { segments: [
      { type:'say', text:"Once you can do Do to Sol and back without mistakes, try chord progressions.", rate:0.86 },
      { type:'pause', ms:400 },
      { type:'say', text:"You can jump from any chord to any chord. Like this.", rate:0.85, gap:700 },
      { type:'chord', notes:['C3','C4'], color:'cyan', wait:1400 },
      { type:'chord', notes:['G3','G4'], color:'green', wait:1400 },
      { type:'chord', notes:['A3','A4'], color:'magenta', wait:1400 },
      { type:'chord', notes:['E3','E4'], color:'yellow', wait:1400 },
      { type:'say', text:"Do, Sol, La, Mi. Already sounds musical.", rate:0.86 },
      { type:'pause', ms:500 },
      { type:'say', text:"Here is a famous one. This is Canon in D.", rate:0.87, pitch:1.1, gap:700 },
      { type:'chord', notes:['D4','Gb4','A4'], color:'cyan', wait:1600 },
      { type:'chord', notes:['A3','Db4','E4'], color:'yellow', wait:1600 },
      { type:'chord', notes:['B3','Eb4','Gb4'], color:'magenta', wait:1600 },
      { type:'chord', notes:['Gb3','A3','Db4'], color:'green', wait:1600 },
      { type:'chord', notes:['G3','B3','D4'], color:'cyan', wait:1600 },
      { type:'chord', notes:['D3','Gb3','A3'], color:'yellow', wait:1600 },
      { type:'chord', notes:['G3','B3','D4'], color:'magenta', wait:1600 },
      { type:'chord', notes:['A3','Db4','E4'], color:'orange', wait:1600 },
      { type:'say', text:"That progression is Canon in D. One of the most used progressions in all of music.", rate:0.85 },
      { type:'pause', ms:400 },
      { type:'say', text:"Your goal is to play any progression like that. Smooth. Continuous. No gaps.", rate:0.86, pitch:1.05 },
    ]},
    { segments: [
      { type:'say', text:"Let me end with a quiz to check your understanding.", rate:0.88 },
      { type:'quiz', quiz:{
        type:'mcq',
        question:"In the 1-3-5 exercise starting on C, which three keys do you play?",
        sub:"Think: finger 1 is thumb, finger 3 is middle, finger 5 is pinky",
        options:["C, D, E","C, E, G","C, F, G","D, F, A"],
        answer:"C, E, G",
        explain:"Finger 1 (thumb) on C, finger 3 (middle) on E, finger 5 (pinky) on G. That is the C Major chord shape — the foundation of everything!"
      }},
    ]},
    { segments: [
      { type:'say', text:"Excellent! C, E, G. The C Major chord. You have got it.", rate:0.88, pitch:1.1 },
      { type:'pause', ms:400 },
      { type:'chord', notes:['C4','E4','G4'], color:'green', wait:2000 },
      { type:'say', text:"Practice the exercise from Do up to Sol and back. Slow first, then gradually faster.", rate:0.86 },
      { type:'pause', ms:400 },
      { type:'say', text:"Master this, and we will move on to Lesson 2. Happy practicing!", rate:0.87, pitch:1.05 },
      { type:'pause', ms:500 },
      { type:'chord', notes:['C4','E4','G4','C5'], color:'cyan', wait:2500 },
    ]},
  ]
};
LESSONS[2] = {
  complete: "Grade 2 done! You can navigate the keyboard like a pro. 50 XP!",
  steps: [
    { segments: [
      { type:'say', text:"Now let us fill in your map.", rate:0.88, pitch:1.05 },
      { type:'pause', ms:300 },
      { type:'say', text:"You know C. Now meet the other landmark: F.", rate:0.87, gap:500 },
      { type:'chord', notes:['F4'], color:'yellow', wait:1200 },
      { type:'say', text:"F is always to the LEFT of the group of three black keys.", rate:0.88 },
      { type:'pause', ms:400 },
      { type:'say', text:"C and F. Two anchors. The whole keyboard flows from just these two.", rate:0.86, pitch:1.05 },
    ]},
    { segments: [
      { type:'say', text:"Between the 2 black keys you have C, D, E.", rate:0.87, gap:600 },
      { type:'seqAll', notes:['C4','D4','E4'], color:'cyan', delay:500 },
      { type:'say', text:"Around the 3 black keys you have F, G, A, B.", rate:0.87, gap:600 },
      { type:'seqAll', notes:['F4','G4','A4','B4'], color:'yellow', delay:500 },
      { type:'say', text:"Seven notes. Then it repeats. That is the whole pattern.", rate:0.86 },
    ]},
    { segments: [
      { type:'say', text:"Now I want YOU to find a note. Ready?", rate:0.9, pitch:1.1 },
      { type:'pause', ms:400 },
      { type:'say', text:"Find Middle C on the keyboard below and press it.", rate:0.87 },
      { type:'quiz', quiz:{ type:'key', question:"Press Middle C (C4) on the keyboard!", sub:"Look for the group of 2 black keys at the center", target:'C4' }},
    ]},
    { segments: [
      { type:'say', text:"Now find F4. Left of the 3 black keys.", rate:0.9, pitch:1.1, gap:500 },
      { type:'quiz', quiz:{ type:'key', question:"Press F4 on the keyboard!", sub:"Left of the group of 3 black keys", target:'F4' }},
    ]},
  ]
};

LESSONS[3] = {
  complete: "Half steps and whole steps. You have got the DNA of music now. Grade 3 done! 50 XP!",
  steps: [
    { segments: [
      { type:'say', text:"This is where music theory actually clicks.", rate:0.88, pitch:1.08 },
      { type:'pause', ms:300 },
      { type:'say', text:"Everything in music is built from just two distances.", rate:0.86 },
      { type:'pause', ms:400 },
      { type:'say', text:"A half step. And a whole step. That is it.", rate:0.84, pitch:1.1 },
    ]},
    { segments: [
      { type:'say', text:"A half step is the smallest possible move. One key over.", rate:0.87, gap:600 },
      { type:'seq', notes:['E4','F4'], color:'cyan', delay:700 },
      { type:'say', text:"E to F. One half step. No black key between them.", rate:0.86 },
      { type:'pause', ms:500 },
      { type:'say', text:"Same here.", rate:0.85, gap:600 },
      { type:'seq', notes:['B4','C5'], color:'yellow', delay:700 },
      { type:'say', text:"B to C. Another natural half step. No black key.", rate:0.86, pitch:1.05 },
    ]},
    { segments: [
      { type:'say', text:"A whole step skips one key.", rate:0.87, gap:600 },
      { type:'seq', notes:['C4','D4'], color:'cyan', delay:700 },
      { type:'say', text:"C to D. One whole step. There is a black key in between.", rate:0.86 },
      { type:'pause', ms:400 },
      { type:'say', text:"Now the chromatic scale. Every single half step in order.", rate:0.85, gap:700 },
      { type:'seq', notes:['C4','Db4','D4','Eb4','E4','F4','Gb4','G4','Ab4','A4','Bb4','B4','C5'], color:'cyan', delay:280 },
      { type:'say', text:"Twelve half steps. One octave.", rate:0.87, pitch:1.1 },
    ]},
    { segments: [
      { type:'quiz', quiz:{
        type:'mcq', question:"E to F is which kind of step?",
        sub:"There is no black key between E and F",
        options:["Whole step","Half step","Octave","Third"],
        answer:"Half step",
        explain:"E to F is a half step, one of only two natural half steps on the keyboard. The other is B to C."
      }},
    ]},
  ]
};

LESSONS[4] = {
  complete: "You learned the formula that unlocks every major scale. Grade 4 done! 50 XP!",
  steps: [
    { segments: [
      { type:'say', text:"Ready for the most powerful formula in music?", rate:0.9, pitch:1.1 },
      { type:'pause', ms:400 },
      { type:'say', text:"Every major scale follows the exact same pattern.", rate:0.87 },
      { type:'pause', ms:300 },
      { type:'say', text:"Whole, Whole, Half, Whole, Whole, Whole, Half.", rate:0.82, pitch:1.05 },
      { type:'pause', ms:500 },
      { type:'say', text:"Learn this once and you can build a major scale from any note.", rate:0.86 },
    ]},
    { segments: [
      { type:'say', text:"C Major is the easiest. All white keys.", rate:0.88, gap:500 },
      { type:'seqAll', notes:['C4','D4','E4','F4','G4','A4','B4','C5'], color:'cyan', delay:420 },
      { type:'say', text:"C, D, E, F, G, A, B, C. Eight notes. All white.", rate:0.86 },
    ]},
    { segments: [
      { type:'say', text:"Now G Major. Same formula, different start.", rate:0.87, gap:600 },
      { type:'seqAll', notes:['G4','A4','B4','C5','D5','E5','Gb5','G5'], color:'yellow', delay:420 },
      { type:'say', text:"Almost all white keys, but one black key sneaks in.", rate:0.86, pitch:1.05, gap:500 },
      { type:'chord', notes:['Gb5'], color:'orange', wait:1200 },
      { type:'say', text:"F sharp. The formula forced a half step there, landing on a black key.", rate:0.85 },
    ]},
    { segments: [
      { type:'quiz', quiz:{
        type:'mcq', question:"What is the major scale formula?",
        sub:"This pattern works starting on any note",
        options:["W-H-W-W-H-W-W","W-W-H-W-W-W-H","H-W-W-H-W-W-W","W-W-W-H-W-W-H"],
        answer:"W-W-H-W-W-W-H",
        explain:"W-W-H-W-W-W-H is the major scale formula. Learn it once, use it in all 12 keys forever!"
      }},
    ]},
  ]
};

LESSONS[5] = {
  complete: "You hear the difference now. That is real ear training. Grade 5 done! 50 XP!",
  steps: [
    { segments: [
      { type:'say', text:"If major is sunshine, minor is the golden hour.", rate:0.85, pitch:1.05 },
      { type:'pause', ms:500 },
      { type:'say', text:"Same idea. Different formula. Totally different feeling.", rate:0.86 },
      { type:'pause', ms:300 },
      { type:'say', text:"Minor formula: Whole, Half, Whole, Whole, Half, Whole, Whole.", rate:0.82 },
    ]},
    { segments: [
      { type:'say', text:"Listen to C Major first.", rate:0.87, gap:600 },
      { type:'seqAll', notes:['C4','D4','E4','F4','G4','A4','B4','C5'], color:'cyan', delay:400 },
      { type:'say', text:"Bright. Happy. Resolved.", rate:0.84, pitch:1.05 },
      { type:'pause', ms:600 },
      { type:'say', text:"Now C Natural Minor.", rate:0.87, gap:600 },
      { type:'seqAll', notes:['C4','D4','Eb4','F4','G4','Ab4','Bb4','C5'], color:'magenta', delay:400 },
      { type:'say', text:"Darker. More emotional. Three black keys now.", rate:0.84 },
    ]},
    { segments: [
      { type:'say', text:"Here is the key insight. Listen closely.", rate:0.87, pitch:1.1, gap:700 },
      { type:'chord', notes:['C4','E4','G4'], color:'cyan', wait:1800 },
      { type:'say', text:"C Major. Now I change just one note.", rate:0.85, gap:800 },
      { type:'chord', notes:['C4','Eb4','G4'], color:'magenta', wait:1800 },
      { type:'say', text:"C Minor. One half step lower on the middle note. That is the entire emotional shift.", rate:0.85, pitch:1.08 },
    ]},
    { segments: [
      { type:'quiz', quiz:{
        type:'mcq', question:"What changes C Major into C Minor?",
        sub:"C Major is C E G. C Minor is C Eb G",
        options:["Lower the root by a half step","Lower the 3rd by a half step","Raise the 5th by a half step","Lower all notes"],
        answer:"Lower the 3rd by a half step",
        explain:"Lowering the 3rd from E to Eb creates the minor sound. This works for any chord!"
      }},
    ]},
  ]
};

LESSONS[6] = {
  complete: "Three chords. Hundreds of songs. Grade 6 is yours! 50 XP!",
  steps: [
    { segments: [
      { type:'say', text:"Now we are cooking.", rate:0.9, pitch:1.1 },
      { type:'pause', ms:300 },
      { type:'say', text:"A chord is three or more notes played at the same time.", rate:0.87 },
      { type:'pause', ms:300 },
      { type:'say', text:"Every major chord uses the same shape. Root, plus 4 half steps, plus 3 more.", rate:0.85 },
    ]},
    { segments: [
      { type:'say', text:"C Major.", rate:0.87, gap:700 },
      { type:'chord', notes:['C4','E4','G4'], color:'cyan', wait:2000 },
      { type:'say', text:"C, E, G. Full and resolved.", rate:0.86, pitch:1.05 },
      { type:'pause', ms:500 },
      { type:'say', text:"F Major. Same shape, new root.", rate:0.87, gap:700 },
      { type:'chord', notes:['F4','A4','C5'], color:'yellow', wait:2000 },
      { type:'say', text:"F, A, C. Warmer. More open.", rate:0.86 },
    ]},
    { segments: [
      { type:'say', text:"G Major. The third of the trio.", rate:0.87, gap:700 },
      { type:'chord', notes:['G4','B4','D5'], color:'green', wait:2000 },
      { type:'say', text:"G, B, D. Feels like it wants to go somewhere.", rate:0.86, pitch:1.05 },
      { type:'pause', ms:500 },
      { type:'say', text:"These three are the I, IV, and V chords of C Major. Used in hundreds of songs. Listen.", rate:0.84, gap:800 },
      { type:'chord', notes:['C4','E4','G4'], color:'cyan', wait:1600 },
      { type:'chord', notes:['F4','A4','C5'], color:'yellow', wait:1600 },
      { type:'chord', notes:['G4','B4','D5'], color:'green', wait:1600 },
      { type:'chord', notes:['C4','E4','G4'], color:'cyan', wait:1600 },
      { type:'say', text:"I, IV, V, I. The backbone of rock, blues, and pop.", rate:0.86 },
    ]},
    { segments: [
      { type:'quiz', quiz:{
        type:'mcq', question:"What 3 notes make up C Major?",
        options:["C D E","C F G","C E G","C Eb G"],
        answer:"C E G",
        explain:"C (root) plus E (4 half steps = major 3rd) plus G (3 more half steps = perfect 5th). That is the major chord formula!"
      }},
    ]},
  ]
};

LESSONS[7] = {
  complete: "You unlocked the most played chord progression in pop history. Grade 7 done! 50 XP!",
  steps: [
    { segments: [
      { type:'say', text:"Minor chords. This is where emotion lives.", rate:0.86, pitch:1.05 },
      { type:'pause', ms:400 },
      { type:'say', text:"Same formula as major, but flipped. 3 half steps first, then 4.", rate:0.85 },
    ]},
    { segments: [
      { type:'say', text:"A Minor. Possibly the most iconic chord in pop music.", rate:0.87, gap:700 },
      { type:'chord', notes:['A3','C4','E4'], color:'magenta', wait:2000 },
      { type:'say', text:"A, C, E. Instantly emotional.", rate:0.85, pitch:1.05 },
      { type:'pause', ms:500 },
      { type:'say', text:"Now the Axis Progression. Am, F, C, G. Used in Despacito, Faded, Someone Like You.", rate:0.86, gap:700 },
      { type:'chord', notes:['A3','C4','E4'], color:'magenta', wait:1600 },
      { type:'chord', notes:['F3','A3','C4'], color:'yellow', wait:1600 },
      { type:'chord', notes:['C4','E4','G4'], color:'cyan', wait:1600 },
      { type:'chord', notes:['G3','B3','D4'], color:'green', wait:1600 },
      { type:'say', text:"Four chords. Thousands of songs.", rate:0.86, pitch:1.08 },
    ]},
    { segments: [
      { type:'quiz', quiz:{
        type:'mcq', question:"What makes A Minor different from A Major?",
        sub:"A Major is A C# E. A Minor is A C E",
        options:["The root is different","The 3rd is lower by a half step","The 5th is higher","All notes change"],
        answer:"The 3rd is lower by a half step",
        explain:"C# becomes C, one half step drop. Same root, same 5th, just a flattened 3rd creates the minor sound."
      }},
    ]},
  ]
};

LESSONS[8] = {
  complete: "Chord progressions, the grammar of music. You speak it now. Grade 8 done! 50 XP!",
  steps: [
    { segments: [
      { type:'say', text:"Music follows patterns that feel natural to our ears.", rate:0.86 },
      { type:'pause', ms:400 },
      { type:'say', text:"These are called progressions. Theorists label them with Roman numerals.", rate:0.85 },
      { type:'pause', ms:300 },
      { type:'say', text:"In C Major: I is C, IV is F, V is G, vi is A minor.", rate:0.83 },
    ]},
    { segments: [
      { type:'say', text:"The most used progression in recorded music. I, V, six, IV.", rate:0.87, gap:700 },
      { type:'chord', notes:['C4','E4','G4'], color:'cyan', wait:1500 },
      { type:'chord', notes:['G3','B3','D4'], color:'green', wait:1500 },
      { type:'chord', notes:['A3','C4','E4'], color:'magenta', wait:1500 },
      { type:'chord', notes:['F3','A3','C4'], color:'yellow', wait:1500 },
      { type:'say', text:"Let It Be. No Woman No Cry. Someone Like You. All of them.", rate:0.85, pitch:1.08 },
    ]},
    { segments: [
      { type:'quiz', quiz:{
        type:'mcq', question:"In C Major, what chord is the vi?",
        options:["F Major","G Major","D Minor","A Minor"],
        answer:"A Minor",
        explain:"Count from C: I is C, ii is D, iii is E, IV is F, V is G, vi is A. The 6th note is A, and vi is always minor."
      }},
    ]},
  ]
};

LESSONS[9] = {
  complete: "The Circle of Fifths is in your toolkit now. Grade 9 done! 50 XP!",
  steps: [
    { segments: [
      { type:'say', text:"One diagram. Rules everything in music theory.", rate:0.87, pitch:1.08 },
      { type:'pause', ms:400 },
      { type:'say', text:"The Circle of Fifths. All 12 keys in a circle, each a perfect 5th apart.", rate:0.84 },
    ]},
    { segments: [
      { type:'say', text:"Watch. C Major, then G, then D, then A.", rate:0.87, gap:700 },
      { type:'chord', notes:['C4','E4','G4'], color:'cyan', wait:1800 },
      { type:'chord', notes:['G3','B3','D4'], color:'yellow', wait:1800 },
      { type:'chord', notes:['D4','Gb4','A4'], color:'green', wait:1800 },
      { type:'chord', notes:['A3','Db4','E4'], color:'orange', wait:1800 },
      { type:'say', text:"Keys next to each other always sound great together.", rate:0.85 },
    ]},
    { segments: [
      { type:'say', text:"Relative minors. C Major and A Minor share all the same notes.", rate:0.87, pitch:1.08, gap:700 },
      { type:'chord', notes:['C4','E4','G4'], color:'cyan', wait:1800 },
      { type:'chord', notes:['A3','C4','E4'], color:'magenta', wait:1800 },
      { type:'say', text:"C Major is the day. A Minor is the night.", rate:0.84, pitch:1.08 },
    ]},
    { segments: [
      { type:'quiz', quiz:{
        type:'mcq', question:"What is the relative minor of C Major?",
        sub:"They share the exact same notes",
        options:["C Minor","G Minor","E Minor","A Minor"],
        answer:"A Minor",
        explain:"A Minor uses the same notes as C Major but starts on A, giving it a darker mood."
      }},
    ]},
  ]
};

LESSONS[10] = {
  complete: "Seventh chords, welcome to jazz and R&B. Grade 10 done! 50 XP!",
  steps: [
    { segments: [
      { type:'say', text:"You know triads. Three notes. Add one more on top.", rate:0.87 },
      { type:'pause', ms:300 },
      { type:'say', text:"Seventh chords. Four notes. Instantly more sophisticated.", rate:0.86, pitch:1.08 },
    ]},
    { segments: [
      { type:'say', text:"C Major 7. Dreamy. Floating.", rate:0.87, gap:700 },
      { type:'chord', notes:['C4','E4','G4','B4'], color:'cyan', wait:2200 },
      { type:'say', text:"C Minor 7. Smooth. Soulful.", rate:0.87, gap:700 },
      { type:'chord', notes:['C4','Eb4','G4','Bb4'], color:'magenta', wait:2200 },
      { type:'say', text:"C Dominant 7. Tense. Wants to resolve.", rate:0.87, gap:700 },
      { type:'chord', notes:['C4','E4','G4','Bb4'], color:'orange', wait:2200 },
    ]},
    { segments: [
      { type:'say', text:"The ii-V-I. The most important jazz progression.", rate:0.87, pitch:1.1, gap:700 },
      { type:'chord', notes:['D4','F4','A4','C5'], color:'yellow', wait:1800 },
      { type:'chord', notes:['G3','B3','D4','F4'], color:'orange', wait:1800 },
      { type:'chord', notes:['C4','E4','G4','B4'], color:'cyan', wait:2000 },
      { type:'say', text:"Tension and release. That is the heartbeat of jazz.", rate:0.85, pitch:1.08 },
    ]},
    { segments: [
      { type:'quiz', quiz:{
        type:'mcq', question:"Which 7th chord creates the most tension and demands resolution?",
        options:["Major 7","Minor 7","Dominant 7","Minor Major 7"],
        answer:"Dominant 7",
        explain:"Dominant 7 creates intense tension that demands resolution. It is the engine of jazz harmony."
      }},
    ]},
  ]
};

LESSONS[11] = {
  complete: "Voice leading is what makes pianists sound effortless. Grade 11 done! 50 XP!",
  steps: [
    { segments: [
      { type:'say', text:"Here is what separates beginners from polished pianists.", rate:0.87, pitch:1.08 },
      { type:'pause', ms:400 },
      { type:'say', text:"Inversions. Same chord, different note on the bottom.", rate:0.86 },
    ]},
    { segments: [
      { type:'say', text:"C Major root position.", rate:0.87, gap:700 },
      { type:'chord', notes:['C4','E4','G4'], color:'cyan', wait:1800 },
      { type:'say', text:"First inversion. E on the bottom.", rate:0.87, gap:700 },
      { type:'chord', notes:['E4','G4','C5'], color:'yellow', wait:1800 },
      { type:'say', text:"Second inversion. G on the bottom.", rate:0.87, gap:700 },
      { type:'chord', notes:['G4','C5','E5'], color:'orange', wait:1800 },
      { type:'say', text:"Same three notes. Three different flavors.", rate:0.85, pitch:1.05 },
    ]},
    { segments: [
      { type:'say', text:"Smooth voice leading. C to F to G with inversions.", rate:0.86, gap:800 },
      { type:'chord', notes:['C4','E4','G4'], color:'cyan', wait:1600 },
      { type:'chord', notes:['C4','F4','A4'], color:'yellow', wait:1600 },
      { type:'chord', notes:['B3','D4','G4'], color:'green', wait:1600 },
      { type:'say', text:"Smooth. Effortless. That is voice leading.", rate:0.84, pitch:1.08 },
    ]},
    { segments: [
      { type:'quiz', quiz:{
        type:'mcq', question:"In 1st inversion of C Major, which note is on the bottom?",
        options:["C","G","E","B"],
        answer:"E",
        explain:"1st inversion puts the 3rd on the bottom. E is lowest, giving it a lighter feel."
      }},
    ]},
  ]
};

LESSONS[12] = {
  complete: "All 12 grades complete! You think like a musician now. Go sit at a real piano and play!",
  steps: [
    { segments: [
      { type:'say', text:"Grade 12. Everything comes together right here.", rate:0.87, pitch:1.1 },
      { type:'pause', ms:400 },
      { type:'say', text:"Notes, scales, chords, progressions, circle of fifths, sevenths, inversions.", rate:0.84 },
      { type:'pause', ms:400 },
      { type:'say', text:"Let us use it all to play real music.", rate:0.88, pitch:1.1 },
    ]},
    { segments: [
      { type:'say', text:"Let It Be by The Beatles. Four chords. That is the whole song.", rate:0.87, gap:700 },
      { type:'chord', notes:['C4','E4','G4'], color:'cyan', wait:1600 },
      { type:'chord', notes:['G3','B3','D4'], color:'green', wait:1600 },
      { type:'chord', notes:['A3','C4','E4'], color:'magenta', wait:1600 },
      { type:'chord', notes:['F3','A3','C4'], color:'yellow', wait:1600 },
      { type:'say', text:"One of the most beloved songs ever. Four chords.", rate:0.86, pitch:1.08 },
    ]},
    { segments: [
      { type:'say', text:"Axis Progression. Thousands of hits.", rate:0.86, gap:800 },
      { type:'chord', notes:['A3','C4','E4'], color:'magenta', wait:1600 },
      { type:'chord', notes:['F3','A3','C4'], color:'yellow', wait:1600 },
      { type:'chord', notes:['C4','E4','G4'], color:'cyan', wait:1600 },
      { type:'chord', notes:['G3','B3','D4'], color:'green', wait:1600 },
      { type:'say', text:"Despacito. Faded. Apologize. All of them.", rate:0.85, pitch:1.05 },
    ]},
    { segments: [
      { type:'quiz', quiz:{
        type:'mcq', question:"The vi chord in C Major is which chord?",
        sub:"Count: I is C, ii is D, iii is E, IV is F, V is G, vi is?",
        options:["F Major","G Major","A Minor","B Diminished"],
        answer:"A Minor",
        explain:"The 6th degree of C Major is A, and vi is always minor. That is why Am is called the relative minor of C Major."
      }},
    ]},
  ]
};