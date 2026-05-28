import { useFonts, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import BLEPairingScreen from './src/screens/BLEPairingScreen';

export default function App() {
  const [fontsLoaded] = useFonts({ Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFAEC' }}>
        <ActivityIndicator color="#58CC02" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor="#FFFAEC" />
      <BLEPairingScreen
        onConnected={(name) => console.log('Connected to', name)}
        onStartLesson={() => console.log('Start lesson — navigate here')}
      />
    </>
  );
}
