// The review SCREEN between OMR and the player: the notation preview gets the
// score, the title/tempo edits reach the registry, and the three actions hand
// the reviewed song to the right place. The notation page itself is a pure
// string, tested directly at the bottom.
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockGo = jest.fn();
const mockBack = jest.fn();
const mockToast = jest.fn();
let mockParams: Record<string, unknown> = { songId: 'song-test' };
const mockSaveLocalSong = jest.fn<Promise<void>, [unknown]>(async () => {});
const mockRenameLocalSong = jest.fn<Promise<void>, [string, string]>(async () => {});
const mockGenerateSongLesson: jest.Mock = jest.fn();

jest.mock('react-native-webview', () => {
  const ReactActual = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  // Exposes what the screen handed the WebView so the test can read the page.
  const WebView = (props: any) =>
    ReactActual.createElement(View, { testID: 'webview', html: props.source?.html, whitelist: props.originWhitelist });
  return { WebView };
});

jest.mock('../theme/AppTheme', () => ({
  useAppTheme: () => ({
    colors: {
      bg: '#000', ink: '#fff', inkSoft: '#ccc', inkFaint: '#888', line: '#333',
      surface: '#111', surface2: '#222', green: '#58CC02', sky: '#2F9BD6',
      gold: '#F5B800', error: '#FF4B4B', selGreen: '#123',
    },
  }),
}));
// No active profile → useT() falls back to English, so the real strings render.
jest.mock('../state/AppState', () => ({ useApp: () => ({ activeProfile: null }) }));
jest.mock('../nav/Router', () => ({
  useRouter: () => ({ params: mockParams, go: mockGo, back: mockBack, toast: mockToast }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../theme/responsive', () => ({ useStage: () => ({ isTablet: false }) }));
jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual('react-native');
  return { LinearGradient: View };
});
jest.mock('../feedback/haptics', () => ({ tap: jest.fn() }));
// Referenced lazily: jest hoists these factories above the `const mock…` lines.
jest.mock('../omr/songLibrary', () => ({
  saveLocalSong: (song: unknown) => mockSaveLocalSong(song),
  renameLocalSong: (id: string, title: string) => mockRenameLocalSong(id, title),
}));
jest.mock('../omr/songLessonGenerator', () => ({
  generateSongLesson: (song: unknown) => mockGenerateSongLesson(song),
}));

// eslint-disable-next-line import/first
import ReviewScore, { notationHtml, TEMPO_MIN, TEMPO_MAX } from '../views/ReviewScore';
// eslint-disable-next-line import/first
import { registerImportedSong, getImportedSong } from '../omr/importedSongs';
// eslint-disable-next-line import/first
import { parseMusicXmlScore } from '../omr/musicxmlScore';

// ── fixture: 8 bars, C → Am → F → G twice, 4/4 at 100 BPM (same builder as analyzeSong.test.ts) ──
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

const XML = buildSong();

beforeEach(() => {
  mockGo.mockClear();
  mockBack.mockClear();
  mockToast.mockClear();
  mockSaveLocalSong.mockClear();
  mockRenameLocalSong.mockClear();
  mockGenerateSongLesson.mockReset();
  mockGenerateSongLesson.mockReturnValue({
    id: 'course-song-test', title: 'Test song', subtitle: '8 bars', xpReward: 50, lesson: { steps: [] },
  });
  mockParams = { songId: 'song-test' };
  registerImportedSong({ id: 'song-test', title: 'Test song', xml: XML, score: parseMusicXmlScore(XML), pageCount: 2 });
});

const clicks = (r: ReturnType<typeof render>, id: string, n: number) => {
  for (let i = 0; i < n; i++) fireEvent.press(r.getByTestId(id));
};

describe('ReviewScore — the screen', () => {
  it('shows the imported title and hands the score to the notation WebView', () => {
    const r = render(<ReviewScore />);
    expect(r.getByText('Review your score')).toBeTruthy();
    expect(r.getByTestId('title-input').props.value).toBe('Test song');
    expect(r.getByText('100 BPM')).toBeTruthy();
    // key · bars · chords, straight from analyzeSong
    expect(r.getByText(/C major · 8 bars · C Am F G/)).toBeTruthy();

    const web = r.getByTestId('webview');
    expect(web.props.whitelist).toEqual(['*']);
    expect(web.props.html).toContain('score-partwise');
    expect(web.props.html).toContain('<sound tempo=\\"100\\"/>'); // JSON-escaped inside the script
  });

  it('steps the tempo by 5 and clamps at 30 and 240', () => {
    const r = render(<ReviewScore />);
    fireEvent.press(r.getByTestId('tempo-plus'));
    expect(r.getByText('105 BPM')).toBeTruthy();

    clicks(r, 'tempo-plus', 40); // 105 → would be 305 without the clamp
    expect(r.getByText(`${TEMPO_MAX} BPM`)).toBeTruthy();

    clicks(r, 'tempo-minus', 60); // 240 → would be -60 without the clamp
    expect(r.getByText(`${TEMPO_MIN} BPM`)).toBeTruthy();
  });

  it('Save writes the renamed song to the library and confirms with a toast', async () => {
    const r = render(<ReviewScore />);
    fireEvent.changeText(r.getByTestId('title-input'), '  New title ');
    fireEvent.press(r.getByText('Save'));

    await waitFor(() => expect(mockRenameLocalSong).toHaveBeenCalledWith('song-test', 'New title'));
    expect(mockSaveLocalSong).toHaveBeenCalledTimes(1);
    expect(mockSaveLocalSong.mock.calls[0][0]).toEqual(expect.objectContaining({ id: 'song-test', title: 'New title' }));
    expect(mockToast).toHaveBeenCalledWith('Saved to My songs');
    // …and the in-memory handoff the player reads sees the same title.
    expect(getImportedSong('song-test')?.title).toBe('New title');
  });

  it('a blanked title falls back to the original instead of saving an empty name', async () => {
    const r = render(<ReviewScore />);
    fireEvent.changeText(r.getByTestId('title-input'), '   ');
    fireEvent.press(r.getByText('Save'));
    await waitFor(() => expect(mockRenameLocalSong).toHaveBeenCalledWith('song-test', 'Test song'));
  });

  it('Play applies the edits and opens the player on this song', () => {
    const r = render(<ReviewScore />);
    fireEvent.press(r.getByTestId('tempo-plus'));
    fireEvent.press(r.getByText('Play'));

    expect(mockGo).toHaveBeenCalledWith('songPlayer', { songId: 'song-test' });
    // The tempo edit re-timed the registered score; the notes are unchanged.
    const song = getImportedSong('song-test')!;
    expect(song.score.tempoBpm).toBe(105);
    expect(song.score.events.length).toBe(parseMusicXmlScore(XML).events.length);
  });

  it('leaves the score object alone when the tempo was not touched', () => {
    const before = getImportedSong('song-test')!.score;
    const r = render(<ReviewScore />);
    fireEvent.press(r.getByText('Play'));
    expect(getImportedSong('song-test')!.score).toBe(before);
  });

  it('Learn generates a course and runs it through the lesson route', () => {
    const r = render(<ReviewScore />);
    fireEvent.press(r.getByText('Learn A→Z'));

    expect(mockGenerateSongLesson).toHaveBeenCalledWith(expect.objectContaining({ id: 'song-test' }));
    expect(mockGo).toHaveBeenCalledWith('lesson', {
      item: { id: 'course-song-test', title: 'Test song', sub: '8 bars', kind: 'song' },
      lesson: { steps: [] },
    });
  });

  it('the back chevron goes back', () => {
    const r = render(<ReviewScore />);
    fireEvent.press(r.getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('says so when the song is no longer in memory', () => {
    mockParams = { songId: 'nope' };
    const r = render(<ReviewScore />);
    expect(r.getByText('Song not found')).toBeTruthy();
    expect(r.queryByTestId('webview')).toBeNull();
    fireEvent.press(r.getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

describe('notationHtml — the page inside the WebView', () => {
  it('embeds the xml as a JSON string that round-trips, and loads OpenSheetMusicDisplay', () => {
    const html = notationHtml(XML);
    expect(html).toContain('opensheetmusicdisplay');
    expect(html).toMatch(/<script src="https:\/\/[^"]*opensheetmusicdisplay[^"]*\.js"><\/script>/);

    const m = /const xml = ("(?:[^"\\]|\\.)*");/.exec(html);
    expect(m).not.toBeNull();
    expect(JSON.parse(m![1])).toBe(XML);
  });

  it('cannot be broken out of by a </script> inside the score', () => {
    const hostile = '<score-partwise></script><script>alert(1)</script></score-partwise>';
    const html = notationHtml(hostile);
    // The only closing script tags are the page's own two.
    expect(html.match(/<\/script>/g)).toHaveLength(2);
    const m = /const xml = ("(?:[^"\\]|\\.)*");/.exec(html);
    expect(JSON.parse(m![1])).toBe(hostile);
  });
});
