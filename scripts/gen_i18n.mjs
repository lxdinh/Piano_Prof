// Generates src/i18n/strings.generated.ts from the design prototype's
// app/i18n.jsx (the authoritative 10-language dictionary). The prototype file
// is plain data + Object.assign(window, ...) — no JSX — so we evaluate it in a
// vm sandbox with a `window` shim and read the populated dictionaries.
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'app', 'i18n.jsx'), 'utf8');

const win = {};
vm.runInNewContext(src, { window: win, console });

const PP_I18N = win.PP_I18N ?? {};
const PP_ITEM_I18N = win.PP_ITEM_I18N ?? {};

const header = `// AUTO-GENERATED from app/i18n.jsx by scripts/gen_i18n.mjs — do not edit by hand.
// Run: node scripts/gen_i18n.mjs
/* eslint-disable */
export type Dict = Record<string, string>;
`;

const body =
  `export const PP_I18N: Record<string, Dict> = ${JSON.stringify(PP_I18N, null, 0)};\n\n` +
  `export const PP_ITEM_I18N: Record<string, { title?: Dict; sub?: Dict }> = ${JSON.stringify(PP_ITEM_I18N, null, 0)};\n`;

writeFileSync(join(root, 'src', 'i18n', 'strings.generated.ts'), header + '\n' + body);

console.log(`Generated: PP_I18N ${Object.keys(PP_I18N).length} keys, PP_ITEM_I18N ${Object.keys(PP_ITEM_I18N).length} items`);
