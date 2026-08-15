# Milestone B-4: M2 Basic Armor & Damage (Surface Tactical Core)

## Objective

A deterministic, engine-only **armor & damage-resolution** stage in
`@bluewave/combat` that, given armored `TacticalUnit`s and presented impacts
(from the B-3 gunnery seam), resolves DESIGN-41 **basic armor & damage** (§§1–9,
§45–48) folded with the DESIGN-39 §§16–24 armor model, emitting immutable
`DamageEventRecord`s through `BattleLedger` + `canonicalEventOrder`, with strict
no-op behavior that leaves B-2/B-3 hashes unchanged and goldens 9/9.

## Canonical requirements

- DESIGN-41 §§1–9, §45–48 (basic subset); DESIGN-39 §§16–24 (armor model, folded
  from B-3); DESIGN-38 (minute-advance, `BattleLedger`, `canonicalEventOrder`,
  reason-code catalog); DESIGN-07 (integer arithmetic); DESIGN-55 §3–4 (M2 scope,
  M3/C-5 damage-control boundary).

## Starting state

Verified baseline (2026-08-13): B-1 (tactical units incl. armored definitions,
ADR-0012–17), B-2 (minute-advance steps 4–8, movement/spotting/contact, ADR-0018/19),
B-3 (`resolveGunnery` after spotting + reserved impact/armor inputs in
`GunneryEventRecord`, gunnery contracts, ADR-0020) all DONE — PASS. Combat suite
45 files / 330 tests green; goldens 9/9; cross-process 13 green;
`BattleResolver`/`StrengthCalculator` unmodified.

## In scope

- `ShipDamageState` + `assertFixedPointDamage` guards; 10-stage pipeline with
  no-skip empty-stage semantics + transaction rollback.
- DESIGN-39 §§16–24 armor model: zone maxima, thick-armor manufacturing (7 500 bp),
  quality adjustment, impact geometry/obliquity, 2-in splinter threshold + classes,
  7 penetration outcomes.
- Stages 1–4 (hit location, protection interaction, local component damage incl.
  turret states, structure + flotation) + Stage 5 immediate fire/flooding
  **creation only** + magazine/ammunition secondary hazard + basic SINKING/
  FOUNDERED terminal detection.
- `DamageEventRecord` (§45) + canonical ordering (§46) via `BattleLedger` +
  `canonicalEventOrder`.
- In-slice reason codes (ticket 05) + `reason-codes-damage.test.ts` set-equality.
- Content deliverable: `armor_v1`/`damage_v1` versioned content constants +
  `SHIPPED_*_CONTRACT` + validate guards, grounded in
  `docs/research/b4-m2-armor-damage.md` (armor zone maxima, armor-technology
  quality families, fire/flooding creation-type tables).
- ADR-0021; spec `.scratch/b4-m2-armor-damage/spec.md` (AC-1..16, INC-1..6).

## Out of scope

- Flooding/fire per-minute resolution, damage-control resources/priority,
  terminal-state adjudication, survivors/rescue, post-battle survival,
  fire/flooding persistence → **M3/C-5**.
- Secondary hazards beyond magazine reaction; torpedo/mine/bomb/missile contracts
  into Stage 2 → owning M3/M4 sprints.
- Phase wiring / `BattleResolver` replacement / campaign persistence / M2 gate →
  **B-6**; weather damage modifiers → B-5; smoke → M3/C-5.
- Production-pack YAML changes; golden regeneration (no ADR-0007 change).

## Required implementation

Public contracts: `ShipDamageState`, armor-model functions + `armor_v1`/
`damage_v1` constants + `SHIPPED_*_CONTRACT` + `validateDamageContract` +
validate guards; `resolveDamage` engine stage after `resolveGunnery`; immutable
`DamageEventRecord`; versioned reason codes; strict no-op when no impact/hazard.
Keyed RNG (`battle/ship/damage/*` streams), integer fixed-point only, no ambient
randomness/clock/env.

## Acceptance tests

Per spec AC-1..AC-16: unit per damage function (incl. invalid/boundary),
pipeline order/empty/rollback, armor-model table exactness, component/turret/
structure/flotation, immediate fire/flooding creation, magazine hazard + terminal
seam, event-record completeness, canonical ordering, `resolveDamage` integration +
no-op path, reason-code set-equality, two-process determinism (byte-identical),
contracts fail-closed. Continuity: build --force, typecheck, lint, format, full
tests, goldens 9/9, cross-process.

## Determinism proof

`resolveDamage` per-minute state hash + `DamageEventRecord` hashes identical across
two child node processes (byte-compared); strict no-op path preserves B-2/B-3
golden hashes; `verify-golden-hashes.cjs` 9/9.

## Compatibility and versions

No snapshot schema / phase / serializer / RNG-stream change. New `*_v1` armor/
damage/ruleset/formula versions. Reason codes additive only (recorded ADR-0021).

## Performance observations

Combat suite runtime regression ≤ small constant; no authoritative wall-clock data.

## Stop conditions

In addition to the permanent rules: any value that changes authoritative armor/
damage outcomes without a documented versioned-ruleset cause; inability to prove
the no-op path preserves B-2/B-3 golden hashes; a fabricated armor-technology
quality family not grounded in `docs/research/b4-m2-armor-damage.md`.

## Required delivery

Code + tests; traceability (SPRINT-PLAN B-4 row + pointer, PROGRESS); ADR-0021;
validation report `.ai/reports/b4-m2-armor-damage-impl.md`; changed-file summary;
Conventional Commits on `dev`; clean working tree.
