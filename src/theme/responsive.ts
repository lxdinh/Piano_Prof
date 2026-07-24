// Piano Professor — device-responsive sizing. The app is landscape-locked, so
// only device *size* varies (not orientation). This adapts centered content
// width and exposes tablet/compact flags so screens fit every device.
import { useWindowDimensions } from 'react-native';

const BASE_LONG = 820;  // reference landscape width the UI was designed at
const BASE_SHORT = 390; // reference landscape height

export interface Responsive {
  w: number;
  h: number;
  scale: number;            // clamped size multiplier
  isTablet: boolean;
  isCompact: boolean;       // short landscape phones
  /** Clamp a designed card width so it never overflows a narrow screen and
      grows a little on tablets. */
  contentWidth: (design: number) => number;
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const longest = Math.max(width, height);
  const shortest = Math.min(width, height);
  const scale = Math.max(0.9, Math.min(1.4, Math.min(longest / BASE_LONG, shortest / BASE_SHORT)));
  return {
    w: width,
    h: height,
    scale,
    isTablet: shortest >= 600,
    isCompact: shortest < 350,
    contentWidth: (design) => Math.min(Math.round(design * scale), Math.round(width - 32)),
  };
}
