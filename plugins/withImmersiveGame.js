// Expo config plugin — make the app a true full-screen game on Android:
//  • windowLayoutInDisplayCutoutMode = shortEdges → the app draws into the
//    camera-cutout area instead of being letterboxed with black bars.
//  • windowFullscreen = true → the status bar is hidden at the native theme
//    level (no flash on launch; the runtime StatusBar/NavigationBar calls in
//    App.tsx handle the navigation bar + resume).
const { withAndroidStyles, AndroidConfig } = require('@expo/config-plugins');

const { assignStylesValue, getAppThemeLightNoActionBarGroup } = AndroidConfig.Styles;

module.exports = function withImmersiveGame(config) {
  return withAndroidStyles(config, (cfg) => {
    const parent = getAppThemeLightNoActionBarGroup();
    cfg.modResults = assignStylesValue(cfg.modResults, {
      add: true,
      parent,
      name: 'android:windowLayoutInDisplayCutoutMode',
      value: 'shortEdges',
    });
    cfg.modResults = assignStylesValue(cfg.modResults, {
      add: true,
      parent,
      name: 'android:windowFullscreen',
      value: 'true',
    });
    return cfg;
  });
};
