# Validation Report: D-4-IMPL INC-5 — Records + Ordering + Reason Codes + Contracts + Guaranteed Light-AA Disruption

## Outcome

`PASS`

## Scope delivered

D-4 INC-5 of the AA air-defense vertical slice (`@bluewave/combat/src/air-defense/`),
fifth of six D-4 implementation tickets. Landed 2026-09-22 on `origin/dev` (commit
`53ec75f`); adopted and re-validated 2026-10-06 during the `origin/dev` merge gate
(ADR-0044). Delivered:

- **Engagement records** (`records.ts`) — AC-15, §26: `AirDefenseEngagementRecord` carrying
  the full §26 body (timing, defender/attacker/attack/target identifiers, attack type and
  profile, layer, defense system + nullable director/radar channels, the nine §19 factor
  inputs, effective kill/damage/abort/disruption bp, rounds remaining/consumed, draw,
  outcome + `outcomeOrdinal` + `recordKind`, disruption severity, threat release and
  formation size, reason code, model/formula versions), policy id `air_defense_record_v1`.
  Records are immutable (`Object.freeze`, shallow suffices — primitives only) and hash via
  the shared `createEnvelope("air-defense-record", …)` canonical body hash:
  `computeAirDefenseEngagementRecordHash` / `verify…` / `assert…`. All seven §26 record
  kinds, null director/radar channels, and the full §1 layer union (incl. the deferred
  CAP/SAM layers) are supported. A tampered record fails with `AIR_DEFENSE_INVARIANT_FAILED`.
- **§27.8 outcome-effect ordinal** — `AIR_DEFENSE_OUTCOME_ORDINALS`: one canonical monotone
  table over all nine outcomes — INELIGIBLE 0 < EXHAUSTED 1 < DIRECTOR_ASSIGNED 2 <
  OPPORTUNITY_CREATED 3 < NO_EFFECT 4 < DISRUPTION 5 < ABORT 6 < DAMAGE 7 < KILL 8.
  `airDefenseOutcomeOrdinal` fails closed (`AIR_DEFENSE_INVARIANT_FAILED`) on an unknown
  outcome.
- **Guaranteed light-AA disruption opportunity record** (`createLightAaDisruptionOpportunityRecord`,
  AC-7): a GRANTED opportunity yields an immutable, verifiable record with `draw = 0`,
  `roundsConsumed = 0`, `outcome = OPPORTUNITY_CREATED` — no ammunition, hit, damage, or
  abort is guaranteed (§29.9); a NOT-created opportunity is rejected fail-closed.
- **Canonical ordering** (`ordering.ts`) — AC-15, §27: `compareAirDefenseEngagementRecords`
  realizes the eight §27 keys in document order — 27.1 arrival (minute → substep), 27.2
  layer (§1 order, unknown layer sorts LAST defensively), 27.3 defended-ship identifier,
  27.4 threat priority (§17 comparator: released first, closer to impact, defended ship
  first, formationSize descending, targetId ascending), 27.5 defense-system identifier,
  27.6 director then radar channel (null → `""`), 27.7 engagement/record id, 27.8 outcome
  ordinal — using codepoint `compareStrings` (never `localeCompare`).
  `canonicallySortedAirDefenseRecords` returns a sorted copy; the input array is never
  mutated.
- **§28 reason-code rollup** (`reasonCodes.ts`) — AC-16: **exactly** the 20 §28 codes in §28
  document order as the single authoritative `AIR_DEFENSE_SHIPPED_REASON_CODE_LIST`; the
  `AirDefenseReasonCode` union, `AIR_DEFENSE_REASON_CODES_SHIPPED` keyed object and
  `AIR_DEFENSE_REASON_CODE_SET` all derive from that one list, so the shipped count cannot
  drift from 20 without a compile-level change. Version id `air_defense_reason_codes_v1`.
  The 6 verbatim `*_DEFERRED` SAM markers are reserved outside the shipped set (no shipped
  code mentions SAM); `INVALID_AIR_DEFENSE_ATTACK` (§4) is retained as a documented
  boundary/superset code that is never shipped; the two INC-1 state codes
  (`INVALID_AIR_DEFENSE_STATE`, `INVALID_AIR_DEFENSE_SYSTEM_DEFINITION`) are §28 members and
  are in the shipped 20. Set-equality guards assert 20/20/6 and prior INC-1..INC-4 codes
  were not dropped.
