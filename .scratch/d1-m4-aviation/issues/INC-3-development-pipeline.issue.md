# INC-3: Development Pipeline

**Frontier: no** (blocked by: INC-2)

## Deliverable

Full aircraft development pipeline: request command, one-active-proposal slot, project lifecycle, development duration, proposal generation (keyed RNG), attribute allocation, acceptance/rejection. Constants for `aircraft_development_duration_v1`, `aircraft_role_baselines_v1`, `aircraft_trait_weights_v1`.

## Files

- `packages/combat/src/aircraft/development.ts` — request command, proposal slot enforcement, project lifecycle
- `packages/combat/src/aircraft/proposal.ts` — proposal generation, acceptance/rejection
- `packages/combat/src/aircraft/development-duration.ts` — duration formula (§7), `aircraft_development_duration_v1`
- `packages/combat/src/aircraft/attribute-allocation.ts` — role baseline, trait bonus, trade-off, modifiers (§9)
- `packages/combat/src/aircraft/constants.ts` — all shipped constant sets

## Tests

- `aircraft/development-request.test.ts` — valid request, duplicate traits, slot limit
- `aircraft/proposal-slot.test.ts` — one active, private venture slot limit
- `aircraft/development-project.test.ts` — lifecycle states, hash
- `aircraft/development-duration.test.ts` — base 4, range 3-6, modifiers
- `aircraft/proposal-generation.test.ts` — RNG stream, deterministic, no-reroll
- `aircraft/attribute-allocation.test.ts` — +10 per trait, -10 trade-off, bounds
- `aircraft/proposal.test.ts` — immutable proposal, acceptance/rejection

## Acceptance criteria

AC-5 (§4), AC-6 (§5), AC-7 (§6), AC-8 (§7), AC-9 (§8), AC-10 (§9), AC-11 (§10)

## Dependencies

INC-2 (state model types, contracts)