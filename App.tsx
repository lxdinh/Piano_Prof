import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Platform, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import {
  useFonts, Nunito_700Bold, Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';

import { AppThemeProvider } from './src/theme/AppTheme';
import { AppStateProvider } from './src/state/AppState';
import { BillingProvider } from './src/billing/BillingProvider';
import { HardwareProvider } from './src/state/HardwareProvider';
import { AccountProvider } from './src/account/AccountProvider';
import { RouterProvider } from './src/nav/Router';
import { registry } from './src/nav/registry';
import { initTelemetry, wrapRoot } from './src/telemetry/sentry';
import * as pianoEngine from './src/audio/pianoEngine';
import * as trustedTime from './src/services/trustedTime';

// Start crash reporting as early as possible (no-op until a DSN is set).
initTelemetry();

function Root() {
  return (
    <>
      {/* Immersive game: no OS status bar. */}
      <StatusBar hidden />
      <RouterProvider screens={registry} initial="splash" />
    </>
  );
}

function App() {
  // Two families: Baloo 2 = chunky rounded display (titles, numbers, buttons),
  // Nunito = friendly body text. See src/theme/tokens.ts.
  const [fontsLoaded] = useFonts({
    Nunito_700Bold, Nunito_800ExtraBold, Baloo2_700Bold, Baloo2_800ExtraBold,
  });

  // The new design is landscape-first (matches the prototype's phone + tablet
  // artboards). Lock landscape, and go immersive full-screen like a game —
  // hide the Android navigation bar (sticky, so a swipe reveals it briefly).
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    const hideNavBar = () => {
      if (Platform.OS !== 'android') return;
      NavigationBar.setVisibilityAsync('hidden').catch(() => {});
      NavigationBar.setBehaviorAsync('overlay-swipe').catch(() => {});
    };
    hideNavBar();
    // Trusted clock for the whole reward economy: load the stored anchor, then
    // re-anchor to network time on launch and on every resume — which is when a
    // device-clock change would have happened.
    trustedTime.initTrustedTime()
      .then(() => trustedTime.syncFromNetwork())
      .catch(() => {});
    // Android restores the nav bar after some interactions / on resume — re-hide.
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      hideNavBar();
      void trustedTime.syncFromNetwork().catch(() => {});
    });
    // Configure the audio session + warm the piano samples so the first note
    // plays instantly and Android media output is correctly routed.
    pianoEngine.initAudio().then(() => pianoEngine.preloadCore()).catch(() => {});
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFAEC' }}>
        <ActivityIndicator color="#58CC02" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        {/* Above AppState: premium gates XP and hearts from inside it. */}
        <BillingProvider>
          <AppStateProvider>
            <AccountProvider>
              {/* Above the router on purpose: the BLE link must survive `go()`. */}
              <HardwareProvider>
                <Root />
              </HardwareProvider>
            </AccountProvider>
          </AppStateProvider>
        </BillingProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

// Wrapped for Sentry native crash handlers (unwrapped no-op until a DSN is set).
export default wrapRoot(App);
