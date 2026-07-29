// Pins the Stage scaling contract.
//
// Stage lays its child out at a LOGICAL size and then shrinks it with a
// transform, so "does the content fit inside the safe area" is pure arithmetic
// on two numbers — and it was wrong: the logical width was derived from the FULL
// measured box while the child was laid out inside the PADDED box, so the scaled
// child came out exactly `padL + padR` too wide, overflowed symmetrically, and
// silently cancelled the insets it was supposed to respect.
//
// The invariant worth holding on to: after scaling, the child occupies exactly
// the padded content box — no more (clipped, insets defeated) and no less
// (letterboxed, which this app deliberately does not do).
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

/** The gutter Stage guarantees even where the device reports no inset. */
const EDGE_GUTTER = 10;

interface Measured {
  padL: number; padR: number;
  /** Layout width of the scaled child, before the transform. */
  logicalW: number;
  scale: number;
  /** What the child actually covers on screen. */
  visualW: number;
  visualH: number;
}

function mount(box: { w: number; h: number }): Measured {
  const r = render(<Stage><Text>content</Text></Stage>);
  const outer = r.UNSAFE_getAllByType(View)[0];
  fireEvent(outer, 'layout', {
    nativeEvent: { layout: { width: box.w, height: box.h, x: 0, y: 0 } },
  });

  const json: any = r.toJSON();
  const outerStyle = StyleSheet.flatten(json.props.style);
  const child = json.children[0];
  const childStyle = StyleSheet.flatten(child.props.style);
  const scale = childStyle.transform[0].scale;

  return {
    padL: outerStyle.paddingLeft,
    padR: outerStyle.paddingRight,
    logicalW: childStyle.width,
    scale,
    visualW: childStyle.width * scale,
    visualH: childStyle.height * scale,
  };
}

beforeEach(() => {
  mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  mockCanvas = { w: 852, h: 394 };
});

describe('Stage — the scaled child fits the padded content box', () => {
  it('fills exactly the space left between the gutters', () => {
    const m = mount({ w: 800, h: 400 });
    expect(m.padL).toBe(EDGE_GUTTER);
    expect(m.padR).toBe(EDGE_GUTTER);
    // THE REGRESSION: this used to come out at the full 800, overflowing the
    // gutters by 10dp on each side and pinning content to the physical edge.
    expect(m.visualW).toBeCloseTo(800 - EDGE_GUTTER * 2, 5);
  });

  it('respects a landscape camera cutout', () => {
    mockInsets = { top: 0, bottom: 0, left: 44, right: 12 };
    const m = mount({ w: 800, h: 400 });
    expect(m.padL).toBe(44);
    expect(m.padR).toBe(12);
    expect(m.visualW).toBeCloseTo(800 - 44 - 12, 5);
  });

  it('never lets an inset smaller than the gutter shrink the margin', () => {
    mockInsets = { top: 0, bottom: 0, left: 3, right: 0 };
    const m = mount({ w: 800, h: 400 });
    expect(m.padL).toBe(EDGE_GUTTER);
    expect(m.padR).toBe(EDGE_GUTTER);
  });

  it('holds on the roomy tablet canvas too', () => {
    mockCanvas = { w: 1280, h: 800 };
    const m = mount({ w: 1600, h: 900 });
    expect(m.visualW).toBeCloseTo(1600 - EDGE_GUTTER * 2, 5);
  });

  it('scales to fill the height exactly — the app does not letterbox', () => {
    const m = mount({ w: 800, h: 400 });
    expect(m.scale).toBeCloseTo(400 / 394, 6);
    expect(m.visualH).toBeCloseTo(400, 5);
  });
});

describe('Stage — degenerate boxes', () => {
  it('renders nothing until it has been measured', () => {
    const r = render(<Stage><Text>content</Text></Stage>);
    expect((r.toJSON() as any).children).toBeNull();
  });

  it('does not produce a negative width when the insets exceed the screen', () => {
    mockInsets = { top: 0, bottom: 0, left: 300, right: 300 };
    const m = mount({ w: 400, h: 400 });
    expect(m.logicalW).toBeGreaterThanOrEqual(0);
    expect(m.visualW).toBeGreaterThanOrEqual(0);
  });
});
