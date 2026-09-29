// The import SCREEN — the flow from a picked page to a named chord sequence,
// as opposed to the OMR client (omrClient.test.ts) and the theory
// (analyzeSong.test.ts) it is built on.
//
// What matters: with no server the learner still lands on a real result (the
// demo score), a real score comes back with the chords the analyser found and
// a song the next screens can look up, a failed scan is explained in the
// server's own words and keeps the pages for a retry, and each of the three
// ways forward hands the right params to the router.
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

import type { PickedImage } from '../omr/pickImage';

const mockGo = jest.fn();
const mockBack = jest.fn();
const mockToast = jest.fn();

jest.mock('../theme/AppTheme', () => ({
  useAppTheme: () => ({
    colors: {
      bg: '#000', surface: '#111', surface2: '#222', ink: '#fff', inkSoft: '#ccc', inkFaint: '#888',
      line: '#333', selSky: '#123', selGreen: '#132', selGold: '#321', green: '#58CC02',
      greenDark: '#46A302', gold: '#F5B800', goldDeep: '#C28A00', sky: '#2F9BD6', skyDeep: '#2E84AD',
      error: '#FF4B4B', purple: '#9b6bff',
    },
  }),
}));
jest.mock('../theme/responsive', () => ({
  useStage: () => ({ isTablet: false, isDesktop: false, canvas: { w: 852, h: 394 }, maxScale: 3 }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../nav/Router', () => ({
  useRouter: () => ({ go: mockGo, back: mockBack, toast: mockToast, params: {}, screen: 'import' }),
}));
// Keys, not copy: the assertions below are about which string was chosen.
jest.mock('../i18n/useT', () => ({
  useT: () => (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key} ${Object.values(vars).join(' ')}` : key,
}));
jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual('react-native');
  return { LinearGradient: View };
});
jest.mock('../feedback/haptics', () => ({ tap: jest.fn(), press: jest.fn(), bump: jest.fn(), thud: jest.fn() }));

// Visual-only children — the flow, not the pixels, is under test here.
jest.mock('../ui/Maestro', () => () => null);
jest.mock('../ui/ScrollFit', () => {
  const { View } = jest.requireActual('react-native');
  const MockScrollFit = ({ children }: any) => <View>{children}</View>;
  return MockScrollFit;
});

// The network, the OS pickers, the disk and the lesson generator all sit
// behind their modules; the error classes stay real so instanceof works.
jest.mock('../omr/omrClient', () => {
  const actual = jest.requireActual('../omr/omrClient');
  return {
    OmrError: actual.OmrError,
    OmrNotConfiguredError: actual.OmrNotConfiguredError,
    runOmrScore: jest.fn(),
  };
});
jest.mock('../omr/pickImage', () => ({
  capturePhoto: jest.fn(),
  pickPagesFromLibrary: jest.fn(),
  pickPdf: jest.fn(),
}));
jest.mock('../omr/songLibrary', () => ({
  listLocalSongs: jest.fn(async () => []),
  saveLocalSong: jest.fn(async () => {}),
  loadLocalSong: jest.fn(async () => null),
  renameLocalSong: jest.fn(async () => {}),
  deleteLocalSong: jest.fn(async () => {}),
}));
jest.mock('../omr/songLessonGenerator', () => ({ generateSongLesson: jest.fn() }));

// eslint-disable-next-line import/first
import ImportSheet, { collapseChords, titleFromXml } from '../views/ImportSheet';
// eslint-disable-next-line import/first
import { OmrError, OmrNotConfiguredError, runOmrScore } from '../omr/omrClient';
// eslint-disable-next-line import/first
import { capturePhoto, pickPagesFromLibrary, pickPdf } from '../omr/pickImage';
// eslint-disable-next-line import/first
import { saveLocalSong } from '../omr/songLibrary';
// eslint-disable-next-line import/first
import { generateSongLesson } from '../omr/songLessonGenerator';
// eslint-disable-next-line import/first
import { getImportedSong } from '../omr/importedSongs';
// eslint-disable-next-line import/first
import { DEMO_SCORE_TITLE, DEMO_SCORE_XML } from '../omr/demoScore';
// eslint-disable-next-line import/first
import { parseMusicXmlScore } from '../omr/musicxmlScore';
// eslint-disable-next-line import/first
import { analyzeSong } from '../omr/analyzeSong';

const mockRun = runOmrScore as jest.MockedFunction<typeof runOmrScore>;
const mockCapture = capturePhoto as jest.MockedFunction<typeof capturePhoto>;
const mockLibrary = pickPagesFromLibrary as jest.MockedFunction<typeof pickPagesFromLibrary>;
const mockPdf = pickPdf as jest.MockedFunction<typeof pickPdf>;
const mockSave = saveLocalSong as jest.MockedFunction<typeof saveLocalSong>;
const mockGenerate = generateSongLesson as jest.MockedFunction<typeof generateSongLesson>;

const page = (n: number): PickedImage => ({
  uri: `file:///page${n}.jpg`, mimeType: 'image/jpeg', fileName: `page${n}.jpg`,
});
const PDF: PickedImage = { uri: 'file:///score.pdf', mimeType: 'application/pdf', fileName: 'score.pdf' };

// ── A score with a KNOWN chord structure (same builder as analyzeSong.test.ts) ─

const CHORD_NOTES: Record<string, [string, string][]> = {
  C: [['C', '3'], ['E', '3'], ['G', '3']],
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
  [['G', '4'], ['B', '4'], ['D', '5'], ['B', '4']],
];

/** Four bars: C G C G, so the loop finder has something to find. */
function twoChordSong(title = 'Two Chords'): string {
  const loop = ['C', 'G'];
  let out = '<score-partwise><work><work-title>' + title + '</work-title></work>' +
    '<part-list><score-part id="P1"/></part-list><part id="P1">';
  for (let m = 0; m < 4; m++) {
    const attrs = m === 0
      ? '<attributes><divisions>2</divisions><key><fifths>0</fifths></key>' +
        '<time><beats>4</beats><beat-type>4</beat-type></time></attributes><sound tempo="100"/>'
      : '';
    out += `<measure number="${m + 1}">${attrs}${rhMelody(PHRASE[m % 2])}` +
      `<backup><duration>8</duration></backup>${lhChord(loop[m % 2])}</measure>`;
  }
  return out + '</part></score-partwise>';
}

const EMPTY_SONG = '<score-partwise><part id="P1"><measure number="1"><note><rest/><duration>4</duration></note></measure></part></score-partwise>';

type Screen = ReturnType<typeof render>;

/** Press a button whose handler continues asynchronously (pickers, the scan). */
const pressAsync = (r: Screen, text: string) =>
  act(async () => { fireEvent.press(r.getByText(text)); });

/** Take one photo and press Read; resolves once the scan has been kicked off. */
async function photographAndRead(r: Screen) {
  await pressAsync(r, 'import.photo');
  await r.findByText('import.page 1');
  await pressAsync(r, 'import.read');
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCapture.mockResolvedValue(page(1));
  mockLibrary.mockResolvedValue([page(1), page(2)]);
  mockPdf.mockResolvedValue(PDF);
  mockGenerate.mockImplementation((song) => ({
    id: `course-${song.id}`, title: song.title, subtitle: `${song.score.measureCount} bars`, xpReward: 50,
    lesson: { steps: [{ title: 'Overview', segments: [{ type: 'lessonCompleteScreen' }] }] },
  }));
});

describe('ImportSheet — helpers', () => {
  it('collapses repeated chords and drops unnamed bars', () => {
    const c = (label: string | null) => ({ label });
    expect(collapseChords([c('G'), c('G'), c(null), c('D'), c('Em'), c('Em'), c('G')])).toEqual(['G', 'D', 'Em', 'G']);
  });

  it('takes the first non-empty title the engine wrote, decoded', () => {
    expect(titleFromXml('<work><work-title>  </work-title></work><movement-title>Für Elise &amp; co</movement-title>'))
      .toBe('Für Elise & co');
    expect(titleFromXml('<score-partwise/>')).toBeNull();
  });
});

describe('ImportSheet — picking pages', () => {
  it('starts on the two tiles and never scans with nothing picked', async () => {
    mockCapture.mockResolvedValue(null); // learner dismissed the camera
    const r = render(<ImportSheet />);
    expect(r.getByText('import.title')).toBeTruthy();
    await pressAsync(r, 'import.photo');
    expect(r.queryByText('import.read')).toBeNull();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('lists pages in order, with a PDF as a page of its own', async () => {
    const r = render(<ImportSheet />);
    await pressAsync(r, 'import.upload');
    await r.findByText('import.page 2');
    await pressAsync(r, 'import.pdf');
    await r.findByText('import.page 3');
    expect(r.getByText('score.pdf')).toBeTruthy();
    expect(r.getByText('import.pages 3')).toBeTruthy();
  });

  it('reorders and removes pages', async () => {
    const r = render(<ImportSheet />);
    await pressAsync(r, 'import.upload');
    await r.findByText('import.page 2');
    expect(r.getAllByText(/^page\d\.jpg$/).map((t) => t.props.children)).toEqual(['page1.jpg', 'page2.jpg']);

    fireEvent.press(r.getByLabelText('import.moveUp 2'));
    expect(r.getAllByText(/^page\d\.jpg$/).map((t) => t.props.children)).toEqual(['page2.jpg', 'page1.jpg']);

    fireEvent.press(r.getAllByLabelText('import.remove')[0]);
    expect(r.queryByText('page2.jpg')).toBeNull();
    fireEvent.press(r.getAllByLabelText('import.remove')[0]);
    // Back to the tiles once nothing is left.
    expect(r.getByText('import.photoSub')).toBeTruthy();
  });

  it('goes back from the chevron', () => {
    const r = render(<ImportSheet />);
    fireEvent.press(r.getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('ImportSheet — no server configured', () => {
  it('reads the demo score and still hands the player a real song', async () => {
    mockRun.mockRejectedValue(new OmrNotConfiguredError());
    const r = render(<ImportSheet />);
    await photographAndRead(r);

    await r.findByText(/^import\.detectedN /);
    expect(mockRun).toHaveBeenCalledWith([page(1)], expect.any(Function));
    expect(mockToast).toHaveBeenCalledWith('import.demoNotice');
    expect(r.getByText('Demo')).toBeTruthy();

    // The chips are whatever the analyser finds in the bundled score — no
    // second copy of that answer lives here.
    const analysis = analyzeSong(parseMusicXmlScore(DEMO_SCORE_XML), DEMO_SCORE_XML);
    const chips = collapseChords(analysis.chords);
    expect(chips.length).toBeGreaterThan(0);
    for (const c of chips) expect(r.getAllByText(c).length).toBeGreaterThan(0);
    expect(r.getByText(`import.detectedN ${chips.length} ${analysis.key.name}`)).toBeTruthy();

    fireEvent.press(r.getByText('import.playLights'));
    expect(mockGo).toHaveBeenCalledWith('songPlayer', { songId: expect.any(String) });
    const { songId } = mockGo.mock.calls[0][1];
    expect(getImportedSong(songId)?.title).toBe(DEMO_SCORE_TITLE);
    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ id: songId, pageCount: 1 }));
  });
});

describe('ImportSheet — a real scan', () => {
  it('names the chords, spots the loop, and registers the song for review', async () => {
    mockRun.mockResolvedValue(twoChordSong());
    const r = render(<ImportSheet />);
    await pressAsync(r, 'import.upload');
    await r.findByText('import.page 2');
    await pressAsync(r, 'import.read');

    await r.findByText(/^import\.detectedN /);
    expect(mockToast).not.toHaveBeenCalled();
    expect(r.queryByText('Demo')).toBeNull();
    expect(r.getAllByText('C').length).toBeGreaterThan(0);
    expect(r.getAllByText('G').length).toBeGreaterThan(0);
    expect(r.getByText('×2')).toBeTruthy(); // C G repeats twice
    expect(r.getByText('import.detectedN 4 C major')).toBeTruthy();
    expect(r.getByText('import.summary 4 100 import.pages 2')).toBeTruthy();
    expect(r.getByText('Two Chords')).toBeTruthy();

    fireEvent.press(r.getByText('import.review'));
    expect(mockGo).toHaveBeenCalledWith('reviewScore', { songId: expect.any(String) });
    const song = getImportedSong(mockGo.mock.calls[0][1].songId);
    expect(song).not.toBeNull();
    expect(song?.title).toBe('Two Chords');
    expect(song?.pageCount).toBe(2);
    expect(song?.score.measureCount).toBe(4);
  });

  it('falls back to a plain title when the engine wrote none', async () => {
    mockRun.mockResolvedValue(twoChordSong('').replace('<work><work-title></work-title></work>', ''));
    const r = render(<ImportSheet />);
    await photographAndRead(r);
    await r.findByText('Imported sheet');
  });

  it('shows the scan progress while it waits', async () => {
    let finish: (xml: string) => void = () => {};
    mockRun.mockImplementation((_pages, onProgress) => new Promise((resolve) => {
      onProgress?.({ page: 0, pageCount: 1, indeterminate: true });
      finish = resolve;
    }));
    const r = render(<ImportSheet />);
    await photographAndRead(r);
    await r.findByText('import.reading');
    expect(r.getByText('import.detecting')).toBeTruthy();
    expect(r.queryByText('import.read')).toBeNull();
    await act(async () => { finish(twoChordSong()); });
    await r.findByText(/^import\.detectedN /);
  });

  it('starts over from "Import another"', async () => {
    mockRun.mockResolvedValue(twoChordSong());
    const r = render(<ImportSheet />);
    await photographAndRead(r);
    await r.findByText(/^import\.detectedN /);
    fireEvent.press(r.getByText('import.another'));
    expect(r.getByText('import.photoSub')).toBeTruthy();
    expect(r.queryByText('import.page 1')).toBeNull();
  });
});

describe('ImportSheet — when the scan fails', () => {
  it("explains a 422 in the server's own words and keeps the pages for a retry", async () => {
    mockRun.mockRejectedValue(new OmrError(422, 'no staves'));
    const r = render(<ImportSheet />);
    await photographAndRead(r);

    await r.findByText(/No music was found/);
    expect(mockGo).not.toHaveBeenCalled();
    fireEvent.press(r.getByText('import.retry'));
    expect(r.getByText('import.page 1')).toBeTruthy();
    expect(r.getByText('import.read')).toBeTruthy();
  });

  it('uses the generic message for anything that is not an OmrError', async () => {
    mockRun.mockRejectedValue(new TypeError('Network request failed'));
    const r = render(<ImportSheet />);
    await photographAndRead(r);
    await r.findByText('import.failed');
    expect(r.queryByText(/Network request failed/)).toBeNull();
  });

  it('treats a score with no notes as a failure, not a song', async () => {
    mockRun.mockResolvedValue(EMPTY_SONG);
    const r = render(<ImportSheet />);
    await photographAndRead(r);
    await r.findByText('import.noNotes');
    expect(mockSave).not.toHaveBeenCalled();
  });
});

describe('ImportSheet — Learn A→Z', () => {
  it('generates the course and opens it as a lesson', async () => {
    mockRun.mockResolvedValue(twoChordSong());
    const r = render(<ImportSheet />);
    await photographAndRead(r);
    await r.findByText(/^import\.detectedN /);

    fireEvent.press(r.getByText('import.learn'));
    expect(mockGenerate).toHaveBeenCalledWith(expect.objectContaining({ id: expect.stringMatching(/^song-/), title: 'Two Chords' }));
    expect(mockGo).toHaveBeenCalledWith('lesson', {
      item: { id: expect.stringMatching(/^course-/), title: 'Two Chords', sub: '4 bars', kind: 'song' },
      lesson: expect.objectContaining({ steps: expect.any(Array) }),
    });
  });
});
