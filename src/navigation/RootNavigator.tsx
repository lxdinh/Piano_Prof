import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { Colors } from '../theme/tokens';
import { useProfiles } from '../gamification/ProfilesProvider';
import MainTabs from './MainTabs';
import OnboardingScreen from '../screens/OnboardingScreen';
import ProfilePickerScreen from '../screens/ProfilePickerScreen';
import PlacementScreen from '../screens/PlacementScreen';
import LessonScreen from '../screens/LessonScreen';
import LessonCompleteScreen from '../screens/LessonCompleteScreen';
import BLEPairingRoute from '../screens/BLEPairingRoute';
import VoiceSettingsScreen from '../screens/VoiceSettingsScreen';
import OmrImportScreen from '../screens/OmrImportScreen';
import PaywallScreen from '../screens/PaywallScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { ready, profiles } = useProfiles();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream50 }}>
        <ActivityIndicator color={Colors.brand} />
      </View>
    );
  }

  // Fresh install → onboarding (creates the first profile). Returning families
  // land on the Netflix-style "Who's playing?" picker each cold start.
  const initialRoute: keyof RootStackParamList = profiles.length === 0 ? 'Onboarding' : 'ProfilePicker';

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
      <Stack.Screen name="ProfilePicker" component={ProfilePickerScreen} />
      <Stack.Screen name="Placement" component={PlacementScreen} />
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
