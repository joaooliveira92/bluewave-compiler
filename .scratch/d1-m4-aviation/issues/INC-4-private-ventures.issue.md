# INC-4: Private Ventures

**Frontier: no** (blocked by: INC-3)

## Deliverable

Private-venture aircraft proposals: typed event `private_aircraft_venture_v1`, eligibility predicates, 12-month cooldown, max 3 unexpired, `PurchasePrivateAircraftProposalCommand`, 12-month expiry.

## Files

- `packages/combat/src/aircraft/private-venture.ts` — eligibility, cooldown, purchase, expiry
- `packages/combat/src/aircraft/event-types.ts` — `private_aircraft_venture_v1` event type

## Tests

- `aircraft/private-venture.test.ts` — eligibility, cooldown enforcement, max limit, purchase + insufficient payment, expiry

## Acceptance criteria

AC-12 (§11-12)

## Dependencies

INC-3 (development pipeline, proposal types)