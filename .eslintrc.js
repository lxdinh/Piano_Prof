// ESLint — Expo's recommended config + Prettier compatibility.
// The generated i18n strings and native/build dirs are excluded.
module.exports = {
  root: true,
  extends: ['expo', 'prettier'],
  ignorePatterns: [
    'node_modules/',
    'android/',
    'ios/',
    'dist/',
    'coverage/',
    '.build-info/',
    'scripts/',
    'src/i18n/strings.generated.ts',
    '*.config.js',
    'babel.config.js',
    'metro.config.js',
  ],
  rules: {
    // Metro/Expo resolve these; the linter doesn't need to.
    'import/no-unresolved': 'off',
  },
};
