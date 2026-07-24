// Piano Professor — localization hook bound to the active profile's language.
// Screens call const tr = useT(); then tr('nav.learn') etc.
import { useCallback } from 'react';
import { useApp } from '../state/AppState';
import { t as translate, tItemTitle, tItemSub } from './index';

export function useT() {
  const { activeProfile } = useApp();
  const lang = activeProfile?.lang ?? 'en';
  const tr = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(key, lang, vars),
    [lang],
  );
  const trItem = useCallback((id: string, fallback: string) => tItemTitle(id, fallback, lang), [lang]);
  const trSub = useCallback((id: string, fallback: string) => tItemSub(id, fallback, lang), [lang]);
  return Object.assign(tr, { lang, item: trItem, sub: trSub });
}
