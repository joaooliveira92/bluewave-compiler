# Validation Report: D-4-IMPL INC-5 — Records + Ordering + Reason Codes + Contracts + Guaranteed Disruption

## Outcome

`PASS` (reviewer VERDICT: APPROVE)

## Scope delivered

D-4 INC-5 of the AA air-defense vertical slice (`@bluewave/combat/src/air-defense/`),
the fifth of six D-4 implementation tickets. Delivered (implementor via the
orchestrator pipeline, adversarial review APPROVE, full orchestrator validation gate):

- **AC-7 (§10)** — `evaluateLightAADisruptionOpportunity()` (`light-aa-disruption.ts`):
  guarantees every eligible light-AA system at least one disruption check of one
  authoritative substep against each attack entering its valid terminal envelope.
  Prohibition checks (destroyed / unpowered / no ammunition / out-of-arc-range /
  target-ineligible / no channel) fail closed. Uses the §19 disruption-only base +
  neutral factors + `computeEffectiveDefenseBp`, the §5 outcome table
  (`resolveEngagementOutcome` with kill/damage/abort = 0 → only DISRUPTION or
  NO_EFFECT), and `determineDisruptionSeverity`. Sets
  `LIGHT_AA_DISRUPTION_OPPORTUNITY_CREATED` only when eligible. Satisfies §29.9:
  does NOT guarantee ammunition/hit/damage/abort. Pure + deterministic (supplied
  `randomBp` draw).
- **AC-15 (§26/§27)** — `AirDefenseEngagementRecord` (`records.ts`) carrying all §26
  required fields (battle minute/substep, defender/attacker ids, attack type/profile,
  layer/system, director/radar/crew/damage/power/ammunition state, timing/channel,
  scaling+saturation values, probability+random draw, outcome+disruption severity,
  formula/ruleset versions, policy id, record hash). Deterministic hash via
  `createEnvelope("air-defense-record", "air_defense_record_v1", body)` with
  `verify`/`assert`. `ordering.ts`: `compareAirDefenseEngagementRecords` implements
  the §27 eight-key canonical order (layer §1 order, defended id, threat proxy, system
  id, channel id, engagement id, outcome ordinal) using locale-free codepoint
  `compareStrings`; `canonicallySortedRecords` returns a new sorted array.
- **AC-16 (§28)** — `reason-codes.ts`: exactly the **20 shipped §28 codes**
  (no missing/extra, exact names), the `AIR_DEFENSE_REASON_CODE_SET` set-equality
  guard, and exactly **6 deferred SAM markers** (`*_DEFERRED`, excluded from the set).
  Reason-code literals from prior increments were relocated here from `constants.ts`
  (no duplication, no removal), matching the sibling `air-combat` pattern.
- **AC-17** — `contracts.ts` + `contractRollup.ts`: the four shipped `*_v1` contracts
  (`air_defense_v1`, `aa_director_scaling_v1`, `radar_saturation_v1`,
  `ciws_redundancy_v1`) as strict Zod literal contracts with literal tables matching
  the §12/§14/§16 shipped schedules exactly; fail-closed `validate*Contract` guards
  throw `BluewaveError(AIR_DEFENSE_INVARIANT_FAILED)`; `SHIPPED_AIR_DEFENSE_CONTRACTS`
  rollup + `validateAllAirDefenseContracts()`.

**Design decisions recorded in ADR-0043:** §27 step-4 ordering uses
`outcomeProbabilityBp` (descending) as a deterministic proxy for §17 threat priority
(replaced by a real `threatPriorityOrdinal` when §17 wiring lands); exactly six
deferred SAM markers (3 layer types × layer + engagement markers).

**Explicitly deferred (per spec / INC-6):** engine stage at step 7.8 (`resolve_air_defense`,
strict no-op), two-process determinism child (AC-19), integration-boundary proof,
SAM layers (E-track).

## Requirements evidence

| AC    | Symbols                                                                                                                                                                           | Proving tests                                  |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| AC-7  | `evaluateLightAADisruptionOpportunity`                                                                                                                                            | `light-aa-disruption.test.ts` (10)             |
| AC-15 | `AirDefenseEngagementRecord`, `createAirDefenseEngagementRecord`, `verify/assertAirDefenseEngagementRecordHash`, `compareAirDefenseEngagementRecords`, `canonicallySortedRecords` | `records.test.ts` (9), `ordering.test.ts` (12) |
| AC-16 | `AIR_DEFENSE_REASON_CODES_SHIPPED/_DEFERRED`, `AIR_DEFENSE_REASON_CODE_SET`                                                                                                       | `reason-codes-rollup.test.ts` (10)             |
| AC-17 | `validate{AirDefense,AaDirectorScaling,RadarSaturation,CiwsRedundancy}Contract`, `SHIPPED_AIR_DEFENSE_CONTRACTS`, `validateAllAirDefenseContracts`                                | `contracts.test.ts` (21)                       |

