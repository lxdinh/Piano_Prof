import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
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
import { ProfilesProvider, useProfiles } from './src/gamification/ProfilesProvider';
import AchievementCelebration from './src/gamification/AchievementCelebration';
import RootNavigator from './src/navigation/RootNavigator';
import { Colors } from './src/theme/tokens';
import { useAppOrientation } from './src/feedback/useOrientation';
import { preloadCore } from './src/audio/pianoEngine';

// Bridges the active family profile into UserProvider. When the active uid
// changes (profile switch), UserProvider reloads that learner's data.
function ActiveUserProvider({ children }: { children: React.ReactNode }) {
  const { activeUid } = useProfiles();
  return <UserProvider uid={activeUid}>{children}</UserProvider>;
}

export default function App() {
  const [fontsLoaded] = useFonts({ Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });

  // Landscape-first on tablets; phones rotate freely. Lesson + Practice still
  // force landscape while focused via their own hooks.
  useAppOrientation();

  // Warm the piano sample cache in the background so the first tap is instant.
  useEffect(() => { void preloadCore(); }, []);

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
          <ProfilesProvider>
            <ActiveUserProvider>
              <NavigationContainer>
                <StatusBar style="dark" />
                <RootNavigator />
                <AchievementCelebration />
              </NavigationContainer>
            </ActiveUserProvider>
          </ProfilesProvider>
        </BLEProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
