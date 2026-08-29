# Validation Report: D-1-IMPL INC-4 — Private Ventures

## Outcome

`PASS` — INC-4 fully implemented and verified through the orchestrator validation gate.

## Scope delivered

INC-4 (Private ventures) from D-1 M4 Aviation spec: typed event `private_aircraft_venture_v1`, 12-month cooldown, max 3 unexpired, `PurchasePrivateAircraftProposalCommand`, 12-month expiry.

### Files created

- `packages/combat/src/aircraft/event-types.ts` — `PrivateAircraftVenture_v1` typed event with hash
- `packages/combat/src/aircraft/private-venture.ts` — eligibility, cooldown, purchase, expiry logic
- `packages/combat/test/aircraft/private-venture.test.ts` — 23 tests

### Files modified

- `packages/combat/src/aircraft/reasonCodes.ts` — added `AIRCRAFT_PRIVATE_VENTURE_INELIGIBLE`, `AIRCRAFT_PRIVATE_PROPOSAL_EXPIRED`
- `packages/combat/src/aircraft/constants.ts` — added `PRIVATE_VENTURE_COOLDOWN_MONTHS=12`, `PRIVATE_VENTURE_MAX_UNEXPIRED=3`, `PRIVATE_PROPOSAL_LIFETIME_MONTHS=12`
- `packages/combat/src/aircraft/index.ts` — added `event-types`, `private-venture` exports

### Acceptance criteria

AC-12 (§11-12) — fully covered by 23 tests:

| Test area | Tests | Coverage |
|-----------|-------|----------|
| checkPrivateVentureEligibility | 8 | industry, prohibition, roles, cooldown, max limit |
| generatePrivateVentureProposal | 3 | field presence, deterministic, different seeds |
| resolvePrivateVenture | 5 | granted, ineligible, cooldown, limit, deterministic |
| purchasePrivateProposal | 3 | purchase, expired, insufficient payment |
| expirePrivateProposals | 4 | past expiry, within window, same month, non-PENDING |

## Commands and observed results

```text
# Clean uncached build
$ pnpm -w turbo run build --force
18/18 successful

# TypeScript
$ pnpm tsc -b
clean (exit 0)

# Format
$ pnpm format:fix
no new formatting changes

# Combat test suite
$ pnpm -w turbo run test --concurrency=1 --continue --filter @bluewave/combat
204 files / 2620 tests PASS (23 new private venture tests)

# Full engine test suites
$ pnpm -w turbo run test --concurrency=1 --continue
34/36 successful (2 pre-existing unrelated failures:
  content-schema/test/nation.test.ts — broken import;
  desktop — campaignBridge.test.ts, ConstructionWizard.test.tsx)

# Golden hashes
$ node scripts/verify-golden-hashes.cjs
All 10 hashes match golden reference

# Cross-process determinism
$ pnpm -w turbo run test --filter @bluewave/cross-process-test
3 files / 14 tests PASS
```

## Determinism evidence

- All private venture functions use keyed RNG streams; identical seeds produce identical proposals and events (proven by test).
- `resolvePrivateVenture` produces deterministic event hashes for same inputs.
- `purchasePrivateProposal` produces deterministic model content hashes.
- Golden hashes 10/10 unchanged (no phase/snapshot wiring in INC-4).

## Canonical artifact changes

None. INC-4 is a pure module addition within `@bluewave/combat/src/aircraft/`. No phase engine, snapshot, or golden hash changes.

## Pre-existing failures (not INC-4 blocking)

- `content-schema/test/nation.test.ts` — broken import (deleted corpus).
- `apps/desktop` — campaignBridge.test.ts (NOT_IMPLEMENTED→INVALID_PAYLOAD), ConstructionWizard.test.tsx ("ship name" assertion over-match).

## Tests added

23 tests in `packages/combat/test/aircraft/private-venture.test.ts` covering:
- eligibility predicate (8 tests)
- proposal generation (3 tests)
- monthly resolution (5 tests)
- purchase command (3 tests)
- expiry resolution (4 tests)

## Security and cancellation

N/A — pure functions, no I/O, no ambient randomness.

## ADRs and dependencies

No new ADR this increment. ADR deferred to INC-9 (contracts rollup + ADR + gate).

## Known limitations and deferred requirements

Per spec §1.3: mission roles, experience/fatigue, production pipeline, tactical battle engagement, content YAML all deferred.

## Changed files

```
A  packages/combat/src/aircraft/event-types.ts           — private_aircraft_venture_v1 typed event
A  packages/combat/src/aircraft/private-venture.ts        — eligibility, cooldown, purchase, expiry
A  packages/combat/test/aircraft/private-venture.test.ts  — 23 tests
M  packages/combat/src/aircraft/reasonCodes.ts            — INC-4 reason codes
M  packages/combat/src/aircraft/constants.ts              — private venture constants
M  packages/combat/src/aircraft/index.ts                  — export new modules
M  .ai/SPRINT-PLAN.md                                     — INC-4 DONE, next INC-5
M  docs/PROGRESS.md                                       — INC-4 DONE
```

## Secondary consistency check

- All 23 tests pass deterministically.
- `rg "AIRCRAFT_PRIVATE_VENTURE_INELIGIBLE" packages/combat/src/aircraft/` — 3 references (definition, import, use).
- `rg "AIRCRAFT_PRIVATE_PROPOSAL_EXPIRED" packages/combat/src/aircraft/` — 2 references (definition, import).
- Spec (`.scratch/d1-m4-aviation/spec.md`) AC-12 fully covered.
- No `OPEN DECISION` markers resolved.
- `BattleResolver`/`StrengthCalculator` unmodified (no imports, no changes).