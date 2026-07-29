// The calibration SCREEN, as opposed to the mapping maths in calibration.test.ts.
//
// What matters here is that the flow actually produces anchors from real key
// presses — the screen this replaced looked identical and produced nothing at
// all, which is exactly the class of bug a component test catches and a logic
// test cannot.
import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';

import type { NoteOnCb } from '../lesson1/hal';

const mockCalibrateLight = jest.fn();
const mockGo = jest.fn();
let mockNoteListeners: NoteOnCb[] = [];
let mockLedCount: number | null = 60;
let mockHwState = { state: 'connected', detail: 'Piano-Prof' };

jest.mock('../theme/AppTheme', () => ({
  useAppTheme: () => ({
    colors: {
      bg: '#000', ink: '#fff', inkSoft: '#ccc', inkFaint: '#888', line: '#333',
      surface: '#111', surface2: '#222', green: '#58CC02', sky: '#2F9BD6',
      gold: '#F5B800', error: '#FF4B4B', selGreen: '#123',
    },
  }),
}));

jest.mock('../state/AppState', () => ({ useApp: () => ({ setLed: jest.fn() }) }));
jest.mock('../nav/Router', () => ({ useRouter: () => ({ go: mockGo, back: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../audio/pianoEngine', () => ({ playMidi: jest.fn(async () => {}) }));
jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual('react-native');
  return { LinearGradient: View };
});
jest.mock('../feedback/haptics', () => ({ tap: jest.fn() }));

// Visual-only children — the flow, not the pixels, is under test here.
jest.mock('../ui/Maestro', () => () => null);
jest.mock('../ui/Piano', () => () => null);
jest.mock('../ui/ScrollFit', () => {
  const { View } = jest.requireActual('react-native');
  const MockScrollFit = ({ children }: any) => <View>{children}</View>;
  return MockScrollFit;
});

jest.mock('../state/HardwareProvider', () => ({
  useHardware: () => ({
    hw: {
      calibrateLight: mockCalibrateLight,
      get ledCount() { return mockLedCount; },
      onNoteOn: (cb: NoteOnCb) => {
        mockNoteListeners.push(cb);
        return () => { mockNoteListeners = mockNoteListeners.filter((l) => l !== cb); };
      },
    },
    status: mockHwState,
  }),
}));

// eslint-disable-next-line import/first
import Calibration from '../views/Calibration';
// eslint-disable-next-line import/first
import { getAnchors, isCalibrated, __setAnchorsForTest } from '../ble/calibration';
// eslint-disable-next-line import/first
import { midiToNote } from '../lesson1/data';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn(async (k: string) => store[k] ?? null),
    setItem: jest.fn(async (k: string, v: string) => { store[k] = v; }),
    removeItem: jest.fn(async (k: string) => { delete store[k]; }),
  };
});

/** Simulate a real key press arriving from the board. */
const press = (midi: number) =>
  act(() => { mockNoteListeners.forEach((cb) => cb(midiToNote(midi), 100, Date.now())); });

beforeEach(() => {
  mockCalibrateLight.mockClear();
  mockGo.mockClear();
  mockNoteListeners = [];
  mockLedCount = 60;
  mockHwState = { state: 'connected', detail: 'Piano-Prof' };
  __setAnchorsForTest([]);
});

describe('Calibration — lighting the target dot', () => {
  it('lights the first LED on entry', () => {
    render(<Calibration />);
    expect(mockCalibrateLight).toHaveBeenCalledWith(0);
  });

  it('walks the strip as the learner presses keys', () => {
    render(<Calibration />);
    press(36);
    expect(mockCalibrateLight).toHaveBeenLastCalledWith(30); // middle of 60 LEDs
    press(60);
    expect(mockCalibrateLight).toHaveBeenLastCalledWith(59); // far end
  });

  it('adapts the targets to a shorter strip', () => {
    mockLedCount = 30;
    render(<Calibration />);
    press(36);
    expect(mockCalibrateLight).toHaveBeenLastCalledWith(15);
  });

  it('clears the strip once every dot is done', () => {
    render(<Calibration />);
    press(36); press(60); press(84);
    expect(mockCalibrateLight).toHaveBeenLastCalledWith(null);
  });

  it('leaves the strip dark on unmount', () => {
    const r = render(<Calibration />);
    mockCalibrateLight.mockClear();
    r.unmount();
    expect(mockCalibrateLight).toHaveBeenCalledWith(null);
  });
});

describe('Calibration — capturing anchors', () => {
  it('saves a usable calibration and moves on', async () => {
    const r = render(<Calibration />);
    press(36); press(60); press(84);

    fireEvent.press(r.getByText('Finish'));

    await waitFor(() => expect(isCalibrated()).toBe(true));
    expect(getAnchors()).toEqual([
      { midiNote: 36, ledIndex: 0 },
      { midiNote: 60, ledIndex: 30 },
      { midiNote: 84, ledIndex: 59 },
    ]);
    expect(mockGo).toHaveBeenCalledWith('ledSettings');
  });

  it('rejects a right-to-left run and restarts instead of storing it', async () => {
    const r = render(<Calibration />);
    // Pressing high → low means the anchors describe a backwards strip.
    press(84); press(60); press(36);

    fireEvent.press(r.getByText('Finish'));

    await waitFor(() => expect(r.getByText(/don’t line up left-to-right/)).toBeTruthy());
    expect(isCalibrated()).toBe(false);
    expect(mockGo).not.toHaveBeenCalled();
  });

  it('ignores presses outside the playable range', () => {
    render(<Calibration />);
    press(12); // below C2
    expect(mockCalibrateLight).not.toHaveBeenCalledWith(30);
  });
});

describe('Calibration — without a board', () => {
  it('says so plainly rather than pretending to light something', () => {
    mockHwState = { state: 'sim', detail: '' };
    const r = render(<Calibration />);
    expect(r.getByText(/No board connected/)).toBeTruthy();
  });

  it('keeps quiet when a board is live', () => {
    const r = render(<Calibration />);
    expect(r.queryByText(/No board connected/)).toBeNull();
  });
});
