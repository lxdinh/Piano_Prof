/* ===================================================================
   Piano Professor — Static content & data
   =================================================================== */

/* Six learning levels (Kindergarten → Master) */
const PP_LEVELS = [
  { id: "kg", name: "Kindergarten", short: "KG", color: "#58CC02", deep: "#3D8E00", blurb: "Your very first notes & the magic of lit keys.", grade: 1 },
  { id: "el", name: "Elementary",   short: "EL", color: "#5BB8E3", deep: "#2E84AD", blurb: "Two hands, simple chords, your first real song.", grade: 3 },
  { id: "ms", name: "Middle School",short: "MS", color: "#F5B800", deep: "#C28A00", blurb: "Chord changes, rhythm and pop progressions.", grade: 5 },
  { id: "hs", name: "High School",  short: "HS", color: "#FF7A52", deep: "#C2410C", blurb: "Syncopation, inversions & expressive playing.", grade: 7 },
  { id: "un", name: "University",   short: "UN", color: "#9b6bff", deep: "#6b3fd4", blurb: "Advanced voicings, improvisation, theory.", grade: 9 },
  { id: "ma", name: "Master",       short: "MA", color: "var(--ink)", deep: "#000", blurb: "Concert-level repertoire & your own style.", grade: 12 },
];

/* Profile avatar choices (Maestro moods) */
const PP_AVATARS = [
  { mood: "cool", bg: "#FFE38A" }, { mood: "conduct", bg: "#BFE6FF" },
  { mood: "magician", bg: "#E3D2FF" }, { mood: "painter", bg: "#FFD7C2" },
  { mood: "rebel", bg: "#D7F5C2" }, { mood: "futurist", bg: "#C2F0FF" },
  { mood: "chef", bg: "#FFE0A8" }, { mood: "classical", bg: "#EADfc6" },
  { mood: "drummer", bg: "#FFC9C9" }, { mood: "violin", bg: "#FFE38A" },
  { mood: "astronaut", bg: "#CFE0FF" }, { mood: "showman", bg: "#FFD0E6" },
  { mood: "nature", bg: "#C9F0D2" }, { mood: "star", bg: "#FFE9A0" },
  { mood: "wow", bg: "#D6E8FF" }, { mood: "love", bg: "#FFD3DD" },
];

/* Starter family profiles */
const PP_PROFILES_SEED = [
  { id: "p1", name: "Ava",   avatar: "cool",    bg: "#FFE38A", color: "#58CC02", streak: 12, xp: 3480, gems: 240, hearts: 5, levelId: "el", grade: 3, placed: true, path: "chords", lastUnit: "Pop Chords I", lang: "en" },
  { id: "p2", name: "Leo",   avatar: "rebel",   bg: "#D7F5C2", color: "#FF7A52", streak: 4,  xp: 1260, gems: 80,  hearts: 4, levelId: "kg", grade: 1, placed: true, path: "soloist", lastUnit: "First 3 Notes", lang: "vi" },
  { id: "p3", name: "Mum",   avatar: "violin",  bg: "#FFE38A", color: "#9b6bff", streak: 31, xp: 9120, gems: 510, hearts: 5, levelId: "ms", grade: 5, placed: true, path: "chords", lastUnit: "Ballads & Arpeggios", lang: "fr" },
];

