// Smoke-test harness: mounts a screen the way the real app does — inside the
// core providers (real BLEProvider/UserProvider; natives are mocked in
// __mocks__/, not our providers) and a real navigator, because screens use
// useNavigation()/useRoute(). Shell-specific wrappers (ThemeProvider) are
// passed in by the shell's own test so this harness stays design-agnostic.
import React from 'react';
import renderer, { act, ReactTestRenderer } from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BLEProvider } from '../../ble/BLEContext';
import { UserProvider } from '../../gamification/UserProvider';

export interface RenderScreenOptions {
  /** Route name the screen expects from useRoute() typing. */
  route: string;
  Screen: React.ComponentType<any>;
  params?: object;
  /** Shell-specific providers, outermost first (e.g. the shell's ThemeProvider). */
  wrappers?: React.ComponentType<{ children: React.ReactNode }>[];
}

export async function renderScreen(opts: RenderScreenOptions): Promise<ReactTestRenderer> {
  const Stack = createNativeStackNavigator();

  let element: React.ReactElement = (
    <BLEProvider>
      <UserProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name={opts.route}
              component={opts.Screen}
              initialParams={opts.params}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </UserProvider>
    </BLEProvider>
  );

  for (const Wrapper of [...(opts.wrappers ?? [])].reverse()) {
    element = <Wrapper>{element}</Wrapper>;
  }

  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(element);
  });
  // Flush the async profile/settings loads that fire in mount effects.
  await act(async () => {});
  return tree;
}

export async function renderRoot(element: React.ReactElement): Promise<ReactTestRenderer> {
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(element);
  });
  await act(async () => {});
  return tree;
}
