// Piano Professor — static content & data model.
// Ported from the design prototype (app/data.jsx). Drives levels, the home
// shelves, songs, placement test, subscription plans, avatars and the sample
// lesson script.

export interface Level {
  id: string;
  name: string;
  short: string;
  color: string;
  deep: string;
  blurb: string;
  grade: number;
}

export const LEVELS: Level[] = [
  { id: 'kg', name: 'Kindergarten', short: 'KG', color: '#58CC02', deep: '#3D8E00', blurb: 'Your very first notes & the magic of lit keys.', grade: 1 },
  { id: 'el', name: 'Elementary',   short: 'EL', color: '#5BB8E3', deep: '#2E84AD', blurb: 'Two hands, simple chords, your first real song.', grade: 3 },
  { id: 'ms', name: 'Middle School',short: 'MS', color: '#F5B800', deep: '#C28A00', blurb: 'Chord changes, rhythm and pop progressions.', grade: 5 },
  { id: 'hs', name: 'High School',  short: 'HS', color: '#FF7A52', deep: '#C2410C', blurb: 'Syncopation, inversions & expressive playing.', grade: 7 },
  { id: 'un', name: 'University',   short: 'UN', color: '#9b6bff', deep: '#6b3fd4', blurb: 'Advanced voicings, improvisation, theory.', grade: 9 },
  { id: 'ma', name: 'Master',       short: 'MA', color: '#2D2A26', deep: '#000000', blurb: 'Concert-level repertoire & your own style.', grade: 12 },
];

export const levelById = (id: string): Level =>
  LEVELS.find((l) => l.id === id) ?? LEVELS[0];

export interface Avatar { mood: string; bg: string; }

export const AVATARS: Avatar[] = [
  { mood: 'cool', bg: '#FFE38A' }, { mood: 'conduct', bg: '#BFE6FF' },
  { mood: 'magician', bg: '#E3D2FF' }, { mood: 'painter', bg: '#FFD7C2' },
  { mood: 'rebel', bg: '#D7F5C2' }, { mood: 'futurist', bg: '#C2F0FF' },
  { mood: 'chef', bg: '#FFE0A8' }, { mood: 'classical', bg: '#EADFC6' },
  { mood: 'drummer', bg: '#FFC9C9' }, { mood: 'violin', bg: '#FFE38A' },
  { mood: 'astronaut', bg: '#CFE0FF' }, { mood: 'showman', bg: '#FFD0E6' },
  { mood: 'nature', bg: '#C9F0D2' }, { mood: 'star', bg: '#FFE9A0' },
  { mood: 'wow', bg: '#D6E8FF' }, { mood: 'love', bg: '#FFD3DD' },
];

export type LearningPath = 'chords' | 'soloist';

export interface Profile {
  id: string;
  name: string;
  avatar: string;   // Maestro mood
  bg: string;
  color: string;
  streak: number;
  xp: number;
  gems: number;
  hearts: number;   // 0..5
  levelId: string;
  grade: number;
  placed: boolean;
  path: LearningPath;
  lastUnit: string;
  lang: string;
  /** itemId -> stars earned (drives derived shelf states). */
  progress?: Record<string, number>;
  /** Daily XP goal (Casual 20 / Regular 50 / Serious 100 / Intense 150). */
  dailyGoalXp?: number;
  /** XP earned today (daily-goal bucket). */
  todayXp?: number;
  /** Local date key (YYYY-MM-DD) of the last completed lesson. */
  lastActiveDate?: string;
  /** Per-day XP history (YYYY-MM-DD -> xp) for the weekly chart. */
  history?: Record<string, number>;
  /** Timestamp of the last heart loss — drives the 30-min refill timer. */
  heartsAt?: number;
}

export type ItemKind = 'lesson' | 'song' | 'concept' | 'exercise';
export type ItemState = 'done' | 'active' | 'locked' | 'soon';

export interface ShelfItem {
  id: string;
  kind: ItemKind;
  title: string;
  sub: string;
  state: ItemState;
  stars?: number;
  progress?: number;
  premium?: boolean;
}

export interface Shelf {
  levelId: string;
  title: string;
  color: string;
  deep: string;
  items: ShelfItem[];
}

