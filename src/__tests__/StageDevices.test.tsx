// Stage across real device shapes — the check that cannot be done by hand
// without owning ten phones.
//
// The phone canvas is 852×394, ratio 2.16, which is almost exactly a 19.5:9
// screen. That is why the layout looks right on a Galaxy S24 Ultra / iPhone 15
// and why nothing revealed the problem: scaling to height alone let the LOGICAL
// WIDTH collapse on anything squarer — 700 units on a 16:9 phone, 473 on an
// open foldable, against a UI authored for 852.
//
// The invariant that fixes every ratio at once: the logical canvas may grow, but
// it must never be smaller than the canvas the UI was authored against. These
// tests assert exactly that, on real device geometry.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

let mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
let mockCanvas = { w: 852, h: 394 };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets,
  SafeAreaInsetsContext: { Provider: ({ children }: any) => children },
}));
jest.mock('../theme/AppTheme', () => ({
  useAppTheme: () => ({ colors: { bg: '#FFFAEC' } }),
}));
jest.mock('../theme/responsive', () => ({
  useStage: () => ({
    canvas: mockCanvas, isTablet: false, isDesktop: false, maxScale: 3,
  }),
}));

// eslint-disable-next-line import/first
import Stage from '../nav/Stage';

const EDGE_GUTTER = 10;

/** Landscape logical-pixel (dp) sizes, long side first. */
const PHONES: Record<string, { w: number; h: number }> = {
  'Galaxy S24 Ultra': { w: 1084, h: 500 },
  'iPhone 15 Pro Max': { w: 932, h: 430 },
  'iPhone 15': { w: 852, h: 393 },
  'iPhone SE (16:9)': { w: 667, h: 375 },
  'Pixel 8 (20:9)': { w: 892, h: 412 },
  'Sony 21:9': { w: 916, h: 393 },
  'Galaxy Z Fold5 open': { w: 882, h: 734 },
};

const TABLETS: Record<string, { w: number; h: number }> = {
  'iPad 10.9 (4:3)': { w: 1180, h: 820 },
  'Galaxy Tab S9 (16:10)': { w: 1280, h: 800 },
  'iPad Pro 12.9': { w: 1366, h: 1024 },
};

interface Measured {
  logicalW: number; logicalH: number; scale: number;
  visualW: number; visualH: number; padL: number; padR: number;
}

function measure(box: { w: number; h: number }): Measured {
  const r = render(<Stage><Text>content</Text></Stage>);
  fireEvent(r.UNSAFE_getAllByType(View)[0], 'layout', {
    nativeEvent: { layout: { width: box.w, height: box.h, x: 0, y: 0 } },
  });
  const json: any = r.toJSON();
  const outer = StyleSheet.flatten(json.props.style);
  const child = StyleSheet.flatten(json.children[0].props.style);
  const scale = child.transform[0].scale;
  return {
    logicalW: child.width, logicalH: child.height, scale,
    visualW: child.width * scale, visualH: child.height * scale,
    padL: outer.paddingLeft, padR: outer.paddingRight,
  };
}

beforeEach(() => {
  mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  mockCanvas = { w: 852, h: 394 };
});

describe('every phone gets at least the canvas it was authored for', () => {
  it.each(Object.entries(PHONES))('%s', (_name, box) => {
    const m = measure(box);
    // THE REGRESSION: a 16:9 phone used to get 700 logical units of width for a
    // UI drawn at 852, and an open foldable 473.
    expect(m.logicalW).toBeGreaterThanOrEqual(mockCanvas.w - 0.5);
    expect(m.logicalH).toBeGreaterThanOrEqual(mockCanvas.h - 0.5);
  });

  it.each(Object.entries(PHONES))('%s still fills the screen — no letterbox', (_name, box) => {
    const m = measure(box);
    expect(m.visualW).toBeCloseTo(box.w - m.padL - m.padR, 4);
    expect(m.visualH).toBeCloseTo(box.h, 4);
  });

  it.each(Object.entries(PHONES))('%s keeps a gutter at both edges', (_name, box) => {
    const m = measure(box);
    expect(m.padL).toBeGreaterThanOrEqual(EDGE_GUTTER);
    expect(m.padR).toBeGreaterThanOrEqual(EDGE_GUTTER);
  });
});

describe('tablets, against the roomier canvas', () => {
  beforeEach(() => { mockCanvas = { w: 1280, h: 800 }; });

  it.each(Object.entries(TABLETS))('%s', (_name, box) => {
    const m = measure(box);
    // A 4:3 iPad is squarer than the 16:10 tablet canvas, so it had the same
    // collapse: 1151 logical units for a UI drawn at 1280.
    expect(m.logicalW).toBeGreaterThanOrEqual(1280 - 0.5);
    expect(m.logicalH).toBeGreaterThanOrEqual(800 - 0.5);
  });
});

describe('what the extra room does', () => {
  it('a squarer phone gains HEIGHT rather than losing width', () => {
    const m = measure(PHONES['iPhone SE (16:9)']);
    expect(m.logicalW).toBeCloseTo(852, 4);
    expect(m.logicalH).toBeGreaterThan(mockCanvas.h);
  });

  it('a wider phone gains WIDTH and keeps the authored height', () => {
    const m = measure(PHONES['Sony 21:9']);
    expect(m.logicalW).toBeGreaterThan(mockCanvas.w);
    expect(m.logicalH).toBeCloseTo(mockCanvas.h, 4);
  });

  it('the reference device is essentially unchanged', () => {
    // The S24 Ultra is what the layout was tuned on — it must not shift.
    const m = measure(PHONES['Galaxy S24 Ultra']);
    expect(m.logicalW).toBeCloseTo(852, 0);
    expect(m.logicalH).toBeCloseTo(400, 0);
  });
});

describe('display cutouts', () => {
  it('a landscape notch still reduces the drawing area, not the canvas', () => {
    mockInsets = { top: 0, bottom: 0, left: 59, right: 59 };
    const m = measure(PHONES['iPhone 15 Pro Max']);
    expect(m.padL).toBe(59);
    expect(m.logicalW).toBeGreaterThanOrEqual(mockCanvas.w - 0.5);
    expect(m.visualW).toBeCloseTo(932 - 118, 4);
  });
});
