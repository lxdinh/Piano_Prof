// The song-player SCREEN — the frame loop and what it does to the speaker and
// the LED strip, as opposed to the pure helpers in songPlayback.test.ts.
//
// What matters: Play sounds each onset exactly once and lights the same keys
// on the strip (right hand warm, left hand cool, sharps-only names); a note
// that ends goes dark while a held one stays lit; Pause and unmount stop the
// loop and darken the strip; Restart really goes back to the top; and the
// speed button changes how fast the song moves, not which notes play.
//
// The loop is requestAnimationFrame-driven. React Native's jest setup shims
// rAF as setTimeout(0) stamped with a frozen clock, which under fake timers
// never advances playback (and re-arms itself forever inside one tick). The
// shim below is a 16 ms frame stamped from the fake Date.now(), so
// `advance(600)` is 600 ms of wall time at 60 fps.
import React from 'react';
import { Pressable } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';

import type { LedEntry, LedSnapshot } from '../lesson1/hal';

const mockGo = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, unknown> = { songId: 'song-player-test' };

// A HwFacade double: every LED command is recorded, and every subscription
// hands back an unsubscribe the test can check was called on the way out.
interface Sub { kind: 'led' | 'noteOn' | 'noteOff'; off: jest.Mock }
const mockSubs: Sub[] = [];
function subscribe(kind: Sub['kind']): jest.Mock {
  const off = jest.fn();
  mockSubs.push({ kind, off });
  return off;
}
const mockHw = {
  mode: 'sim',
  backend: {},
  ledSet: jest.fn<void, [LedEntry[]]>(),
  ledOffMany: jest.fn<void, [string[]]>(),
  ledClear: jest.fn<void, []>(),
  // Like the real facade, the first frame arrives synchronously.
  onLed: jest.fn((cb: (snap: LedSnapshot) => void) => { cb(new Map()); return subscribe('led'); }),
  onNoteOn: jest.fn(() => subscribe('noteOn')),
  onNoteOff: jest.fn(() => subscribe('noteOff')),
};

jest.mock('../theme/AppTheme', () => ({
  useAppTheme: () => ({
    colors: {
      bg: '#000', surface: '#111', surface2: '#222', ink: '#fff', inkSoft: '#ccc', inkFaint: '#888',
      line: '#333', selSky: '#123', selGreen: '#132', selGold: '#321', green: '#58CC02',
      greenDark: '#46A302', gold: '#F5B800', sky: '#2F9BD6', skyDeep: '#2E84AD',
      error: '#FF4B4B', purple: '#9b6bff',
    },
  }),
}));
jest.mock('../theme/responsive', () => ({ useStage: () => ({ isTablet: false }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../nav/Router', () => ({
  useRouter: () => ({ params: mockParams, go: mockGo, back: mockBack, toast: jest.fn() }),
}));
// No active profile → useT() falls back to English, so the real labels render.
jest.mock('../state/AppState', () => ({ useApp: () => ({ activeProfile: null }) }));
jest.mock('../state/HardwareProvider', () => ({
  useHardware: () => ({ hw: mockHw, status: { state: 'sim', detail: '' } }),
}));
jest.mock('../audio/pianoEngine', () => ({
  playMidi: jest.fn(async () => {}),
  stopAll: jest.fn(async () => {}),
}));
jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual('react-native');
  return { LinearGradient: View };
});
jest.mock('../feedback/haptics', () => ({ tap: jest.fn(), press: jest.fn(), bump: jest.fn(), thud: jest.fn() }));
// Visual-only child — the strip, not the pixels, is under test here.
jest.mock('../ui/Piano', () => () => null);
jest.mock('../omr/songLessonGenerator', () => ({ generateSongLesson: jest.fn() }));

// eslint-disable-next-line import/first
import SongPlayer from '../views/SongPlayer';
// eslint-disable-next-line import/first
import { registerImportedSong } from '../omr/importedSongs';
// eslint-disable-next-line import/first
import { parseMusicXmlScore } from '../omr/musicxmlScore';
// eslint-disable-next-line import/first
import { playMidi, stopAll } from '../audio/pianoEngine';
// eslint-disable-next-line import/first
import { generateSongLesson } from '../omr/songLessonGenerator';
// eslint-disable-next-line import/first
import { handColor } from '../theme/handColors';

const mockPlay = playMidi as jest.MockedFunction<typeof playMidi>;
const mockStopAll = stopAll as jest.MockedFunction<typeof stopAll>;
const mockGenerate = generateSongLesson as jest.MockedFunction<typeof generateSongLesson>;