- **Guaranteed light-AA disruption opportunity** (`light-aa-disruption.ts`) — AC-7, §29.8-9:
  `resolveGuaranteedLightAaDisruptionOpportunity` grants exactly ONE authoritative substep
  per eligible (system, attack) pair, inside the system's light-AA window, through a fixed
  predicate order (system may engage → operable → arc → envelope → channel → ammunition →
  window eligibility → granted) with deterministic reason reporting. It performs NO random
  draw and consumes NO ammunition: the §6 severity draw and its disruptive effects happen at
  attack resolution (INC-6) against the opportunity's exact check minute/substep, so only
  the check is guaranteed (§29.9). Fail-closed contradiction guard throws
  `AIR_DEFENSE_INVARIANT_FAILED` when eligibility claims true while a shared direct
  predicate contradicts it; the arc step is deliberately excluded (light-AA eligibility
  never checks the arc — the resolver owns out-of-arc reporting).
- **Versioned contracts** (`contracts.ts`) — AC-17: four strict-Zod literal contracts,
  every value a literal pinned to the shipped constants and every factory built from those
  same constants, so schema and content cannot silently diverge:
  - `air_defense_v1` — full ruleset manifest: `rulesetVersion`/`formulaVersion` anchors,
    `AIR_DEFENSE_SYSTEM_DEFINITION_FIELD_KEYS` (§3 schema keys), layer order, engagement
    formula + slot names, director/radar/CIWS tables, disruption multipliers, §29.8
    `guaranteedLightAaDisruption: { exactlyOneAuthoritativeSubstep: 1 }`, §7/§8/§21 anchors,
    `reasonCodesVersion` + the §28 `reasonCodes` tuple derived from the shipped list;
  - `aa_director_scaling_v1` (§12 table + shipped cap), `radar_saturation_v1` (§14 table),
    `ciws_redundancy_v1` (§16 table).
    Each has a fail-closed `validate*Contract` guard. **Contract registry**
    (`contractRollup.ts`, AC-17): `SHIPPED_AIR_DEFENSE_CONTRACTS` in canonical registry order
    (manifest first, then the three sub-contracts) plus the `validateAllAirDefenseContracts()`
    gate and a pinned module golden hash (`AIR_DEFENSE_CONTRACTS_GOLDEN_HASH`).
- **Exports** (`index.ts`): records, ordering, reason-code rollup, contracts, contract
  rollup and light-AA disruption modules exported.

**Explicitly deferred (per spec §1.3 / INC-6):** engine stage (step 7.8) + two-process child

- gate (INC-6), SAM layers (E-track), full damage model, full ammunition model. `BattleResolver`
  / `StrengthCalculator` unmodified.

## Decisions (recorded in ADR-0042 decisions 14-20)

| #   | Decision                                                                                                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14  | Exact-20 §28 catalog resolves decision 3's "presence-of-20": shipped = exactly the 20 §28 codes; `INVALID_AIR_DEFENSE_ATTACK` stays a documented boundary code outside the set; 6 SAM `_DEFERRED` markers are reserved, never shipped. |
| 15  | One ordered list (`AIR_DEFENSE_SHIPPED_REASON_CODE_LIST`, §28 document order) is the single source of truth — union, keyed constants, set and contract tuple derive from it; versioned `air_defense_reason_codes_v1`.                  |
| 16  | One canonical §27.8 outcome-effect ordinal table over all nine outcomes; the record's `outcomeOrdinal` field and the §27.8 ordering key both read it (fail-closed on unknown outcomes).                                                |
| 17  | Record integrity = shared envelope hash over a primitives-only body + `AIR_DEFENSE_INVARIANT_FAILED` (no new record-specific code); §26 immutability via `Object.freeze`.                                                              |
| 18  | §27 ordering is a total, deterministic codepoint order (unknown layer last, null channels as `""`, §17 comparator for threat priority, recordId final tiebreak); sort returns a copy.                                                  |
| 19  | The light-AA opportunity is a gate, not a draw: no RNG, no ammunition at opportunity creation; §6 severity draw deferred to attack resolution (INC-6); contradiction guard fail-closed with the arc deliberately excluded.             |
| 20  | Contracts are literal-pinned to shipped constants, registry-gated (`validateAllAirDefenseContracts`) and hash-pinned by a module golden; `air_defense_v1` also pins the system-definition field keys.                                  |

