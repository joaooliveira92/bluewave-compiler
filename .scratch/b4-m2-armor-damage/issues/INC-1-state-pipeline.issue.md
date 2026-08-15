# INC-1 — ShipDamageState + Pipeline Skeleton + Reason Codes + Constants

**State:** READY_FOR_AGENT (frontier, blocked by none)
**Spec:** `.scratch/b4-m2-armor-damage/spec.md` (AC-1..3, AC-15 seeds)

## Acceptance criteria
- AC-1 authoritative integer `ShipDamageState` (§1: shipId, ordered compartments + components, structural-integrity score, flotation-reserve score, stability score, fire-intensity records, flooding-source records, progressive-flooding total, performance modifiers, terminal-state status, ruleset/formula versions, aggregate hash); non-integers rejected (`INVALID_SHIP_DAMAGE_STATE` / `DAMAGE_STATE_INVARIANT_FAILED`); `assertFixedPointDamage` guards.
- AC-2 the seven §2 categories; every damaging event → ≥ one typed package or explicit `NO_EFFECT`; narrative never mutates state.
- AC-3 the §3 ten-stage pipeline orchestrator runs stages in exact order with the **no-skip empty-stage** rule (successful empty record) and **full-transaction rollback** on stage failure (`DAMAGE_RESOLUTION_FAILED`).
- AC-15 seeds: `damage_v1` policy + base `SHIPPED_DAMAGE_CONTRACT` + `validateDamageContract`.

## Notes
Mirror the B-3 pattern (`src/gunnery/state.ts`, `constants.ts`). Reason codes are the in-slice set from spec §1.4 / ticket 05; set-equality test lands in INC-6 but the catalog object ships here as `src/damage/reasonCodes.ts` (keep separate from shared catalog, like gunnery).