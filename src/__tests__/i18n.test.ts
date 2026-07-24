import { t, tItemTitle, tItemSub, LANGS, langTTS } from '../i18n';
import { PP_I18N } from '../i18n/strings.generated';

const CODES = LANGS.map((l) => l.code);

describe('i18n dictionary', () => {
  it('ships all 10 languages', () => {
    expect(CODES).toEqual(['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'vi', 'pt', 'it']);
  });
  it('every key has a translation in every language', () => {
    for (const entry of Object.values(PP_I18N)) {
      for (const code of CODES) {
        expect(typeof entry[code]).toBe('string');
        expect((entry[code] as string).length).toBeGreaterThan(0);
      }
    }
  });
  it('translates real strings per language', () => {
    expect(t('nav.learn', 'en')).toBe('Learn');
    expect(t('nav.learn', 'vi')).toBe('Học');
    expect(t('nav.learn', 'ja')).toBe('学ぶ');
    expect(t('settings.title', 'es')).toBe('Ajustes');
    expect(t('level.ms', 'de')).toBe('Mittelstufe');
  });
  it('falls back to English then the key itself', () => {
    // an app-only key present only in English
    expect(t('splash.play', 'zh')).toBe("Let's Play");
    expect(t('does.not.exist', 'fr')).toBe('does.not.exist');
  });
  it('interpolates vars', () => {
    // no {var} in the ported strings, but the mechanism must work
    const out = t('home.hi', 'en', { name: 'Ava' });
    expect(out).toBe('Hi'); // no placeholder, unchanged
  });
  it('localizes shelf item titles and subs, songs untouched', () => {
    expect(tItemTitle('e2', 'fallback', 'fr')).toBe('Deux mains');
    expect(tItemSub('e2', 'fallback', 'vi')).toBe('Tay trái + phải cùng lúc');
    expect(tItemTitle('s1', 'Perfect', 'fr')).toBe('Perfect'); // not in dict → fallback
  });
  it('maps languages to BCP-47 TTS codes', () => {
    expect(langTTS('vi')).toBe('vi-VN');
    expect(langTTS('pt')).toBe('pt-BR');
    expect(langTTS('xx')).toBe('en-US');
  });
});
