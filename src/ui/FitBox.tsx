// Piano Professor — scale-to-fit stage (RN analog of the prototype's
// `transform: scale(min(w/W, h/H))`). Renders children at a fixed *design* size
// and uniformly scales the whole subtree to fit the measured area, centered,
// with overflow clipped. Nothing reflows or clips; scroll views inside scroll
// within the design canvas. Used app-wide by <Stage> and per-region (e.g. the
// Circle of Fifths) for content that must never scroll.
import React, { useState } from 'react';
import { View, LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';

export interface FitDesign {
  w: number;
  h: number;
}

export default function FitBox({
  design,
  maxScale = Infinity,
  style,
  children,
}: {
  design: FitDesign;
  /** Cap upscaling so text stays crisp on very large screens. */
  maxScale?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== box.w || height !== box.h) setBox({ w: width, h: height });
  };

  // contain-fit: the largest scale that keeps the whole design inside the box.
  const s = box.w > 0 && box.h > 0 ? Math.min(box.w / design.w, box.h / design.h, maxScale) : 0;

  return (
    <View
      onLayout={onLayout}
      style={[{ flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}
    >
      {s > 0 && (
        // RN scales around the view centre by default, and the design box is
        // flex-centred here, so scaling keeps it centred and fits it exactly.
        <View style={{ width: design.w, height: design.h, transform: [{ scale: s }] }}>{children}</View>
      )}
    </View>
  );
}
