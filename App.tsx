import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Platform, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import {
  useFonts, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black,
} from '@expo-google-fonts/nunito';

import { AppThemeProvider } from './src/theme/AppTheme';
import { AppStateProvider } from './src/state/AppState';
import { AccountProvider } from './src/account/AccountProvider';
import { RouterProvider } from './src/nav/Router';
import { registry } from './src/nav/registry';
import { initTelemetry, wrapRoot } from './src/telemetry/sentry';

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
  const [fontsLoaded] = useFonts({ Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });

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
    // Android restores the nav bar after some interactions / on resume — re-hide.
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') hideNavBar(); });
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
        <AppStateProvider>
          <AccountProvider>
            <Root />
          </AccountProvider>
        </AppStateProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

// Wrapped for Sentry native crash handlers (unwrapped no-op until a DSN is set).
export default wrapRoot(App);
