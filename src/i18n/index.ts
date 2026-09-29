// Piano Professor — i18n. The 10-language dictionary is ported verbatim from
// the design prototype (app/i18n.jsx) via scripts/gen_i18n.mjs. A few app-only
// keys the prototype doesn't define are supplemented in English below.
import { PP_I18N, PP_ITEM_I18N } from './strings.generated';

export interface Lang { code: string; label: string; native: string; tts: string; flag: string; }

export const LANGS: Lang[] = [
  { code: 'en', label: 'English',    native: 'English',    tts: 'en-US', flag: '🇺🇸' },
  { code: 'zh', label: 'Chinese',    native: '中文',        tts: 'zh-CN', flag: '🇨🇳' },
  { code: 'es', label: 'Spanish',    native: 'Español',    tts: 'es-ES', flag: '🇪🇸' },
  { code: 'fr', label: 'French',     native: 'Français',   tts: 'fr-FR', flag: '🇫🇷' },
  { code: 'de', label: 'German',     native: 'Deutsch',    tts: 'de-DE', flag: '🇩🇪' },
  { code: 'ja', label: 'Japanese',   native: '日本語',      tts: 'ja-JP', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean',     native: '한국어',      tts: 'ko-KR', flag: '🇰🇷' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt', tts: 'vi-VN', flag: '🇻🇳' },
  { code: 'pt', label: 'Portuguese', native: 'Português',  tts: 'pt-BR', flag: '🇧🇷' },
  { code: 'it', label: 'Italian',    native: 'Italiano',   tts: 'it-IT', flag: '🇮🇹' },
];

export const langByCode = (code: string): Lang => LANGS.find((l) => l.code === code) ?? LANGS[0];
export const langTTS = (code: string): string => langByCode(code).tts;

// App-only strings the prototype dictionary doesn't cover (English base).
const EXTRA: Record<string, Record<string, string>> = {
  'splash.tagline': { en: 'Real piano. Lit keys. Learn fast.' },
  'splash.tuning': { en: 'Tuning your keys…' },
  'splash.play': { en: "Let's Play" },
  'onboarding.startPlacement': { en: 'Start placement' },
  'placement.placed': { en: "You're placed in" },
  'path.title': { en: 'Choose your path' },
  'path.switch': { en: 'You can switch anytime.' },
};

export function t(key: string, lang = 'en', vars?: Record<string, string | number>): string {
  const entry = PP_I18N[key] ?? EXTRA[key];
  let out = entry ? (entry[lang] ?? entry.en ?? key) : key;
  if (vars) for (const k of Object.keys(vars)) out = out.replace(`{${k}}`, String(vars[k]));
  return out;
}

/** Localize a shelf item's title/sub; songs (and unlisted items) keep theirs. */
export function tItemTitle(id: string, fallback: string, lang: string): string {
  return PP_ITEM_I18N[id]?.title?.[lang] ?? PP_ITEM_I18N[id]?.title?.en ?? fallback;
}
export function tItemSub(id: string, fallback: string, lang: string): string {
  return PP_ITEM_I18N[id]?.sub?.[lang] ?? PP_ITEM_I18N[id]?.sub?.en ?? fallback;
}
