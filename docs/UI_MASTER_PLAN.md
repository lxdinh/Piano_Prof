# UI Master Plan — the design's screen inventory & status

This is the living master plan extracted from the design canvas
(`designs/<version>/project/app.jsx` — each `DCSection` is a designed area of
the app, quoted below with its intent subtitle). **It is the port checklist:
every design adoption updates the status columns here.** The design is the
100% authoritative spec for how each screen looks; features adapt to serve it.

Statuses: `—` not started · `ported` rebuilt from the design spec ·
`smoke` covered by shell smoke tests · `qa` verified on a device.

## Designed sections (V2 canvas, designs/v2/project/app.jsx)

| # | Section (design title) | Design intent (subtitle, verbatim) | Screen(s) | v2 status |
|---|---|---|---|---|
| 01 | Onboarding & Welcome | "First-launch hero. Cat mascot front and center." | `OnboardingScreen` | ported · smoke |
| 02 | Lesson Path — two takes | "Variant A: notes on a treble staff. Variant B: piano keys laid vertically." | `LearnScreen` (variant in use); `PathScreen` (variant B, **unrouted orphan** — decide: route it or archive it) | partial · smoke |
| 03 | Inside a Lesson | "Mascot teaches, piano lights show, beat ticks. The 8-key magnified view sits above a slidable 88-key strip so the student can locate any key on a real piano." | `LessonScreen` | ported · smoke |
| 03b | Lesson · Landscape phones | "For students without a tablet: rotate the phone for an iPad-style split — cat + step on the left, full keyboard on the right." | `LessonScreen` + `useLandscapeWhileFocused` | ported · smoke |
| 04 | Lesson Complete | "Confetti, stars, stats, encore." | `LessonCompleteScreen` | ported · smoke |
| 05 | Daily Warm-up & Streak | "The 'show up daily' driver — quests + 30-day streak goal." | **GAP — no dedicated screen.** Needs a quests screen + a daily-quest engine in core (new contract exports) | — |
| 06 | Profile & Stats | "Player ID, streak calendar, badges, on-repeat songs." | `ProfileScreen` | ported · smoke |
| 07 | Songbook | "Real songs to play after the course. Featured + categories." | `SongbookScreen` | ported · smoke |
| 08 | LED Hardware — Pairing Flow | "Discover → Calibrate → Connected. This is the moment that sets Piano Professor apart from Duolingo." | `BLEPairingScreen` (+ `BLEPairingRoute`) | ported · smoke |
| 09 | Settings | "Account, LED hardware, sound, app preferences." | `SettingsScreen` | ported · smoke |
| 10 | iPad Landscape | "Tablet layout uses a sidebar + right rail to expose more density." | **GAP — tablet layout unimplemented** | — |
| 11 | Mini Design System | "Quick reference: colors, buttons, mascot moods, piano key." | `theme/tokens.ts` (+ generated palette) · `ChunkyButton` · `PpCard` · `StatChip` · `MascotImage` | ported |

## App screens NOT in the design canvas

These exist in the app but were never designed in the canvas. **A new design
version must not silently drop them** — either the new canvas covers them, or
they get restyled to the new design system during the port:

- `PracticeScreen` (+ `ChordLibrary`) — free-play piano + penguin-guided chords
- `VoiceSettingsScreen` — instructor voice / ElevenLabs config
- `OmrImportScreen` — photograph sheet music → playable lesson
- `PaywallScreen` — premium tiers

## How this file evolves

- **Weekly drop (same design version):** update statuses for any screen the
  drop changed.
- **Monthly drop (new design version):** add a new section table for the new
  canvas (extract the `DCSection` titles/subtitles from
  `designs/<new>/project/app.jsx`), with a fresh status column. New design
  features that need core support (like the 05 quest engine) get listed as
  core tasks FIRST — core adapts behind `src/core/contract.ts`, then the
  shell consumes it.
- When a shell is archived to `legacy/`, its column here is the record of
  what shipped.
