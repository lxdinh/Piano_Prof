#!/usr/bin/env node
/**
 * extract-tokens.mjs — design-token sync pipeline.
 *
 * Parses the `:root { --var: value; }` blocks of a design drop's CSS
 * (designs/<version>/project/pp-styles.css) and emits a deterministic
 * TypeScript module the active UI shell imports its palette from.
 * The design CSS is the source of truth; the generated file is a faithful,
 * diffable mirror of it — never edit it by hand.
 *
 * Usage:
 *   node scripts/extract-tokens.mjs --css <styles.css> --out <tokens.generated.ts>
 *   node scripts/extract-tokens.mjs --css <styles.css> --out <tokens.generated.ts> --check
 *
 * --check regenerates in memory and fails (exit 1) if the committed file
 * differs — wired into `npm run verify` so a new design drop can't be
 * half-adopted silently.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1];
}

const cssPath = arg('--css');
const outPath = arg('--out');
const checkMode = process.argv.includes('--check');

if (!cssPath || !outPath) {
  console.error('Usage: extract-tokens.mjs --css <styles.css> --out <tokens.generated.ts> [--check]');
  process.exit(2);
}
if (!fs.existsSync(cssPath)) {
  console.error(`extract-tokens: CSS source not found: ${cssPath}`);
  process.exit(2);
}

const css = fs.readFileSync(cssPath, 'utf8');

// Collect every `:root { ... }` block (a drop may declare several).
const rootBlocks = [];
const rootRe = /:root\s*\{([^}]*)\}/g;
for (let m; (m = rootRe.exec(css)); ) rootBlocks.push(m[1]);

if (rootBlocks.length === 0) {
  console.error(`extract-tokens: no :root blocks found in ${cssPath}`);
  process.exit(1);
}

// Parse custom properties. Source order preserved; later duplicates win
// (CSS cascade semantics).
const vars = new Map();
const varRe = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
for (const block of rootBlocks) {
  for (let m; (m = varRe.exec(block)); ) {
    const name = `--${m[1]}`;
    const value = m[2].trim().replace(/\s+/g, ' ');
    if (vars.has(name)) vars.delete(name); // re-insert to keep last-write order
    vars.set(name, value);
  }
}

// Dumb mechanical kebab→camel ('--butter-d' → 'butterD'). Ergonomic aliases
// belong in the hand-written tokens overlay, not here — this file must stay
// a faithful mirror of the drop.
const camel = (cssVar) =>
  cssVar
    .replace(/^--/, '')
    .replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

const entries = [...vars.entries()];
const hash = crypto
  .createHash('sha256')
  .update(JSON.stringify(entries))
  .digest('hex')
  .slice(0, 12);

const relCss = path.relative(process.cwd(), cssPath).split(path.sep).join('/');

const lines = [];
lines.push(`// AUTO-GENERATED from ${relCss} — DO NOT EDIT.`);
lines.push('// Regenerate: npm run tokens     Drift check: npm run tokens -- --check');
lines.push(`// Token hash: ${hash} (changes only when the design's :root vars change)`);
lines.push('');
lines.push('/** Raw CSS custom properties, exactly as the design drop declares them. */');
lines.push('export const CssVars = {');
for (const [k, v] of entries) lines.push(`  '${k}': '${v}',`);
lines.push('} as const;');
lines.push('');
lines.push('/** Same values keyed by mechanical kebab→camelCase names. */');
lines.push('export const CssColors = {');
for (const [k, v] of entries) lines.push(`  ${camel(k)}: '${v}',`);
lines.push('} as const;');
lines.push('');
const output = lines.join('\n');

if (checkMode) {
  const committed = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : null;
  if (committed !== output) {
    console.error(`extract-tokens: DRIFT — ${outPath} does not match ${relCss}.`);
    console.error('A design drop changed the palette (or the generated file was hand-edited).');
    console.error('Run `npm run tokens`, review the diff, and commit it with the adoption.');
    process.exit(1);
  }
  console.log(`extract-tokens: OK — ${outPath} matches ${relCss} (${entries.length} vars, ${hash})`);
} else {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, output);
  console.log(`extract-tokens: wrote ${outPath} (${entries.length} vars from ${relCss}, ${hash})`);
}
