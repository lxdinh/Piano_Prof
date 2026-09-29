// Pins the two PPButton fixes that shipped unverified.
//
// 1. VERTICAL CENTRING. Baloo 2 declares tall ascent/descent and Android adds it
//    as invisible padding around the glyphs, so labels rode high with dead space
//    beneath them. The first attempt pinned `lineHeight`, which does not remove
//    that padding — it only repositions the baseline inside a shorter box, so it
//    looked *worse*. The fix is includeFontPadding:false + textAlignVertical.
//    Asserting the absence of lineHeight is the point: re-adding it is the
//    regression.
//
// 2. GHOST INK. Ghost is the only variant with no fill, and it drew a fixed
//    near-black from the palette — invisible on the dark theme ("Switch" could
//    not be read at all). Its ink and outline must come from the theme.
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

const THEME = { line: '#3A3631', inkSoft: '#C9C2B6', ink: '#FFFFFF' };

jest.mock('../theme/AppTheme', () => ({
  useAppTheme: () => ({ colors: THEME }),
}));

jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual('react-native');
  return { LinearGradient: View };
});

jest.mock('../feedback/haptics', () => ({ tap: jest.fn() }));

// eslint-disable-next-line import/first
import PPButton from '../ui/PPButton';

const labelStyle = (el: ReturnType<typeof render>) => {
  const { StyleSheet } = jest.requireActual('react-native');
  return StyleSheet.flatten(el.UNSAFE_getAllByType(Text)[0].props.style);
};

describe('PPButton — label metrics', () => {
  it('drops Android font padding and centres the glyph box', () => {
    const s = labelStyle(render(<PPButton label="PLAY SCALE" size="lg" />));
    expect(s.includeFontPadding).toBe(false);
    expect(s.textAlignVertical).toBe('center');
  });

  it('does NOT pin lineHeight — that was the fix that made it worse', () => {
    const s = labelStyle(render(<PPButton label="PLAY SCALE" size="lg" />));
    expect(s.lineHeight).toBeUndefined();
  });

  it.each(['sm', 'md', 'lg', 'xl'] as const)(
    'keeps real optical padding at size %s', (size) => {
      const r = render(<PPButton label="GO" size={size} />);
      const { StyleSheet, View } = jest.requireActual('react-native');
      // The gradient face is mocked to a View; it carries the padding.
      const faces = r.UNSAFE_getAllByType(View);
      const withPad = faces
        .map((f: any) => StyleSheet.flatten(f.props.style))
        .find((st: any) => st && st.paddingVertical != null);
      expect(withPad.paddingVertical).toBeGreaterThanOrEqual(9);
    },
  );
});

describe('PPButton — ghost variant follows the theme', () => {
  it('draws its ink from the theme, not the fixed near-black palette', () => {
    const s = labelStyle(render(<PPButton label="Switch" variant="ghost" />));
    expect(s.color).toBe(THEME.inkSoft);
    expect(s.color).not.toBe('#2D2A26'); // the unreadable palette value
  });

  it('keeps its outline on the theme line colour', () => {
    const r = render(<PPButton label="Switch" variant="ghost" />);
    const { StyleSheet, View } = jest.requireActual('react-native');
    const bordered = r.UNSAFE_getAllByType(View)
      .map((v: any) => StyleSheet.flatten(v.props.style))
      .find((st: any) => st && st.borderWidth === 2);
    expect(bordered.borderColor).toBe(THEME.line);
  });

  it('leaves ghost labels in sentence case, unlike the filled variants', () => {
    expect(labelStyle(render(<PPButton label="Switch" variant="ghost" />)).textTransform)
      .toBe('none');
    expect(labelStyle(render(<PPButton label="Continue" variant="green" />)).textTransform)
      .toBe('uppercase');
  });

  it('still honours an explicit textColor override', () => {
    const s = labelStyle(render(<PPButton label="Switch" variant="ghost" textColor="#FF0000" />));
    expect(s.color).toBe('#FF0000');
  });
});

describe('PPButton — filled variants keep their palette ink', () => {
  it('does not reroute a filled variant through the theme', () => {
    expect(labelStyle(render(<PPButton label="Go" variant="green" />)).color).toBe('#ffffff');
    expect(labelStyle(render(<PPButton label="Go" variant="gold" />)).color).toBe('#5a3d00');
  });
});
