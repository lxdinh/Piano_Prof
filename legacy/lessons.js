// Piano Professor v0.8.6 — lesson catalog
// Mirrors lesson_data.dart (levels + lessonCatalog + authored stubs)

const LEVELS = [
  { id:'kindergarten', index:1, name:'Level 1 · Kindergarten',
    objective:'Meet the keyboard, your hands, and your first chord shape. Overcome the fear and play.',
    duration:'2–4 weeks' },
  { id:'elementary',   index:2, name:'Level 2 · Elementary',
    objective:'Scales and rhythm: the major/minor formulas and steady two-hand playing.',
    duration:'1–2 months' },
  { id:'middle',       index:3, name:'Level 3 · Middle School',
    objective:'Chords and the universal progression; accompany real pop songs.',
    duration:'2–3 months' },
  { id:'high',         index:4, name:'Level 4 · High School',
    objective:'Minor chords, the Axis progression, and Roman-numeral thinking.',
    duration:'3–6 months' },
  { id:'university',   index:5, name:'Level 5 · University',
    objective:'Circle of fifths, seventh chords, and your first real solo pieces.',
    duration:'6 months–1 year' },
  { id:'master',       index:6, name:'Level 6 · Master',
    objective:'Inversions, voice leading, and bringing every tool together.',
    duration:'Lifetime mastery' },
];

// kind: 'concept' | 'song' | 'exercise'
// authored: only 'g1' has real steps; rest are coming-soon stubs
const LESSON_CATALOG = [
  // Level 1 — Kindergarten
  { id:'g1',         levelId:'kindergarten', order:1, title:'Grade 1: Layout & 1-3-5 Chords',       kind:'concept',  authored:true  },
  { id:'l1-posture', levelId:'kindergarten', order:2, title:'Posture & Hand Position',               kind:'concept',  authored:false },
  { id:'g2',         levelId:'kindergarten', order:3, title:'Grade 2: Landmarks & Navigation',       kind:'concept',  authored:false },
  { id:'l1-mary',    levelId:'kindergarten', order:4, title:'Mary Had a Little Lamb',                kind:'song',     authored:false },
  { id:'l1-frere',   levelId:'kindergarten', order:5, title:'Frère Jacques',                         kind:'song',     authored:false },
  // Level 2 — Elementary
  { id:'g3',         levelId:'elementary',   order:1, title:'Grade 3: Half & Whole Steps',           kind:'concept',  authored:false },
  { id:'g4',         levelId:'elementary',   order:2, title:'Grade 4: Major Scale Formula',          kind:'concept',  authored:false },
  { id:'l2-twinkle', levelId:'elementary',   order:3, title:'Twinkle Twinkle',                       kind:'song',     authored:false },
  { id:'l2-birthday',levelId:'elementary',   order:4, title:'Happy Birthday',                        kind:'song',     authored:false },
  // Level 3 — Middle School
  { id:'g5',         levelId:'middle',       order:1, title:'Grade 5: Minor Scale & Emotions',       kind:'concept',  authored:false },
  { id:'g6',         levelId:'middle',       order:2, title:'Grade 6: Major Chords (I, IV, V)',      kind:'concept',  authored:false },
  { id:'l3-letitbe', levelId:'middle',       order:3, title:'Let It Be',                             kind:'song',     authored:false },
  // Level 4 — High School
  { id:'g7',         levelId:'high',         order:1, title:'Grade 7: Minor Chords & Axis',          kind:'concept',  authored:false },
  { id:'g8',         levelId:'high',         order:2, title:'Grade 8: Progressions & Roman Numerals',kind:'concept',  authored:false },
  { id:'l4-canon',   levelId:'high',         order:3, title:'Canon in D',                            kind:'song',     authored:false },
  // Level 5 — University
  { id:'g9',         levelId:'university',   order:1, title:'Grade 9: Circle of Fifths',             kind:'concept',  authored:false },
  { id:'g10',        levelId:'university',   order:2, title:'Grade 10: Seventh Chords & Jazz',       kind:'concept',  authored:false },
  { id:'l5-river',   levelId:'university',   order:3, title:'River Flows in You',                    kind:'song',     authored:false },
  { id:'l5-kiss',    levelId:'university',   order:4, title:'Kiss the Rain',                         kind:'song',     authored:false },
  // Level 6 — Master
  { id:'g11',        levelId:'master',       order:1, title:'Grade 11: Inversions & Voice Leading',  kind:'concept',  authored:false },
  { id:'g12',        levelId:'master',       order:2, title:'Grade 12: Bringing It All Together',    kind:'concept',  authored:false },
  { id:'l6-improv',  levelId:'master',       order:3, title:'Improvising over LH Loops',             kind:'exercise', authored:false },
  { id:'l6-jazz',    levelId:'master',       order:4, title:'Jazz & Blues Voicings',                 kind:'concept',  authored:false },
];

// Grade 1 authored steps — simplified version of lesson_data.dart 'g1'
// Each step: { text, chords?, quiz? }
//   chords: [{ notes: string[], color: 'cyan'|'orange' }]
//   quiz:   { type:'mcq', question, options, answer, explain } | { type:'key', target }
const G1_STEPS = [
  {
    text: "Hello! I'm Maestro Penguini, your AI piano instructor. Our goal is simple: play real songs you actually love. And the secret? Chords first.",
    chords: [{ notes:['C4','E4','G4','B4'], color:'cyan' }],
  },
  {
    text: "A piano has only seven letter names: A B C D E F G — then it repeats. That repeating group of 12 keys is called an octave.",
    chords: [{ notes:['C2','C3','C4','C5','C6'], color:'cyan' }],
  },
  {
    text: "C is always to the LEFT of the group of two black keys. That's your anchor. Every time you get lost, find the two black keys.",
  },
  {
    text: "Now find middle C — it's labelled C4 on your keyboard. It's the C closest to the middle of a full piano.",
    chords: [{ notes:['C4'], color:'orange' }],
  },
  {
    text: "Great! Now let's try the 1-3-5 pattern. Place your thumb on C4, skip D, land on E4, skip F, land on G4.",
    chords: [{ notes:['C4','E4','G4'], color:'cyan' }],
  },
  {
    text: "That's a C Major chord — the most important chord in music. Press all three at once.",
    quiz: { type:'mcq', question:'What is the C-E-G chord called?',
            options:['C Major','C Minor','D Major','G Major'],
            answer:'C Major', explain:'C-E-G is C Major — the 1st, 3rd, and 5th notes of the C scale.' },
  },
  {
    text: "Excellent! The 1-3-5 pattern works from any note. Now try it from G: G4, B4, D5.",
    chords: [{ notes:['G4','B4','D5'], color:'cyan' }],
  },
  {
    text: "Amazing work! You've completed Grade 1. You know the layout, the anchor note, and the 1-3-5 chord shape.",
    complete: true,
  },
];
