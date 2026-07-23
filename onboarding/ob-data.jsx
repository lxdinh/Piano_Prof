/* ===================================================================
   Piano Professor — Onboarding data
   Songs (curated pop + classical), profile-question options, the
   interactive placement ladder, and Maestro's AI persona.
   Only public-domain pieces carry real notation/lyrics; copyrighted
   songs appear by title only as difficulty reference points.
   =================================================================== */

/* ---- Song catalog (titles/artists are facts; no copyrighted notation) ---- */
const OB_SONGS = {
  perfect:    { id: "perfect",    title: "Perfect",            artist: "Ed Sheeran",        genre: "pop",       hue: 12  },
  thousand:   { id: "thousand",   title: "A Thousand Years",   artist: "Christina Perri",   genre: "pop",       hue: 286 },
  someone:    { id: "someone",    title: "Someone Like You",   artist: "Adele",             genre: "pop",       hue: 320 },
  clocks:     { id: "clocks",     title: "Clocks",             artist: "Coldplay",          genre: "pop",       hue: 200 },
  lovely:     { id: "lovely",     title: "lovely",             artist: "Billie Eilish",     genre: "pop",       hue: 250 },
  safe:       { id: "safe",       title: "Safe & Sound",       artist: "Taylor Swift",      genre: "pop",       hue: 168 },
  furelise:   { id: "furelise",   title: "Für Elise",          artist: "Beethoven",         genre: "classical", hue: 38  },
  river:      { id: "river",      title: "River Flows in You", artist: "Yiruma",            genre: "classical", hue: 190 },
  clair:      { id: "clair",      title: "Clair de Lune",      artist: "Debussy",           genre: "classical", hue: 220 },
  canon:      { id: "canon",      title: "Canon in D",         artist: "Pachelbel",         genre: "classical", hue: 150 },
  // expansion pool (revealed as "related")
  hallelujah: { id: "hallelujah", title: "Hallelujah",         artist: "L. Cohen",          genre: "pop",       hue: 40  },
  letitbe:    { id: "letitbe",    title: "Let It Be",          artist: "The Beatles",       genre: "pop",       hue: 30  },
  fixyou:     { id: "fixyou",     title: "Fix You",            artist: "Coldplay",          genre: "pop",       hue: 196 },
  happier:    { id: "happier",    title: "Happier",            artist: "Olivia Rodrigo",    genre: "pop",       hue: 300 },
  wheniwas:   { id: "wheniwas",   title: "When I Was Your Man",artist: "Bruno Mars",        genre: "pop",       hue: 18  },
  moonlight:  { id: "moonlight",  title: "Moonlight Sonata",   artist: "Beethoven",         genre: "classical", hue: 230 },
  gymnopedie: { id: "gymnopedie", title: "Gymnopédie No.1",    artist: "Satie",             genre: "classical", hue: 174 },
  nocturne:   { id: "nocturne",   title: "Nocturne Op.9 No.2", artist: "Chopin",            genre: "classical", hue: 280 },
  ode:        { id: "ode",        title: "Ode to Joy",         artist: "Beethoven",         genre: "classical", hue: 120 },
  prelude:    { id: "prelude",    title: "Prelude in C",       artist: "Bach",              genre: "classical", hue: 96  },
  married:    { id: "married",    title: "Married Life (Up)",  artist: "M. Giacchino",      genre: "film",      hue: 48  },
  merrygo:    { id: "merrygo",    title: "Merry-Go-Round",     artist: "J. Hisaishi",       genre: "film",      hue: 210 },
  interstellar:{id: "interstellar",title: "Interstellar",      artist: "H. Zimmer",         genre: "film",      hue: 214 },
  comptine:   { id: "comptine",   title: "Comptine d'un autre été", artist: "Yann Tiersen", genre: "film",      hue: 158 },
};

/* The 10 starter cards shown first (balanced pop + classical) */
const OB_SONG_START = ["perfect", "thousand", "someone", "lovely", "safe", "furelise", "river", "clair", "canon", "clocks"];

