# Octave Flex Cell — Phase 1 Build Guide (Option C: butt + wire-bridge)

Goal: build ONE working 5-octave LED strip prototype, cheaply and fast, from
**5 identical single-octave flex cells** butted edge-to-edge and joined with
short wire bridges + a stiffener at each seam (Option C). Pitch is maintained by
the board geometry; the bridges only carry signal/power, not load.

This is a **throwaway prototype joint**. It is NOT the mass-market joint — Phase 2
pivots to a single continuous flex (or Option A interposers). The cell and its
edge pads are designed so that pivot needs no LED re-layout.

Spacing/fit rationale (octave width, pitch, anchoring, brand data) lives in
[KEY_SPACING_FIT.md](KEY_SPACING_FIT.md). Positions come from
[led-positions-uniform.csv](led-positions-uniform.csv).

---

## 0. Decisions baked into this guide (from the existing design files)

| Item | Choice | Why |
|------|--------|-----|
| Substrate | 2-layer polyimide flex | Product direction. (Rigid `octave-module` is cheaper if you change your mind — same steps otherwise.) |
| LED | WS2812B **5050** (LCSC C114586) | Body = 5.0 mm; **emitting window ≈ 3.5 mm** (your "~3 mm lit" target). Hand-solderable. Keep for the proto. |
| Placement model | **Uniform 13.75 mm pitch** (165 / 12; 12 per octave) | Simple, regular, the standard piano-strip approach. |
| Octave / cell length | **165 mm** (6.5″ standard) | Measured avg + midpoint of the real 164–166 mm brand range → fits most pianos. See KEY_SPACING_FIT.md. |
| Edge offset | First/last LED **6.875 mm** from the edge (half-pitch) | Makes the butt seam continuous at exactly 13.75 mm. |
| Cell height | 25 mm | Tune to your channel later. |
| Inter-cell join | Front-side wire bridges + back-side stiffener | No vias = fewer flex failure points = simplest/most reliable for a proto. |
| Connector J1 | Footprint kept, **DNP** for the proto | Feed cell #1 from the controller straight into its left bridge pads. |

> **Two recorded caveats (both diffuser-invisible):**
> 1. *Within-octave:* uniform pitch can't represent the E–F / B–C no-black-key gaps,
>    so **C, F, B sit ~5–7 mm off true centers**; others within ~3 mm. Corrected in
>    firmware by the note→LED map.
> 2. *Cross-piano:* standard 165 mm pianos get ~0 drift; the extremes (Yamaha 164 mm
>    or a 166 mm piano) drift **≤ ±2.46 mm** over 5 octaves **if center-anchored**
>    (≤ ±4.92 mm if end-anchored). Center-anchor it. (Yamaha-heavy market? See the
>    164.5 mm hedge in KEY_SPACING_FIT.md §4.)

---

## 1. Create the cell project

1. Copy `hardware/octave-module/octave-module/` → `hardware/octave-flex-cell/` and
   rename the project files to `octave-flex-cell.*`. (It already has the right
   *scope*: 12× WS2812B D1..D12, 12× 0.1 µF C1..C12, the D1→D12 data chain, J1/J2.)
2. **Re-space the 12 LEDs to UNIFORM** per [led-positions-uniform.csv](led-positions-uniform.csv):
   `x = 6.875 + n × 13.75` → 6.875, 20.625, 34.375, 48.125, 61.875, 75.625, 89.375,
   103.125, 116.875, 130.625, 144.375, 158.125 mm. (`octave-module` shipped the old
   *geometric* spacing — replace it.) Keep each cap next to its LED (~3.5 mm above the row).
3. Set **J1 and J2 to DNP**.

> Alternative basis: slice the first octave out of `hardware/octave-flex/` — it is
> *already* uniform 13.75 mm and *already* has the flex layout rules applied. Then
> delete the other 48 LEDs/caps, trim to 165 mm, and add the bridge pads (§2).

---

## 2. Replace J1/J2 with edge bridge pads

The only real new design work — swap the two JST connectors for small solderable
pads at each edge, on the **same nets**.

**Schematic** (keep nets identical to [octave-netlist.txt](../octave-netlist.txt)):
- `BL` = 4 pads, LEFT edge (input):  `BL1=+5V  BL2=GND  BL3=DIN  BL4=PASS`
  - `BL3` (DIN) ties to the **same net as J1 pin 3 / D1 DIN**.
- `BR` = 4 pads, RIGHT edge (output): `BR1=+5V  BR2=GND  BR3=DOUT  BR4=PASS`
  - `BR3` (DOUT) ties to **D12 DOUT** (old J2 pin 3).
- `+5V`, `GND` tie to the existing rails. `PASS` is optional — omit BL4/BR4 if you
  don't want the diagnostic passthrough (3 bridges is enough).

**Layout** — a tiny 4-pad footprint (or 4 SMD pads) at each edge:

| Pad | Net (left / right) | Suggested position (mm, origin = top-left) | Layer |
|-----|--------------------|--------------------------------------------|-------|
| 1   | +5V  / +5V         | x = 1.0 / 164.0,  y = 10.0 | F.Cu |
| 2   | GND  / GND         | x = 1.0 / 164.0,  y = 13.0 | F.Cu |
| 3   | DIN  / DOUT        | x = 1.0 / 164.0,  y = 16.0 | F.Cu |
| 4   | PASS / PASS        | x = 1.0 / 164.0,  y = 19.0 | F.Cu |

Rules for these pads:
- **Same Y on both edges** (mirror) → when two cells butt, the right pad row of cell
  N lines up across the seam from the left pad row of cell N+1. Bridge span ≈ 2 mm.
