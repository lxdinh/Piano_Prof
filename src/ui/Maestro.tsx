// Piano Professor — Maestro mascot (ds-core.jsx `Maestro` port).
// Static require map over assets/maestro/*.png (Metro bundles static requires).
import React, { useEffect, useRef } from 'react';
import { View, Image, Pressable, Animated, ImageSourcePropType, ViewStyle, StyleProp } from 'react-native';

const MOODS: Record<string, ImageSourcePropType> = {
  astronaut: require('../../assets/maestro/astronaut.png'),
  cheer: require('../../assets/maestro/cheer.png'),
  chef: require('../../assets/maestro/chef.png'),
  classical: require('../../assets/maestro/classical.png'),
  conduct: require('../../assets/maestro/conduct.png'),
  confused: require('../../assets/maestro/confused.png'),
  cool: require('../../assets/maestro/cool.png'),
  drummer: require('../../assets/maestro/drummer.png'),
  epiphany: require('../../assets/maestro/epiphany.png'),
  exhausted: require('../../assets/maestro/exhausted.png'),
  futurist: require('../../assets/maestro/futurist.png'),
  idea: require('../../assets/maestro/idea.png'),
  love: require('../../assets/maestro/love.png'),
  magician: require('../../assets/maestro/magician.png'),
  nature: require('../../assets/maestro/nature.png'),
  nervous: require('../../assets/maestro/nervous.png'),
  painter: require('../../assets/maestro/painter.png'),
  rebel: require('../../assets/maestro/rebel.png'),
  sad: require('../../assets/maestro/sad.png'),
  showman: require('../../assets/maestro/showman.png'),
  sob: require('../../assets/maestro/sob.png'),
  star: require('../../assets/maestro/star.png'),
  swoon: require('../../assets/maestro/swoon.png'),
  teach: require('../../assets/maestro/teach.png'),
  tired: require('../../assets/maestro/tired.png'),
  trophy: require('../../assets/maestro/trophy.png'),
  violin: require('../../assets/maestro/violin.png'),
  'welcome-piano': require('../../assets/maestro/welcome-piano.png'),
  wow: require('../../assets/maestro/wow.png'),
  zen: require('../../assets/maestro/zen.png'),
};

export function maestroSource(mood: string): ImageSourcePropType {
  return MOODS[mood] ?? MOODS.cool;
}

interface Props {
  mood?: string;
  size?: number;
  ring?: number;
  ringColor?: string;
  bg?: string;
  float?: boolean;
  fit?: 'head' | 'body';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function Maestro({
  mood = 'cool', size = 96, ring, ringColor = '#F5B800', bg = '#FFFAEC',
  float, fit = 'body', onPress, style,
}: Props) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!float) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -8, duration: 1600, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float, y]);

  const inner = (
    <Animated.View
      style={[{
        width: size, height: size, borderRadius: size / 2, backgroundColor: bg,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        transform: [{ translateY: y }],
      }, ring ? { borderWidth: ring, borderColor: ringColor } : null, style]}
    >
      <Image
        source={maestroSource(mood)}
        style={fit === 'head'
          ? { width: size * 1.18, height: size * 1.18 }
          : { width: size, height: size }}
        resizeMode={fit === 'head' ? 'cover' : 'contain'}
      />
    </Animated.View>
  );

  if (onPress) return <Pressable onPress={onPress}>{inner}</Pressable>;
  return inner;
}