## Requirements evidence

| AC    | Symbols                                                                                                                                                                                                                                               | Proving tests                                                              |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| AC-7  | `resolveGuaranteedLightAaDisruptionOpportunity`, `LightAaDisruptionOpportunityResult`, `createLightAaDisruptionOpportunityRecord`, `LIGHT_AA_DISRUPTION_OPPORTUNITY_CREATED`                                                                          | `light-aa-disruption.test.ts` (13), `records.test.ts` (AC-7 factory block) |
| AC-15 | `AirDefenseEngagementRecord`, `createAirDefenseEngagementRecord`, `compute/verify/assertAirDefenseEngagementRecordHash`, `AIR_DEFENSE_OUTCOME_ORDINALS`, `compareAirDefenseEngagementRecords`, `canonicallySortedAirDefenseRecords`, `compareStrings` | `records.test.ts` (15), `ordering.test.ts` (18)                            |
| AC-16 | `AIR_DEFENSE_SHIPPED_REASON_CODE_LIST`, `AIR_DEFENSE_REASON_CODES_SHIPPED`/`_DEFERRED`/`_BOUNDARY`, `AIR_DEFENSE_REASON_CODE_SET`, `AirDefenseReasonCode`, `AIR_DEFENSE_REASON_CODES_VERSION`                                                         | `reason-codes-rollup.test.ts` (11)                                         |
| AC-17 | `AirDefensePolicy_v1`, `AaDirectorScalingPolicy_v1`, `RadarSaturationPolicy_v1`, `CiwsRedundancyPolicy_v1`, `validate*Contract`, `makeValid*_v1`, `SHIPPED_AIR_DEFENSE_CONTRACTS`, `validateAllAirDefenseContracts`                                   | `contracts.test.ts` (29)                                                   |

## Review status (merge context)

The implementation landed on `origin/dev` through its own orchestrator pipeline (commit
`53ec75f`); no reviewer report for this INC-5 exists — INC-2..4 had one, and the only INC-5
report in the repo covered the superseded 2026-08-31 _parallel_ implementation of the same
ticket, so it was removed with that run (ADR-0044) rather than kept as evidence for this code. What _was_ adversarial here: the 2026-10-06 conflict
resolution read this implementation line-by-line against the spec (union-merge of the two
runs was rejected because it broke the `air_defense_v1` field-key pinning and duplicated
the INC-1 reason-code sources), adopted it wholesale, and re-ran the full gate. A
reviewer-parity pass for INC-5 is optional follow-up, not a blocker (the code is covered by
86 new tests + the set-equality/hash pins).

## Commands and observed results

```text
pnpm --filter @bluewave/combat exec vitest run
   Test Files 262 passed (262) | Tests 3594 passed (3594)

packages/combat: vitest run test/air-defense/
   Test Files 20 passed (20) | Tests 357 passed (357)

pnpm -w turbo run build --force
   Tasks: 18 successful, 18 total

pnpm -w turbo run typecheck
   Tasks: 33 successful, 33 total

pnpm lint
   0 warnings, 0 errors

pnpm format
   clean (0 files)

node scripts/verify-golden-hashes.cjs
   All 10 hashes match golden reference

pnpm test:cross-process
   success: true

pnpm dev
   every watcher: "Found 0 errors. Watching for file changes."
   desktop dev server + electron start (15 tasks successful)
```

## Determinism evidence

- Golden hashes 10/10 unchanged (module still unwired; INC-6 wires the engine).
- Two-process determinism: `success: true`.
- Records: canonical envelope hash over a primitives-only body — no clock/randomness/locale;
  identical inputs → identical hashes, tampering → `AIR_DEFENSE_INVARIANT_FAILED`.
