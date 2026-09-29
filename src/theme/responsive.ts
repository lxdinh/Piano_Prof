// Piano Professor — stage/canvas resolver. The app is landscape-locked and
// rendered into a fixed logical *canvas* that <Stage> scales to fit the device
// (see src/ui/FitBox.tsx). Phones use a compact canvas, tablets/desktop a
// roomier one, so a big screen gives more room at the same text size rather
// than a zoomed-in phone layout. Both match the uploaded prototype mockups.
import { useWindowDimensions } from 'react-native';

/** Compact phone canvas — matches the prototype's 852×394 landscape mockup. */
export const PHONE_CANVAS = { w: 852, h: 394 };
/** Roomy tablet/desktop canvas — matches the prototype's 1280×800 mockup. */
export const TABLET_CANVAS = { w: 1280, h: 800 };

export interface Stage {
  canvas: { w: number; h: number };
  isTablet: boolean;
  isDesktop: boolean;
  /** Cap FitBox upscaling so text stays crisp on very large screens. */
  maxScale: number;
}

export function useStage(): Stage {
  const { width, height } = useWindowDimensions();
  const shortest = Math.min(width, height);
  const longest = Math.max(width, height);
  const isTablet = shortest >= 600; // ≥600dp shortest side ⇒ tablet-class device
  const isDesktop = longest >= 1400; // large windows / web / desktop
  const canvas = isTablet || isDesktop ? TABLET_CANVAS : PHONE_CANVAS;
  return { canvas, isTablet, isDesktop, maxScale: isDesktop ? 2 : 3 };
}
