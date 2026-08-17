# Milestone B-6: M2 Battle Results → Campaign Integration + M2 Acceptance Gate

## Objective

Wire the B-1..B-5 `@bluewave/combat` tactical engine into the monthly phase
pipeline so every accepted campaign battle is **deterministically auto-resolved**
to a DESIGN-38 §32 battle end and its result (war score, ship damage/loss,
reservations) applies to the campaign — then sign `M2_SURFACE_TACTICAL_CORE`
COMPLETED (DESIGN-55 §23).

## Canonical requirements

DESIGN-38 §§31–35; DESIGN-37 §§19–20/§§30–33; DESIGN-31 (war score, ADR-0010);
DESIGN-42 §1–2; DESIGN-55 §3/§7–10/§23; DESIGN-06/52/55 §28; ENGINEERING-CONTRACT
(determinism, snapshot/save, ADR threshold).

## Starting state

Verified baseline (2026-08-15): B-5-IMPL DONE (PASS) — `weather_generation`
phase (order 0.5) registered but no-op, `StrategicWeatherState` + battle-init +
`resolveWeather` shipped, `evaluateBattleEnd` (§32 precedence) shipped, goldens
9/9, `applyBattleResult` proven (A-3). `BattleResolver`/`StrengthCalculator`
unmodified. Must be re-verified by the implementation (never assumed).

## In scope

- Strategic-weather snapshot persistence + default `climate_profile_v1`.
- `weather_generation` phase actually generating per-area state.
- `resolveBattleAuto` auto-resolution orchestrator (tactical projection,
  battle-init weather, minute loop to §32 end, `BattleResolutionResult`).
- `battle_resolution` phase wiring + campaign consequences (war score via
  existing `applyBattleResult`, ship HP damage/loss, sink removal, reservation
  clearing, `BattleInstance.result` recording).
- Determinism ×2, `*_v1` contract rollup, ADR-0025, golden regeneration per
  ADR-0007 with documented cause.
- M2 acceptance gate: `docs/acceptance/m2-capability-registry.md`, §23 sign-off,
  traceability refresh.

## Out of scope (deferred)

- DESIGN-38 §34 statistical study (REL-1); region climate YAML (CONTENT-track);
  player tactical UI (UI-track); crew/officer/political consequences (M3+);
  `BattleResolver` removal (M1 fallback retained); B-1 AC-14 linkage (CONTENT).

## Required implementation

Public contract, phases orders 0.5/8 wiring, deterministic ship/unit projection,
canonical weather init, explicit consequences, stable diagnostics, save/load/
replay of the new snapshot shape, no ambient randomness/time/env.

## Acceptance tests

See spec §1.1 AC-1..AC-14 with exact test files; plus property/invariant
(terminal removal clamp), save/load, replay, two-process determinism, golden
regression, and contract-set-equality guards.

## Determinism proof

Two child runs byte-identical incl. new battle-result keys; no golden drift
outside ADR-0007-regenerated hashes; `BattleResolver`/`StrengthCalculator`
unmodified.

## Compatibility and versions

CampaignSnapshot gains weather → compatibilityVersion bump + migration/reject
documented; serializer canonical area ordering; persistence schema follows.

## Performance observations

Auto-resolve bounded by 360-minute cap & deterministic; domain packages do not
read wall-clock/env/fs-order.

## Stop conditions

In addition to AUTONOMOUS-AGENT rules: if battle enemy viability semantics
disagree (winner/loser rule not specified in DESIGN), stop; if applying ship loss
requires inventing crew/officer/of sort beyond hp remove, defer & record; if the
`BattleResult` shape can't satisfy DESIGN-31 without altering ADR-0010, stop.

## Required delivery

- code + tests; traceability (SPRINT-PLAN row, PROGRESS); ADR-0025; validation
  report `.ai/reports/b6-m2-battle-results-impl.md`; changed-file summary; small
  Conventional Commits on `dev`; PR description only if remote push available.
