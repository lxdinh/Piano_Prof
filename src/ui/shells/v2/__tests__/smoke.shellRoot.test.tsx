import React from 'react';

import { BLEProvider } from '../../../../ble/BLEContext';
import { UserProvider } from '../../../../gamification/UserProvider';
import { renderRoot } from '../../../testing/renderShell';
import ShellRoot from '../ShellRoot';

describe('v2 ShellRoot', () => {
  it('boots end-to-end (fonts gate → theme → navigator → overlay)', async () => {
    const tree = await renderRoot(
      <BLEProvider>
        <UserProvider>
          <ShellRoot />
        </UserProvider>
      </BLEProvider>,
    );
    expect(tree.toJSON()).not.toBeNull();
    tree.unmount();
  });
});
