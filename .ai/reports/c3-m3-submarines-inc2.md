# Validation Report: C-3-IMPL INC-2 — Submarine Mission Eligibility & Reliability

## Outcome

`PASS`.

## Scope delivered

INC-2 of `c3-m3-submarines` (C-3 sprint, spec AC-4, AC-5, AC-21):

- **Mission eligibility (DESIGN-34 §6, AC-4):** seven canonical missions (`FLEET_INTERDICTION`/`MERCHANT_RAIDING`/`MINE_LAYING`/`RECONNAISSANCE`/`TACTICAL_BATTLE_SUPPORT`/`RETURNING_SHIP_INTERCEPTION`/`MISSILE_PATROL`) with §26.4 `missionPriority` authored field (ascending 1..7); 12-guard fail-closed eligibility predicate validates (in order) canonical mission, type membership, technology, range, base support, readiness, damage, reliability, fuel, policy, area, war state; ineligible → `SUBMARINE_MISSION_INELIGIBLE`, except reliability guard which fires `SUBMARINE_RELIABILITY_INSUFFICIENT` (the §7 owning boundary). Guard→reason-code partition documented in `SUBMARINE_MISSION_ELIGIBILITY_GUARDS`.
- **Reliability (DESIGN-34 §7, AC-5):** integer range 0..100; exact six-band operational multiplier table (0..19:4_000, 20..39:6_000, 40..59:8_000, 60..79:10_000, 80..94:11_000, 95..100:12_000); `SUBMARINE_RELIABILITY_OFFENSIVE_DEPLOYMENT_FLOOR = 20`; below floor → `SUBMARINE_RELIABILITY_INSUFFICIENT` with permitted operations subset (`REPAIR_TRANSFER`/`TRAINING`/`EMERGENCY_DEFENSE`).
- **Contracts (AC-21):** `submarine_missions_v1` and `submarine_reliability_v1` + `SHIPPED_*_CONTRACT` + `validate*Contract` fail-closed guards; mission contract validates strict-ascending priority uniqueness; reliability contract validates all six bands, range [0,100], and floor at 20.

## Requirements evidence

- **AC-4** — `isSubmarineMissionEligible` predicate, `SHIPPED_SUBMARINE_MISSION_DEFINITIONS`, `submarineMissionById`, `SUBMARINE_MISSION_ELIGIBILITY_GUARDS` (`missionEligibility.ts`); `test/submarines/mission-eligibility.test.ts` (31 tests: seven-mission enum, priority ordering, content-hash determinism, happy path, all 12 guards).
- **AC-5** — `reliabilityOperationalMultiplierBp`, `reliabilityOffensiveDeploymentVerdict`, `SUBMARINE_RELIABILITY_OPERATIONAL_MULTIPLIER_TABLE_BP`, `SUBMARINE_RELIABILITY_LOW_OPERATIONS` (`reliability.ts`); `test/submarines/reliability.test.ts` (21 tests: all six bands + boundaries, contiguous coverage, out-of-range fail-closed, offensive deployment verdict).
- **AC-21** — `SHIPPED_SUBMARINE_MISSIONS_CONTRACT`, `validateSubmarineMissionsContract`, `SHIPPED_SUBMARINE_RELIABILITY_CONTRACT`, `validateSubmarineReliabilityContract` (`contracts.ts`); contract tamper tests in both test files.

## Commands and observed results

```text
pnpm -w turbo run build --force
18 successful, 18 total (clean uncached build)

pnpm --filter @bluewave/combat exec vp test run
156 files / 1880 tests passed (incl. 106 submarine; baseline 1774 + 106)

pnpm --filter @bluewave/combat exec vp test run test/submarines/
6 files / 106 tests passed (determinism re-run: identical 106 passing)

pnpm -w exec tsc -b
exit 0, clean

pnpm --filter @bluewave/combat exec vp lint src/submarines test/submarines
Found 0 warnings and 0 errors (13 files, 112 rules)

pnpm -w exec vp fmt --check packages/combat/src/submarines packages/combat/test/submarines
All matched files use the correct format.

node scripts/verify-golden-hashes.cjs
All 10 hashes match golden reference (goldens byte-identical)
```

Pre-existing failures outside this increment (content-schema nation.test.ts, desktop e2e lint/format) untouched.

## Determinism evidence

- Content artifact hash: `createEnvelope` (`@bluewave/deterministic`) for mission definition content hashes — deterministic, SHA-256, locale-independent.
- Cross-process two-process child: **unavailable** — AC-20's `run-submarines-child.ts` is an INC-8 deliverable; the 106-test suite run twice in independent processes returned identical results.
- Golden hashes: 10/10 match.
- No ambient `Math.random()`, `Date.now()`, env, filesystem, or network in `src/submarines/`.

## Canonical artifact changes

None. No snapshot schema, phase, engine-stage, or golden change.

## Tests added

- `mission-eligibility.test.ts` — 31 tests (seven-mission enum, priority ordering, content-hash determinism, 12 guards, guard→code partition, contract fail-closed).
- `reliability.test.ts` — 21 tests (six-band table + boundaries, contiguous coverage, out-of-range fail-closed, offensive-deployment verdict, contract fail-closed).
- Regression coverage: full combat suite 1880 passing (baseline 1774 + 106 submarine; mines/torpedoes/weather/damage regression-free).

## ADRs and dependencies

None new. Existing `@bluewave/contracts` `BluewaveError`/`SafeInt` and `@bluewave/deterministic` `createEnvelope` used.

## Known limitations and deferred requirements

Same set as INC-1: tactical allocation/loss (§2–3), returning-ship interception (§21), ASW resolution (§22), friendly-fire risk/outcome (§23–24), strategic attack loss application (§19). Additionally, the `SUBMARINE_FUEL_INSUFFICIENT` dedicated code's fire is deferred to a later mission/fuel slice (INC-2 fires `SUBMARINE_MISSION_INELIGIBLE` for the fuel guard).

## Changed files

Code:
- `packages/combat/src/submarines/missionEligibility.ts` (new)
- `packages/combat/src/submarines/reliability.ts` (new)
- `packages/combat/src/submarines/contracts.ts` (modified — added two contracts)
- `packages/combat/src/submarines/constants.ts` (modified — added two policy ids)
- `packages/combat/src/submarines/index.ts` (modified — added re-exports)
- `packages/combat/src/submarines/reasonCodes.ts` (modified — comment update)
- `packages/combat/test/submarines/mission-eligibility.test.ts` (new)
- `packages/combat/test/submarines/reliability.test.ts` (new)

Docs:
- `.ai/SPRINT-PLAN.md` (updated INC-2 done, frontier to INC-3)
- `docs/PROGRESS.md` (updated C-3 status)
- `.scratch/c3-m3-submarines/issues/INC-2-mission-reliability.issue.md` (status→DONE)
- `.scratch/c3-m3-submarines/issues/INC-3-proximity-efficiency-vulnerability.issue.md` (frontier→yes)

## Git and remote status

- Branch: `dev`.
- Commit: (below, this report + code + docs together).
- Push status: not pushed.
- Pull request: none.

## Reviewer

APPROVE — no BLOCKER/HIGH findings. LOW finding (cosmetic message duplication) repaired: the reliability rejection message now derives from `SUBMARINE_RELIABILITY_LOW_OPERATIONS.join(", ")`, keeping the two surfaces synchronized.