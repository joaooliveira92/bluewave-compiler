# ADR-0046: P-1 — Torpedoes in Campaign Auto-Resolution + Battle-Fidelity Fixes

## Status

Accepted (2026-10-06)

Superseded by: ADR-0051 (decision 2 — auto-resolution heading override).
Supersedes: ADR-0031 (decision 3 — swept-segment hits).

## Context

P-1 (ADR-0045) wires the M3 torpedo module into `resolveBattleAuto`, the path every
campaign battle takes. Driving real battles through it exposed defects that unit-level
tests never exercised:

1. **Speed units.** `designedSpeedBpKnots` returned whole knots; movement reads knots ×
   `SPEED_BP_SCALE` (1 000). Auto-resolved ships moved at 1/1 000 of design speed.
2. **Spawn headings.** `spawn.ts` labels 90/270 as east/west, but movement's
   `directionBp` uses 0 = +X. The two lines steamed in parallel along ±Y, 20 km apart,
   and never closed — every campaign battle was a static long-range duel.
3. **Short-run torpedoes could never hit.** The torpedo stage evaluated hits only at the
   end-of-minute position (ADR-0031 approximation) and marked a run that ended inside the
   minute as EXHAUSTION before any hit check. The 550 m Whitehead (≈ 770 m/min) therefore
   could not hit anything.
4. **No manoeuvre.** Even once moving, the lines passed through each other once and
   steamed off the map.

## Decision

1. `designedSpeedBpKnots = floor(ums × SPEED_BP_SCALE / KNOTS_TO_UM_S)`.
2. `projectBattle` sets closing headings (ATTACKER 0, DEFENDER 180) explicitly.
   `spawn.ts` is unchanged: its 90/270 values feed direction-agnostic B-2..B-6 hash pins
   marked "MUST NOT be regenerated". Reconciling the spawn convention is P-1 ticket 08.
3. **Swept-segment hits (supersedes the ADR-0031 end-point approximation).** A track is
   hit-checked along the segment it swept this minute
   (`sweptPathIntersectsCollisionGeometry`, exact bigint). A run that ends inside the
   minute is evaluated at its last running point (1 m short of the run's end) before the
   EXHAUSTION transition. All 511 pre-existing torpedo tests still pass.
4. **Pursuit.** Each minute every viable ship steers toward the nearest viable enemy
   legal contact at full speed (`battleResolution/pursuit.ts`). Headings are chosen by an
   integer search over the movement direction table, with no floating trigonometry.
   Tactical AI proper is P-6.
5. **Torpedo doctrine** (`torpedoDoctrine.ts`). The engine launches every torpedo along
   the firing ship's heading (DESIGN-40 §13 slice) from its end-of-minute position, so a
   launcher fires one tube per minute when the target's *predicted* end-of-minute
   position lies on that run, within its collision radius, between the arming distance
   and the first setting's range. Broadside tubes therefore behave like bow tubes. This
   is a recorded approximation until trainable launches exist.
6. **Projection figures.** Collision radius = clamp(round(cbrt(t) × 2.5), 5, 150) m;
   draft = clamp(round(cbrt(t) × 0.35), 1, 12) m. Protection `WEAK` (pre-bulkhead
   hulls); one load per tube (no reloads); crew 7 000 bp.
7. `whitehead_14in_1886` gains the `14in_underwater_fixed` launcher family: 1880
   ironclads fired it from submerged bow tubes. Projection fails closed on a
   model/mount incompatibility.
8. `BattleResolutionResult.torpedoSummary` (`tubesFired`, `hits`) is present only when
   a combatant carries torpedo armament, so unarmed results keep their hash shape.

## Consequences

- Campaign auto-resolution now closes to close action, and torpedo armament changes
  outcomes (proven from compiled production content, `production-pack-loop.test.ts`).
- Goldens 10/10 unchanged: no golden scenario resolves a battle.
- **Known remaining defects (recorded as P-1 tickets, not fixed here):**
  - 06: auto-resolution gunnery makes **one** hit draw per battery-salvo at a fixed
    accuracy, independent of range and gun count. Outcomes are largely insensitive to
    design.
  - 07: the damage-control stage takes a single-ship context and overwrites every
    ship's fire/flooding records with it. Torpedo flooding therefore never progresses,
    so hits matter far less than they should.
  - 08: spawn heading convention (above).
- The next ADR number is **0047**.