- Ordering: codepoint comparisons only (never `localeCompare`), total eight-key order,
  input array untouched; reason-code rollup: order and membership are compile-pinned.
- Pre-existing, unrelated: 7 `apps/desktop` timeouts in
  `useNewGameFlow.test.ts` (now tracked — `.scratch/desktop-test-failures/`); desktop does
  not import `@bluewave/combat` and was byte-identical to `origin/dev` at merge time.

## Canonical artifact changes

None. `scripts/verify-golden-hashes.cjs` 10/10. The contract golden
(`AIR_DEFENSE_CONTRACTS_GOLDEN_HASH`) is a _test-pinned module golden_, regenerated only as
a deliberate versioned release change — it does not participate in the engine artifact
goldens. Air-defense state hashes remain provisional (ADR-0042).

## Tests added

- `packages/combat/test/air-defense/records.test.ts` (15)
- `packages/combat/test/air-defense/ordering.test.ts` (18)
- `packages/combat/test/air-defense/reason-codes-rollup.test.ts` (11)
- `packages/combat/test/air-defense/contracts.test.ts` (29)
- `packages/combat/test/air-defense/light-aa-disruption.test.ts` (13)

Types: unit, boundary/fail-closed, canonical-value (set equality, ordinal monotonicity,
contract literals, pinned hash), determinism/reproducibility (hash stability, sort
non-mutation).

## Security and cancellation

- Fail-closed everywhere: unknown outcome → invariant failure; tampered record → invariant
  failure; contradictory eligibility state → invariant failure; non-created opportunity
  passed to the record factory → invariant failure; contract validation is a throwing guard.
- Contracts reject drift (strict `.strict()`-style schemas, literal tuples from shipped
  constants, registry + hash pinning).
- No ambient I/O/randomness/locale/timezone in this increment (the §6 draw is explicitly
  deferred to INC-6 attack resolution). No long-running operations (cancellation N/A).

## Performance observations

Bounded: record creation/hash O(fields); sort O(n log n) with O(1) keys; set/union
operations O(20); contract validation O(1) per shipped entry. Not otherwise collected.

## ADRs and dependencies

- **ADR-0042 extended** (decisions 14-20): exact-20 catalog resolution, single ordered
  reason-code source of truth, canonical outcome ordinal, envelope-hashed immutable
  records, total codepoint §27 order, gate-not-draw light-AA opportunity, literal-pinned
  contract regime.
- **ADR-0044**: why this implementation (not the 2026-08-31 parallel one) is authoritative.
- No third-party dependencies (Zod already in use).

## Known limitations and deferred requirements

- Engine stage (step 7.8) + two-process child + gate → INC-6.
- SAM layers (E-track), full damage model, full ammunition model → deferred (§1.3).
- Pre-existing unrelated: 7 desktop `useNewGameFlow.test.ts` timeouts (ticketed under
  `.scratch/desktop-test-failures/`).

## Changed files

Landed in `53ec75f` (15 files, +2328/−20): `packages/combat/src/air-defense/` — new
`records.ts`, `ordering.ts`, `light-aa-disruption.ts`, `contracts.ts`, `contractRollup.ts`;
modified `reasonCodes.ts` (rollup + versioned catalog), `air-defense-system-definition.ts`
(+36: field-key tuple), `constants.ts`, `engagement.ts`, `index.ts` (+5 exports); tests —
new `records.test.ts`, `ordering.test.ts`, `reason-codes-rollup.test.ts`,
`contracts.test.ts`, `light-aa-disruption.test.ts`.

## Git and remote status

- Branch: `dev`. Code commit `53ec75f` (origin/dev); adopted via merge commit `3e0f494`
  (ADR-0044); this report is part of the follow-up traceability commit.
- `BattleResolver`/`StrengthCalculator` unmodified (verified `git diff --name-only`).
- Push: performed for `dev` at session end.

## Secondary consistency check

- Air-defense suite: 357/357 across 20 files; combat suite 3594/3594 across 262 files.
- Scope confined to the air-defense module + docs (git diff --name-only).
- Goldens 10/10, cross-process `success: true`, gate green after all edits.