/* Home hub shelves — poster cards with states */
const PP_SHELVES = [
  {
    levelId: "kg", title: "Kindergarten · Grade 1", color: "#58CC02", deep: "#3D8E00",
    items: [
      { id: "k1", kind: "lesson",  title: "First 3 Notes", sub: "C · D · E", state: "done", stars: 3 },
      { id: "k2", kind: "lesson",  title: "Find Middle C", sub: "Your home base", state: "done", stars: 3 },
      { id: "k3", kind: "song",    title: "Twinkle Twinkle", sub: "Trad.", state: "done", stars: 2 },
      { id: "k4", kind: "concept", title: "Loud & Soft", sub: "Dynamics for tiny hands", state: "done", stars: 3 },
    ],
  },
  {
    levelId: "el", title: "Elementary · Grade 3", color: "#5BB8E3", deep: "#2E84AD",
    items: [
      { id: "e1", kind: "lesson",  title: "Pop Chords I", sub: "C · G · Am · F", state: "done", stars: 3 },
      { id: "e2", kind: "lesson",  title: "Both Hands", sub: "Left + right together", state: "active", progress: 60 },
      { id: "e3", kind: "song",    title: "Let It Be", sub: "The Beatles", state: "locked" },
      { id: "e4", kind: "concept", title: "Reading Rhythm", sub: "Quarter & half notes", state: "locked" },
      { id: "e5", kind: "exercise",title: "Chord Sprint", sub: "Speed drill", state: "soon" },
    ],
  },
  {
    levelId: "ms", title: "Middle School · Grade 5", color: "#F5B800", deep: "#C28A00",
    items: [
      { id: "m1", kind: "lesson",  title: "Chord Changes", sub: "Smooth transitions", state: "locked" },
      { id: "m2", kind: "song",    title: "Someone Like You", sub: "Adele", state: "locked", premium: true },
      { id: "m3", kind: "concept", title: "The Circle of 5ths", sub: "Why keys work", state: "locked", premium: true },
      { id: "m4", kind: "exercise",title: "Inversion Gym", sub: "Move between shapes", state: "locked", premium: true },
    ],
  },
  {
    levelId: "hs", title: "High School · Grade 7", color: "#FF7A52", deep: "#C2410C",
    items: [
      { id: "h1", kind: "lesson",  title: "Syncopation", sub: "Play off the beat", state: "locked", premium: true },
      { id: "h2", kind: "song",    title: "Clocks", sub: "Coldplay", state: "locked", premium: true },
      { id: "h3", kind: "song",    title: "River Flows in You", sub: "Yiruma", state: "locked", premium: true },
    ],
  },
  {
    levelId: "un", title: "University · Grade 9", color: "#9b6bff", deep: "#6b3fd4",
    items: [
      { id: "u1", kind: "lesson",  title: "Jazz Voicings", sub: "Rootless & rich", state: "locked", premium: true },
      { id: "u2", kind: "concept", title: "Improv Basics", sub: "Make it up, on key", state: "locked", premium: true },
      { id: "u3", kind: "song",    title: "Autumn Leaves", sub: "Jazz standard", state: "locked", premium: true },
    ],
  },
  {
    levelId: "ma", title: "Master · Grade 12", color: "#C9A227", deep: "#8A5E0C",
    items: [
      { id: "a1", kind: "lesson",  title: "Concert Études", sub: "Recital-ready", state: "locked", premium: true },
      { id: "a2", kind: "concept", title: "Your Signature Style", sub: "Sound like you", state: "locked", premium: true },
      { id: "a3", kind: "song",    title: "Clair de Lune", sub: "Debussy", state: "locked", premium: true },
    ],
  },
];

/* Song library */
const PP_SONGS = {
  featured: { id: "s0", title: "A Thousand Years", artist: "Christina Perri", hue: 280, level: "Elementary", premium: false },
  trending: [
    { id: "s1", title: "Perfect", artist: "Ed Sheeran", hue: 12, level: "Elementary" },
    { id: "s2", title: "Clocks", artist: "Coldplay", hue: 200, level: "High School", premium: true },
    { id: "s3", title: "Someone Like You", artist: "Adele", hue: 320, level: "Middle School", premium: true },
    { id: "s4", title: "Hallelujah", artist: "L. Cohen", hue: 40, level: "Elementary" },
    { id: "s5", title: "Lovely", artist: "Billie Eilish", hue: 250, level: "Middle School", premium: true },
  ],
  learn: [
    { id: "s6", title: "Twinkle Twinkle", artist: "Trad.", hue: 90, level: "Kindergarten" },
    { id: "s7", title: "Ode to Joy", artist: "Beethoven", hue: 150, level: "Kindergarten" },
    { id: "s8", title: "Let It Be", artist: "The Beatles", hue: 30, level: "Elementary" },
    { id: "s9", title: "Million Reasons", artist: "Lady Gaga", hue: 340, level: "Elementary" },
    { id: "s10", title: "Fix You", artist: "Coldplay", hue: 190, level: "Middle School", premium: true },
  ],
};

