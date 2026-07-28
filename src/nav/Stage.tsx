// Piano Professor — app-wide stage (full-screen game fill).
// This is a game, not a utility app: it fills the screen edge-to-edge like
// Clash of Clans / Duolingo — no letterbox bars. We scale the UI to the device
// *height* and let the logical *width* flex to fill the width, so every device
// is filled completely with no cropping. The UI is authored at a fixed logical
// height (compact on phones, roomy on tablets), so a big screen shows more at
// the same text size rather than a zoomed-in phone layout. Only a display
// cutout (camera notch) is padded, so nav-rail buttons never hide under it.
import React, { useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/AppTheme';
import { useStage } from '../theme/responsive';

// Inside the canvas the frame already fills the usable screen, so screens must
// see zero insets — otherwise device insets get applied in canvas space and
// scaled. This overrides useSafeAreaInsets() for every screen.
const ZERO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

/** Minimum breathing room (dp) between content and the physical screen edge. */
const EDGE_GUTTER = 10;

export default function Stage({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { canvas } = useStage();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== box.w || height !== box.h) setBox({ w: width, h: height });
  };

  // Horizontal gutters: a camera cutout where there is one, and never less than
  // EDGE_GUTTER, so a chip or button at the end of a row can't sit flush against
  // the physical edge of the screen (it reads as clipped, and on curved glass it
  // partly is).
  const padL = Math.max(insets.left, EDGE_GUTTER);
  const padR = Math.max(insets.right, EDGE_GUTTER);

  // Fill-to-height: scale so the canvas height exactly fills the screen height,
  // then derive the logical width so the scaled result fills the width too.
  //
  // The width MUST come from the padded content box, not the full measured box.
  // Deriving it from box.w made the scaled child wider than the space it was
  // laid out in, so it overflowed the padding symmetrically and got clipped —
  // which silently cancelled the safe-area insets and pushed content hard
  // against both edges.
  const s = box.h > 0 ? box.h / canvas.h : 0;
  const contentW = Math.max(0, box.w - padL - padR);
  const logicalW = s > 0 ? contentW / s : canvas.w;

  return (
    <View
      onLayout={onLayout}
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: padL,
        paddingRight: padR,
      }}
    >
      {s > 0 && (
        <View style={{ width: logicalW, height: canvas.h, transform: [{ scale: s }] }}>
          <SafeAreaInsetsContext.Provider value={ZERO_INSETS}>{children}</SafeAreaInsetsContext.Provider>
        </View>
      )}
    </View>
  );
}
