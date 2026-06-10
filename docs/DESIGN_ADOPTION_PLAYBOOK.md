# Design Adoption Playbook — new design in, APK out, no bugs

How a claude.ai/design drop (weekly iteration or monthly full redesign)
becomes the shipping app. Follow it every time; the gates do the worrying.

## Why this works (how the big apps survive redesigns)

Duolingo-class apps re-skin constantly without breaking because of four
disciplines, all of which this repo now enforces mechanically:

1. **Logic never lives in UI code.** Lessons, audio, hearts/XP, BLE and
   storage sit behind one frozen surface — `src/core/contract.ts`. A redesign
   can torch every pixel and cannot corrupt a streak. Enforced by
   `npm run check:imports`.
2. **Visual identity is data, not code.** The design CSS's `:root` palette is
   machine-synced into the shell (`npm run tokens`), never hand-copied. Drift
   fails the build.
3. **The new UI ships beside the old one.** Each design is a self-contained
   shell (`src/ui/shells/<version>/`); `src/ui/activeShell.ts` is the one-line
   switch. Swap and rollback are single commits.
4. **Automated gates run before anything reaches a phone.** `npm run verify`
   (typecheck + boundaries + token drift + unit tests + render-every-screen
   smoke tests) gates the EAS APK build in CI.

## The doctrine

- The design drop is the **100% authoritative spec** for how the app looks.
- Port = open the drop's `Screen*` JSX and rebuild it in React Native,
  top-to-bottom, against the synced tokens. Never "restyle the old screen to
  roughly match".
- **Features adapt to the design**, never the reverse. If the design shows a
  feature core doesn't have (e.g. daily quests), the core work happens first —
  new logic behind the contract — then the shell consumes it.
- Design drops are reference material: they live in `designs/` and are never
  imported by app code.

## Weekly drop (iteration on the current design version)

1. Unzip the drop **over** `designs/<current>/` (overwrite in place).
2. `git diff designs/` — this is the exact scope of what changed.
3. `npm run tokens` — palette changes land mechanically; review the
   `tokens.generated.ts` diff.
4. Port the changed screens/components in the active shell per the doctrine.
5. Update statuses in `docs/UI_MASTER_PLAN.md`.
6. `npm run verify` — must be green.
7. Quick device pass (Expo Go / dev build): boot, all tabs, open lesson
   `g1-l1`, pairing modal, settings.
8. Commit the drop and the port separately ("docs: weekly design drop" then
   the port). Merge/push to `main` → CI runs verify → EAS builds the APK →
   install link appears in `.build-info/last-build-url.txt`.

## Monthly drop (a brand-new design version, e.g. V3)

1. **Land the drop:** unzip to `designs/v3/{README.md,chats/,project/}`;
   commit raw.
2. **Extract the plan:** read `designs/v3/chats/*` (intent lives there) and
   the `DCSection` inventory in `designs/v3/project/app.jsx`. Add the V3
   section table + gap analysis to `docs/UI_MASTER_PLAN.md`.
3. **Core first:** for every new design feature that needs logic the core
   doesn't have, build it in core (with unit tests) and export it via
   `src/core/contract.ts` — before any UI work.
4. **Scaffold the shell:** copy `src/ui/shells/v2` → `src/ui/shells/v3` as a
   *wiring skeleton only* (navigation plumbing, contract hooks, smoke
   registry). Every screen's visuals are then rebuilt from the V3 JSX spec.
   The inactive v3 shell is typechecked and smoke-tested while you work, but
   is not bundled (it's outside the require graph) — v2 stays shippable the
   whole time.
5. **Sync V3 tokens:** point the `tokens` script at the V3 CSS, regenerate
   into the v3 shell's theme.
6. **Port screen-by-screen** in master-plan order; keep `npm run verify`
   green at every step; tick statuses as you go.
7. **Flip:** change `src/ui/shells/v2` → `v3` in `src/ui/activeShell.ts` and
   in the `tokens` npm script (one commit). Device QA per the checklist.
8. **Archive the old design:** `git mv src/ui/shells/v2 legacy/ui-shell-v2`
   (its smoke tests stop matching the ui project's testMatch once outside
   `src/ui/`, by design). Update the smoke registry path note in the master
   plan.

## Rollback

A bad flip is two reverts on `main`:

```bash
git revert <archive-commit> <flip-commit>
git push   # CI verify + EAS rebuild the previous design's APK
```

Until the archive commit, rollback is just reverting the flip commit.

## Gates (all enforced by `npm run verify`, which gates the EAS build in CI)

- `tsc --noEmit` clean
- `check:imports` clean — shells touch core only via the contract; core never
  imports UI; every asset `require()` resolves
- `tokens -- --check` clean — committed palette matches the design CSS
- all unit tests + every shell screen renders (smoke registry is
  completeness-checked against the screens/ folder)
