// Piano Professor — app-wide stage. Frames the safe-area, then scales the whole
// UI (rendered at a fixed logical canvas) to fit the device via FitBox. The
// outer frame paints the app background, so the letterbox margins that appear
// when the device aspect ratio differs from the canvas read as padding, not
// black bars. Every screen renders in canvas coordinates, so "fits vs scrolls"
// is deterministic — fixed screens never scroll; real lists scroll inside.
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useStage } from '../theme/responsive';
import FitBox from '../ui/FitBox';

// Inside the canvas the frame is already within the safe area, so screens must
// see zero insets — otherwise device insets (notch) get applied in canvas space
// and scaled, wasting room. This overrides useSafeAreaInsets() for all screens.
const ZERO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

export default function Stage({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { canvas, maxScale } = useStage();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <FitBox design={canvas} maxScale={maxScale}>
        <SafeAreaInsetsContext.Provider value={ZERO_INSETS}>{children}</SafeAreaInsetsContext.Provider>
      </FitBox>
    </View>
  );
}
