import { parseMusicXmlNotes, groupIntoChords, musicXmlToLesson } from '../omr/musicxmlToLesson';

const XML = `
<score-partwise>
  <part id="P1">
    <measure number="1">
      <note><pitch><step>C</step><octave>4</octave></pitch></note>
      <note><chord/><pitch><step>E</step><octave>4</octave></pitch></note>
      <note><chord/><pitch><step>G</step><octave>4</octave></pitch></note>
      <note><rest/></note>
      <note><pitch><step>F</step><alter>1</alter><octave>4</octave></pitch></note>
    </measure>
  </part>
</score-partwise>`;

describe('musicxmlToLesson', () => {
  it('extracts pitched notes and skips rests', () => {
    const notes = parseMusicXmlNotes(XML);
    expect(notes.map((n) => n.note)).toEqual(['C4', 'E4', 'G4', 'F#4']);
  });

  it('groups <chord/> notes onto the same onset', () => {
    const groups = groupIntoChords(parseMusicXmlNotes(XML));
    expect(groups[0]).toEqual(['C4', 'E4', 'G4']); // the triad
    expect(groups[1]).toEqual(['F#4']);
  });

  it('produces a playable Lesson with chord + seq segments', () => {
    const lesson = musicXmlToLesson(XML, 'Test');
    expect(lesson.grade).toBe(0);
    expect(lesson.steps).toHaveLength(1);
    const types = lesson.steps[0].segments.map((s) => s.type);
    expect(types).toContain('chord');
    expect(types[0]).toBe('say');
  });
});