// ── fixture: one 4/4 bar at 60 BPM (a quarter note = 1 s), two hands ──
//   RH (staff 1): C4 at 0–1 s, E4 at 1–2 s, then a half rest
//   LH (staff 2): C3 held 0–2 s
// So the first RH note ENDS exactly when the second one starts, while the
// left hand is still down — the LED diff has to tell those apart.
const XML =
  '<score-partwise><part-list><score-part id="P1"/></part-list><part id="P1">' +
  '<measure number="1">' +
  '<attributes><divisions>1</divisions><key><fifths>0</fifths></key>' +
  '<time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves></attributes>' +
  '<sound tempo="60"/>' +
  '<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><staff>1</staff></note>' +
  '<note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><staff>1</staff></note>' +
  '<note><rest/><duration>2</duration><staff>1</staff></note>' +
  '<backup><duration>4</duration></backup>' +
  '<note><pitch><step>C</step><octave>3</octave></pitch><duration>2</duration><staff>2</staff></note>' +
  '<note><rest/><duration>2</duration><staff>2</staff></note>' +
  '</measure></part></score-partwise>';

const C3 = 48;
const C4 = 60;
const E4 = 64;
const CLICK_MIDIS = [96, 91]; // the metronome's accent / beat clicks
const FRAME_MS = 16;

let rafRequests = 0;

/** Run `ms` of fake time (frames, timers) inside act. */
const advance = (ms: number) => act(() => { jest.advanceTimersByTime(ms); });

/** How many times the player sounded this midi note. */
const timesPlayed = (midi: number) => mockPlay.mock.calls.filter(([m]) => m === midi).length;

/** Every LED entry handed to the strip so far, in order. */
const ledEntries = (): LedEntry[] => mockHw.ledSet.mock.calls.flatMap(([list]) => list);

/** Every note name the strip was told to switch off so far. */
const ledOffs = (): string[] => mockHw.ledOffMany.mock.calls.flatMap(([names]) => names);

const rgbOf = (e: LedEntry) => [e.r, e.g, e.b];

type Screen = ReturnType<typeof render>;
const press = (r: Screen, label: string) => fireEvent.press(r.getByText(label));

