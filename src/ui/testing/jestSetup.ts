/* eslint-disable @typescript-eslint/no-var-requires */
// UI smoke-test setup (jest-expo project only).
import 'react-native-gesture-handler/jestSetup';

// Shells run infinite Animated loops (breathing mascots, pulsing path nodes).
// Fake timers freeze them so Jest can exit; promises/microtasks still flush.
jest.useFakeTimers();
