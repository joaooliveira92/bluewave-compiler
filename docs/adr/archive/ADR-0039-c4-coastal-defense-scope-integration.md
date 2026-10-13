# ADR-0039: C-4 Coastal Defense — Scope, Integration Boundary & Constant Policy

## Status

Accepted 2026-08-28

## Context

C-4 delivers a pure value model for coastal defense (DESIGN-48, 48 lines) in `@bluewave/combat`. DESIGN-48 is the shortest design document in the repository, but its contents span three integration domains: pure value-model mechanics (battery definitions, damage states, placement), tactical battle integration (coastal artillery in local battles), and strategic campaign integration (infrastructure consequences). We must decide the slice boundary, the integration timing, and the constant-authoring policy.

## Decision

### Scope boundary

C-4 ships the full DESIGN-48 **value model** as pure functions in `packages/combat/src/coastal-defense/`:

1. Coastal battery definitions (model, caliber, era band, AA capability flag)
2. Land target type classification (7 types)
3. Land target damage state progression (5-state linear: Intact→Suppressed→Damaged→Disabled→Destroyed)
4. Placement rules (predefined zones, seed-driven selection via keyed RNG stream)
5. Local mine-pressure contribution (value-only; produces `CoastalArtilleryMinePressure` record)
6. Value-only effectiveness formula (BigInt floor)
7. Records + canonical ordering + reason codes + contracts

### Deferred (battle/phase integration)

- **Battle participation** — coastal artillery appearing in tactical battles requires the tactical battle context (manifest, damage pipeline). Deferred to a C-4 continuation or M3 integration pass.
- **Campaign infrastructure consequence application** after battle requires strategic snapshot integration (B-6 pattern). Deferred.
- **AA capability progression** requires the M4 AA system (DESIGN-45). Deferred; captured as a `hasAA` boolean on the battery model.
- **Airfield and radar-site mechanics** are M4/D-track capabilities. Deferred; types are captured as discriminated union values only.
- **Two-process determinism child** — the canonical-ordering proof (AC-7) and the pure-function nature of the module make a cross-process child test high-overhead for low marginal confidence. Deferred; the integration-boundary proof and deterministic-sort tests replace it.

### Phase/snapshot integration boundary

No phase-engine registration or campaign snapshot schema change this sprint (mirrors C-2 and C-3 precedent). Golden hashes 10/10 must remain unchanged.

### Constant authoring policy

Constants are shipped as in-code TypeScript `*_v1` sets in `constants.ts`. YAML-authored content promotion is deferred to the phase-integration pass.

### Reason codes and contracts

Per the C-1/C-2/C-3 precedent: a dedicated `reasonCodes.ts` (7 in-slice codes + 1 `COASTAL_DEFENSE_RESOLUTION_DEFERRED` marker), versioned `*_v1` contracts (3 shipped: `coastal_battery_v1`, `land_target_types_v1`, `land_target_damage_states_v1`), and fail-closed `validate*Contract` guards. Set-equality test verifies the shipped set.

## Consequences

- DESIGN-48 is fully implemented as a value model (all 48 lines have corresponding code and tests).
- The integration path for battle/phase wiring is documented and the relevant code boundaries are sealed with `COASTAL_DEFENSE_RESOLUTION_DEFERRED` markers.
- M3 continues to C-5 (smoke + detailed damage control) with coastal defense complete at the `VERIFIED_NOT_INTEGRATED` level.
- `BattleResolver`/`StrengthCalculator` remain unmodified.
- Goldens 10/10 remain unchanged.