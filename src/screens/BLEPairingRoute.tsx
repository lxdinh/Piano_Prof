import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import BLEPairingScreen from './BLEPairingScreen';
import { logEvent, Events } from '../services/analytics';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BLEPairing'>;

// Adapts the prop-driven BLEPairingScreen to the navigation stack.
export default function BLEPairingRoute() {
  const nav = useNavigation<Nav>();
  return (
    <BLEPairingScreen
      onConnected={(name) => logEvent(Events.blePaired, { name })}
      onStartLesson={() => nav.navigate('MainTabs', { screen: 'Learn' })}
      onBack={() => nav.goBack()}
    />
  );
}
