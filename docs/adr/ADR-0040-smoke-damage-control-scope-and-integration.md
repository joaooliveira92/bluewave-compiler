# ADR-0040: Smoke Module + Damage-Control Extension — Scope, Integration, and Policy

## Status

Accepted 2026-08-28

## Context

C-5 implements the smoke module (DESIGN-42 §§7-23) and the damage-control extension
(DESIGN-41 §§13-22, §24-25, §27-28) in `@bluewave/combat`. These two bodies of work:

- Span 24 DESIGN sections across three design documents (DESIGN-42, DESIGN-41,
  DESIGN-55).
- Introduce a new `smoke/` package within `packages/combat/src/` — the first
  domain module added since B-5 weather.
- Extend the existing damage module with per-minute fire resolution, flooding
  resolution, and damage-control resource allocation.
- Add a per-minute engine stage at step 5.5 (smoke) and step 8.6 (damage control).
- Use a simplified spatial model (centroid-radius + line-segment intersection)
  rather than a grid-based approach.

We must decide the scope boundary, integration timing, constant-authoring policy,
and reason-code ownership for each module.

This ADR captures those decisions so later tracks (C-5 continuation, M3) can
integrate without ambiguity.

## Decision

### Decision 01: Smoke module scope boundary

C-5 ships the full DESIGN-42 smoke value model as pure functions in
`packages/combat/src/smoke/`:

1. **Funnel smoke profile** (§7) — base density, fuel/power multipliers.
2. **Wind retention** (§9-10) — density multipliers by wind band.
3. **Smokescreen generation** (§11) — ship eligibility, equipment/consumable
   checks, cooldown, density, generation interruption.
4. **Smoke float** (§12) — technology/capacity/inventory checks, deployment speed
   limit, emission duration.
5. **Smoke generator** (§13) — technology/charges checks, emission duration,
   cooldown.
6. **Equipment mode conflict** (§14) — mutually exclusive smoke-source modes.
7. **Smoke density accumulation** (§15) — multi-source density with stacking and
   saturation.
8. **Drift and decay** (§16-17) — centroid displacement per wind, density decay
   per precipitation.
9. **Line-segment intersection** (§18) — simplified spatial test.
10. **Source precedence** (§19) — tie-breaking by source type and creation time.
11. **Smoke resolution step** (§22-23) — per-minute smoke lifecycle step 5.5:
    drift/decay for all active clouds; event records (SMOKE_SOURCE_REMOVAL,
    DRIFT_DECAY).
12. **Reason codes** (§30) — full §30 subset (15 codes) + `SMOKE_RESOLUTION_DEFERRED`
    marker.
13. **Contracts** — `SmokeCloudContract`, `FunnelSmokeProfileContract`,
    `SmokeConstantsContract` with `validateAllSmokeContracts`.
14. **Constants** — all numeric values as TypeScript constants; YAML constants
    deferred.

**Deferred smoke behaviors** (recorded, owned by C-5 continuation or later track):
- Smoke impact on gunnery accuracy (visibility modifier in B-3/gunnery).
- Smoke impact on spotting (detection modifier in B-2/spotting).
- Smoke-related tactical command effects (DESIGN-50).
- Full terminal state machine for smoke sources (expiration, removal triggers).
- Survivors/rescue mechanics on sinking ships within smoke.

### Decision 02: Damage-control scope boundary

C-5 ships the DESIGN-41 damage-control extension as pure functions within
`packages/combat/src/damage/`:

1. **Fire resolution** (§22-23) — per-minute fire intensity decay, suppression,
   spread, extinguishment. Rate-of-fire penalty bands. Night visibility signature.
   Fire smoke strength.
2. **Flooding resolution** (§14-18) — per-minute flooding ingress/egress, severity
   classification, speed-pressure multipliers, high-speed loss, dewatering.
3. **Damage-control resource allocation** (§27-28) — 9-step priority ordering,
   resource pool definitions (teams, pumping, firefighting, crew), allocation logic.
4. **Damage-control engine wiring** — step 8.6 `resolveDamageControl` called after
   damage resolution (step 8.5/9-10), before hash computation.
5. **Reason codes** — `FIRE_SPREAD_CREATED`, `FIRE_EXTINGUISHED`,
   `FIRE_INTENSITY_CHANGED`, `FLOODING_HIGH_SPEED_LOSS_CHECK`,
   `DAMAGE_CONTROL_ALLOCATION_FAILED`.
6. **Constants** — `firePolicyId`, `floodingPolicyId`, `damageControlPolicyId`
   with versioned ruleset and formula identifiers.

**Deferred damage-control behaviors** (recorded, owned by later track):
- Aluminum superstructure fire vulnerability (DESIGN-41 §19).
- Progressive flooding failure multiplier (DESIGN-41 §18) — uses `10_000` default.
- Carrier operations obstruction by fire (§26).
- Ship mission kill, stabilized, abandoned, scuttled, captured, recovered states.
- Survivor rescue, sinking credit confirmation.

