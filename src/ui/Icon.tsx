// Piano Professor — icon set (react-native-svg port of ds-core.jsx `Icon`).
import React from 'react';
import Svg, { Path, Line, Polyline, Circle, Rect, G, Ellipse } from 'react-native-svg';

export type IconName =
  | 'chevronRight' | 'chevronLeft' | 'chevronDown' | 'close' | 'check' | 'plus'
  | 'lock' | 'play' | 'pause' | 'gear' | 'bluetooth' | 'home' | 'library'
  | 'piano' | 'user' | 'star' | 'starline' | 'flame' | 'bolt' | 'gem' | 'heart'
  | 'mic' | 'bell' | 'moon' | 'shield' | 'sound' | 'mute' | 'crown' | 'sparkle'
  | 'wifi' | 'arrowRight' | 'refresh' | 'target' | 'music' | 'book'
  | 'headphones' | 'grad' | 'gridShelf' | 'camera' | 'image' | 'swap' | 'pencil';

interface Props { name: IconName; size?: number; color?: string; }

export default function Icon({ name, size = 24, color = '#2D2A26' }: Props) {
  const s = { stroke: color, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const f = { fill: color };
  const body = (() => {
    switch (name) {
      case 'chevronRight': return <Polyline points="9 6 15 12 9 18" {...s} />;
      case 'chevronLeft': return <Polyline points="15 6 9 12 15 18" {...s} />;
      case 'chevronDown': return <Polyline points="6 9 12 15 18 9" {...s} />;
      case 'close': return <G {...s}><Line x1="6" y1="6" x2="18" y2="18" /><Line x1="18" y1="6" x2="6" y2="18" /></G>;
      case 'check': return <Polyline points="4 12 10 18 20 6" {...s} />;
      case 'plus': return <G {...s}><Line x1="12" y1="5" x2="12" y2="19" /><Line x1="5" y1="12" x2="19" y2="12" /></G>;
      case 'lock': return <G {...s}><Rect x="5" y="11" width="14" height="9" rx="2" /><Path d="M8 11V8a4 4 0 0 1 8 0v3" /></G>;
      case 'play': return <Path d="M7 5l12 7-12 7z" {...f} />;
      case 'pause': return <G {...f}><Rect x="6" y="5" width="4" height="14" rx="1.2" /><Rect x="14" y="5" width="4" height="14" rx="1.2" /></G>;
      case 'gear': return <G {...s}><Circle cx="12" cy="12" r="3.2" /><Path d="M12 3v2.5M12 18.5V21M21 12h-2.5M5.5 12H3M18 6l-1.8 1.8M7.8 16.2 6 18M18 18l-1.8-1.8M7.8 7.8 6 6" /></G>;
      case 'bluetooth': return <Path d="M7 7l10 10-5 4V3l5 4L7 17" {...s} />;
      case 'gridShelf': return <G {...s}><Rect x="3" y="4" width="7" height="7" rx="1.6" /><Rect x="14" y="4" width="7" height="7" rx="1.6" /><Rect x="3" y="14" width="7" height="7" rx="1.6" /><Rect x="14" y="14" width="7" height="7" rx="1.6" /></G>;
      case 'home': return <Path d="M4 11l8-7 8 7M6 10v9h12v-9" {...s} />;
      case 'library': return <G {...s}><Path d="M5 4v16M9 4v16" /><Rect x="13" y="4" width="6" height="16" rx="1.4" /></G>;
      case 'piano': return <G {...s}><Rect x="3" y="5" width="18" height="14" rx="2" /><Path d="M8 5v9M13 5v9M18 5v9M3 14h18" /></G>;
      case 'user': return <G {...s}><Circle cx="12" cy="8" r="4" /><Path d="M5 20c0-3.9 3.1-6 7-6s7 2.1 7 6" /></G>;
      case 'star': return <Path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17.8 6.1 20.3l1.3-6.2L2.7 9.5l6.3-.7z" {...f} />;
      case 'starline': return <Path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17.8 6.1 20.3l1.3-6.2L2.7 9.5l6.3-.7z" {...s} />;
      case 'flame': return <Path d="M12 3c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1.5-1-3-2-4 .4 2-1 3-1 3 .5-3-1-5-1-6zM12 21a5 5 0 0 1-5-5c0-2 1-3 2-4" {...s} />;
      case 'bolt': return <Path d="M13 2L4 14h7l-1 8 9-12h-7z" {...f} />;
      case 'gem': return <Path d="M6 3h12l3 6-9 12L3 9z M3 9h18 M9 3l-1 6 4 12 4-12-1-6" {...s} />;
      case 'heart': return <Path d="M12 21c-7-4.5-9-8-9-11.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 3.5C21 13 19 16.5 12 21z" {...f} />;
      case 'mic': return <G {...s}><Rect x="9" y="3" width="6" height="11" rx="3" /><Path d="M6 11a6 6 0 0 0 12 0M12 17v4" /></G>;
      case 'bell': return <Path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 21a2 2 0 0 0 4 0" {...s} />;
      case 'moon': return <Path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" {...f} />;
      case 'shield': return <Path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" {...s} />;
      case 'sound': return <G {...s}><Path d="M4 9v6h4l5 4V5L8 9z" /><Path d="M16 9a3 3 0 0 1 0 6M18.5 7a6 6 0 0 1 0 10" /></G>;
      case 'mute': return <G {...s}><Path d="M4 9v6h4l5 4V5L8 9z" /><Path d="M22 9l-5 6M17 9l5 6" /></G>;
      case 'crown': return <Path d="M3 17l2-9 4 5 3-7 3 7 4-5 2 9z M3 17h18v3H3z" {...s} />;
      case 'sparkle': return <Path d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8z" {...f} />;
      case 'wifi': return <Path d="M5 12a10 10 0 0 1 14 0M8 15.5a5 5 0 0 1 8 0M12 19h.01" {...s} />;
      case 'arrowRight': return <G {...s}><Line x1="4" y1="12" x2="19" y2="12" /><Polyline points="13 6 19 12 13 18" /></G>;
      case 'refresh': return <Path d="M20 11a8 8 0 1 0-1 5M20 5v6h-6" {...s} />;
      case 'target': return <G {...s}><Circle cx="12" cy="12" r="8" /><Circle cx="12" cy="12" r="4" /><Circle cx="12" cy="12" r="1" fill={color} /></G>;
      case 'music': return <G {...s}><Ellipse cx="8.5" cy="17.5" rx="3.6" ry="2.7" fill={color} stroke="none" /><Path d="M11.7 16.4V4.5c3.2.5 5.3 2.2 5.3 5.2" /></G>;
      case 'book': return <Path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM6 17h13" {...s} />;
      case 'headphones': return <Path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 1 4 0v3a2 2 0 0 1-4 0zM20 14a2 2 0 0 0-4 0v3a2 2 0 0 0 4 0z" {...s} />;
      case 'grad': return <Path d="M3 9l9-4 9 4-9 4zM7 11v5c0 1 2.5 2.5 5 2.5s5-1.5 5-2.5v-5" {...s} />;
      case 'camera': return <G {...s}><Path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><Circle cx="12" cy="13" r="3.4" /></G>;
      case 'image': return <G {...s}><Rect x="3" y="4" width="18" height="16" rx="2.4" /><Circle cx="8.5" cy="9.5" r="1.6" /><Path d="M21 16l-5-5L5 20" /></G>;
      case 'swap': return <Path d="M7 7h11l-3-3M17 17H6l3 3" {...s} />;
      case 'pencil': return <Path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" {...s} />;
      default: return null;
    }
  })();
  return <Svg width={size} height={size} viewBox="0 0 24 24">{body}</Svg>;
}