/* Clicking a song reveals up to 5 related picks (by vibe / artist / era) */
const OB_RELATED = {
  perfect:   ["thousand", "wheniwas", "letitbe", "hallelujah", "happier"],
  thousand:  ["perfect", "river", "married", "hallelujah", "comptine"],
  someone:   ["wheniwas", "fixyou", "happier", "hallelujah", "lovely"],
  clocks:    ["fixyou", "interstellar", "river", "married", "perfect"],
  lovely:    ["happier", "someone", "comptine", "river", "interstellar"],
  safe:      ["thousand", "hallelujah", "river", "happier", "letitbe"],
  furelise:  ["ode", "moonlight", "nocturne", "prelude", "gymnopedie"],
  river:     ["comptine", "merrygo", "clair", "gymnopedie", "interstellar"],
  clair:     ["gymnopedie", "nocturne", "moonlight", "comptine", "prelude"],
  canon:     ["prelude", "ode", "clair", "married", "river"],
  hallelujah:["letitbe", "perfect", "thousand", "fixyou", "someone"],
  letitbe:   ["hallelujah", "perfect", "fixyou", "wheniwas", "someone"],
  fixyou:    ["clocks", "interstellar", "someone", "river", "married"],
  happier:   ["lovely", "someone", "wheniwas", "perfect", "fixyou"],
  wheniwas:  ["someone", "perfect", "happier", "letitbe", "hallelujah"],
  moonlight: ["furelise", "nocturne", "clair", "gymnopedie", "prelude"],
  gymnopedie:["clair", "comptine", "river", "nocturne", "merrygo"],
  nocturne:  ["clair", "moonlight", "gymnopedie", "furelise", "prelude"],
  ode:       ["furelise", "canon", "prelude", "moonlight", "married"],
  prelude:   ["canon", "ode", "gymnopedie", "furelise", "clair"],
  married:   ["merrygo", "comptine", "interstellar", "thousand", "river"],
  merrygo:   ["comptine", "river", "married", "interstellar", "gymnopedie"],
  interstellar:["clocks", "fixyou", "merrygo", "married", "river"],
  comptine:  ["merrygo", "river", "gymnopedie", "married", "clair"],
};

/* ----------------------- get-to-know-you options ------------------ */
const OB_WHY = [
  { id: "fun",   emoji: "🎉", t: "Just for fun" },
  { id: "song",  emoji: "🎯", t: "One song I'm obsessed with" },
  { id: "exam",  emoji: "🎓", t: "Grades / exams" },
  { id: "kids",  emoji: "👨‍👩‍👧", t: "Teaching my kids" },
  { id: "relax", emoji: "🧘", t: "Relax & de-stress" },
];
const OB_PIANOS = [
  { id: "acoustic", emoji: "🎹", t: "Acoustic / upright", sub: "The real, heavy kind" },
  { id: "digital",  emoji: "🎛️", t: "Digital piano", sub: "88 weighted keys" },
  { id: "keyboard", emoji: "🎚️", t: "Keyboard", sub: "61 / 76 keys" },
  { id: "none",     emoji: "🛒", t: "Don't have one yet", sub: "We'll help you pick" },
];
const OB_SING = [
  { id: "yes",    emoji: "🎤", t: "Love to sing!" },
  { id: "little", emoji: "🫣", t: "In the shower only" },
  { id: "no",     emoji: "🙅", t: "Just the keys, thanks" },
];

/* ----------------------- placement ladder ------------------------- */
/* Melodies are scale-degree white-key phrases of PUBLIC-DOMAIN pieces.
   [midi, lyric?] — lyric only where it's a real PD song text. */
const OB_TWINKLE = [
  [60, "Twin"], [60, "kle"], [67, "twin"], [67, "kle"], [69, "lit"], [69, "tle"], [67, "star"],
];
const OB_ODE = [
  [64], [64], [65], [67], [67], [65], [64], [62], [60], [60], [62], [64], [64], [62],
];
/* A recognizable Bach-style (PD) advanced-looking phrase for the top rung */
const OB_SONATA = [
  [60], [64], [67], [72], [71], [67], [64], [62], [65], [69], [74], [72],
];