export const SHELVES: Shelf[] = [
  {
    levelId: 'kg', title: 'Kindergarten · Grade 1', color: '#58CC02', deep: '#3D8E00',
    items: [
      { id: 'k1', kind: 'lesson',  title: 'First 3 Notes', sub: 'C · D · E', state: 'done', stars: 3 },
      { id: 'k2', kind: 'lesson',  title: 'Find Middle C', sub: 'Your home base', state: 'done', stars: 3 },
      { id: 'k3', kind: 'song',    title: 'Twinkle Twinkle', sub: 'Trad.', state: 'done', stars: 2 },
      { id: 'k4', kind: 'concept', title: 'Loud & Soft', sub: 'Dynamics for tiny hands', state: 'done', stars: 3 },
    ],
  },
  {
    levelId: 'el', title: 'Elementary · Grade 3', color: '#5BB8E3', deep: '#2E84AD',
    items: [
      { id: 'e1', kind: 'lesson',  title: 'Pop Chords I', sub: 'C · G · Am · F', state: 'done', stars: 3 },
      { id: 'e2', kind: 'lesson',  title: 'Both Hands', sub: 'Left + right together', state: 'active', progress: 60 },
      { id: 'e3', kind: 'song',    title: 'Let It Be', sub: 'The Beatles', state: 'locked' },
      { id: 'e4', kind: 'concept', title: 'Reading Rhythm', sub: 'Quarter & half notes', state: 'locked' },
      { id: 'e5', kind: 'exercise',title: 'Chord Sprint', sub: 'Speed drill', state: 'soon' },
    ],
  },
  {
    levelId: 'ms', title: 'Middle School · Grade 5', color: '#F5B800', deep: '#C28A00',
    items: [
      { id: 'm1', kind: 'lesson',  title: 'Chord Changes', sub: 'Smooth transitions', state: 'locked' },
      { id: 'm2', kind: 'song',    title: 'Someone Like You', sub: 'Adele', state: 'locked', premium: true },
      { id: 'm3', kind: 'concept', title: 'The Circle of 5ths', sub: 'Why keys work', state: 'locked', premium: true },
      { id: 'm4', kind: 'exercise',title: 'Inversion Gym', sub: 'Move between shapes', state: 'locked', premium: true },
    ],
  },
  {
    levelId: 'hs', title: 'High School · Grade 7', color: '#FF7A52', deep: '#C2410C',
    items: [
      { id: 'h1', kind: 'lesson',  title: 'Syncopation', sub: 'Play off the beat', state: 'locked', premium: true },
      { id: 'h2', kind: 'song',    title: 'Clocks', sub: 'Coldplay', state: 'locked', premium: true },
      { id: 'h3', kind: 'song',    title: 'River Flows in You', sub: 'Yiruma', state: 'locked', premium: true },
    ],
  },
  {
    levelId: 'un', title: 'University · Grade 9', color: '#9b6bff', deep: '#6b3fd4',
    items: [
      { id: 'u1', kind: 'lesson',  title: 'Jazz Voicings', sub: 'Rootless & rich', state: 'locked', premium: true },
      { id: 'u2', kind: 'concept', title: 'Improv Basics', sub: 'Make it up, on key', state: 'locked', premium: true },
      { id: 'u3', kind: 'song',    title: 'Autumn Leaves', sub: 'Jazz standard', state: 'locked', premium: true },
    ],
  },
  {
    levelId: 'ma', title: 'Master · Grade 12', color: '#C9A227', deep: '#8A5E0C',
    items: [
      { id: 'a1', kind: 'lesson',  title: 'Concert Études', sub: 'Recital-ready', state: 'locked', premium: true },
      { id: 'a2', kind: 'concept', title: 'Your Signature Style', sub: 'Sound like you', state: 'locked', premium: true },
      { id: 'a3', kind: 'song',    title: 'Clair de Lune', sub: 'Debussy', state: 'locked', premium: true },
    ],
  },
];

// Demo starting progress: everything the design marks "done" up front, keyed
// to its star rating. New profiles created via onboarding start empty.
export function seedProgress(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const shelf of SHELVES) {
    for (const item of shelf.items) {
      if (item.state === 'done') map[item.id] = item.stars ?? 3;
    }
  }
  return map;
}