- Pad size ~1.2 × 1.0 mm, on F.Cu (front). No vias needed. (Phase-2 premium: move to
  B.Cu + vias for an invisible front; same net/position scheme.)
- They sit in the LED-free corners (LED1 body ends at x≈4.4, LED12 at x≈160.6).
- Silkscreen `5V G D P` next to them.
- **This pad pattern IS the future Option-A interposer landing.** Don't change its
  pitch/order later or you lose the free C→A transition.

**Seam check:** LED12 sits 6.875 mm from the right edge; the next cell's LED1 sits
6.875 mm from its left edge. Butted with zero gap → LED12-to-next-LED1 = 13.75 mm,
identical to every other gap. ✔

---

## 3. Flex conversion (reuse the rules already written for the 822 mm board)

Apply the flex layout rules from [octave-flex-netlist.txt](../octave-flex/octave-flex-netlist.txt)
(your own spec):
- **GND on B.Cu = cross-hatch pour** (50% fill, ~0.5 mm hatch), not solid.
- **+5V on F.Cu** = wide trace/pour along the length. Power is trivial here: 0.9 A
  over 165 mm of even 1/3 oz pour ≈ 40 mV; ~70 mV across all 5 cells — fine.
- **Teardrops** on all pad/trace junctions (Tools → Generate Teardrops).
- **Curved / 45° traces**, no 90° corners. Data: 0.2 mm min, short hops D1→…→D12.
- Skip the J1 stiffener (J1 is unpopulated for the proto).

---

## 4. Fab order (JLCPCB FPC — a 165 mm cell is well within their flex limit)

```
Service:        Flex (FPC), 2 layer
Board size:     165 x 25 mm
Quantity:       5  (one strip = 5 cells; order a couple extra if budget allows)
Material:       Polyimide
Copper:         1 oz if offered, else 1/3 oz (fine at <1 A here)
Coverlay:       both sides
Surface finish: ENIG preferred (gold won't crack); HASL-LF OK for a short proto cell
Stiffener:      none (J1 unpopulated; seams stiffened by hand at assembly)
Assembly:       SMT assemble LEDs + caps (recommended). Leave J1 unpopulated (DNP).
```

BOM (per cell ×5): 12× WS2812B-5050 `C114586`, 12× 0.1 µF 0603 `C14663`. J1 DNP.

> Tip: let JLC assemble the LEDs/caps; you hand-solder only the 4 seam bridges.

---

## 5. Bench-test each cell BEFORE joining

1. **Visual/DMM:** +5V↔GND not shorted; DIN→D1 and D12→DOUT continuity.
2. **Power:** 5 V bench supply, current-limit ~1 A. (Firmware safety cap:
   `FastLED.setMaxPowerInVoltsAndMilliamps(5, 900)`, ≤10 LEDs lit — [PROJECT_PLAN.md:105](../../PROJECT_PLAN.md).)
3. **Data:** drive `BL3` (DIN) from the controller's level-shifted 5 V data (the
   74AHCT1G125 path). Bare-bench 3.3 V often works but is out-of-spec — add a
   ~330 Ω series resistor and share ground.
4. Run a 12-LED FastLED test (color wipe / `RGBCalibrate`). All 12 light, color order
   correct (GRB). Mark the cell PASS.

---

## 6. Option C assembly — joining the seams

LEDs facing **up**, on a flat surface.

1. **Butt** cell N's right edge against cell N+1's left edge — zero gap, pad rows
   aligned. Register the bottom edge against a straight bar; use a hard stop.
2. **Stiffener:** ~12 × 20 mm of 0.5–1 mm FR4 (or stacked Kapton), glued to the
   **back** across the seam. (Opposite face from the LEDs — carries all the load.)
3. **Bridge:** solder 3 short wires (30 AWG) on the **front** in the ~8.75 mm
   LED-free seam gap: BR1→BL1 (5V), BR2→BL2 (GND), BR3→BL3 (DOUT→DIN). Add BR4→BL4
   only if you wired PASS.
4. **Strain-relief:** a dab of hot-glue / UV resin over the wires once they test good.
5. **Re-test cumulatively:** power up for 12, 24, 36, 48, 60 LEDs. New octave lit = seam good.

Repeat for all 4 seams. Feed the whole strip from cell #1's `BL` pads
(controller 5V/GND/level-shifted data). **Center-anchor** the finished strip to the
keyboard (see KEY_SPACING_FIT.md §5) so cross-piano drift splits both ways.

---

## 7. Mounting the prototype

Bare flex curls. Drop the joined strip into an aluminium LED channel + diffuser
(1 m, ~17 mm wide). Hides the seam wires, protects the LEDs, blurs the per-key
offset. Don't ship it — Option C is bench-grade only.

---

## 8. M2 registration holes — add them now (cheap), skip the precision jig

Put 4× M2 holes in the cell layout at known positions relative to LED1 (corners,
clear of traces, copper annulus + small stiffener so the thin flex doesn't tear).
They fix the curly flex to a rail during assembly, keep the cell footprint identical
to the Phase-2 layout, and become the datum for the Phase-2 jig. Don't buy a machined
dowel-pin rail or tight hole tolerancing now — align by eye into the channel.

---

## 9. Phase-2 forward-compat (don't break these)

- Keep the `BL`/`BR` pad **pitch, order, and Y-positions** fixed — Option-A interposer landing.
- Keep LED placement driven by [led-positions-uniform.csv](led-positions-uniform.csv)
  (uniform 13.75). The Phase-2 monolith = 5 replicated copies of THIS cell at
  **+165 mm** offsets with the seams merged into continuous copper.
- Manage J1 population and seam stiffeners as **assembly variants**, not redesigns.
