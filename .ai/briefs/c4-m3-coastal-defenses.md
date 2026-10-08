# Milestone C-4: M3 Coastal Defense — Coastal Artillery & Land-Target Damage Model

## Objective

A deterministic, engine-only **coastal-defense value model** in a new `packages/combat/src/coastal-defense/` module (`@bluewave/combat`) that models coastal artillery battery definitions, land-target type classification (7 types), land-target damage state (5-state linear progression), coastal artillery participation in local battles (value-only effectiveness contribution), local mine-pressure contribution (via C-2's `createMinePressureRecord`), placement rules (predefined zones, seed-driven selection), records, canonical ordering, and reason codes — the complete DESIGN-48 value-model surface **except battle-participation integration, campaign-infrastructure consequence application, and AA-capability progression**, which are explicitly deferred pending tactical battle context (manifest/damage pipeline), campaign snapshot wire (B-6 pattern), and M4 AA system acceptance respectively. No campaign snapshot schema change; no phase-engine wiring; goldens 10/10 unchanged.

## Canonical requirements

DESIGN-48 (full, 48 lines); DESIGN-14 (AreaMinePressureRecord — produced via C-2's mine model); DESIGN-08 (§determinism — seed-driven placement); DESIGN-07 (integer arithmetic); DESIGN-55 §4 (M3 scope).

## Starting state

Verified baseline (2026-08-28): M2 COMPLETED. C-1 (torpedoes) COMPLETE, C-2 (mines) COMPLETE, C-3 (submarines) COMPLETE (INC-1..INC-8, AC-1..AC-22). `@bluewave/combat` has the full tactical pipeline (movement, spotting, gunnery, damage, weather, auto-resolve) plus `torpedoes/`, `mines/` (with `AreaMinePressureRecord` + `createMinePressureRecord`), `submarines/`, and `weather/` modules. `BattleResolver`/`StrengthCalculator` unmodified throughout M3.

## In scope

- Coastal battery definitions (model, caliber, era-band, AA capability flag)
- Land-target type classification (7 types: airfield/dockyard/fuel_storage/radar_station/coastal_battery/port_installation/transport_concentration)
- Land-target damage state (5-state: Intact/Suppressed/Damaged/Disabled/Destroyed)
- Placement rules (predefined zones, seed-driven selection, geographic validity)
- Local mine-pressure contribution (produces AreaMinePressureRecord via C-2)
- Value-only effectiveness formula (BigInt, floor)
- Records + canonical ordering + reason codes + contracts
- TypeScript constants (YAML promotion deferred)

## Out of scope

- Battle-participation integration (coastal artillery in tactical battles)
- Campaign infrastructure consequence application after battle
- AA capability progression over time (M4)
- Airfield, radar-site mechanics (M4)
- YAML-authored constants
- Phase-engine/snapshot wiring

## Required implementation

6 implementation increments (INC-1..INC-6) per spec at `.scratch/c4-m3-coastal-defenses/spec.md`.

## Acceptance tests

Per AC-1..AC-11 table in spec: unit tests for battery definitions, land target types, damage state progression, placement, mine pressure, effectiveness, records, ordering, reason-code set-equality, contracts validation, integration-boundary proof.

## Determinism proof

Goldens 10/10 unchanged (no snapshot/phase change). Two-process determinism for coastal-defense records (optional if scaffolding overhead exceeds model complexity; AC-7 canonical ordering proves collection determinism).

## Compatibility and versions

`coastal_defense_constants_v1`, `land_target_damage_states_v1`, `coastal_battery_era_bands_v1` — new contracts only. No existing format/formula/RNG stream change. No migration required.

## Performance observations

Coastal defense is a pure value model performing O(n) operations over possession batteries per resolution. No benchmark fixture needed.

## Stop conditions

- DESIGN-48 ambiguity about any term (none expected — 48-line document is explicit)
- C-2 `createMinePressureRecord` signature is incompatible (check before use; adapt with a thin adapter)
- Two-process determinism child breaks on platform-specific ordering (fall back to canonical-ordering proof + cross-process guard similar to INC-6 of C-3)

## Required delivery

- code and tests (6 INC increments, ~20 files)
- traceability (SPRINT-PLAN update, PROGRESS update)
- ADR (C-4 scope/integration decision, mirroring ADR-0033)
- validation report (`.ai/reports/c4-m3-coastal-defenses.md`)
- Conventional Commits (one per INC increment)
- changed-file summary