export const PROFILES_SEED: Profile[] = [
  { id: 'p1', name: 'Ava', avatar: 'cool',   bg: '#FFE38A', color: '#58CC02', streak: 12, xp: 3480, gems: 240, hearts: 5, levelId: 'el', grade: 3, placed: true, path: 'chords',  lastUnit: 'Both Hands', lang: 'en', progress: seedProgress(), todayXp: 30 },
  { id: 'p2', name: 'Leo', avatar: 'rebel',  bg: '#D7F5C2', color: '#FF7A52', streak: 4,  xp: 1260, gems: 80,  hearts: 4, levelId: 'kg', grade: 1, placed: true, path: 'soloist', lastUnit: 'First 3 Notes', lang: 'vi', progress: seedProgress(), todayXp: 0 },
  { id: 'p3', name: 'Mum', avatar: 'violin', bg: '#FFE38A', color: '#9b6bff', streak: 31, xp: 9120, gems: 510, hearts: 5, levelId: 'ms', grade: 5, placed: true, path: 'chords',  lastUnit: 'Both Hands', lang: 'fr', progress: seedProgress(), todayXp: 0 },
];

export interface Song {
  id: string; title: string; artist: string; hue: number; level: string; premium?: boolean;
}

export const SONGS: { featured: Song; trending: Song[]; learn: Song[] } = {
  featured: { id: 's0', title: 'A Thousand Years', artist: 'Christina Perri', hue: 280, level: 'Elementary', premium: false },
  trending: [
    { id: 's1', title: 'Perfect', artist: 'Ed Sheeran', hue: 12, level: 'Elementary' },
    { id: 's2', title: 'Clocks', artist: 'Coldplay', hue: 200, level: 'High School', premium: true },
    { id: 's3', title: 'Someone Like You', artist: 'Adele', hue: 320, level: 'Middle School', premium: true },
    { id: 's4', title: 'Hallelujah', artist: 'L. Cohen', hue: 40, level: 'Elementary' },
    { id: 's5', title: 'Lovely', artist: 'Billie Eilish', hue: 250, level: 'Middle School', premium: true },
  ],
  learn: [
    { id: 's6', title: 'Twinkle Twinkle', artist: 'Trad.', hue: 90, level: 'Kindergarten' },
    { id: 's7', title: 'Ode to Joy', artist: 'Beethoven', hue: 150, level: 'Kindergarten' },
    { id: 's8', title: 'Let It Be', artist: 'The Beatles', hue: 30, level: 'Elementary' },
    { id: 's9', title: 'Million Reasons', artist: 'Lady Gaga', hue: 340, level: 'Elementary' },
    { id: 's10', title: 'Fix You', artist: 'Coldplay', hue: 190, level: 'Middle School', premium: true },
  ],
};

export interface PlacementOption { t: string; v: number; }
export interface PlacementQuestion { q: string; emoji: string; a: PlacementOption[]; noScore?: boolean; }

export const PLACEMENT: PlacementQuestion[] = [
  { q: 'Have you played piano before?', emoji: '🎹', a: [
    { t: 'Never touched one', v: 0 }, { t: 'A little, long ago', v: 1 },
    { t: 'I know a few songs', v: 2 }, { t: 'I play regularly', v: 3 },
  ] },
  { q: 'Can you read sheet music?', emoji: '🎼', a: [
    { t: 'Not at all', v: 0 }, { t: 'Slowly, note by note', v: 1 },
    { t: 'Yes, fairly well', v: 2 }, { t: 'Fluently', v: 3 },
  ] },
  { q: 'Which feels true about chords?', emoji: '🎵', a: [
    { t: "What's a chord?", v: 0 }, { t: 'I know C and G', v: 1 },
    { t: 'Major & minor, no problem', v: 2 }, { t: 'I improvise with them', v: 3 },
  ] },
  { q: 'Play with two hands together?', emoji: '🙌', a: [
    { t: 'One hand is plenty', v: 0 }, { t: 'Slowly, with effort', v: 1 },
    { t: 'Yes, comfortably', v: 2 }, { t: 'Independent hands, easy', v: 3 },
  ] },
  { q: "What's your goal?", emoji: '⭐', noScore: true, a: [
    { t: 'Play songs I love', v: 0 }, { t: 'Understand music', v: 0 },
    { t: 'Impress my family', v: 0 }, { t: 'Get seriously good', v: 0 },
  ] },
];

