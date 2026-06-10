// Fonts load instantly in tests so the shell's fonts gate never blocks.
module.exports = {
  useFonts: () => [true, null],
  Nunito_400Regular: 1,
  Nunito_600SemiBold: 1,
  Nunito_700Bold: 1,
  Nunito_800ExtraBold: 1,
  Nunito_900Black: 1,
};
