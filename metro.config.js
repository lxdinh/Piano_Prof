// Metro config — ensure audio sample formats are bundled as assets.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// wav/mp3 are in Expo's defaults, but pin them so the piano samples always bundle.
const audioExts = ['wav', 'mp3', 'm4a', 'ogg'];
config.resolver.assetExts = Array.from(
  new Set([...config.resolver.assetExts, ...audioExts]),
);

module.exports = config;