beforeEach(() => {
  jest.useFakeTimers();
  rafRequests = 0;
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
    rafRequests++;
    return setTimeout(() => cb(Date.now()), FRAME_MS) as unknown as number;
  };
  globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);

  jest.clearAllMocks();
  mockSubs.length = 0;
  mockParams = { songId: 'song-player-test' };
  mockGenerate.mockReturnValue({
    id: 'course-song-player-test', title: 'Player fixture', subtitle: '1 bar', xpReward: 50, lesson: { steps: [] },
  });
  registerImportedSong({
    id: 'song-player-test', title: 'Player fixture', xml: XML, score: parseMusicXmlScore(XML), pageCount: 1,
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('SongPlayer — on entry', () => {
  it('shows the title, the key and tempo, the length, and a Play button — and stays silent', () => {
    const r = render(<SongPlayer />);
    expect(r.getByText('Player fixture')).toBeTruthy();
    expect(r.getByText('C major · 60 BPM')).toBeTruthy();
    expect(r.getByText('Play')).toBeTruthy();
    expect(r.getByText('0:02')).toBeTruthy(); // total length
    expect(r.getByText('×1')).toBeTruthy();

    // Subscribed to the strip's frames, but nothing sounds or lights until Play.
    expect(mockHw.onLed).toHaveBeenCalledTimes(1);
    advance(1000);
    expect(mockPlay).not.toHaveBeenCalled();
    expect(mockHw.ledSet).not.toHaveBeenCalled();
    expect(rafRequests).toBe(0);
  });

  it('says so when the song is no longer in memory', () => {
    mockParams = { songId: 'nope' };
    const r = render(<SongPlayer />);
    expect(r.getByText('Song not found')).toBeTruthy();
    expect(r.queryByText('Play')).toBeNull();
    fireEvent.press(r.UNSAFE_getAllByType(Pressable)[0]); // the back chevron
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

describe('SongPlayer — Play', () => {
  it('sounds the first RH and LH notes exactly once and lights them in their hand colours', () => {
    const r = render(<SongPlayer />);
    press(r, 'Play');
    expect(r.getByText('Pause')).toBeTruthy();
    advance(600); // ~0.58 s into the song: C4 + C3 have started, E4 (1.0 s) has not

    expect(timesPlayed(C4)).toBe(1);
    expect(timesPlayed(C3)).toBe(1);
    expect(timesPlayed(E4)).toBe(0);
    // Metronome is off by default — no clicks.
    for (const m of CLICK_MIDIS) expect(timesPlayed(m)).toBe(0);

    const entries = ledEntries();
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) expect(e.note).toMatch(/^[A-G]#?\d$/);

    // Each key is SET once when it starts sounding, not re-sent every frame.
    const c4 = entries.filter((e) => e.note === 'C4');
    const c3 = entries.filter((e) => e.note === 'C3');
    expect(c4).toHaveLength(1);
    expect(c3).toHaveLength(1);
    expect(entries.some((e) => e.note === 'E4')).toBe(false);

    // Right hand warm, left hand cool — and visibly different from each other.
    expect(rgbOf(c4[0])).toEqual(handColor('R'));
    expect(rgbOf(c3[0])).toEqual(handColor('L'));
    expect(rgbOf(c4[0])).not.toEqual(rgbOf(c3[0]));

    // Nothing has ended yet, and nothing wiped the strip mid-song.
    expect(mockHw.ledOffMany).not.toHaveBeenCalled();
    expect(mockHw.ledClear).not.toHaveBeenCalled();
  });

  it('turns the first RH note off when it ends while the held LH note stays lit', () => {
    const r = render(<SongPlayer />);
    press(r, 'Play');
    advance(1200); // ~1.18 s: C4 ended at 1.0 s, E4 started, C3 still held to 2.0 s

    expect(timesPlayed(C4)).toBe(1);
    expect(timesPlayed(E4)).toBe(1);
    expect(timesPlayed(C3)).toBe(1);

    const offs = ledOffs();
    expect(offs).toContain('C4');
    expect(offs).not.toContain('C3');
    expect(offs).not.toContain('E4');
    expect(offs.filter((n) => n === 'C4')).toHaveLength(1);

    const e4 = ledEntries().filter((e) => e.note === 'E4');
    expect(e4).toHaveLength(1);
    expect(rgbOf(e4[0])).toEqual(handColor('R'));
    expect(ledEntries().filter((e) => e.note === 'C3')).toHaveLength(1); // never re-sent
    expect(mockHw.ledClear).not.toHaveBeenCalled();
    expect(r.getByText('0:01')).toBeTruthy(); // the clock moved with the song
  });

  it('parks at the end with the strip dark, and Play again starts from the top', () => {
    const r = render(<SongPlayer />);
    press(r, 'Play');
    advance(2500); // past the 2.0 s end

    expect(r.getByText('Play')).toBeTruthy();
    expect(mockHw.ledClear).toHaveBeenCalledTimes(1);
    expect(r.getAllByText('0:02')).toHaveLength(2); // position == length
    const requestsAtEnd = rafRequests;
    advance(1000);
    expect(rafRequests).toBe(requestsAtEnd); // the loop is not idling at the end

    press(r, 'Play');
    advance(600);
    expect(timesPlayed(C4)).toBe(2);
    expect(timesPlayed(C3)).toBe(2);
    expect(timesPlayed(E4)).toBe(1);
  });

  it('clicks on the beat when the metronome is on', () => {
    const r = render(<SongPlayer />);
    press(r, 'Metronome');
    press(r, 'Play');
    advance(600); // beat 0 only (60 BPM → one beat per second)
    expect(timesPlayed(96)).toBe(1); // the downbeat accent
    expect(timesPlayed(91)).toBe(0);
    advance(600); // beat 1 has arrived
    expect(timesPlayed(91)).toBe(1);
    expect(timesPlayed(96)).toBe(1);
  });
});

describe('SongPlayer — Pause / Restart', () => {
  it('Pause darkens the strip and stops the loop', () => {
    const r = render(<SongPlayer />);
    press(r, 'Play');
    advance(600);
    press(r, 'Pause');

    expect(r.getByText('Play')).toBeTruthy();
    expect(mockHw.ledClear).toHaveBeenCalledTimes(1);

    const plays = mockPlay.mock.calls.length;
    const sets = mockHw.ledSet.mock.calls.length;
    const requests = rafRequests;
    advance(3000); // would have crossed E4 (1.0 s) and the end (2.0 s) if still running
    expect(mockPlay.mock.calls.length).toBe(plays);
    expect(mockHw.ledSet.mock.calls.length).toBe(sets);
    expect(rafRequests).toBe(requests);
    expect(timesPlayed(E4)).toBe(0);
    expect(r.getByText('0:00')).toBeTruthy(); // the clock stopped too
  });

  it('Play after Pause resumes where it stopped, without re-sounding what already played', () => {
    const r = render(<SongPlayer />);
    press(r, 'Play');
    advance(600);
    press(r, 'Pause');
    press(r, 'Play');
    advance(600); // ~1.16 s total
    expect(timesPlayed(C4)).toBe(1);
    expect(timesPlayed(C3)).toBe(1);
    expect(timesPlayed(E4)).toBe(1);
    // The held LH note was re-lit after the pause cleared it.
    expect(ledEntries().filter((e) => e.note === 'C3')).toHaveLength(2);
  });

  it('Restart goes back to the top and replays the first note once on Play', () => {
    const r = render(<SongPlayer />);
    press(r, 'Play');
    advance(1200); // C4, C3, E4 all sounded; the clock shows 0:01
    press(r, 'Pause');
    press(r, 'Restart');

    expect(r.queryByText('0:01')).toBeNull();
    expect(r.getByText('0:00')).toBeTruthy();
    expect(mockHw.ledClear).toHaveBeenCalledTimes(2); // pause + restart

    press(r, 'Play');
    advance(600);
    expect(timesPlayed(C4)).toBe(2);
    expect(timesPlayed(C3)).toBe(2);
    expect(timesPlayed(E4)).toBe(1); // not reached again yet
  });

  it('Restart mid-play jumps to the top without stopping', () => {
    const r = render(<SongPlayer />);
    press(r, 'Play');
    advance(1200);
    press(r, 'Restart');
    expect(r.getByText('Pause')).toBeTruthy(); // still playing
    advance(600);
    expect(timesPlayed(C4)).toBe(2);
    expect(timesPlayed(E4)).toBe(1);
  });
});

describe('SongPlayer — speed', () => {
  it('×0.5 halves progress: a note at 1.0 s has not played after 1.2 s of wall time, but has at ×1', () => {
    const one = render(<SongPlayer />);
    press(one, 'Play');
    advance(1200);
    expect(timesPlayed(E4)).toBe(1);
    expect(one.getByText('0:01')).toBeTruthy();
    one.unmount();
    jest.clearAllMocks();

    const half = render(<SongPlayer />);
    press(half, '×1'); // → ×1.25
    press(half, '×1.25'); // → ×0.5
    expect(half.getByText('×0.5')).toBeTruthy();
    press(half, 'Play');
    advance(1200); // ~0.59 s of song
    expect(timesPlayed(C4)).toBe(1); // the start still sounds
    expect(timesPlayed(E4)).toBe(0);
    expect(half.getByText('0:00')).toBeTruthy();
    // …and it does arrive once enough wall time has passed at half speed.
    advance(1200); // ~1.18 s of song
    expect(timesPlayed(E4)).toBe(1);
  });
});

describe('SongPlayer — leaving', () => {
  it('unmount silences the piano, darkens the strip, detaches, and stops the loop', () => {
    const r = render(<SongPlayer />);
    press(r, 'Play');
    advance(600);
    expect(mockSubs.some((s) => s.kind === 'led')).toBe(true);

    const plays = mockPlay.mock.calls.length;
    const requests = rafRequests;
    r.unmount();

    expect(mockStopAll).toHaveBeenCalledTimes(1);
    expect(mockHw.ledClear).toHaveBeenCalled();
    // Every subscription this screen took out (LED frames, and any note
    // listeners) was released exactly once.
    for (const s of mockSubs) expect(s.off).toHaveBeenCalledTimes(1);

    advance(3000);
    expect(mockPlay.mock.calls.length).toBe(plays);
    expect(rafRequests).toBe(requests);
  });

  it('Learn A→Z pauses the song and opens the generated lesson', () => {
    const r = render(<SongPlayer />);
    press(r, 'Play');
    advance(600);
    press(r, 'Learn A→Z');

    expect(mockHw.ledClear).toHaveBeenCalledTimes(1);
    expect(mockGenerate).toHaveBeenCalledWith(expect.objectContaining({ id: 'song-player-test' }));
    expect(mockGo).toHaveBeenCalledWith('lesson', {
      item: { id: 'course-song-player-test', title: 'Player fixture', sub: '1 bar', kind: 'song' },
      lesson: { steps: [] },
    });
    const plays = mockPlay.mock.calls.length;
    advance(2000);
    expect(mockPlay.mock.calls.length).toBe(plays);
  });
});
