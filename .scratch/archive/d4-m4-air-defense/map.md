# D-4 Wayfinder Map — Air Defense / AA (M4)

## Destination

A scoped spec + frontier-ordered implementation tickets for AA air-defense systems (HEAVY_AA, MEDIUM_AA, LIGHT_AA, CIWS) as an engine-only deterministic module in `@bluewave/combat/src/air-defense/`, parallel to the D-3 air-combat module. Includes defense-layer resolution order, engagement probability, disruption, director scaling, radar-directed groups, CIWS redundancy, ammunition consumption, damage/power effects, records, ordering, reason codes, contracts, and engine stage wiring. Does NOT include SAM (deferred to E-track).

## Notes

- DESIGN-45 (511 lines, 29 sections) is the governing doc
- SAM layers (HEAVY_SAM, MEDIUM_SAM, LIGHT_SAM) are deferred to M5/E-track
- Follow D-3 air-combat module patterns: pure deterministic, SafeInt, keyed RNG streams
- Integrates with D-3 CAP intercept (pre-AA layer) and D-2 spotting (detection)
- New `resolveAirDefense` engine stage at step 1.5 (after air-combat, before movement)
- `BattleResolver`/`StrengthCalculator` unmodified throughout

## Decisions so far

## Not yet specified

- Full damage model for AA systems (independent weapon/director/radar/power damage states)
- CIWS terminal defense detailed engagement formula (reuse general engagement pattern)
- Ammunition consumption model detail (burst, reload, cooling, jams)

## Out of scope

- SAM systems (HEAVY_SAM, MEDIUM_SAM, LIGHT_SAM) — deferred to E-track (M5)
- CAP interception integration — already shipped in D-3
- Content YAML — CONTENT-track