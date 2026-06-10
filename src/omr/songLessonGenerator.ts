import { Lesson, LessonSegment, LessonStep } from '../lessons/schema';
import { NoteEvent } from './musicxmlScore';
import { ImportedSong } from './importedSongs';
import { analyzeSong, MeasureChord, SongAnalysis } from './analyzeSong';

// Turns an imported song into a complete A→Z course, the way a teacher would
// take it apart — understand first, memorize never:
//   1. overview: what this song is made of, what to notice
//   2. the key + where it sits on the circle of fifths
//   3. the rhythm: count it before you play it
//   4. LEFT HAND first: every chord one by one (1-3-5, fingering), you play each
//   5. the chord loop: play the progression in time
//   6. RIGHT HAND: melody section by section (with finger-crossing advice)
//   7. hands together, a few bars at a time
//   8. dynamics + pedal: where to lean in, where to whisper
//   9. perform with the metronome
// Every "you play" moment is a quiz segment — the engine waits until the
// student actually plays the notes (on-screen keys or BLE piano).

const say = (text: string, gap = 250): LessonSegment => ({ type: 'say', text, gap });
const pause = (ms: number): LessonSegment => ({ type: 'pause', ms });

export function generateSongLesson(song: ImportedSong): Lesson {
  const a = analyzeSong(song.score, song.xml);
  const steps: LessonStep[] = [];

  steps.push(overviewStep(song, a));
  steps.push(keyStep(a));
  steps.push(rhythmStep(a));

  const uniqueChords = dedupeChords(a.chords);
  if (uniqueChords.length) {
    steps.push(...leftHandChordSteps(uniqueChords, a));
    steps.push(progressionStep(uniqueChords, a));
  }
  steps.push(...rightHandSteps(song, a));
  if (a.hands.hasLeft && a.hands.hasRight) steps.push(handsTogetherStep(song, a));
  steps.push(expressionStep(a));
  steps.push(performStep(song, a));

  return {
    id: `course-${song.id}`,
    grade: 0,
    title: `${song.title} — full course`,
    subtitle: `${a.key.name} · ${Math.round(a.tempoBpm)} BPM · ${a.measureCount} bars`,
    xpReward: 50,
    complete: `That's ${song.title} — and you UNDERSTAND it, not just remember it. Play it once a day this week and it's yours forever.`,
    steps,
  };
}

// ── 1. Overview ──────────────────────────────────────────────────────────────

function overviewStep(song: ImportedSong, a: SongAnalysis): LessonStep {
  const segs: LessonSegment[] = [
    say(`Let's learn ${song.title} — properly, from A to Z.`),
    say(`Most people stare at the sheet and memorize it bar by bar. We won't. We'll take it apart first: the key, the chords, the rhythm, the sections — then your hands will know WHY they're moving.`),
    say(`The song is in ${a.key.name}, ${a.beatsPerMeasure} beats per bar, around ${Math.round(a.tempoBpm)} beats per minute, ${a.measureCount} bars long.`),
  ];
  if (a.sections.length > 1) {
    segs.push(say(`Its shape: ${a.sections.map((s) => s.label).join('. ')}.`));
    segs.push(say(`Knowing the shape matters — when you can say "now comes the chorus again", you've stopped memorizing and started understanding.`));
  }
  return { segments: segs };
}

// ── 2. Key + circle of fifths ────────────────────────────────────────────────

function keyStep(a: SongAnalysis): LessonStep {
  const k = a.key;
  const tonicNote = `${k.name.split(' ')[0]}4`;
  return {
    segments: [
      say(`First: the key. ${k.name}. That's home base — the note where the song feels finished.`),
      say(`On the circle of fifths, ${k.name} sits between ${k.neighborFlat} and ${k.neighborSharp}. Neighbors on the circle share most of their notes — that's why songs borrow chords from them.`),
      say(`Its relative key is ${k.relative} — the exact same keys on the piano, different home note. Composers slide between the two for mood.`),
      say(`From the circle we can predict this song's chords before reading a single bar: ${k.primaryChords.join(', ')}. Watch how often they show up.`),
      {
        type: 'quiz',
        prompt: `Find home base: play ${tonicNote.replace('4', '')} near middle C`,
        expect: [tonicNote],
        color: 'yellow',
        xp: 5,
      },
    ],
  };
}

// ── 3. Rhythm ────────────────────────────────────────────────────────────────

