/**
 * THE one-line design switch.
 *
 * Metro cannot dynamic-require a shell, so this must stay a static
 * re-export. To ship a new design: change 'v2' to the new shell version
 * on the lines below (one commit — trivially revertable for rollback).
 *
 * The global ReactNavigation typing lives HERE (not inside a shell) on
 * purpose: if every shell declared it, TypeScript would merge all shells'
 * route params globally and conflict the moment two designs disagree.
 */
export { ShellRoot } from './shells/v2';
export type { RootStackParamList, MainTabsParamList } from './shells/v2';

import type { RootStackParamList as ActiveParams } from './shells/v2';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends ActiveParams {}
  }
}
