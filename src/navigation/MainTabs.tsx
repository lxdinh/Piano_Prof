import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MainTabsParamList } from './types';
import { Colors, Fonts, Motion } from '../theme/tokens';
import LearnScreen from '../screens/LearnScreen';
import SongbookScreen from '../screens/SongbookScreen';
import PracticeScreen from '../screens/PracticeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import * as haptics from '../feedback/haptics';

const Tab = createBottomTabNavigator<MainTabsParamList>();

// Icons + labels mirror the legacy web UI's bottom nav exactly.
const TABS: { name: keyof MainTabsParamList; icon: string; label: string }[] = [
  { name: 'Learn',    icon: '♪',  label: 'Learn' },
  { name: 'Sheet',    icon: '📄', label: 'Sheet' },
  { name: 'Practice', icon: '🎹', label: 'Practice' },
  { name: 'Profile',  icon: '👤', label: 'Profile' },
];

// Bottom tab bar tuned to the legacy proportions (64px cream bar, 20px icon,
// 11px/900 Nunito label). The active tab is signalled with the brand green plus
// a gentle icon pop — Duolingo-style — instead of legacy's label-darken only.
function PpTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.tabSafe}>
      <Animated.View style={styles.tabBar}>
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
      </Animated.View>
    </SafeAreaView>
  );
}

function TabButton({
  icon, label, focused, onPress,
}: { icon: string; label: string; focused: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(focused ? 1 : 1)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.12 : 1,
      ...Motion.spring.press,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  return (
    <Pressable onPress={onPress} style={styles.tabBtn} hitSlop={6}>
      <Animated.Text
        style={[styles.icon, focused && styles.iconFocused, { transform: [{ scale }] }]}
        allowFontScaling={false}
      >
        {icon}
      </Animated.Text>
      <Text style={[styles.label, focused && styles.labelFocused]} numberOfLines={1} allowFontScaling={false}>
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
  Sheet: SongbookScreen,
  Practice: PracticeScreen,
  Profile: ProfileScreen,
};

const styles = StyleSheet.create({
  tabSafe: { backgroundColor: Colors.cream50 },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.cream50,
    height: 64,
    borderTopWidth: 1.5,
    borderTopColor: Colors.inkLine,
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingBottom: 4 },
  icon: { fontSize: 20, lineHeight: 24, color: Colors.ink500 },
  iconFocused: { color: Colors.brand },
  label: {
    fontSize: Fonts.sm,
    fontFamily: Fonts.family.black,
    fontWeight: Fonts.weight.black,
    color: Colors.ink300,
  },
  labelFocused: { color: Colors.brand },
});
