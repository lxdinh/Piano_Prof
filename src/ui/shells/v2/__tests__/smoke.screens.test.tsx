import fs from 'fs';
import path from 'path';

import { renderScreen } from '../../../testing/renderShell';
import { ThemeProvider } from '../theme/ThemeContext';
import { SMOKE_REGISTRY } from './smoke.registry';

describe('v2 shell — every screen renders', () => {
  it.each(SMOKE_REGISTRY.map((e) => [e.file, e] as const))(
    'renders %s',
    async (_file, entry) => {
      const tree = await renderScreen({
        route: entry.route,
        Screen: entry.Screen,
        params: entry.params,
        wrappers: [ThemeProvider],
      });
      expect(tree.toJSON()).not.toBeNull();
      tree.unmount();
    },
  );

  it('registry covers every screen file in screens/', () => {
    const screenFiles = fs
      .readdirSync(path.join(__dirname, '..', 'screens'))
      .filter((f) => f.endsWith('.tsx'))
      .map((f) => f.replace(/\.tsx$/, ''))
      .sort();
    const registered = SMOKE_REGISTRY.map((e) => e.file).sort();
    expect(registered).toEqual(screenFiles);
  });
});
