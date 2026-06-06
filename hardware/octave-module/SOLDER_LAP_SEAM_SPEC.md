# Octave Module — Solder Lap-Joint Seam Spec (glued-flat flex, ONE Gerber)

Five flex octave boards from **one Gerber**, each **glued flat to the piano**, joined at 4 seams
by **solder lap joints** — no connector at the seams, no FFC, no aluminum channel.
**J1 (controller input connector) is populated on board 1 only**; boards 2–5 leave J1
unpopulated (DNP) and feed in through their input lap pads.

**Why solder lap** (vs FFC / channel): glued flat → the seam never flexes → solder is robust;
and it's the flattest, cleanest result (no service loop, no channel bulk). Decided 2026-06-03.

---

## 1. Lap joint (mechanical)
- Board N's right tab **overlaps** board N+1's left end by **~2 mm**; the overlapping pads are soldered.
  The double-thickness overlap is **self-stiffening** — no separate stiffener.
- Each board rides **on top** of the previous tab → ~0.2 mm step at the seam (negligible once glued).
- Any install-time bending happens in the flexible spans, never at the soldered overlap.

## 2. Board length & LED pitch — CRITICAL
- Octave pitch (LED1 → next LED1) must stay **165 mm** → **board = 167 mm** (165 + 2 mm overlap tab).
- LED1 at **6.875 mm** from the left edge; LED12 at 158.125 mm; LEDs uniform **13.75 mm**.
- Tab = rightmost 2 mm (x = 165–167). ⚠️ Keep 165 mm + lap 2 mm and every seam gap becomes 11.75 mm
  (keys drift) — the +2 mm is required.

## 3. Interface (ONE Gerber)
> Exact pad / LED / outline coordinates: see **BOARD_COORDS.md**.
- **Output tab (right), TOP face:** pads `+5V, GND, DOUT`.
- **Input pads (left), BOTTOM face:** pads `+5V, GND, DIN` (same Y as output so they align).
- **Mate:** board N+1's bottom input pads sit on board N's top output pads → `+5V→+5V`, `GND→GND`, `DOUT→DIN`.
- **J1 (left end, TOP face):** JST-SH 4-pin controller input, on the SAME input nets.
  **Populate on board 1 only; DNP on 2–5.** (Board 1's input lap pads then go unused — fine.)
- Pads wide (~1 mm), 3+ (more = stronger bond; solder carries amps, so no current/ganging concern).
- 330 Ω data series resistor stays at each board's LED1 DIN.

## 4. Power
- Single feed (board 1's J1); keep `FastLED.setMaxPowerInVoltsAndMilliamps(5, 900)`.
- Solid solder → drop is just copper, negligible. No connector current limit.

## 5. Assembly & test
1. Edge-align the 2 mm overlap against a hard stop; reflow or hand-solder the overlap pads.
2. Continuity-check the seam (+5V↔GND not shorted; DOUT→DIN through).
3. Bench-test each board; then power up cumulatively after each seam (12/24/36/48/60 LEDs).
4. Glue the strip flat to the piano; **center-anchor** (see KEY_SPACING_FIT.md §5).

## 6. Population / fab note
- ONE Gerber, ×5. For a single JLCPCB order, simplest: **populate J1 on all 5** (boards 2–5 carry an
  unused ~$0.15 connector) **or** omit J1 everywhere and **hand-solder it onto board 1.**
  (A mixed DNP variant in one order is fiddlier than it's worth.)
- Board 5's output tab: unused (chain end).

## 7. Keeps / gives up
- **Keep:** thin (~2 mm total), flexible spans between seams, conforms to a gentle curve.
- **Give up:** sharp bending *at* a seam — not needed for a glued-flat strip.

## 8. Remaining work (KiCad GUI — project is open; .sch/.pcb untouched on disk)
- Footprint: flat lap-solder pads (output = top face, input = bottom face) + keep the J1 footprint (DNP-able).
- Board outline: 165 → **167 mm** with the 2 mm overlap tab.
- LED re-spacing: uniform 13.75 mm, LED1 at 6.875 mm from the left edge.
- The `.kicad_sch` still carries earlier (vestigial) FFC 6-pin ZIF edits on J1/J2 **plus your own
  uncommitted work** — tidy in the GUI; do **not** git-revert it.
