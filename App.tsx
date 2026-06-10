import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BLEProvider } from './src/ble/BLEContext';
import { UserProvider } from './src/gamification/UserProvider';
import { useLockPortraitOnMount } from './src/feedback/useOrientation';
import { preloadCore } from './src/audio/pianoEngine';
import { ShellRoot } from './src/ui/activeShell';

/**
 * Core composition root. Design-agnostic: providers and device concerns
 * only. Everything visual lives in the active UI shell (src/ui/activeShell
 * decides which design ships).
 */
export default function App() {
  // App defaults to portrait. Lesson + Practice flip to landscape via their
  // own hooks while focused, then restore portrait on blur.
  useLockPortraitOnMount();

  // Warm the piano sample cache in the background so the first tap is instant.
  useEffect(() => { void preloadCore(); }, []);

  return (
    <SafeAreaProvider>
      <BLEProvider>
        <UserProvider>
          <ShellRoot />
        </UserProvider>
      </BLEProvider>
    </SafeAreaProvider>
  );
}
