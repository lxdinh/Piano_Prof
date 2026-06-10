#!/usr/bin/env node
/**
 * check-shell-imports.mjs — import-boundary + asset-path gate.
 *
 * Enforces the swappable-UI architecture (see docs/DESIGN_ADOPTION_PLAYBOOK.md):
 *
 *   1. Shell files (src/ui/shells/<v>/**) may import, relatively, ONLY:
 *        - other files inside the SAME shell
 *        - src/core/contract (the single core surface)
 *        - bundled assets (assets/**)
 *      They may NOT reach into core internals, other shells, or the switch
 *      (src/ui/activeShell) — that's what keeps a design swap one-line safe.
 *
 *   2. Core files (everything in src/ outside src/ui/) may NOT import from
 *      src/ui/** — core must never know which design is shipping.
 *      (App.tsx is the one composition point: it may import src/ui/activeShell.)
 *
 *   3. Every require('...<asset ext>') must resolve to a file that exists.
 *      TypeScript does not validate asset require paths and Jest stubs them
 *      by pattern — without this check a bad path only explodes in Metro at
 *      runtime.
 *
 * Test infrastructure (src/ui/testing/** and __tests__ folders) is exempt
 * from rule 1 (tests may wire shells + core together) but still asset-checked.
 *
 * Zero dependencies. Run: node scripts/check-shell-imports.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const CONTRACT = path.join(SRC, 'core', 'contract');
const SHELLS_DIR = path.join(SRC, 'ui', 'shells');
const ASSET_EXT = /\.(png|jpe?g|gif|webp|svg|wav|mp3|m4a|ttf|otf|json)$/i;

const violations = [];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

const files = [...walk(SRC), path.join(ROOT, 'App.tsx'), path.join(ROOT, 'index.js')];

// import x from '...' | export ... from '...' | require('...') | import('...')
const SPEC_RE = /(?:from\s*|require\s*\(\s*|import\s*\(\s*)['"]([^'"]+)['"]/g;

function shellOf(file) {
  if (!file.startsWith(SHELLS_DIR + path.sep)) return null;
  return file.slice(SHELLS_DIR.length + 1).split(path.sep)[0]; // e.g. 'v2'
}

function isTestInfra(file) {
  return (
    file.includes(`${path.sep}__tests__${path.sep}`) ||
    /\.test\.(ts|tsx|js|jsx)$/.test(file) ||
    file.startsWith(path.join(SRC, 'ui', 'testing') + path.sep)
  );
}

// Strip comments so example snippets in docs/comments aren't treated as
// imports (full-line // comments and /* */ blocks; inline trailing comments
// with require() examples are rare enough to ignore).
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
             .replace(/^([ \t]*)\/\/.*$/gm, '$1');
}

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const text = stripComments(fs.readFileSync(file, 'utf8'));
  const rel = path.relative(ROOT, file);
  const myShell = shellOf(file);

  for (const m of text.matchAll(SPEC_RE)) {
    const spec = m[1];
    const line = text.slice(0, m.index).split('\n').length;
    if (!spec.startsWith('.')) continue; // bare package imports are fine

    const resolvedNoExt = path.resolve(path.dirname(file), spec);

    // Rule 3 — asset requires must exist on disk.
    if (ASSET_EXT.test(spec)) {
      if (!fs.existsSync(resolvedNoExt)) {
        violations.push(`${rel}:${line}  asset does not exist: '${spec}'`);
      }
      continue;
    }

    const inUi = resolvedNoExt.startsWith(path.join(SRC, 'ui') + path.sep);
    const targetShell =
      resolvedNoExt.startsWith(SHELLS_DIR + path.sep)
        ? resolvedNoExt.slice(SHELLS_DIR.length + 1).split(path.sep)[0]
        : null;

    if (myShell && !isTestInfra(file)) {
      // Rule 1 — shell purity.
      const isContract = resolvedNoExt === CONTRACT;
      const isIntraShell = targetShell === myShell;
      const isAsset = resolvedNoExt.startsWith(path.join(ROOT, 'assets') + path.sep);
      if (!isContract && !isIntraShell && !isAsset) {
        violations.push(
          `${rel}:${line}  shell '${myShell}' imports outside its boundary: '${spec}'\n` +
          `    shells may import only intra-shell files, src/core/contract, or assets/`,
        );
      }
    } else if (
      !myShell &&
      file.startsWith(SRC + path.sep) &&
      !file.startsWith(path.join(SRC, 'ui') + path.sep) && // the UI layer itself (switch, testing) is not core
      !isTestInfra(file)
    ) {
      // Rule 2 — core must not import UI.
      if (inUi) {
        violations.push(`${rel}:${line}  core imports from src/ui: '${spec}' (core must never know the design)`);
      }
    } else if (path.basename(file) === 'App.tsx' && inUi) {
      // App.tsx may import only the switch from src/ui.
      const isSwitch = resolvedNoExt === path.join(SRC, 'ui', 'activeShell');
      if (!isSwitch) {
        violations.push(`${rel}:${line}  App.tsx may import only src/ui/activeShell from the UI layer: '${spec}'`);
      }
    }
  }
}

if (violations.length) {
  console.error(`check-shell-imports: ${violations.length} violation(s)\n`);
  for (const v of violations) console.error('  ' + v + '\n');
  process.exit(1);
}
console.log(`check-shell-imports: OK — ${files.length} files clean`);
