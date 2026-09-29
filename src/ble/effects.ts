// Piano Professor — LED animations, driven from the app.
//
// The old protocol assumed a firmware-side pattern engine (RUN_PATTERN with
// rainbow/breathing/sparkle/…). The real firmware has no such thing: it takes
// per-LED colours and draws them immediately. So the animations live here,
// as short bursts of frames rather than a persistent render loop — these are
// celebrations, not a game engine, and the radio is the scarce resource.

import { cmdClearAll, cmdSetMultiChunked } from './protocol';

type RGB = [number, number, number];

export interface EffectContext {
  send: (bytes: Uint8Array) => Promise<void>;
  ledCount: number;
  /** Negotiated ATT MTU — decides how many LEDs fit in one write. */
  mtu: number;
  /** Polled between frames so a disconnect or a new effect stops this one. */
  cancelled?: () => boolean;
}

export type EffectName = 'rainbow' | 'successBurst' | 'static' | 'breathing' | 'off';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function paint(ctx: EffectContext, colors: RGB[]): Promise<void> {
  const entries = colors.map((rgb, index) => ({ index, rgb }));
  for (const frame of cmdSetMultiChunked(entries, ctx.mtu)) {
    if (ctx.cancelled?.()) return;
    await ctx.send(frame);
  }
}

/** HSV→RGB with h in [0,1). Cheap enough to run per-LED per-frame. */
function hsv(h: number, s: number, v: number): RGB {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const [r, g, b] = [
    [v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q],
  ][i % 6];
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/** Celebration sweep. Runs for `durationMs` then clears. */
export async function playRainbow(ctx: EffectContext, durationMs = 1400): Promise<void> {
  const frameMs = 60;
  const frames = Math.max(1, Math.round(durationMs / frameMs));
  for (let f = 0; f < frames; f++) {
    if (ctx.cancelled?.()) return;
    const phase = f / frames;
    const colors: RGB[] = [];
    for (let i = 0; i < ctx.ledCount; i++) {
      colors.push(hsv(((i / ctx.ledCount) + phase) % 1, 1, 0.6));
    }
    await paint(ctx, colors);
    await sleep(frameMs);
  }
  await ctx.send(cmdClearAll());
}

/** Quick green flash + fade — the "correct note" reward. */
export async function playSuccessBurst(ctx: EffectContext): Promise<void> {
  const steps = 5;
  for (let s = 0; s < steps; s++) {
    if (ctx.cancelled?.()) return;
    const k = 1 - s / steps;
    const rgb: RGB = [Math.round(0x58 * k), Math.round(0xcc * k), Math.round(0x02 * k)];
    await paint(ctx, new Array(ctx.ledCount).fill(rgb));
    await sleep(45);
  }
  await ctx.send(cmdClearAll());
}

/** Solid colour across the strip. */
export async function playStatic(ctx: EffectContext, rgb: RGB): Promise<void> {
  await paint(ctx, new Array(ctx.ledCount).fill(rgb));
}

/** Slow pulse of one colour, `cycles` times. */
export async function playBreathing(
  ctx: EffectContext,
  rgb: RGB,
  cycles = 2,
): Promise<void> {
  const perCycle = 16;
  for (let c = 0; c < cycles; c++) {
    for (let i = 0; i < perCycle; i++) {
      if (ctx.cancelled?.()) return;
      const k = (Math.sin((i / perCycle) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      await paint(
        ctx,
        new Array(ctx.ledCount).fill([
          Math.round(rgb[0] * k), Math.round(rgb[1] * k), Math.round(rgb[2] * k),
        ] as RGB),
      );
      await sleep(60);
    }
  }
  await ctx.send(cmdClearAll());
}

export async function runEffectByName(
  name: EffectName,
  ctx: EffectContext,
  rgb: RGB = [0x58, 0xcc, 0x02],
): Promise<void> {
  switch (name) {
    case 'rainbow':      return playRainbow(ctx);
    case 'successBurst': return playSuccessBurst(ctx);
    case 'static':       return playStatic(ctx, rgb);
    case 'breathing':    return playBreathing(ctx, rgb);
    case 'off':          { await ctx.send(cmdClearAll()); return; }
  }
}
