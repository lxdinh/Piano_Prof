// Pure-logic unit tests run in a plain node environment with babel-preset-expo
// for TS/JSX transform. (We deliberately avoid jest-expo's multi-platform RN
// projects here — these tests cover framework-free logic only.)
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
};