## Commands and observed results

```text
cd packages/combat && npx vp test run test/air-defense/
  21 files passed (343 tests)   [records 9, ordering 12, reason-codes-rollup 10, contracts 21, light-aa-disruption 10 new]

pnpm -w turbo run build --force
  18 successful, 18 total

npx tsc -b
  exit 0 (clean)

pnpm lint
  Found 0 warnings and 0 errors (1139 files)

pnpm format
  All matched files use the correct format.

pnpm -w turbo run test --force
  Tasks: 36 successful, 36 total (0 failed)
  combat: 3580 tests passed
  desktop: 528 tests passed

node scripts/verify-golden-hashes.cjs
  All 10 hashes match golden reference

cd packages/cross-process-test && npx vp test run
  3 files, 17 tests passed
```

## Determinism evidence

- All INC-5 functions are pure and deterministic: no `Math.random`, no wall-clock, no
  ambient I/O, no `localeCompare`. Random disruption check uses a supplied `randomBp`
  draw in [0, 10_000). Sorting is locale-free (codepoint `compareStrings`).
- Record hash via `createEnvelope` with a domain-separated artifact kind + policy id —
  deterministic, tamper-evident (`verify`/`assert`).
- Golden verify 10/10 unchanged (pure module, no snapshot/phase change); cross-process
  17/17 passed.

## Reviewer verdict

Adversarial reviewer: **APPROVE**. Findings: one MEDIUM (§27 step-4 uses
`outcomeProbabilityBp` as a deterministic proxy for §17 threat priority — acceptable
for the records-only increment, recorded in ADR-0043) and two LOW design-notes (step-7
`attackerId` as engagement-id tie-breaker; `LAYER_ORDER` fallback ordinal for deferred
layers). No blockers; all four ACs satisfied.

## Canonical artifact changes

None. No golden hash, content hash, or authoritative snapshot hash changed. This is a
pure un-wired module; `BattleResolver`/`StrengthCalculator` unmodified.

## Tests added

- `packages/combat/test/air-defense/light-aa-disruption.test.ts` (10)
- `packages/combat/test/air-defense/records.test.ts` (9)
- `packages/combat/test/air-defense/ordering.test.ts` (12)
- `packages/combat/test/air-defense/reason-codes-rollup.test.ts` (10)
- `packages/combat/test/air-defense/contracts.test.ts` (21)
- `packages/combat/test/air-defense/test-helpers.ts` (shared fixtures)

Types: unit, boundary/fail-closed (tampered hash, invalid contract, invalid draw,
prohibited systems), exhaustive set-equality + disjointness, eight-key ordering,
immutability, deterministic hash.

## Security and cancellation

- Fail-closed validation at every boundary (BluewaveError with
  INVALID_AIR_DEFENSE_STATE / INVALID_AIR_DEFENSE_SYSTEM_DEFINITION /
  AIR_DEFENSE_INVARIANT_FAILED as appropriate).
- Strict Zod contracts reject unknown fields.
- No ambient I/O, wall-clock, `Math.random`, or locale/timezone dependence.
- No long-running operations; cancellation N/A.

## Known limitations and deferred requirements

- §27 step-4 orders by the `outcomeProbabilityBp` proxy, not a real §17 threat ordinal
  (wired in later; ADR-0043).
- Deferred-layer records (SAM/CAP) would sort via the LAYER_ORDER fallback ordinal;
  updated when SAM ships on E-track.
- Engine stage wiring (step 7.8) + two-process determinism child + integration-boundary
  proof → INC-6 (AC-18/19/20).
- SAM layers → E-track.

## Changed files

`packages/combat/src/air-defense/` — NEW: `reason-codes.ts`, `records.ts`, `ordering.ts`,
`contracts.ts`, `contractRollup.ts`, `light-aa-disruption.ts`; MODIFIED: `constants.ts`
(reason-code literals relocated), `index.ts` (exports), and import updates in
`engagement.ts`, `layer-resolution.ts`, `air-defense-attack.ts`, `air-defense-state.ts`,
`air-defense-system-definition.ts`, `scaling.ts`. `packages/combat/test/air-defense/` —
NEW: the 5 test files + `test-helpers.ts`. `docs/adr/ADR-0043-*.md`.
`.scratch/d4-m4-air-defense/issues/05-*.md` DONE. New report file.

## Git and remote status

- Branch: `dev`.
- INC-5 committed by orchestrator after the full orchestrator validation gate + reviewer
  APPROVE.
- Push: not performed (no explicit request; remote sync handled separately).
- Pull request / merge: none.

## Secondary consistency check

- Re-ran air-defense suite (343 green) + full turbo test (36/36) after changes.
- Verified lint/format/tsc clean, goldens 10/10, cross-process 17/17 before marking PASS.
- Confirmed `git diff HEAD -- packages/combat/src/resolver packages/combat/src/strength-calculator`
  empty (`BattleResolver`/`StrengthCalculator` unmodified).
