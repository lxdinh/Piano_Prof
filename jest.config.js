// Two jest projects:
//  - "logic": framework-free unit tests (node env, babel transform only).
//  - "ui": shell smoke tests (jest-expo) — renders every screen of the active
//    shell with native modules mocked (see __mocks__/). This is the safety net
//    that catches a broken screen before a design adoption ships.
module.exports = {
  projects: [
    {
      displayName: 'logic',
      testEnvironment: 'node',
      transform: {
        '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { presets: ['babel-preset-expo'] }],
      },
      testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
    },
    {
      displayName: 'ui',
      preset: 'jest-expo',
      setupFiles: ['<rootDir>/src/ui/testing/jestSetup.ts'],
      testMatch: ['<rootDir>/src/ui/**/__tests__/**/*.test.tsx'],
    },
  ],
};
