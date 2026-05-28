import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabsParamList } from './types';
import { Colors, Fonts } from '../theme/tokens';
import LearnScreen from '../screens/LearnScreen';
import PathScreen from '../screens/PathScreen';
import SongbookScreen from '../screens/SongbookScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const ICONS: Record<keyof MainTabsParamList, string> = {
  Learn: '𝄞',
  Path: '🪜',
  Songbook: '🎵',
  Profile: '🐧',
  Settings: '⚙️',
};

function tabIcon(name: keyof MainTabsParamList) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Text style={{ fontSize: focused ? 24 : 22, color }}>{ICONS[name]}</Text>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.brand,
        tabBarInactiveTintColor: Colors.ink300,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: Colors.inkLine,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: Fonts.xs, fontWeight: Fonts.weight.bold },
        tabBarIcon: tabIcon(route.name),
      })}
    >
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Path" component={PathScreen} />
      <Tab.Screen name="Songbook" component={SongbookScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
