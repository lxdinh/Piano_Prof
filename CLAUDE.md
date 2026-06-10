# Rules for coding agents in this repo

Read `docs/DESIGN_ADOPTION_PLAYBOOK.md` before touching anything visual.
Read `docs/UI_MASTER_PLAN.md` for what each screen is supposed to be.

## The architecture (do not fight it)

- **Design drops** from claude.ai/design live in `designs/<version>/`.
  They are the 100% authoritative spec for how the app looks. They are
  reference only — never import them from app code.
- **UI shells** live in `src/ui/shells/<version>/` (screens, components,
  navigation, theme). One shell per design version. Shells are rebuilt from
  the design spec, not evolved from the previous design.
- **The switch** is `src/ui/activeShell.ts` — a static re-export (Metro
  cannot dynamic-require). Flipping the shipped design is a one-line change
  there. The global ReactNavigation typing lives in that file on purpose;
  never re-declare it inside a shell.
- **Core logic** (lessons, audio, gamification, BLE, services, storage) is
  everything in `src/` outside `src/ui/`. It must never know which design is
  shipping.

## Hard rules

1. Shell files import core **only** via `src/core/contract.ts`. Never reach
   into `src/lessons/…`, `src/ble/…`, etc. from a shell. Need something new?
   Export it from the contract (additive is safe).
2. Never import `src/ui/**` from core. `App.tsx` may import only
   `src/ui/activeShell`.
3. Never put business logic or persistent state in a shell — shells render
   and call contract hooks.
4. The design dictates the look 100%; **features adapt to the design**. If a
   design needs logic that doesn't exist, build it in core first (with unit
   tests), expose it via the contract, then build the UI.
5. `src/ui/shells/<v>/theme/tokens.generated.ts` is generated — never edit
   it. Palette changes come from the design CSS via `npm run tokens`.
6. Every screen file in a shell must have an entry in that shell's
   `__tests__/smoke.registry.ts` (a completeness test enforces this).
7. `npm run verify` must pass before any work is called done. It gates the
   EAS APK build in CI too.
8. Update `docs/UI_MASTER_PLAN.md` statuses whenever screens are
   added/ported/changed.

## Useful commands

- `npm run verify` — typecheck + import boundaries + token drift + all tests
- `npm run tokens` — re-sync palette from the current design's CSS
- `npm run voice` — pre-generate instructor voice clips (docs/SERVICES_SETUP.md)
- `npm test` / `npx jest --selectProjects ui` — all tests / UI smoke only
- APK: push to `main` → `.github/workflows/build-eas.yml` runs verify, then
  EAS builds; install link lands in `.build-info/last-build-url.txt`
