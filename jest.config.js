// Two projects, deliberately.
//
// `logic` is the original harness: a plain node environment with just the babel
// transform, which is why the pure-logic suite runs in about a second. Nothing
// about it changes — it is worth keeping fast.
//
// `ui` exists because the previous config matched only `*.test.ts`, so the views
// and UI components could not be tested at all — every layout and typography fix
// shipped unverified. Component tests are `*.test.tsx` and run under jest-expo so
// that react-native resolves.
const logic = {
  displayName: 'logic',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
};

const ui = {
  displayName: 'ui',
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.tsx'],
  setupFiles: ['<rootDir>/jest.setup.ui.js'],
};

module.exports = { projects: [logic, ui] };
