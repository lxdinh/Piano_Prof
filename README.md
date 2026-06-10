# Piano Professor

Duolingo-style piano learning app (React Native + Expo) that pairs with custom
BLE LED hardware mounted above real piano keys. See `PROJECT_PLAN.md` for the
full product/hardware master plan.

## How this repo works — designs are drops, the UI is a shell

The app's look is redesigned in [claude.ai/design](https://claude.ai/design)
(a new full design every month, iteration drops weekly). **The design drop is
the 100% authoritative spec for how the app looks.** The codebase is built so
adopting a new design is a repeatable, gated procedure instead of a rewrite:

| Piece | Where | Rule |
|---|---|---|
| Design drops (HTML/JSX/CSS from claude.ai/design) | `designs/<version>/` | reference only — never bundled into the app |
| UI shells (one per design version) | `src/ui/shells/<version>/` | all screens/components/navigation/theme; rebuilt per design |
| The switch | `src/ui/activeShell.ts` | one line decides which design ships; flip = instant swap/rollback |
| Core logic (lessons, audio, gamification, BLE, storage) | `src/*` (everything outside `src/ui/`) | never changes for a redesign; shells import it **only** via `src/core/contract.ts` |
| The procedure | `docs/DESIGN_ADOPTION_PLAYBOOK.md` | weekly/monthly adoption steps + rollback |
| The spec inventory | `docs/UI_MASTER_PLAN.md` | every designed screen, its intent, and its implementation status |

## Run it

```bash
npm install
npm run verify     # typecheck + import-boundary check + token drift + all tests
npm start          # Expo dev server (npm run android / ios / web)
```

## Ship it

Push to `main` → `.github/workflows/build-eas.yml` runs `verify`, then submits
an EAS Android build. The APK install link lands in
`.build-info/last-build-url.txt`.

## Repo map

- `src/` — the app (core logic + `src/ui/shells/`)
- `designs/` — design drops from claude.ai/design, one folder per version
- `docs/` — architecture, master plan, adoption playbook
- `hardware/` — KiCad: ESP32-S3 controller + WS2812B octave LED strips
- `assets/` — mascots, piano samples, icons
- `legacy/` — retired Flutter/web/Kotlin apps (reference only)
- `CLAUDE.md` — rules coding agents must follow in this repo
