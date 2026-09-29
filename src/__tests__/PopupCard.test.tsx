// The popup sizing invariant.
//
// The reported bug looked like "no rounded corners, touching both edges", but
// the corners were already rounded at radius 26. The card was simply TALLER
// than the 394dp phone canvas, so its rounded top and bottom sat off-screen and
// only the straight sides remained — reading as a full-height slab.
//
// So the thing worth pinning is not the radius, it is that a popup can never
// outgrow the stage. Get that wrong again and the radius stops being visible no
// matter how large it is.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

let mockCanvas = { w: 852, h: 394 };
let mockIsTablet = false;

jest.mock('../theme/AppTheme', () => ({
  useAppTheme: () => ({ colors: { surface: '#fff', line: '#eee' } }),
}));

jest.mock('../theme/responsive', () => ({
  useStage: () => ({
    canvas: mockCanvas, isTablet: mockIsTablet, isDesktop: false, maxScale: 3,
  }),
}));

// eslint-disable-next-line import/first
import PopupCard from '../ui/PopupCard';

const MARGIN = 20;

const allStyles = (tree: ReturnType<typeof render>) =>
  tree.UNSAFE_getAllByType(View)
    .map((v) => StyleSheet.flatten(v.props.style))
    .filter(Boolean) as Record<string, any>[];

/** Outer layer: sizing + the shadow (which iOS would clip if it also hid overflow). */
const cardStyle = (tree: ReturnType<typeof render>) =>
  allStyles(tree).find((s) => typeof s.maxHeight === 'number')!;

/** Inner layer: the surface that clips content to the corners. */
const clipStyle = (tree: ReturnType<typeof render>) =>
  allStyles(tree).find((s) => s.overflow === 'hidden')!;

beforeEach(() => {
  mockCanvas = { w: 852, h: 394 };
  mockIsTablet = false;
});

describe('PopupCard — it cannot outgrow the stage', () => {
  it('caps its height to the canvas minus margins', () => {
    // THE REGRESSION. Without this the card grows past 394 and the rounded top
    // and bottom are pushed off-screen.
    const s = cardStyle(render(<PopupCard><Text>hi</Text></PopupCard>));
    expect(s.maxHeight).toBe(394 - MARGIN * 2);
  });

  it('follows a taller tablet canvas', () => {
    mockCanvas = { w: 1280, h: 800 };
    const s = cardStyle(render(<PopupCard><Text>hi</Text></PopupCard>));
    expect(s.maxHeight).toBe(800 - MARGIN * 2);
  });

  it('never lets the card reach the screen edge', () => {
    const tree = render(<PopupCard><Text>hi</Text></PopupCard>);
    const outer = StyleSheet.flatten(tree.UNSAFE_getAllByType(View)[0].props.style) as
      Record<string, any>;
    expect(outer.padding).toBeGreaterThanOrEqual(MARGIN);
  });

  it('keeps its width inside the stage', () => {
    const s = cardStyle(render(<PopupCard width={520}><Text>hi</Text></PopupCard>));
    expect(s.width).toBe(520);
    expect(s.maxWidth).toBe('100%');
  });
});

describe('PopupCard — it reads as a rounded card', () => {
  it('rounds every corner generously', () => {
    expect(cardStyle(render(<PopupCard><Text>hi</Text></PopupCard>)).borderRadius)
      .toBeGreaterThanOrEqual(28);
  });

  it('rounds a little more on the roomier tablet canvas', () => {
    const phone = cardStyle(render(<PopupCard><Text>hi</Text></PopupCard>)).borderRadius;
    mockIsTablet = true;
    const tablet = cardStyle(render(<PopupCard><Text>hi</Text></PopupCard>)).borderRadius;
    expect(tablet).toBeGreaterThan(phone);
  });

  it('clips content to the corners', () => {
    // Without overflow:hidden the scrolling content squares the corners off
    // again — the radius would be there and still invisible.
    const tree = render(<PopupCard><Text>hi</Text></PopupCard>);
    expect(clipStyle(tree).overflow).toBe('hidden');
    expect(clipStyle(tree).borderRadius).toBeGreaterThanOrEqual(28);
  });

  it('casts its shadow from a layer that does NOT clip', () => {
    // iOS clips a shadow to the view's own bounds, so a view that is both
    // shadowed and overflow:hidden renders no shadow at all.
    const tree = render(<PopupCard><Text>hi</Text></PopupCard>);
    expect(cardStyle(tree).overflow).toBeUndefined();
    expect(clipStyle(tree).shadowOpacity).toBeUndefined();
  });

  it('lifts off the backdrop so the edge reads as a curve', () => {
    const s = cardStyle(render(<PopupCard><Text>hi</Text></PopupCard>));
    expect(s.elevation).toBeGreaterThan(0);
    expect(s.shadowOpacity).toBeGreaterThan(0);
  });
});

describe('PopupCard — dismissal', () => {
  it('is modal by default — the backdrop does not close it', () => {
    const tree = render(<PopupCard><Text>hi</Text></PopupCard>);
    const pressables = tree.UNSAFE_root.findAllByType(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('react-native').Pressable,
    );
    expect(pressables.every((p: { props: { disabled?: boolean } }) => p.props.disabled)).toBe(true);
  });

  it('closes on a backdrop tap when a handler is given', () => {
    const onDismiss = jest.fn();
    const tree = render(<PopupCard onDismiss={onDismiss}><Text>hi</Text></PopupCard>);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Pressable } = require('react-native');
    const backdrop = tree.UNSAFE_root.findAllByType(Pressable)
      .find((p: { props: { disabled?: boolean } }) => !p.props.disabled)!;
    backdrop.props.onPress();
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe('PopupCard — content', () => {
  it('renders what it is given', () => {
    const tree = render(<PopupCard><Text>Start lesson</Text></PopupCard>);
    expect(tree.getByText('Start lesson')).toBeTruthy();
  });
});
