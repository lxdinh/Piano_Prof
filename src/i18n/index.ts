// Piano Professor — i18n scaffold.
// The prototype ships a full 10-language dictionary (app/i18n.jsx). Phase 1
// wires the structure and ships English; the other dictionaries port in later.
// All UI copy should read through t() so localization is a data drop-in.

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

// English string table (other languages to be ported from app/i18n.jsx).
type Dict = Record<string, string>;
const EN: Dict = {
  'splash.tagline': 'Real piano. Lit keys. Learn fast.',
  'splash.tuning': 'Tuning your keys…',
  'splash.play': "Let's Play",
  'who.title': "Who's playing?",
  'who.add': 'Add profile',
  'who.manage': 'Manage',
  'create.title': 'Create profile',
  'create.name': 'Your name',
  'create.language': 'Language',
  'create.avatar': 'Pick your Maestro',
  'create.start': 'Start learning',
  'home.continue': 'Continue learning',
  'home.dailyGoal': 'Daily goal',
  'nav.learn': 'Learn',
  'nav.songs': 'Songs',
  'nav.practice': 'Practice',
  'nav.profile': 'Profile',
  'common.continue': 'Continue',
  'common.next': 'Next',
  'common.back': 'Back',
  'lesson.hearIt': 'Hear it again',
  'lesson.gotIt': 'Got it',
  'complete.title': 'Lesson complete!',
  'complete.backToLearn': 'Back to learn',
  'complete.next': 'Next lesson',
};

const TABLES: Record<string, Dict> = { en: EN };

export function t(key: string, lang = 'en', vars?: Record<string, string | number>): string {
  const table = TABLES[lang] ?? EN;
  let out = table[key] ?? EN[key] ?? key;
  if (vars) for (const k of Object.keys(vars)) out = out.replace(`{${k}}`, String(vars[k]));
  return out;
}
