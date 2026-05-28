import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MainTabsParamList } from './types';
import { Colors, Fonts, Spacing, Gradients, Elevation, Motion } from '../theme/tokens';
import LearnScreen from '../screens/LearnScreen';
import PathScreen from '../screens/PathScreen';
import SongbookScreen from '../screens/SongbookScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import * as haptics from '../feedback/haptics';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const TABS: { name: keyof MainTabsParamList; icon: string; label: string }[] = [
  { name: 'Learn',    icon: '𝄞', label: 'Learn' },
  { name: 'Path',     icon: '🪜', label: 'Path' },
  { name: 'Songbook', icon: '🎵', label: 'Songbook' },
  { name: 'Profile',  icon: '🐧', label: 'Profile' },
  { name: 'Settings', icon: '⚙️', label: 'Settings' },
];

// Custom tab bar with a "soap-bar" highlight that slides between tabs,
// a chunky bottom shadow, and a per-tap pop animation on the active icon.
function PpTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const containerW = useRef(0);
  const slide = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.spring(slide, { toValue: state.index, ...Motion.spring.press, useNativeDriver: false }).start();
  }, [state.index, slide]);

  const tabWidth = containerW.current / TABS.length || 0;
  const indicatorX = slide.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * tabWidth + 6),
  });

  return (
    <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
      <View
        style={styles.tabBar}
        onLayout={(e) => {
          containerW.current = e.nativeEvent.layout.width;
          // re-trigger interpolation by nudging the value
          slide.setValue(state.index);
        }}
      >
        {/* sliding indicator */}
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              { width: tabWidth - 12, transform: [{ translateX: indicatorX }] },
            ]}
          >
            <LinearGradient
              colors={[Gradients.brand[0], Gradients.brand[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}

        {state.routes.map((route, i) => {
          const meta = TABS.find((t) => t.name === route.name);
          if (!meta) return null;
          const focused = state.index === i;
          const onPress = () => {
            haptics.tap();
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name as never);
          };
          return (
            <TabButton
              key={route.key}
              icon={meta.icon}
              label={meta.label}
              focused={focused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function TabButton({
  icon, label, focused, onPress,
}: { icon: string; label: string; focused: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(focused ? 1.1 : 1)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: focused ? 1.1 : 1, ...Motion.spring.press, useNativeDriver: true }).start();
  }, [focused, scale]);

  return (
    <Pressable onPress={onPress} style={styles.tabBtn}>
      <Animated.Text style={[styles.icon, { transform: [{ scale }] }, focused && styles.iconFocused]}>
        {icon}
      </Animated.Text>
      <Text style={[styles.label, focused && styles.labelFocused]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, lazy: true }}
      tabBar={(props) => <PpTabBar {...props} />}
    >
      {TABS.map((t) => (
        <Tab.Screen key={t.name} name={t.name} component={SCREENS[t.name]} />
      ))}
    </Tab.Navigator>
  );
}

const SCREENS: Record<keyof MainTabsParamList, React.ComponentType<any>> = {
  Learn: LearnScreen,
  Path: PathScreen,
  Songbook: SongbookScreen,
  Profile: ProfileScreen,
  Settings: SettingsScreen,
};

const styles = StyleSheet.create({
  tabSafe: { backgroundColor: '#FFFFFF', ...Elevation.lg },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 6,
    height: 70,
    borderTopWidth: 1,
    borderTopColor: Colors.inkLine,
  },
  indicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 16,
    overflow: 'hidden',
    opacity: 0.16,
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { fontSize: 22, color: Colors.ink300 },
  iconFocused: { color: Colors.brand },
  label: { fontSize: Fonts.xs, color: Colors.ink300, fontWeight: Fonts.weight.bold },
  labelFocused: { color: Colors.brand, fontWeight: Fonts.weight.black },
});
