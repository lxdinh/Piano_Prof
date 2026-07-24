import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  useFonts, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black,
} from '@expo-google-fonts/nunito';

import { AppThemeProvider, useAppTheme } from './src/theme/AppTheme';
import { AppStateProvider } from './src/state/AppState';
import { AccountProvider } from './src/account/AccountProvider';
import { RouterProvider } from './src/nav/Router';
import { registry } from './src/nav/registry';

function Root() {
  const { isDark } = useAppTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RouterProvider screens={registry} initial="splash" />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });

  // The new design is landscape-first (matches the prototype's phone + tablet
  // artboards). Lock landscape for the whole app.
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
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