### Decision 03: Engine wiring

1. **Smoke resolution (`resolveSmoke`)** at step 5.5 — after movement intent,
   before propulsion. Pure function taking `SmokeContext` (clouds, wind,
   precipitation) and returning `SmokeStageResult` (next clouds, events).
2. **Damage-control resolution (`resolveDamageControl`)** at step 8.6 — after
   damage/torpedo resolution (steps 1-8.5), before hash computation. Pure function
   taking `DamageControlContext` (fire/flooding records, resources, speed, RNG)
   and returning `DamageControlStageResult` (updated records, allocations,
   smoke events).
3. Goldens regenerate under ADR-0007 (cross-process determinism) when the smoke
   or damage-control stage is wired into the per-minute pipeline.

### Decision 04: Spatial model

Simplified centroid-radius + line-segment intersection (DESIGN-42 §18). The
`lineIntersection` module computes whether a line segment (ship LOS) intersects
a circle (smoke cloud centroid + radius). Grid-based or Voronoi spatial
partitioning is deferred; the simplified model is correct for the C-5 spatial
scope.

### Decision 05: Pipeline extension

Separate `resolveDamageControl` stage (step 8.6), NOT inlined into the existing
damage pipeline. This preserves the existing damage pipeline (steps 1-8.5)
unchanged. The damage-control stage operates on the output of the damage stage
and produces its own event records.

### Decision 06: Reason codes and contracts

1. **Smoke reason codes**: Full DESIGN-42 §30 set (15 codes) shipped in the
   `SMOKE_REASON_CODES` catalog plus `SMOKE_RESOLUTION_DEFERRED` marker (mirrors
   C-1's `TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED` precedent). Set-equality guard
   in `reason-codes-smoke.test.ts` forces explicit acknowledgment of any
   addition/removal.
2. **Damage-control reason codes**: `FIRE_SPREAD_CREATED`, `FIRE_EXTINGUISHED`,
   `FIRE_INTENSITY_CHANGED`, `FLOODING_HIGH_SPEED_LOSS_CHECK`,
   `DAMAGE_CONTROL_ALLOCATION_FAILED` added to the existing `DAMAGE_REASON_CODES`
   catalog. The existing set-equality guard (`reason-codes-damage.test.ts`) is
   updated in B-4/INC-6; the C-5 extension guard is in
   `reason-codes-damage-control.test.ts`.
3. **Contracts**: Full smoke contract rollup (`validateAllSmokeContractsRollup`)
   and existing damage contract rollup (`validateAllDamageContracts`). Both fail
   closed on any mismatch.

### Decision 07: Constants

All constants are TypeScript `const` declarations with explicit numeric types,
shipped in the module's `constants.ts` file. YAML constants (multi-game
source-of-truth) are deferred to a later infrastructure track.

## Consequences

1. **Golden regeneration**: Goldens will regenerate because the smoke stage
   (step 5.5) and damage-control stage (step 8.6) change per-minute hash values
   for any battle context that invokes them.
2. **Pre-smoke battles**: Battles that never enter the smoke module (no smoke
   clouds, no smoke-related events) have byte-identical hashes — the smoke stage
   is a strict no-op when given an empty cloud context.
3. **BattleResolver/StrengthCalculator**: Neither class is modified by C-5. The
   smoke and damage-control modules are self-contained pure functions.
4. **Integration boundary**: The smoke module does not re-export from the combat
   root index (`src/index.ts`). The damage-control extension only extends files
   within `src/damage/`.
5. **Cross-module code**: `WEATHER_SMOKE_STATE_INVARIANT_FAILED` is declared in
   both the weather module (B-5) and the smoke module (C-5). This is a documented
   §30 code reused across modules — both declarations produce the same string
   literal.
6. **ADR-0007**: Cross-process determinism is maintained; the smoke and
   damage-control stages accept their dependencies (wind, precipitation, RNG
   stream) as parameters, not ambient state.
7. **Traceability**: ENGINEERING-CONTRACT.md, DESIGN-42 §30, DESIGN-41 §47, and
   DESIGN-55 are the governing documents for scope and policy.

## Compliance

- **ENGINEERING-CONTRACT.md**: All new code follows strict TypeScript with `.js`
  imports, domain-separated random decisions, branded integers (where applicable),
  and explicit rounding for authoritative arithmetic.
- **DESIGN-42**: Full smoke module scope per §§7-23, §30.
- **DESIGN-41**: Damage-control extension per §§13-22, §24-25, §27-28, §47.
- **DESIGN-55**: Smoke and damage-control pipeline stage numbering per §5.