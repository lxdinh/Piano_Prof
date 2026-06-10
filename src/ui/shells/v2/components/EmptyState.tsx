import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing } from '../theme/tokens';
import MascotImage, { MascotMood } from './MascotImage';
import ChunkyButton, { ChunkyButtonVariant } from './ChunkyButton';

interface Props {
  mood?: MascotMood;
  title: string;
  body?: string;
  cta?: { label: string; onPress: () => void; variant?: ChunkyButtonVariant };
}

// A consistent "nothing here yet" panel. Mascot + headline + soft body +
// a single chunky CTA. Used by Songbook (no imports yet), Profile (no
// achievements), and any future empty list.
export default function EmptyState({ mood = 'sleepy', title, body, cta }: Props) {
  return (
    <View style={styles.wrap}>
      <MascotImage mood={mood} size={130} static />
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {cta ? (
        <View style={styles.ctaWrap}>
          <ChunkyButton label={cta.label} onPress={cta.onPress} variant={cta.variant ?? 'primary'} fullWidth />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.md, padding: Spacing.xl },
  title: { fontSize: Fonts.xl, fontWeight: Fonts.weight.black, color: Colors.ink900, textAlign: 'center' },
  body: { fontSize: Fonts.base, color: Colors.ink500, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.md },
  ctaWrap: { width: '100%', maxWidth: 320, marginTop: Spacing.sm },
});
