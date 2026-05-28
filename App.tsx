import 'react-native-gesture-handler';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import {
  useFonts, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black,
} from '@expo-google-fonts/nunito';

import { ThemeProvider } from './src/theme/ThemeContext';
import { BLEProvider } from './src/ble/BLEContext';
import { UserProvider } from './src/gamification/UserProvider';
import AchievementCelebration from './src/gamification/AchievementCelebration';
import RootNavigator from './src/navigation/RootNavigator';
import { Colors } from './src/theme/tokens';

export default function App() {
  const [fontsLoaded] = useFonts({ Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream50 }}>
        <ActivityIndicator color={Colors.brand} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <BLEProvider>
          <UserProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <RootNavigator />
              <AchievementCelebration />
            </NavigationContainer>
          </UserProvider>
        </BLEProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
