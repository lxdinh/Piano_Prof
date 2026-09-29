// Piano Professor — the one way a popup looks.
//
// The lesson-start popup read as a full-height white slab with hard vertical
// edges. Its corners WERE rounded (radius 26) — the card was simply taller than
// the 394dp phone canvas, so the rounded top and bottom were pushed off-screen
// and only the straight sides remained visible, touching both edges.
//
// So the fix is not a bigger radius on its own: a popup has to be unable to
// outgrow the stage. This caps height against the canvas, keeps a margin all
// round so the corners are always visible, and scrolls internally when the
// content is genuinely too tall for a short landscape phone.
import React from 'react';
import { View, ScrollView, Pressable, ViewStyle, StyleProp } from 'react-native';

import { useAppTheme } from '../theme/AppTheme';
import { useStage } from '../theme/responsive';

/** Breathing room between the card and the screen edge, in canvas units. */
const MARGIN = 20;

export default function PopupCard({
  children, width = 520, onDismiss, contentStyle,
}: {
  children: React.ReactNode;
  /** Preferred card width; always shrinks to fit the stage. */
  width?: number;
  /** Tapping the dimmed backdrop closes the popup. Omit to make it modal. */
  onDismiss?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  const { canvas, isTablet } = useStage();

  // The card can never be taller than the stage minus its margins, which is
  // what guarantees the rounded corners stay on screen.
  const maxH = canvas.h - MARGIN * 2;
  // Generous and consistent: the popup should read as a soft card, not a panel
  // wedged into the screen.
  const radius = isTablet ? 34 : 28;

  return (
    <View
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center', justifyContent: 'center', padding: MARGIN,
      }}
    >
      {/* Backdrop is its own layer so a tap outside the card can close it
          without the card's own taps bubbling through. */}
      <Pressable
        onPress={onDismiss}
        disabled={!onDismiss}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(20,16,10,0.55)',
        }}
      />
      {/* Two layers on purpose. iOS clips a shadow to the view's own bounds, so
          a view that is BOTH `overflow: hidden` and shadowed renders no shadow
          at all. The outer layer casts, the inner layer clips. */}
      <View
        style={{
          width, maxWidth: '100%', maxHeight: maxH,
          borderRadius: radius,
          shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 }, elevation: 12,
        }}
      >
        <View
          style={{
            borderRadius: radius,
            backgroundColor: colors.surface,
            borderWidth: 2, borderColor: colors.line,
            // Clip the scrolling content to the rounded corners — without this
            // the content squares them off again at top and bottom.
            overflow: 'hidden',
          }}
        >
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              // flexGrow so short content still centres instead of hugging the top.
              { flexGrow: 1, padding: 22, alignItems: 'center', justifyContent: 'center', gap: 8 },
              contentStyle,
            ]}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