function rhythmStep(a: SongAnalysis): LessonStep {
  const counts = Array.from({ length: a.beatsPerMeasure }, (_, i) => `${i + 1}`).join(', ');
  return {
    segments: [
      say(`Now the rhythm — count it before you play it.`),
      say(`${a.beatsPerMeasure} beats per bar. Count out loud with me: ${counts}. Beat 1 is the strong one — that's where the left hand will land its chord.`),
      say(`This song is ${a.rhythm.summary}.`),
      say(`Turn on the metronome in the song player whenever you practice — keeping the beat IS the skill, wrong-notes-in-time beat right-notes-out-of-time.`),
      pause(400),
    ],
  };
}

// ── 4. Left hand: every chord, one by one ────────────────────────────────────

function dedupeChords(chords: MeasureChord[]): MeasureChord[] {
  const seen = new Set<string>();
  const out: MeasureChord[] = [];
  for (const c of chords) {
    if (c.label && !seen.has(c.label)) { seen.add(c.label); out.push(c); }
  }
  return out.slice(0, 6); // a course on more than 6 chords gets exhausting
}

function leftHandChordSteps(chords: MeasureChord[], a: SongAnalysis): LessonStep[] {
  const intro: LessonStep = {
    segments: [
      say(`Left hand first — always. The left hand is the song's skeleton; the melody hangs on it.`),
      say(`This song uses ${chords.length} chord${chords.length === 1 ? '' : 's'}: ${chords.map((c) => c.label).join(', ')}. We'll build each from its root with the ${chords[0].shape} rule, then you play it.`),
    ],
  };
  const steps: LessonStep[] = [intro];
  for (const c of chords) {
    const qualityWord = c.quality === 'major' ? 'major — count 1, 3, 5 up the scale from the root'
      : c.quality === 'minor' ? 'minor — same 1-3-5, but the 3 drops a half step, that\'s what makes it sad'
      : 'diminished — both the 3 and the 5 shrink, tense and unstable';
    steps.push({
      segments: [
        say(`${c.label}. Root ${c.lhNotes[0]?.replace(/\d/, '')}, built ${c.shape}: ${c.lhNotes.map((n) => n.replace(/\d/, '')).join(', ')}. It's ${qualityWord}.`),
        say(`Left-hand fingering: pinky 5 on the root, middle finger 3 in the middle, thumb 1 on top. Watch the keys light up.`),
        { type: 'chord', notes: c.lhNotes, color: 'cyan', wait: 1800 },
        {
          type: 'quiz',
          prompt: `Your turn: play ${c.label} with your left hand (5-3-1)`,
          expect: c.lhNotes,
          color: 'cyan',
          xp: 5,
        },
      ],
    });
  }
  return steps;
}

// ── 5. The progression loop ──────────────────────────────────────────────────

function progressionStep(chords: MeasureChord[], a: SongAnalysis): LessonStep {
  const segs: LessonSegment[] = [];
  if (a.loop) {
    segs.push(say(`Here's the engine of the song: the loop ${a.loop.labels.join(' → ')}, repeating ${a.loop.repeats} times. Learn these ${a.loop.labels.length} bars and you've learned most of the song.`));
  } else {
    segs.push(say(`The chords move like this through the song: ${a.chords.filter((c) => c.label).slice(0, 8).map((c) => c.label).join(' → ')}.`));
  }
  segs.push(say(`I'll light each chord in order — play along, one chord per bar, left hand only. Land each chord ON beat 1.`));
  const sequence = (a.loop
    ? a.loop.labels.map((l) => chords.find((c) => c.label === l)).filter(Boolean)
    : chords) as MeasureChord[];
  for (const c of sequence) {
    segs.push({ type: 'chord', notes: c.lhNotes, color: 'green', wait: 1600 });
  }
  segs.push(say(`Again, and this time say the chord names out loud as you play. Naming while playing is how it sticks.`));
  for (const c of sequence) {
    segs.push({ type: 'chord', notes: c.lhNotes, color: 'green', wait: 1400 });
  }
  return { segments: segs };
}

// ── 6. Right hand, section by section ────────────────────────────────────────