const OB_LADDER = [
  { id: "findC",  type: "findKey",   level: 0, prompt: "Find C", say: "This little keyboard is one octave — it runs from C all the way up to the next C. Tap any C key!", targets: [60, 72], low: 60, high: 72, hint: "Tip: C is just to the LEFT of every group of TWO black keys." },
  { id: "findF",  type: "findKey",   level: 1, prompt: "Now find F", say: "Nice! Now find F — it sits just to the left of the group of THREE black keys.", targets: [65], low: 60, high: 72, hint: "Tip: F is just to the LEFT of every group of THREE black keys." },
  { id: "read",   type: "readNote",  level: 2, prompt: "Read this note, then play it", say: "Here's a note on the staff. Can you find it on the keys?", target: 65, note: 65, low: 60, high: 72 },
  { id: "twinkle",type: "playPhrase",level: 3, prompt: "Play the first line of Twinkle, Twinkle", say: "Read the notes on the staff and play them on the keys. Take your time!", melody: OB_TWINKLE, songName: "Twinkle, Twinkle, Little Star", low: 60, high: 72 },
  { id: "ode",    type: "playPhrase",level: 4, prompt: "Try the theme from Ode to Joy", say: "A little longer this time. Take it slow.", melody: OB_ODE, songName: "Ode to Joy — Beethoven", low: 59, high: 72 },
  { id: "safe",   type: "selfAssess",level: 5, prompt: "Could you play this one?", say: "No need to play it now — just tell me honestly.", refSong: "safe" },
  { id: "sonata", type: "selfAssess",level: 6, prompt: "And a classical sonata theme?", say: "Last one! Be honest so I place you just right.", refSong: "moonlight", showStaff: true, melody: OB_SONATA },
];
const OB_SELF_OPTS = [
  { id: "yes",   t: "Yes, comfortably", v: 1 },
  { id: "rough", t: "Roughly / slowly", v: 0.5 },
  { id: "no",    t: "Not yet", v: 0, stop: true },
];

/* ----------------------- Maestro AI persona ----------------------- */
function obMaestroSystem(p) {
  const age = p.age ? `${p.age} years old` : "age unknown";
  return [
    "You are Maestro — a warm, funny penguin piano teacher (think a cheerful Beethoven penguin) inside the kids-and-families app 'Piano Professor'.",
    `You're chatting with a brand-new student named ${p.name || "friend"} (${age}) to break the ice before lessons.`,
    "RULES: Keep every reply to 1–2 short sentences. Sound modern, warm and a little funny — never stiff or corporate. Use at most one emoji. Be encouraging.",
    "Ask exactly ONE simple, friendly follow-up question each turn (about their music taste, what they want to play, how they're feeling about starting, etc.).",
    "If the student is a young kid, keep words simple. Never give long lectures. Never mention you are an AI or a language model — you are Maestro.",
  ].join(" ");
}
const OB_AI_OPENERS = [
  "Hi! I'm Maestro 🎹 So glad you're here. What made you want to learn piano?",
  "Hey, I'm Maestro! Quick one before we start — what kind of music makes you go 'I wish I could play that'?",
  "Welcome aboard! I'm Maestro. Tell me — are you totally new to piano, or have you tinkered before?",
];
/* Fallback replies if the live AI is unavailable (keeps the demo flowing) */
const OB_AI_FALLBACK = [
  "Love that! 🎶 And when you imagine playing, is it more cosy-classical or turn-it-up pop?",
  "Amazing — we'll absolutely get you there. Do you want to play to relax, or to wow someone?",
  "Got it! One more: would you rather learn a song you adore, or build rock-solid skills first?",
];

/* Tap-driven ice-breaker — no typing. Maestro asks, student taps, Maestro reacts (live AI). */
const OB_ICE = [
  { q: "What pulled you toward piano?", opts: [
    { t: "I heard a song I LOVE 🎵", react: "Ooh, the BEST reason — we'll get you playing it." },
    { t: "My family plays 👨‍👩‍👧", react: "Love that — piano runs in the family now!" },
    { t: "It just looks so cool 😎", react: "It IS cool. And you're about to look very cool playing it." },
    { t: "Always dreamed of it ✨", react: "Dreams to fingers-on-keys. Let's make it real." },
  ] },
  { q: "How are you feeling about starting?", opts: [
    { t: "So excited! 🤩", react: "Same!! Let's pour that energy into the keys." },
    { t: "A little nervous 😅", react: "Totally normal — I'll go nice and gentle, promise." },
    { t: "Super determined 💪", react: "Oh, I LIKE that. You're going to fly." },
    { t: "Just curious 👀", react: "Curiosity is how every great pianist starts." },
  ] },
  { q: "When you play, you want to feel like…", opts: [
    { t: "A pop star 🎤", react: "Spotlight's yours — chords and chart hits coming up." },
    { t: "A movie composer 🎬", react: "Epic. We'll build toward those big cinematic feels." },
    { t: "Classy & classical 🎻", react: "Timeless taste. Beautiful technique ahead." },
    { t: "Chill & happy 😌", react: "The best kind of playing — cosy and joyful." },
  ] },
];

Object.assign(window, {
  OB_SONGS, OB_SONG_START, OB_RELATED, OB_WHY, OB_PIANOS, OB_SING,
  OB_LADDER, OB_SELF_OPTS, OB_TWINKLE, OB_ODE, OB_SONATA,
  obMaestroSystem, OB_AI_OPENERS, OB_AI_FALLBACK, OB_ICE,
});
