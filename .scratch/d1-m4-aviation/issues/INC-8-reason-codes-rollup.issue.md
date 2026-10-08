# INC-8: Reason Codes Rollup + Set-Equality Guard

**Frontier: no** (blocked by: INC-7)

## Deliverable

Complete reason codes catalog with 15 shipped §40 codes + `AIRCRAFT_MISSION_ROLE_DEFERRED` marker. Set-equality guard test. Missing reason codes filled from earlier INCs.

## Files

- `packages/combat/src/aircraft/reasonCodes.ts` — full catalog (15 shipped + 1 marker)
- `packages/combat/src/aircraft/contractRollup.ts` — (or combined with reason codes)

## Tests

- `aircraft/reason-codes-rollup.test.ts` — set-equality vs §40, markers disjoint, retired never re-added

## Acceptance criteria

AC-24 (§40 set-equality)

## Dependencies

INC-7 (all earlier INCs must have declared their reason codes, this INC completes the catalog)