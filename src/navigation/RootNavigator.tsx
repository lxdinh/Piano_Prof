import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { Colors } from '../theme/tokens';
import { getBool } from '../storage/settings';
import MainTabs from './MainTabs';
import OnboardingScreen from '../screens/OnboardingScreen';
import LessonScreen from '../screens/LessonScreen';
import LessonCompleteScreen from '../screens/LessonCompleteScreen';
import BLEPairingRoute from '../screens/BLEPairingRoute';
import VoiceSettingsScreen from '../screens/VoiceSettingsScreen';
import OmrImportScreen from '../screens/OmrImportScreen';
import ReviewScoreScreen from '../screens/ReviewScoreScreen';
import SongPlayerScreen from '../screens/SongPlayerScreen';
import PaywallScreen from '../screens/PaywallScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    getBool('onboarded', false).then((done) => setInitialRoute(done ? 'MainTabs' : 'Onboarding'));
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream50 }}>
        <ActivityIndicator color={Colors.brand} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        // Cohesive cross-fade for the onboarding → main flow; modals get
        // their natural sheet slide via the group below.
        animation: 'fade',
        animationDuration: 220,
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      {/* Lesson uses a full-screen card (not a bottom sheet) so the landscape
          layout reads cleanly without a portrait-orientation header gutter. */}
      <Stack.Screen
        name="Lesson"
        component={LessonScreen}
        options={{ animation: 'fade', animationDuration: 200 }}
      />
      <Stack.Screen
        name="LessonComplete"
        component={LessonCompleteScreen}
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
      {/* Review imported notation (fix title/tempo, spot OMR errors), then play */}
      <Stack.Screen
        name="ReviewScore"
        component={ReviewScoreScreen}
        options={{ animation: 'fade', animationDuration: 200 }}
      />
      {/* Full-screen falling-notes player for imported songs */}
      <Stack.Screen
        name="SongPlayer"
        component={SongPlayerScreen}
        options={{ animation: 'fade', animationDuration: 200 }}
      />
      <Stack.Group screenOptions={{ presentation: 'modal', animation: 'slide_from_bottom' }}>
        <Stack.Screen name="BLEPairing" component={BLEPairingRoute} />
        <Stack.Screen name="VoiceSettings" component={VoiceSettingsScreen} options={{ headerShown: true, title: 'Instructor voice' }} />
        <Stack.Screen name="OmrImport" component={OmrImportScreen} options={{ headerShown: true, title: 'Import sheet music' }} />
        <Stack.Screen name="Paywall" component={PaywallScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings' }} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
