// Text that must survive ten languages.
//
// Short English chrome expands hard once translated — "Skip" → "Überspringen",
// "Root" → "Fondamentale", "Gems" → "Edelsteine", "Practice" → "S'exercer".
// Up to 3× the characters the control was sized for. Every one of those sat in
// a `numberOfLines={1}` Text with nothing else set, so they ellipsised into
// fragments on exactly the devices that also had the least width to give.
//
// Two guards here: controls shrink instead of truncating, and the translation
// data itself stays inside the budget the chrome was designed around, so adding
// an over-long string fails here rather than on a user's phone.
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { PP_I18N } from '../i18n/strings.generated';

jest.mock('../theme/AppTheme', () => ({
  useAppTheme: () => ({ colors: { line: '#333', inkSoft: '#ccc', ink: '#fff' } }),
}));
jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual('react-native');
  return { LinearGradient: View };
});
jest.mock('../feedback/haptics', () => ({ tap: jest.fn() }));

// eslint-disable-next-line import/first
import PPButton from '../ui/PPButton';

const LANGS = ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'vi', 'pt', 'it'];

const labelProps = (label: string) => {
  const r = render(<PPButton label={label} />);
  return r.UNSAFE_getAllByType(Text)[0].props;
};

describe('buttons shrink rather than truncate', () => {
  it('auto-sizes the label to fit', () => {
    const p = labelProps('Continue');
    expect(p.adjustsFontSizeToFit).toBe(true);
    expect(p.numberOfLines).toBe(1);
  });

  it('has a readable floor — shrinking, not vanishing', () => {
    const p = labelProps('Continue');
    expect(p.minimumFontScale).toBeGreaterThanOrEqual(0.6);
    expect(p.minimumFontScale).toBeLessThan(1);
  });

  it('keeps the whole word for the worst real expansions', () => {
    // These are actual strings from the translation data, not invented ones.
    for (const label of ['Überspringen', 'Fondamentale', 'Edelsteine', 'Enregistrer']) {
      const r = render(<PPButton label={label} />);
      // The full text is present — RN truncates at paint time, so the guarantee
      // we can assert is that nothing pre-trims it and shrinking is enabled.
      expect(r.getByText(label)).toBeTruthy();
      expect(r.UNSAFE_getAllByType(Text)[0].props.adjustsFontSizeToFit).toBe(true);
    }
  });
});

describe('translation data stays inside the chrome budget', () => {
  const longest = (prefix: string) => {
    let worst = { len: 0, key: '', lang: '', text: '' };
    for (const [key, byLang] of Object.entries(PP_I18N)) {
      if (!key.startsWith(prefix)) continue;
      for (const [lang, text] of Object.entries(byLang)) {
        if (text.length > worst.len) worst = { len: text.length, key, lang, text };
      }
    }
    return worst;
  };

  it('nav labels stay short enough for the rail', () => {
    // The nav rail is the tightest text in the app: 11px, one line, icon above.
    const w = longest('nav.');
    expect(w.len).toBeLessThanOrEqual(14);
  });

  it('common actions stay button-sized', () => {
    const w = longest('common.');
    expect(w.len).toBeLessThanOrEqual(26);
  });

  it('covers every language for every key', () => {
    // A missing translation silently falls back to English, which reads as a
    // half-translated app rather than an obvious bug.
    const missing: string[] = [];
    for (const [key, byLang] of Object.entries(PP_I18N)) {
      for (const lang of LANGS) {
        if (!byLang[lang]) missing.push(`${key}/${lang}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('has no blank translations', () => {
    const blank = Object.entries(PP_I18N)
      .flatMap(([key, byLang]) => Object.entries(byLang)
        .filter(([, text]) => !text.trim())
        .map(([lang]) => `${key}/${lang}`));
    expect(blank).toEqual([]);
  });
});
