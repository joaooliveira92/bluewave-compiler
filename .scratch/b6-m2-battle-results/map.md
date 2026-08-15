# Wayfinder Map: M2 Battle Results → Campaign Integration + M2 Acceptance Gate (B-6)

## Destination

Close M2 `M2_SURFACE_TACTICAL_CORE` per DESIGN-55 §3/§23. Two coordinated results:

1. **Campaign integration** — wiring the B-1..B-5 `@bluewave/combat` tactical
   engine into the monthly phase pipeline: the `weather_generation` phase
   (registry order 0.5) actually publishes per-area `StrategicWeatherState`; the
   `battle_resolution` phase (order 8) deterministically **auto-resolves each
   pending accepted battle** by running the DESIGN-38 minute-advance tactical
   simulation to a §32 battle-end, producing a campaign-compatible `BattleResult`
   (winner/loser + damageReport) that feeds the existing `applyBattleResult`
   war-score/victory path, with per-ship damage/loss applied back to
   `NationState.fleets[].ships`.
2. **M2 acceptance gate** — applying DESIGN-55 §9 to every M2 capability and
   signing `M2_SURFACE_TACTICAL_CORE` COMPLETED per §23, materialized as
   `docs/acceptance/m2-capability-registry.md`.

This is the campaign/battle seam: everything tactical built in B-2..B-5 becomes
**reachable** from a normal monthly turn. It is also the largest snapshot-surface
change so far: the campaign snapshot must carry per-area strategic weather, and
battle results flow back into ships + war score.

## Notes

- Packages: `@bluewave/combat` (pure auto-resolution orchestrator +
  battle-end evaluation), `@bluewave/campaign` (snapshot strategic-weather
  shape), `@bluewave/phase-engine` (phase wiring). `@bluewave/combat`
  `BattleResolver`/`StrengthCalculator` remain the **M1 fallback**; the tactical
  engine becomes the default resolution for battles carrying a B-1 manifest.
- Skills: `/grilling` + `/to-spec` for scope; `/research` for war-score and
  battle-outcome grounding; `/to-tickets` for slicing.
- ADRs required: B-6 integration/scope boundary (mirrors ADR-0018/0020/0022),
  strategic-weather snapshot shape, battle-result→campaign consequence policy,
  goldens regeneration (ADR-0007) when snapshot/phase behavior changes.
- Performance: auto-resolving every earned battle must stay deterministic and
  bounded. The auto-resolution path runs the same engine the cross-process child
  uses; no wall-clock, threads, or ambient I/O enters authority.

## Decisions so far

- [Scope Boundary](issues/01-scope-boundary.md) — **resolved.** "Battle results"
   = the B-1..B-5 surface gains a campaign-facing auto-resolution path + ship
   loss / war-score propagation. The full statistical validation study
   (DESIGN-38 §34 / §37.33, 1_000 paired runs) is deferred to REL-1 (packaged
   smoke), with the deterministic auto-resolution path + two-process proof
   delivered here.
- [Auto-Resolution Path](issues/02-auto-resolution-path.md) — **resolved.**
   `@bluewave/combat` gets a `resolveBattleAuto` orchestrator consuming a battle
   + B-1 manifest + campaign ships/strategic weather, returning a DESIGN-38
   `BattleResolutionResult`; `month.ts` `battle_resolution` calls it for
   manifest-carrying battles.
- [Strategic Weather Snapshot](issues/03-strategic-weather-snapshot.md) —
   **resolved.** Per-area `StrategicWeatherState` persisted on the campaign
   snapshot so `weather_generation` and battle initialization are deterministic.
- [Campaign Consequences](issues/04-campaign-consequences.md) — **resolved.**
   War score via existing `applyBattleResult`; per-ship damage/loss applied to
   fleet ships; `inBattleId` reservations cleared after resolution.
- [Goldens + Determinism](issues/05-goldens-determinism.md) — **resolved.**
   Two-process byte-identical + golden regression (ADR-0007) after snapshot
   change, with old/new cause documented.
- [M2 Acceptance Gate](issues/06-m2-acceptance-gate.md) — **resolved.**
   Materialize `docs/acceptance/m2-capability-registry.md`, sign
   `M2_SURFACE_TACTICAL_CORE` COMPLETED, refresh traceability.

## Decision tickets resolved (2026-08-15, B-6 scoping)

| Ticket | Result |
|--------|--------|
| [01-scope-boundary](issues/01-scope-boundary.md) | resolved — battle-results seam + deferrals (stat study→REL-1, climate→CONTENT, UI→UI-track) |
| [02-auto-resolution-path](issues/02-auto-resolution-path.md) | resolved — `resolveBattleAuto` pure orchestrator in `@bluewave/combat` |
| [03-strategic-weather-snapshot](issues/03-strategic-weather-snapshot.md) | resolved — current-month per-area `StrategicWeatherState` on snapshot; default `climate_profile_v1` |
| [04-campaign-consequences](issues/04-campaign-consequences.md) | resolved — reuse `applyBattleResult`; ship hp/loss apply; reservations cleared |
| [05-goldens-determinism](issues/05-goldens-determinism.md) | resolved — ADR-0007 documented regen; two-process byte-identical |
| [06-m2-acceptance-gate](issues/06-m2-acceptance-gate.md) | resolved — §9 registry + §23 sign-off + traceability |

Spec: `spec.md` (AC-1..14, INC-1..5). Brief: `.ai/briefs/b6-m2-battle-results.md`.
Research: `docs/research/b6-m2-battle-results.md`. Next: B-6-IMPL INC-1.