function rightHandSteps(song: ImportedSong, a: SongAnalysis): LessonStep[] {
  const melody = song.score.events.filter((e) => e.staff !== 2);
  if (!melody.length) return [];
  const steps: LessonStep[] = [{
    segments: [
      say(`Now the right hand — the melody. We go section by section, never the whole thing at once.`),
    ],
  }];
  for (const s of a.sections.slice(0, 4)) {
    const phrase = melody
      .filter((e) => e.measure >= s.startMeasure && e.measure <= s.endMeasure)
      .slice(0, 12);
    if (!phrase.length) continue;
    const segs: LessonSegment[] = [
      say(`${s.label}: bars ${s.startMeasure + 1} to ${s.endMeasure + 1}.`),
      say(`It starts on ${phrase[0].note}. Watch the phrase, then we'll play it.`),
      { type: 'seq', notes: phrase.map((e) => e.note), color: 'magenta', delay: 450 },
    ];
    const crossing = a.crossings.find((c) => c.measure >= s.startMeasure && c.measure <= s.endMeasure);
    if (crossing) segs.push(say(crossing.advice));
    segs.push({
      type: 'quiz',
      prompt: `Play the first 3 notes of this section`,
      expect: [...new Set(phrase.slice(0, 3).map((e) => e.note))],
      color: 'magenta',
      xp: 5,
    });
    segs.push(say(`Good. Now play along as it lights up — slowly, evenly. Speed comes last.`));
    segs.push({ type: 'seq', notes: phrase.map((e) => e.note), color: 'magenta', delay: 600 });
    steps.push({ segments: segs });
  }
  return steps;
}

// ── 7. Hands together ────────────────────────────────────────────────────────

function handsTogetherStep(song: ImportedSong, a: SongAnalysis): LessonStep {
  const segs: LessonSegment[] = [
    say(`Hands together — the moment everyone fears, so we make it tiny: ONE bar at a time, half speed.`),
    say(`The recipe: left hand plays its chord on beat 1 and holds. The right hand plays the melody on top. If you crash, slow down more — speed is the last thing we add.`),
  ];
  const bars = Math.min(4, a.measureCount);
  for (let m = 0; m < bars; m++) {
    const chord = a.chords[m];
    const melody = song.score.events
      .filter((e) => e.staff !== 2 && e.measure === m)
      .slice(0, 8);
    if (chord?.label) {
      segs.push(say(`Bar ${m + 1}: left hand ${chord.label}…`, 100));
      segs.push({ type: 'chord', notes: chord.lhNotes, color: 'cyan', wait: 1200 });
    }
    if (melody.length) {
      segs.push({ type: 'seq', notes: melody.map((e) => e.note), color: 'magenta', delay: 550 });
    }
  }
  segs.push(say(`That's the pattern for every bar in the song. Work through it section by section in the player.`));
  return { segments: segs };
}

// ── 8. Dynamics + pedal ──────────────────────────────────────────────────────

function expressionStep(a: SongAnalysis): LessonStep {
  const segs: LessonSegment[] = [
    say(`Last layer: expression. This is what separates playing the notes from playing the MUSIC.`),
  ];
  if (a.dynamics.length) {
    for (const d of a.dynamics.slice(0, 6)) {
      segs.push(say(`Bar ${d.measure + 1}: ${d.mark}.`, 100));
    }
  } else {
    segs.push(say(`The scan found no written dynamics, so use the universal rule: verses soft, chorus stronger. Start each phrase gently, lean into its highest note, and let the end of the phrase fall away.`));
  }
  if (a.pedals.length) {
    segs.push(say(`Pedal: press at bar${a.pedals.length > 1 ? 's' : ''} ${a.pedals.slice(0, 6).map((p) => p.measure + 1).join(', ')}.`));
    segs.push(say(`The motion: press the sustain pedal just AFTER beat 1, lift and re-press the instant the chord changes. Late pedal, clean change.`));
  } else {
    segs.push(say(`No pedal marks were scanned, so pedal by ear with the chords: press after each new chord lands, lift exactly when the next one arrives. If it sounds muddy, you're lifting late.`));
  }
  return { segments: segs };
}

// ── 9. Perform ───────────────────────────────────────────────────────────────

function performStep(song: ImportedSong, a: SongAnalysis): LessonStep {
  return {
    segments: [
      say(`Time to put it together. Open ${song.title} in the song player.`),
      say(`Turn the metronome ON and set the speed to half — around ${Math.round(a.tempoBpm * 0.5)} beats per minute. Play along with the falling notes: left hand chords on beat 1, right hand melody on top.`),
      say(`When a full run-through feels easy, raise the speed one notch. Full tempo is ${Math.round(a.tempoBpm)}. Three clean days at each speed, and you own this song.`),
    ],
  };
}
