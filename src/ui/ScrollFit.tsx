// Piano Professor — scroll-safe screen body. Centers content when it fits the
// viewport and scrolls when it doesn't, so nothing ever clips on short/small
// landscape devices. Drop-in replacement for a `<View flex:1 center>` body.
import React from 'react';
import { ScrollView, ViewStyle, StyleProp } from 'react-native';

export default function ScrollFit({
  children, center = true, pad = 24, style,
}: {
  children: React.ReactNode;
  center?: boolean;
  pad?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        { flexGrow: 1, padding: pad, alignItems: 'center', justifyContent: center ? 'center' : 'flex-start' },
        style,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
