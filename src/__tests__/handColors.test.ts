import { fingerColor, handColor, targetColor, scaleRgb, rgbCss } from '../theme/handColors';

describe('hand/finger colours', () => {
  it('right hand is warm, left hand is cool (opposite temperatures)', () => {
    const [rr, , rb] = handColor('R');
    const [lr, , lb] = handColor('L');
    expect(rr).toBeGreaterThan(rb); // warm: red channel dominates
    expect(lb).toBeGreaterThan(lr); // cool: blue channel dominates
  });

  it('each finger has a distinct, constant hue per hand', () => {
    const right = ([1, 2, 3, 4, 5] as const).map((f) => rgbCss(fingerColor('R', f)));
    expect(new Set(right).size).toBe(5); // all different
    expect(fingerColor('R', 1)).toEqual(fingerColor('R', 1)); // stable
    // thumbs differ between hands (warm vs cool)
    expect(fingerColor('R', 1)).not.toEqual(fingerColor('L', 1));
  });

  it('targetColor falls back finger → hand → brand green', () => {
    expect(targetColor('R', 2)).toEqual(fingerColor('R', 2));
    expect(targetColor('L')).toEqual(handColor('L'));
    expect(targetColor()).toEqual([88, 204, 2]);
  });

  it('scaleRgb maps a dynamic factor to brightness', () => {
    expect(scaleRgb([200, 100, 50], 0.5)).toEqual([100, 50, 25]);
    expect(scaleRgb([200, 100, 50], 0)).toEqual([0, 0, 0]);
    expect(scaleRgb([200, 100, 50], 2)).toEqual([200, 100, 50]); // clamped to 1
  });
});