/* Placement test questions */
const PP_PLACEMENT = [
  {
    q: "Have you played piano before?", emoji: "🎹",
    a: [
      { t: "Never touched one", v: 0 }, { t: "A little, long ago", v: 1 },
      { t: "I know a few songs", v: 2 }, { t: "I play regularly", v: 3 },
    ],
  },
  {
    q: "Can you read sheet music?", emoji: "🎼",
    a: [
      { t: "Not at all", v: 0 }, { t: "Slowly, note by note", v: 1 },
      { t: "Yes, fairly well", v: 2 }, { t: "Fluently", v: 3 },
    ],
  },
  {
    q: "Which feels true about chords?", emoji: "🎵",
    a: [
      { t: "What's a chord?", v: 0 }, { t: "I know C and G", v: 1 },
      { t: "Major & minor, no problem", v: 2 }, { t: "I improvise with them", v: 3 },
    ],
  },
  {
    q: "Play with two hands together?", emoji: "🙌",
    a: [
      { t: "One hand is plenty", v: 0 }, { t: "Slowly, with effort", v: 1 },
      { t: "Yes, comfortably", v: 2 }, { t: "Independent hands, easy", v: 3 },
    ],
  },
  {
    q: "What's your goal?", emoji: "⭐", noScore: true,
    a: [
      { t: "Play songs I love", v: 0 }, { t: "Understand music", v: 0 },
      { t: "Impress my family", v: 0 }, { t: "Get seriously good", v: 0 },
    ],
  },
];

/* Subscription plans */
const PP_PLANS = [
  { id: "individual", name: "Individual", profiles: 1, icon: "👤", monthly: 18.74, blurb: "1 premium profile" },
  { id: "duo", name: "Duo", profiles: 2, icon: "👥", monthly: 20.83, blurb: "2 premium profiles" },
  { id: "family", name: "Family", profiles: 5, icon: "👨‍👩‍👧‍👦", monthly: 26.24, blurb: "Up to 5 profiles", best: true },
];

/* Lesson script — sequence of steps for the player */
const PP_LESSON = {
  title: "Pop Chords I",
  sub: "Elementary · Grade 3",
  steps: [
    { type: "teach", text: "Let's learn the C major chord. Place your thumb on C.", say: "Let's learn the C major chord.", notes: { 60: "#58CC02" }, labels: { 60: "C" } },
    { type: "quiz", prompt: "Play C", text: "Press the glowing C key.", target: [60], lit: { 60: "#58CC02" }, labels: { 60: "C" } },
    { type: "teach", text: "A C chord is C, E and G played together.", say: "A C chord is C, E and G together.", notes: { 60: "#58CC02", 64: "#58CC02", 67: "#58CC02" }, labels: { 60: "C", 64: "E", 67: "G" } },
    { type: "quiz", prompt: "Play the C chord", text: "Press all three glowing keys.", target: [60, 64, 67], lit: { 60: "#58CC02", 64: "#58CC02", 67: "#58CC02" } },
    { type: "teach", text: "Now G major: G, B and D. Slide your hand up.", say: "Now the G major chord.", notes: { 67: "#5BB8E3", 71: "#5BB8E3", 74: "#5BB8E3" }, labels: { 67: "G", 71: "B", 74: "D" } },
    { type: "quiz", prompt: "Play the G chord", text: "Press the glowing keys.", target: [67, 71, 74], lit: { 67: "#5BB8E3", 71: "#5BB8E3", 74: "#5BB8E3" } },
    { type: "quiz", prompt: "Switch: C then G", text: "Play C chord, then G chord.", target: [60, 64, 67, 67, 71, 74], seq: true, lit: { 60: "#58CC02", 64: "#58CC02", 67: "#5BB8E3", 71: "#5BB8E3", 74: "#5BB8E3" } },
  ],
};

/* helper: abstract album art from a hue */
function artBg(hue) {
  return `linear-gradient(135deg, hsl(${hue} 80% 62%), hsl(${(hue + 40) % 360} 75% 48%))`;
}

Object.assign(window, {
  PP_LEVELS, PP_AVATARS, PP_PROFILES_SEED, PP_SHELVES, PP_SONGS,
  PP_PLACEMENT, PP_PLANS, PP_LESSON, artBg,
});
