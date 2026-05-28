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
import PaywallScreen from '../screens/PaywallScreen';

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
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="Lesson" component={LessonScreen} />
        <Stack.Screen name="LessonComplete" component={LessonCompleteScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="BLEPairing" component={BLEPairingRoute} />
        <Stack.Screen name="VoiceSettings" component={VoiceSettingsScreen} options={{ headerShown: true, title: 'Instructor voice' }} />
        <Stack.Screen name="OmrImport" component={OmrImportScreen} options={{ headerShown: true, title: 'Import sheet music' }} />
        <Stack.Screen name="Paywall" component={PaywallScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
