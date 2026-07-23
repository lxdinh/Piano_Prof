// Piano Professor — Splash / brand screen.
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../theme/AppTheme';
import { useRouter } from '../nav/Router';
import { Fonts } from '../theme/tokens';
import Maestro from '../ui/Maestro';
import PPButton from '../ui/PPButton';
import { t } from '../i18n';

export default function Splash() {
  const { colors, isDark } = useAppTheme();
  const { go } = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), 1100);
    return () => clearTimeout(id);
  }, []);

  return (
    <LinearGradient
      colors={isDark ? ['#16273F', '#0A1424'] : ['#FFFDF6', '#FFF3D6']}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 }}
    >
      <Maestro mood="conduct" size={180} bg={colors.surface} ring={6} ringColor="#fff" float />
      <Text style={{ fontFamily: Fonts.family.black, fontWeight: '900', fontSize: 40, color: colors.ink, marginTop: 14 }}>
        Piano Professor
      </Text>
      <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 18, color: colors.inkSoft }}>
        {t('splash.tagline')}
      </Text>
      <View style={{ height: 28 }} />
      {ready ? (
        <PPButton label={t('splash.play')} size="lg" variant="green" onPress={() => go('who')} />
      ) : (
        <Text style={{ fontFamily: Fonts.family.bold, fontWeight: '800', fontSize: 15, color: colors.inkFaint }}>
          {t('splash.tuning')}
        </Text>
      )}
    </LinearGradient>
  );
}