// Map a summed placement score (max 12 from 4 scored questions) to a level.
export function levelFromScore(score: number): Level {
  if (score <= 1) return levelById('kg');
  if (score <= 3) return levelById('el');
  if (score <= 6) return levelById('ms');
  if (score <= 8) return levelById('hs');
  if (score <= 10) return levelById('un');
  return levelById('ma');
}

export interface Plan {
  id: string; name: string; profiles: number; icon: string; monthly: number; blurb: string; best?: boolean;
}

export const PLANS: Plan[] = [
  { id: 'individual', name: 'Individual', profiles: 1, icon: '👤', monthly: 18.74, blurb: '1 premium profile' },
  { id: 'duo', name: 'Duo', profiles: 2, icon: '👥', monthly: 20.83, blurb: '2 premium profiles' },
  { id: 'family', name: 'Family', profiles: 5, icon: '👨‍👩‍👧‍👦', monthly: 26.24, blurb: 'Up to 5 profiles', best: true },
];

// ── Lesson script (teach / quiz steps; MIDI note numbers → color) ──
export interface LessonStep {
  type: 'teach' | 'quiz';
  text: string;
  say?: string;
  prompt?: string;
  notes?: Record<number, string>;
  lit?: Record<number, string>;
  labels?: Record<number, string>;
  target?: number[];
  seq?: boolean;
}

export interface Lesson { title: string; sub: string; steps: LessonStep[]; }

export const SAMPLE_LESSON: Lesson = {
  title: 'Pop Chords I',
  sub: 'Elementary · Grade 3',
  steps: [
    { type: 'teach', text: "Let's learn the C major chord. Place your thumb on C.", say: "Let's learn the C major chord.", notes: { 60: '#58CC02' }, labels: { 60: 'C' } },
    { type: 'quiz', prompt: 'Play C', text: 'Press the glowing C key.', target: [60], lit: { 60: '#58CC02' }, labels: { 60: 'C' } },
    { type: 'teach', text: 'A C chord is C, E and G played together.', say: 'A C chord is C, E and G together.', notes: { 60: '#58CC02', 64: '#58CC02', 67: '#58CC02' }, labels: { 60: 'C', 64: 'E', 67: 'G' } },
    { type: 'quiz', prompt: 'Play the C chord', text: 'Press all three glowing keys.', target: [60, 64, 67], lit: { 60: '#58CC02', 64: '#58CC02', 67: '#58CC02' } },
    { type: 'teach', text: 'Now G major: G, B and D. Slide your hand up.', say: 'Now the G major chord.', notes: { 67: '#5BB8E3', 71: '#5BB8E3', 74: '#5BB8E3' }, labels: { 67: 'G', 71: 'B', 74: 'D' } },
    { type: 'quiz', prompt: 'Play the G chord', text: 'Press the glowing keys.', target: [67, 71, 74], lit: { 67: '#5BB8E3', 71: '#5BB8E3', 74: '#5BB8E3' } },
    { type: 'quiz', prompt: 'Switch: C then G', text: 'Play C chord, then G chord.', target: [60, 64, 67, 67, 71, 74], seq: true, lit: { 60: '#58CC02', 64: '#58CC02', 67: '#5BB8E3', 71: '#5BB8E3', 74: '#5BB8E3' } },
  ],
};

// abstract album art from a hue (used by song covers)
export function artColors(hue: number): [string, string] {
  return [`hsl(${hue}, 80%, 62%)`, `hsl(${(hue + 40) % 360}, 75%, 48%)`];
}

// stars earned from hearts remaining (5→3, 3-4→2, else 1)
export function starsFromHearts(hearts: number): number {
  if (hearts >= 5) return 3;
  if (hearts >= 3) return 2;
  return 1;
}
