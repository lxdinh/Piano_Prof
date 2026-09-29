// Piano Professor — turn an imported song into a complete A→Z course that the
// Lesson 1 engine (src/lesson1/engine.ts) runs as-is.
//
// Pedagogy (ported from the June branch): understand first, memorize never.
//   1. overview: what this song is made of, what to notice
//   2. the key + where it sits on the circle of fifths → find home base
//   3. the rhythm: count it before you play it
//   4. LEFT HAND first: every chord one by one (1-3-5, fingering), you play each
//   5. the chord loop: the engine's real play-along (demo, then you)
//   6. RIGHT HAND: melody section by section (with finger-crossing advice)
//   7. hands together, a few bars at a time
//   8. dynamics + pedal: where to lean in, where to whisper
//   9. perform the whole chart, then the complete screen
// Every "you play" moment is a wait segment — the engine holds until the
// learner actually plays the notes (on-screen keys or the BLE board).
//
// Output rules: only src/lesson1/data.ts segments; sharps-only note names,
// shifted by octaves into the LED range C2..B6 (C7 has no LED); colours are
// LED_RGB keys ('cool' left hand, 'warm' right hand, 'yellow' for hints); the
// last segment is lessonCompleteScreen preceded by awardXP, and the awardXP
// amounts across the course add up to exactly xpReward.
import {
  Lesson1, LessonStep, Segment, SongConfig,
  LED_LOW_MIDI, LED_HIGH_MIDI, NOTE_NAMES, midiToNote,
} from '../lesson1/data';
import { NoteEvent } from './musicxmlScore';
import { ImportedSong } from './importedSongs';
import { analyzeSong, MeasureChord, SongAnalysis, SongSection } from './analyzeSong';

/** A generated course: a Lesson1 the engine runs plus the metadata the Lesson screen shows. */
export interface GeneratedCourse {
  /** Stable id used as the progress key, e.g. `course-<songId>`. */
  id: string;
  title: string;
  subtitle: string;
  xpReward: number;
  lesson: Lesson1;
}

const XP_REWARD = 50;
const QUIZ_XP = 5;
const MAX_CHORDS = 6;        // a course on more than 6 chords gets exhausting
const MAX_SECTIONS = 4;
const MAX_PHRASE_NOTES = 8;
const MAX_CHART_BARS = 32;
const MAX_TOGETHER_BARS = 4;
const CHORD_DEMO_MS = 1500;
const TOGETHER_WINDOW_MS = 400;

const say = (text: string): Segment => ({ type: 'say', text });
const pause = (ms: number): Segment => ({ type: 'pause', ms });
const NEXT: Segment = { type: 'nextButton' };

export function generateSongLesson(song: ImportedSong): GeneratedCourse {
  const a = analyzeSong(song.score, song.xml);
  const xp = new XpBudget();
  const melody = melodyLine(song.score.events.filter((e) => e.staff !== 2));
  const chords = pickChords(a.chords);

  const steps: LessonStep[] = [];
  steps.push(overviewStep(song, a));
  steps.push(keyStep(a, xp));
  steps.push(rhythmStep(a));
  if (chords.length) {
    steps.push(leftHandStep(chords, xp));
    const loop = loopStep(song, chords, a);
    if (loop) steps.push(loop);
  }
  steps.push(...rightHandSteps(melody, a, xp));
  if (a.hands.hasLeft && a.hands.hasRight) {
    const together = handsTogetherStep(melody, a, xp);
    if (together) steps.push(together);
  }
  steps.push(expressionStep(a));
  steps.push(performStep(song, chords, a, xp));

  return {
    id: `course-${song.id}`,
    title: song.title,
    subtitle: `${a.key.name} · ${Math.round(a.tempoBpm)} BPM · ${a.measureCount} bars`,
    xpReward: XP_REWARD,
    lesson: { steps },
  };
}

// ── XP budget: 5 per quiz, the rest on the final award, never negative ───────

class XpBudget {
  private left = XP_REWARD;
  /** XP for one "you play it" moment — nothing once the budget is spent. */
  quiz(): Segment[] {
    const amount = Math.min(QUIZ_XP, this.left);
    if (amount <= 0) return [];
    this.left -= amount;
    return [{ type: 'awardXP', amount }];
  }
  /** Whatever is left, so the course totals exactly XP_REWARD. */
  final(): Segment {
    const amount = Math.max(0, this.left);
    this.left = 0;
    return { type: 'awardXP', amount };
  }
}

