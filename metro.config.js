// Metro config — ensure audio sample formats are bundled as assets.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// wav/mp3 are in Expo's defaults, but pin them so the piano samples always bundle.
const audioExts = ['wav', 'mp3', 'm4a', 'ogg'];
config.resolver.assetExts = Array.from(
  new Set([...config.resolver.assetExts, ...audioExts]),
);

// Firebase JS SDK (v10) ships .cjs entry points and relies on package "exports".
// These two lines are the documented fix for Metro + Expo so `firebase/auth`
// resolves correctly ("Component auth has not been registered yet").
config.resolver.sourceExts = Array.from(new Set([...config.resolver.sourceExts, 'cjs']));
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
