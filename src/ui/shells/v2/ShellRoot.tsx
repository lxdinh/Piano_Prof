import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import {
  useFonts, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black,
} from '@expo-google-fonts/nunito';

import { ThemeProvider } from './theme/ThemeContext';
import { Colors } from './theme/tokens';
import RootNavigator from './navigation/RootNavigator';
import AchievementCelebration from './components/AchievementCelebration';

/**
 * Shell root — everything design-scoped lives below this component:
 * fonts (a design choice), theme, navigation tree, status bar style,
 * and design-flavored overlays. Core providers (BLE, user state) mount
 * above it in App.tsx and survive design swaps untouched.
 */
export default function ShellRoot() {
  const [fontsLoaded] = useFonts({ Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream50 }}>
        <ActivityIndicator color={Colors.brand} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
        <AchievementCelebration />
      </NavigationContainer>
    </ThemeProvider>
  );
}