// ── Pitch helpers: any spelling → midi → sharps-only name inside the LED range

/** Parse a spelled pitch ("Bb3", "C#4", "E4") to midi; -1 when unreadable. */
export function pitchToMidi(name: string): number {
  const m = /^([A-G])(#{1,2}|b{1,2})?(-?\d+)$/.exec(name);
  if (!m) return -1;
  const alter = !m[2] ? 0 : m[2][0] === '#' ? m[2].length : -m[2].length;
  return (parseInt(m[3], 10) + 1) * 12 + NOTE_NAMES.indexOf(m[1]) + alter;
}

/** Shift by octaves into C2..B6 (never C7 — it has no LED); null when unusable. */
function fitLed(midi: number): number | null {
  if (!Number.isFinite(midi) || midi < 0) return null;
  let m = midi;
  while (m < LED_LOW_MIDI) m += 12;
  while (m > LED_HIGH_MIDI) m -= 12;
  return m >= LED_LOW_MIDI && m <= LED_HIGH_MIDI ? m : null;
}

const litNote = (midi: number): string | null => {
  const m = fitLed(midi);
  return m == null ? null : midiToNote(m);
};

/** Ordered sequence (repeats kept — a melody may revisit a note). */
function litSequence(midis: number[]): string[] {
  const out: string[] = [];
  for (const m of midis) { const n = litNote(m); if (n) out.push(n); }
  return out;
}

/** A chord: one entry per key, order kept. */
function litChord(midis: number[]): string[] {
  const out: string[] = [];
  for (const m of midis) { const n = litNote(m); if (n && !out.includes(n)) out.push(n); }
  return out;
}

const chordNotes = (c: MeasureChord): string[] => litChord(c.lhNotes.map(pitchToMidi));

/** "A#4" → "A#" for the spoken/typed line. */
const letter = (note: string): string => note.replace(/-?\d+$/, '');
/** "A#" → "A sharp" so the voice reads it properly. */
const spoken = (note: string): string => letter(note).replace('#', ' sharp');
/** "1-♭3-5" → "1, flat 3, 5" for speech. */
const spokenShape = (shape: string): string => shape.replace(/♭/g, 'flat ').split('-').join(', ');

// ── Score helpers ────────────────────────────────────────────────────────────

/** One note per onset — the top voice is the melody a right hand sings. */
function melodyLine(events: NoteEvent[]): NoteEvent[] {
  const byOnset = new Map<number, NoteEvent>();
  for (const e of events) {
    const key = Math.round(e.startBeats * 1000);
    const cur = byOnset.get(key);
    if (!cur || e.midi > cur.midi) byOnset.set(key, e);
  }
  return [...byOnset.values()].sort((x, y) => x.startBeats - y.startBeats);
}

/** The chords worth teaching: the most frequent ones (max 6), in order of first appearance. */
function pickChords(chords: MeasureChord[]): MeasureChord[] {
  const seen = new Map<string, { chord: MeasureChord; count: number; order: number }>();
  chords.forEach((c, i) => {
    if (!c.label) return;
    const e = seen.get(c.label);
    if (e) e.count++; else seen.set(c.label, { chord: c, count: 1, order: i });
  });
  return [...seen.values()]
    .sort((x, y) => y.count - x.count || x.order - y.order)
    .slice(0, MAX_CHORDS)
    .sort((x, y) => x.order - y.order)
    .map((e) => e.chord);
}

/**
 * Lesson 1 play-along voicing: right-hand triad with its root in F3..E4 (the
 * compact "everything around middle C" position) and the left hand on the root
 * one octave below. Index 0 is the left-hand note — the engine's lightChord
 * colours it with leftHandColor.
 */
function playAlongVoicing(c: MeasureChord): string[] | null {
  const lh = c.lhNotes.map(pitchToMidi).filter((m) => m >= 0);
  if (!lh.length) return null;
  const rootPc = ((lh[0] % 12) + 12) % 12;
  let root = 48 + rootPc;              // C3..B3
  if (root < 53) root += 12;           // → F3..E4
  const intervals = lh.map((m) => m - lh[0]);
  const notes = litChord([root - 12, ...intervals.map((iv) => root + iv)]);
  return notes.length >= 2 ? notes : null;
}

function songConfig(song: ImportedSong, chords: MeasureChord[], labels: string[]): SongConfig | null {
  const chordMap: Record<string, string[]> = {};
  for (const c of chords) {
    if (!c.label) continue;
    const voicing = playAlongVoicing(c);
    if (voicing) chordMap[c.label] = voicing;
  }
  const chart = labels
    .filter((l) => Boolean(chordMap[l]))
    .slice(0, MAX_CHART_BARS)
    .map((chord) => ({ chord, lyric: '' }));
  if (!chart.length) return null;
  return {
    song: song.title,
    displayMode: 'chords',
    gateMode: 'pauseUntilCorrect',
    ignoreWrongKeys: true,
    ledLookAheadMs: 600,
    ledColor: 'warm',
    leftHandColor: 'cool',
    windowMs: 250,
    chordMap,
    chart,
  };
}

const qualityWord = (q: MeasureChord['quality']): string =>
  q === 'major' ? 'major — count 1, 3, 5 up the scale from the root'
    : q === 'minor' ? "minor — same 1-3-5, but the 3 drops a half step, that's what makes it sad"
      : 'diminished — both the 3 and the 5 shrink, tense and unstable';

// ── 1. Overview ──────────────────────────────────────────────────────────────

function overviewStep(song: ImportedSong, a: SongAnalysis): LessonStep {
  const segments: Segment[] = [
    say(`Let's learn ${song.title} — properly, from A to Z.`),
    say("Most people stare at the sheet and memorize it bar by bar. We won't. We'll take it apart first: the key, the chords, the rhythm, the sections — then your hands will know WHY they're moving."),
    say(`The song is in ${a.key.name}, ${a.beatsPerMeasure} beats per bar, around ${Math.round(a.tempoBpm)} beats per minute, ${a.measureCount} bars long.`),
  ];
  if (a.sections.length > 1) {
    segments.push(say(`Its shape: ${a.sections.map((s) => s.label).join('. ')}.`));
    segments.push(say('Knowing the shape matters — when you can say "now comes the chorus again", you\'ve stopped memorizing and started understanding.'));
  }
  segments.push(NEXT);
  return { title: 'Overview', segments };
}

// ── 2. Key + circle of fifths → find home base ───────────────────────────────

function keyStep(a: SongAnalysis, xp: XpBudget): LessonStep {
  const k = a.key;
  const tonic = litNote(60 + k.tonicPc) ?? 'C4'; // C4..B4 — near middle C
  const name = spoken(tonic);
  return {
    title: 'The key',
    segments: [
      say(`First: the key. ${k.name}. That's home base — the note where the song feels finished.`),
      say(`On the circle of fifths, ${k.name} sits between ${k.neighborFlat} and ${k.neighborSharp}. Neighbors on the circle share most of their notes — that's why songs borrow chords from them.`),
      say(`Its relative key is ${k.relative} — the exact same keys on the piano, different home note. Composers slide between the two for mood.`),
      say(`From the circle we can predict this song's chords before reading a single bar: ${k.primaryChords.join(', ')}. Watch how often they show up.`),
      say(`Find home base: play ${name} near middle C — it's glowing yellow.`),
      { type: 'ledOn', notes: [tonic], color: 'yellow' },
      { type: 'waitPressCount', note: tonic, count: 1,
        onWrongKey: { led: 'redFlash', say: `Not quite — ${name} is the glowing key.` } },
      { type: 'ledOff', notes: [tonic] },
      ...xp.quiz(),
      say(`That's home. Everything in this song leaves from ${name} and comes back to it.`),
    ],
  };
}

// ── 3. Rhythm ────────────────────────────────────────────────────────────────

function rhythmStep(a: SongAnalysis): LessonStep {
  const counts = Array.from({ length: a.beatsPerMeasure }, (_, i) => `${i + 1}`).join(', ');
  return {
    title: 'Count it',
    segments: [
      say('Now the rhythm — count it before you play it.'),
      say(`${a.beatsPerMeasure} beats per bar. Count out loud with me: ${counts}. Beat 1 is the strong one — that's where the left hand will land its chord.`),
      say(`This song is ${a.rhythm.summary}.`),
      say('Turn on the metronome whenever you practice — keeping the beat IS the skill. Wrong notes in time beat right notes out of time.'),
      pause(400),
      NEXT,
    ],
  };
}

// ── 4. Left hand: every chord, one by one ────────────────────────────────────

function leftHandStep(chords: MeasureChord[], xp: XpBudget): LessonStep {
  const segments: Segment[] = [
    say("Left hand first — always. The left hand is the song's skeleton; the melody hangs on it."),
    say(`This song uses ${chords.length} chord${chords.length === 1 ? '' : 's'}: ${chords.map((c) => c.label).join(', ')}. We'll build each from its root with the ${spokenShape(chords[0].shape)} rule, then you play it.`),
  ];
  for (const c of chords) {
    const notes = chordNotes(c);
    if (notes.length < 2) continue;
    segments.push(
      say(`${c.label}. Root ${spoken(notes[0])}, built ${spokenShape(c.shape)}: ${notes.map(spoken).join(', ')}. It's ${qualityWord(c.quality)}.`),
      say('Left-hand fingering: pinky 5 on the root, middle finger 3 in the middle, thumb 1 on top. Watch the keys light up.'),
      { type: 'ledOn', notes, color: 'cool' },
      pause(CHORD_DEMO_MS),
      { type: 'ledOff', notes },
      say(`Your turn: play ${c.label} with your left hand, 5-3-1. Any order — just get all ${notes.length} keys.`),
      { type: 'ledOn', notes, color: 'yellow' },
      { type: 'waitPressAll', notes, anyOrder: true, turnOffOnPress: true, onWrongKey: { led: 'redFlash' } },
      ...xp.quiz(),
    );
  }
  return { title: 'Left hand', segments };
}

// ── 5. The chord loop — the engine's real play-along ─────────────────────────

function loopStep(song: ImportedSong, chords: MeasureChord[], a: SongAnalysis): LessonStep | null {
  const labels = a.loop
    ? a.loop.labels
    : a.chords.map((c) => c.label).filter((l): l is string => Boolean(l)).slice(0, 8);
  const cfg = songConfig(song, chords, labels);
  if (!cfg) return null;
  const shown = cfg.chart.map((b) => b.chord);
  const segments: Segment[] = [
    a.loop
      ? say(`Here's the engine of the song: the loop ${shown.join(' → ')}, repeating ${a.loop.repeats} times. Learn these ${shown.length} bars and you've learned most of the song.`)
      : say(`The chords move like this through the song: ${shown.join(' → ')}.`),
    say("In the play-along your left hand plays just the root, low, and your right hand takes the triad an octave up — the same shape you just learned. Land each chord ON beat 1."),
    say("Listen first — I'll play it once."),
    { type: 'songDemo', ...cfg },
    say('Now you. The music waits for you — it only moves on when the right chord lands.'),
    { type: 'playAlong', ...cfg },
    say('Say the chord names out loud as you play. Naming while playing is how it sticks.'),
  ];
  return { title: 'The chord loop', segments };
}

// ── 6. Right hand, section by section ────────────────────────────────────────

function phraseFor(melody: NoteEvent[], s: SongSection): string[] {
  return litSequence(
    melody
      .filter((e) => e.measure >= s.startMeasure && e.measure <= s.endMeasure)
      .slice(0, MAX_PHRASE_NOTES)
      .map((e) => e.midi),
  );
}

function rightHandSteps(melody: NoteEvent[], a: SongAnalysis, xp: XpBudget): LessonStep[] {
  if (!melody.length) return [];
  const sections = a.sections.slice(0, MAX_SECTIONS);
  const steps: LessonStep[] = [];
  for (const s of sections) {
    const notes = phraseFor(melody, s);
    if (!notes.length) continue;
    const segments: Segment[] = [];
    if (!steps.length) segments.push(say('Now the right hand — the melody. We go section by section, never the whole thing at once.'));
    segments.push(
      say(`${s.label}: bars ${s.startMeasure + 1} to ${s.endMeasure + 1}.`),
      say(`It starts on ${spoken(notes[0])}. Watch the phrase light up, then we'll play it.`),
      { type: 'sayWithSeq', text: `Listen: ${notes.map(spoken).join(', ')}.`, notes, color: 'warm' },
    );
    const crossing = a.crossings.find((c) => c.measure >= s.startMeasure && c.measure <= s.endMeasure);
    if (crossing) segments.push(say(crossing.advice));
    // A phrase that revisits a note keeps its lights on: switching a key off on
    // its first press would leave the learner guessing at the repeat.
    const repeats = new Set(notes).size !== notes.length;
    segments.push(
      say(`Your turn — play those ${notes.length} notes in order, slowly and evenly. Speed comes last.`),
      { type: 'waitPressOrdered', notes, turnOffOnPress: !repeats, onWrongOrder: { led: 'redFlash' } },
      { type: 'ledOff', notes },
      ...xp.quiz(),
    );
    steps.push({ title: sections.length > 1 ? `Right hand · ${s.letter}` : 'Right hand', segments });
  }
  return steps;
}

// ── 7. Hands together ────────────────────────────────────────────────────────

function handsTogetherStep(melody: NoteEvent[], a: SongAnalysis, xp: XpBudget): LessonStep | null {
  const segments: Segment[] = [
    say('Hands together — the moment everyone fears, so we make it tiny: ONE bar at a time, half speed.'),
    say('The recipe: left hand plays its chord on beat 1 and holds. The right hand plays the melody on top. If you crash, slow down more — speed is the last thing we add.'),
  ];
  let bars = 0;
  for (let m = 0; m < Math.min(MAX_TOGETHER_BARS, a.measureCount); m++) {
    const chord = a.chords[m];
    const first = melody.find((e) => e.measure === m);
    if (!chord?.label || !first) continue;
    const lh = chordNotes(chord);
    const rh = litNote(first.midi);
    if (lh.length < 2 || !rh) continue;
    const notes = lh.includes(rh) ? lh : [...lh, rh];
    bars++;
    segments.push(
      say(`Bar ${m + 1}: left hand ${chord.label}, right hand ${spoken(rh)}. Press them all together.`),
      { type: 'ledOn', notes: lh, color: 'cool' },
      { type: 'ledOn', notes: [rh], color: 'warm' },
      { type: 'waitChord', notes, windowMs: TOGETHER_WINDOW_MS,
        onNotSimultaneous: { say: 'Together — both hands land at the same moment.' } },
      { type: 'ledOff', notes },
    );
  }
  if (!bars) return null;
  segments.push(
    ...xp.quiz(),
    say("That's the pattern for every bar in the song: left hand holds the chord, right hand sings on top."),
  );
  return { title: 'Hands together', segments };
}

// ── 8. Dynamics + pedal ──────────────────────────────────────────────────────

function expressionStep(a: SongAnalysis): LessonStep {
  const segments: Segment[] = [
    say('Last layer: expression. This is what separates playing the notes from playing the MUSIC.'),
  ];
  if (a.dynamics.length) {
    for (const d of a.dynamics.slice(0, 6)) segments.push(say(`Bar ${d.measure + 1}: ${d.mark}.`));
  } else {
    segments.push(say('The scan found no written dynamics, so use the universal rule: verses soft, chorus stronger. Start each phrase gently, lean into its highest note, and let the end of the phrase fall away.'));
  }
  if (a.pedals.length) {
    segments.push(say(`Pedal: press at bar${a.pedals.length > 1 ? 's' : ''} ${a.pedals.slice(0, 6).map((p) => p.measure + 1).join(', ')}.`));
    segments.push(say('The motion: press the sustain pedal just AFTER beat 1, lift and re-press the instant the chord changes. Late pedal, clean change.'));
  } else {
    segments.push(say("No pedal marks were scanned, so pedal by ear with the chords: press after each new chord lands, lift exactly when the next one arrives. If it sounds muddy, you're lifting late."));
  }
  segments.push(NEXT);
  return { title: 'Dynamics & pedal', segments };
}

// ── 9. Perform ───────────────────────────────────────────────────────────────

function performStep(song: ImportedSong, chords: MeasureChord[], a: SongAnalysis, xp: XpBudget): LessonStep {
  const labels = a.chords.map((c) => c.label).filter((l): l is string => Boolean(l));
  const cfg = chords.length ? songConfig(song, chords, labels) : null;
  const segments: Segment[] = [
    say(`Time to put it together: ${song.title}, one chord per bar, both hands.`),
    say(`Half speed first — around ${Math.round(a.tempoBpm * 0.5)} beats per minute. Left hand root on beat 1, right hand triad on top. When a full run-through feels easy, raise the speed one notch. Full tempo is ${Math.round(a.tempoBpm)}.`),
  ];
  if (cfg) {
    segments.push(
      say("Listen first — I'll play it once."),
      { type: 'songDemo', ...cfg },
      say('Now your turn!'),
      { type: 'playAlong', ...cfg },
    );
  }
  segments.push(
    say('For the full melody with falling notes, open the song in the player and keep the metronome on. Three clean days at each speed, and you own this song.'),
    say(`That's ${song.title} — and you UNDERSTAND it, not just remember it. Play it once a day this week and it's yours forever.`),
    xp.final(),
    { type: 'lessonCompleteScreen' },
  );
  return { title: 'Perform', segments };
}
