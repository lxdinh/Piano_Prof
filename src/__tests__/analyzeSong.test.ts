import { parseMusicXmlScore } from '../omr/musicxmlScore';
import { analyzeSong, detectKey, findLoop, findCrossings } from '../omr/analyzeSong';
import { generateSongLesson } from '../omr/songLessonGenerator';
import { ImportedSong } from '../omr/importedSongs';
import { QuizSegment, SaySegment } from '../lessons/schema';

// A song with a known structure: 8 bars, C → Am → F → G loop twice (LH, staff 2),
// RH melody where bars 1-4 repeat as bars 5-8 (phrase A A). 4/4, no accidentals.

const CHORD_NOTES: Record<string, [string, string][]> = {
  C: [['C', '3'], ['E', '3'], ['G', '3']],
  Am: [['A', '2'], ['C', '3'], ['E', '3']],
  F: [['F', '2'], ['A', '2'], ['C', '3']],
  G: [['G', '2'], ['B', '2'], ['D', '3']],
};

function lhChord(label: string): string {
  const [first, ...rest] = CHORD_NOTES[label];
  const note = (s: string, o: string, chord: boolean) =>
    `<note>${chord ? '<chord/>' : ''}<pitch><step>${s}</step><octave>${o}</octave></pitch>` +
    `<duration>8</duration><staff>2</staff></note>`;
  return note(first[0], first[1], false) + rest.map(([s, o]) => note(s, o, true)).join('');
}

function rhMelody(notes: [string, string][]): string {
  return notes.map(([s, o]) =>
    `<note><pitch><step>${s}</step><octave>${o}</octave></pitch><duration>2</duration><staff>1</staff></note>`,
  ).join('');
}

const PHRASE: [string, string][][] = [
  [['E', '4'], ['G', '4'], ['C', '5'], ['G', '4']],
  [['A', '4'], ['E', '4'], ['C', '4'], ['E', '4']],
  [['F', '4'], ['A', '4'], ['C', '5'], ['A', '4']],
  [['G', '4'], ['B', '4'], ['D', '5'], ['B', '4']],
];

function buildSong(): string {
  const loop = ['C', 'Am', 'F', 'G'];
  let out = '<score-partwise><part-list><score-part id="P1"/></part-list><part id="P1">';
  for (let m = 0; m < 8; m++) {
    const attrs = m === 0
      ? '<attributes><divisions>2</divisions><key><fifths>0</fifths></key>' +
        '<time><beats>4</beats><beat-type>4</beat-type></time></attributes><sound tempo="100"/>'
      : '';
    out += `<measure number="${m + 1}">${attrs}${rhMelody(PHRASE[m % 4])}` +
      `<backup><duration>8</duration></backup>${lhChord(loop[m % 4])}</measure>`;
  }
  return out + '</part></score-partwise>';
}

const score = parseMusicXmlScore(buildSong());
const analysis = analyzeSong(score, buildSong());

describe('analyzeSong', () => {
  it('parser exposes measures, key signature, and time signature', () => {
    expect(score.measureCount).toBe(8);
    expect(score.fifths).toBe(0);
    expect(score.beatsPerMeasure).toBe(4);
  });

  it('detects the key and its circle-of-fifths context', () => {
    const key = detectKey(score);
    expect(key.name).toBe('C major');
    expect(key.relative).toBe('A minor');
    expect(key.neighborFlat).toBe('F major');
    expect(key.neighborSharp).toBe('G major');
    expect(key.primaryChords).toEqual(['C', 'F', 'G', 'Am']);
  });

  it('names the chord under every measure', () => {
    expect(analysis.chords.map((c) => c.label)).toEqual(['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G']);
    expect(analysis.chords[0].shape).toBe('1-3-5');
    expect(analysis.chords[1].shape).toBe('1-♭3-5');
  });

  it('finds the repeating chord loop', () => {
    expect(analysis.loop).toEqual({ labels: ['C', 'Am', 'F', 'G'], repeats: 2 });
  });

  it('maps the song sections by melodic repetition', () => {
    // bars 1-4 repeat as 5-8 → one letter spanning all 8 bars
    expect(analysis.sections).toHaveLength(1);
    expect(analysis.sections[0].letter).toBe('A');
    expect(analysis.sections[0].label).toContain('repeats 2×');
  });

  it('separates hands and profiles the rhythm', () => {
    expect(analysis.hands).toEqual({ hasLeft: true, hasRight: true });
    expect(analysis.rhythm.dominant).toBe('quarter notes');
  });

  it('flags finger crossings on long stepwise runs', () => {
    const run = parseMusicXmlScore(`
      <score-partwise><part id="P1"><measure number="1">
        <attributes><divisions>2</divisions></attributes>
        ${rhMelody([['C', '4'], ['D', '4'], ['E', '4'], ['F', '4'], ['G', '4'], ['A', '4'], ['B', '4'], ['C', '5']])}
      </measure></part></score-partwise>`);
    const crossings = findCrossings(run.events);
    expect(crossings).toHaveLength(1);
    expect(crossings[0].direction).toBe('up');
    expect(crossings[0].advice).toContain('thumb');
  });

  it('returns no loop for non-repeating chords', () => {
    expect(findLoop([
      { measure: 0, label: 'C', lhNotes: [], shape: '', quality: 'major' },
      { measure: 1, label: 'G', lhNotes: [], shape: '', quality: 'major' },
    ])).toBeNull();
  });
});

describe('generateSongLesson', () => {
  const song: ImportedSong = {
    id: 'test', title: 'Test Song', xml: buildSong(), score, pageCount: 1,
  };
  const lesson = generateSongLesson(song);
  const allSegments = lesson.steps.flatMap((s) => s.segments);
  const says = allSegments.filter((s): s is SaySegment => s.type === 'say').map((s) => s.text).join(' ');
  const quizzes = allSegments.filter((s): s is QuizSegment => s.type === 'quiz');

  it('teaches key, circle of fifths, rhythm, structure, and expression', () => {
    expect(says).toContain('C major');
    expect(says).toContain('circle of fifths');
    expect(says).toContain('4 beats per bar');
    expect(says).toContain('metronome');
    expect(says).toContain('pedal');
  });

  it('starts with the left hand and drills every chord as a quiz', () => {
    const lhIdx = says.indexOf('Left hand first');
    const rhIdx = says.indexOf('Now the right hand');
    expect(lhIdx).toBeGreaterThan(-1);
    expect(rhIdx).toBeGreaterThan(lhIdx);
    for (const label of ['C', 'Am', 'F', 'G']) {
      expect(quizzes.some((q) => q.prompt.includes(`play ${label} with your left hand`))).toBe(true);
    }
    // chord quizzes expect the actual chord notes
    const cQuiz = quizzes.find((q) => q.prompt.includes('play C with your left hand'));
    expect(cQuiz?.expect).toEqual(['C3', 'E3', 'G3']);
  });

  it('mentions the chord loop and runs on the existing lesson engine schema', () => {
    expect(says).toContain('C → Am → F → G');
    for (const seg of allSegments) {
      expect(['say', 'pause', 'chord', 'seq', 'seqAll', 'quiz']).toContain(seg.type);
    }
    expect(lesson.grade).toBe(0);
    expect(lesson.steps.length).toBeGreaterThanOrEqual(8);
  });
});
