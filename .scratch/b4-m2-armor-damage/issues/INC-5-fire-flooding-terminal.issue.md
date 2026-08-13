# INC-5 — Immediate Fire/Flooding + Magazine Hazard + Terminal Seam + Determinism

**State:** READY_FOR_AGENT · **Blocked by:** INC-4
**Spec:** `.scratch/b4-m2-armor-damage/spec.md` (AC-8, AC-9, AC-14)

## Acceptance criteria
- AC-8 Stage 5 immediate fire/flooding **creation** evaluated independently (ignition/combustible/oxygen + valid zone; hull/piping breach + route); each source a separate stable record (intensity/rate, location, cause, containment state, versions) (`FIRE_SOURCE_CREATED` / `FLOODING_SOURCE_CREATED`); creation-only (resolution M3/C-5).
- AC-9 Stage 6 minimal secondary hazard: **magazine/ammunition reaction** on full/critical penetration into a magazine (or turret magazine-adjacent) zone, keyed draw stream `battle/ship/damage/magazine`, `DAMAGE_SECONDARY_HAZARD_CREATED`; other §10 hazards emit successful empty records. Stage 8 basic terminal detection: flotation 0 → `SINKING` (formula `clamp(10,360, floor(baseSurvivalMinutes × flotationFactorBp × stabilityFactorBp × damageControlFactorBp / 10_000^3))`, `SHIP_SINKING`); catastrophic structural breakup → `FOUNDERED` (`SHIP_FOUNDERED`). No stabilization/abandonment/scuttling/capture/recovery/scoring this sprint.
- AC-14 two-process determinism: two child node processes, byte-compared identical per-minute hashes + damage events; no ambient randomness (`battle/ship/damage/*` streams only).

## Notes
Flooding/fire-resolution formulas (§§13–18/§§19–26) are NOT implemented (M3/C-5) — the creation records carry them forward only. Determinism test mirrors `combat/test/gunnery/determinism.test.ts` (child in `src/simulation/run-damage-child.ts`).