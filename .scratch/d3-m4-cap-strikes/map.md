# D-3 Wayfinder Map — M4 Aviation: CAP & Strikes

## Destination

Deterministic, pure CAP (Combat Air Patrol) and strike mission execution within the minute-advance tactical combat engine (`@bluewave/combat`) — mission role feasibility predicates (DESIGN-43 §§22-31), CAP tick resolution (interception, air-to-air combat), strike lifecycle (launch → formation → ingress → attack → egress → recovery), engine wiring slots these into the tactical minute alongside existing spotting/gunnery/damage/weather stages. No air defense / AA (D-4), no experience/fatigue, no content YAML.

## Notes

- Governing docs: DESIGN-43 §§22-31 (mission roles), DESIGN-44 §§13-18 (strike preparation, launch, recovery — scoped in D-2, now used in tactical combat), DESIGN-38 (minute-advance engine pattern, records/ordering).
- D-1/D-2 ship the aircraft model definitions, basing, squadron lifecycle (D-1) and carrier operations state, deck cycles, contention, launch rates, recovery priority, wind-over-deck (D-2). D-3 consumes those as inputs, does not re-implement them.
- `BattleResolver`/`StrengthCalculator` remain unmodified — the strict pattern from B-2..B-6/C-1..C-5/D-1/D-2.
- New module under `@bluewave/combat/src/air-combat/` or per-mission under `aircraft/cap.ts`, `aircraft/strike.ts` — follow the established module pattern.
- Minute-advance engine stage: new stage(s) in tactical minute pipeline (step numbers TBD — likely before gunnery for CAP interception, after spotting).
- Goldens regenerate when new stage wires in (ADR-0007 process).
- Research: aircraft performance baseline already done (D-1), carrier ops already done (D-2). Primary tactical air-combat research needed for engagement modelling.

## Decisions so far

- [Air-combat resolution model](issues/01-air-combat-resolution-model.md) — **RESOLVED.** Squadron-quality 6-factor exchange formula (quality, numericalAdvantage, altitude, surprise, defenderSurvival, escort). One RNG draw per engaging pair per minute. `killProbabilityBp = floor(PI(factorBp) / 10_000^6)`. Losses = `floor(killProb * defenderCount / 10_000)`. Grounded in `docs/research/d3-m4-air-combat-model.md` (320 lines).
- [Minute-order CAP/strike position](issues/02-minute-order-cap-strike-position.md) — **RESOLVED.** New `resolveAirCombat` stage at step 1, substep 1 (after weather, before gunnery substep 2). CAP interception resolves during transit before strike reaches gunnery range. Strict no-op preserves prior goldens.
- [Attack resolution and damage pipeline](issues/03-attack-resolution-and-damage-pipeline.md) — **RESOLVED.** Bombing: base accuracy formula with disruption modifier, dive-bombing 12_500bp accuracy + 8_500bp penetration. Air-launched torpedo: reuse C-1 hit resolution with air-launch overrides. Damage: lightweight `AirAttackDamagePackage` feeds into existing `resolveDamage`.
- [Reason codes, records, contracts](issues/04-reason-codes-records-contracts.md) — **RESOLVED.** 16 shipped reason codes + 3 deferred markers. New `AirCombatRecord` per DESIGN-43 §38. 5 `*_v1` contracts. Set-equality guard.
- [CAP tactical lifecycle detailed](issues/05-cap-tactical-lifecycle-detailed.md) — **RESOLVED.** CAP patrol station per squadron, detection via B-2 spotting, intercept timing per speed-score mapping (2.5x + 20 m/s). CAP vs escort first, then CAP vs bombers. Disruption axis reduces bombing accuracy.
- [Strike tactical lifecycle detailed](issues/06-strike-tactical-lifecycle-detailed.md) — **RESOLVED.** State machine: EN_ROUTE→ON_TARGET→ATTACKING→EGRESSING→RETURNING. Transit time per formation speed. One attack pass per minute. Egress uses fuel check, recovery uses D-2 priority.

## Not yet specified

<!-- all fog items graduated into resolved decision tickets or spec -->

No remaining fog — the way to D-3 destination is clear. The spec (`.scratch/d3-m4-cap-strikes/spec.md`) and 8 implementation tickets capture all decisions.

## Out of scope

- AA / air defense integration (D-4)
- Experience/fatigue binding (DESIGN-28, unassigned)
- Content YAML constants (CONTENT-track)
- Player UI for CAP/strike management (desktop-track)
- Strategic AI mission planning (AI package — deferred beyond D-track)