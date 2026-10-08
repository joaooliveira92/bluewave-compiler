# Decision 05: Reason codes and contracts

## Question

What reason codes and contracts should C-4 ship?

## Options

**A. Full set.** Ship all reason codes implied by DESIGN-48's validation rules (invalid placement, invalid target type, invalid damage transition, missing battery definition) plus contracts for every shipped constant (`coastal_defense_v1`, `land_target_types_v1`, `damage_states_v1`, `placement_rules_v1`).

**B. Minimal set.** Ship only the type definitions and skip the contract/validation scaffolding.

## Decision

**Option A.** Follow the C-1/C-2/C-3 precedent: every module ships its own `reasonCodes.ts` (in-slice codes + a `COASTAL_DEFENSE_RESOLUTION_DEFERRED` marker for deferred battle-integration items) and versioned `*_v1` contracts with fail-closed `validate*Contract` guards. Set-equality test at the end (INC-6) verifies no silent addition. Reason-code catalog records every decision.