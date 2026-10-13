# ADR-0053: P-1 — Auto-Resolution Lethality Tuning

## Status

Accepted (2026-10-07). Partially meets the tuning target; see Consequences.

## Context

The post-ticket-10 balance sweep (`docs/research/p1-balance-sweep.md`, 30 seeds,
2 BB vs 2 BB, 1880 June) showed: mean length 14-26 min, 100% ending
`no_viable_combatants`, ~80% hp lost per ship, ~2.6 of 4 ships sunk. Target for
equal 2v2 fleets: mean length ~30-90 min, a meaningful share not ending in
elimination, mean sunk well under 2.0 of 4, gun-count advantage still clearly
decisive (10 vs 4 guns winning > 50%), no determinism regression.

Root-cause finding (from the sweep, one lever at a time): ships are lost when
`flotationReserve` reaches 0 (`terminalSeam`). The dominant drains were (a)
magazine detonations (`damage/magazineHazard.ts`: 80% chance on a penetrating
magazine hit, -30 000 flotation of 50 000) fed by a UNIFORM 25% magazine hit
share, and (b) progressive flooding from persisted breach sources (ADR-0050,
500 kg/min each, never repaired fast enough) against a 50 000 reserve.

## Tuning log (30 seeds; equal fleets row = len mean min / att-def-none win / mean sunk)

| # | Change (one at a time unless noted) | Equal-fleet length | Mean sunk | Notes |
| --- | --- | --- | --- | --- |
| 0 | baseline | 14.3 | 2.67 | 100% elimination; ~all "gunfire" |
| 1 | HIT_STRUCTURAL_DAMAGE_BASE 2000 -> 1000 | 14.5 | 2.57 | inert: detonations dominate |
| 2 | HIT_STRUCTURAL_DAMAGE_BASE -> 200 | 14.7 | 2.57 | inert (also after later changes: 500 vs 2000 moved length < 2 min) |
| 3 | BATTLE_DISCOUNT_BP 3000 -> 1500 | 16.7 | 2.63 | weak lever; band-table tests would need rewrite |
| 4 | BATTLE_DISCOUNT_BP -> 1000 | 19.3 | 2.70 | 3x fewer hits ~ +35% length: snowball, not hit-rate bound |
| 5 | (diagnostic) magazine detonation chance 0 | 28.0 | 2.80 | confirms detonations are the main killer; flooding then dominates |
| 6 | hit-zone weights (belt 40 / deck 30 / super 27 / magazine 3 %) | ~22 | 2.60 | flooding becomes main cause (gunfire 2.6 -> 1.1); approximate, an intermediate working-tree state |
| 7 | FLOAT_UNIT 50 000 -> 150 000 (alone) | 26.3 | 2.67 | viability/sinking-threshold lever |
| 8 | FLOAT_UNIT -> 400 000 (alone, no weights) | 50.0 | 2.80 | gun advantage 100%; speed 14kn beats 30kn 90%; approximate, intermediate working-tree state |
| 9 | **6 + 8 combined, discount 3000, base 2000 unchanged** | **58.8** | **2.83** | chosen; 10 v 4 guns 100%; det. OK |
| 10 | alternatives on 6 + FLOAT 200 000 (discount 3000 / 1500) | 42.0 / 45.8 | 2.80 / 2.70 | no change in elimination share; not adopted |

Final sweep (chosen): equal 58.8 min (51-67), att/def/none 60/33/7%; 10-gun v
4-gun 60.4 min, 10-gun wins 100%; 30kn v 14kn 66.6 min, 14kn wins 100%;
torpedoes v unarmed 70.6 min, torp side wins 100%. Cause of loss is now
flooding (2.83/battle), gunfire 0.

## Decision

1. `FLOAT_UNIT` 50 000 -> **400 000** (flotation reserve and `designFlotationReserve`;
   the shipped `battle_auto_resolution_v1` contract validates it via `floatUnit`).
2. New `ZONE_HIT_WEIGHT_BP` (BELT 4 000, DECK 3 000, SUPERSTRUCTURE 2 700,
   MAGAZINE 300): `pickZone` draws one uniform roll over the total weight and
   walks the cumulative weights. Equal weights reduce exactly to the old uniform
   draw (used for the forced-old verification below).
3. Unchanged on purpose: `HIT_STRUCTURAL_DAMAGE_BASE` (2 000), `HIT_DAMAGE_OUTCOME_BP`,
   `BATTLE_DISCOUNT_BP` (3 000), range q cap, the band table and its property
   tests. They were inert or weak levers and are not touched.
4. Fixed 10 km `rangeEstimateUm` in `projectBattle` is only the initial
   battery state; since ADR-0048 the curve uses the true legal contact range
   each minute, so it no longer dominates. No change.
5. Test harness: package `testTimeout` 60 s (battles are ~4x longer), the sweep
   test timeout 180 s, and a sweep tripwire that equal-fleet mean length is in
   30-90 min.

## Re-pinned baselines (ADR-0007)

Forced-old-constant run (FLOAT_UNIT 50 000 and equal zone weights) reproduced
the previous hashes exactly, so every move below is due to the tuning alone.

- `auto-resolve.test.ts` unarmed baseline #1: RESULT `e017125e...` ->
  `bee00786...`; minute 0 byte-identical, minute 1 `cfe97211...` -> `2c598e47...`,
  last minute `0493ad21...` -> `aaca0a19...`; ends `no_viable_combatants` at
  minute 54 (was 14).
- `ac6-damage-control-gate.test.ts` unarmed baseline #2 (4-gun): RESULT
  `c6b73c6f...` -> `f762c585...`; minute 0-1 byte-identical, rest changed; ends
  at minute 70 (was 18). Full minute-hash list re-pinned.
- Rescaled (not weakened) tests that hard-coded the 50 000 reserve:
  `ticket-07-damage-control.test.ts` (use `FLOAT_UNIT`, flood rate `FLOAT_UNIT/4`),
  `torpedo/determinism.test.ts` (`< FLOAT_UNIT`).
- Goldens: checked with `node scripts/verify-golden-hashes.cjs` (see sprint report).

## Consequences

- Length target met (58.8 min equal fleets); gun-count advantage preserved
  (100%); determinism unchanged (two-process tests green).
- NOT met: non-elimination share (still 0% `time_limit`) and mean sunk < 2.0
  (2.8 equal / 2.1 for decisive fleets). Once a side is losing, sinking is a
  one-way snowball and there is no disengagement / withdrawal predicate
  (`mutualDisengagement` is wired false), so every battle runs to elimination.
  Lethality constants alone cannot produce non-elimination without pushing
  length past 360 min. Follow-up: tickets 11 (speed/engagement geometry) and
  12 (disengagement), both `ready-for-agent`.
- Speed geometry: 14 kn now beats 30 kn 100% (was 63%): the slower, closing
  side gets the legal range band and the faster ship overshoots. This is a
  design question, not a constant, and is recorded in ticket 11.
