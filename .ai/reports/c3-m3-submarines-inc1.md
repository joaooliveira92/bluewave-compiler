# Validation Report: C-3-IMPL INC-1 — Submarine Strategic Representation, Types, Policies, Reason-Codes Seed

## Outcome

`PASS`.

## Scope delivered

INC-1 of `c3-m3-submarines` (C-3 sprint, spec AC-1, AC-2, AC-3, AC-18 seed, AC-21 seed):

- **Strategic representation (DESIGN-34 §1, AC-1):** `SubmarineStrategicAsset` full field set; exactly-one canonical representation (`PERSISTENT_UNIT` / `TYPED_FLOTILLA_POOL`) with missing/mixed value, type→representation coherence (COASTAL/MEDIUM_RANGE/LONG_RANGE/MINELAYING→`TYPED_FLOTILLA_POOL`, MISSILE→`PERSISTENT_UNIT`), and persistent-unit quantity≠1 all failing closed with `INVALID_SUBMARINE_REPRESENTATION`; deterministic aggregate hash via `createEnvelope`.
- **Type definitions (DESIGN-34 §4 + §9/§10, AC-2):** five canonical `SubmarineTypeDefinition`s with DESIGN-34-exact §9 remote-efficiency and §10 long-range ASW tables; non-normative authored fields recorded (range class, base-support requirement, mission-eligibility membership, tactical-projection ids, technology prerequisites); content-hash + fail-closed guards.
- **Policies (DESIGN-34 §5, AC-3):** three `SubmarinePolicyDefinition`s; warship+merchant allocation sums to exactly 10_000 with the neutral-incident multiplier as an independent scalar (5_000/10_000/20_000) — documented; `acceptSubmarinePolicyChange` value predicate + `SUBMARINE_POLICY_CHANGE_EFFECTIVE_AT`; command/IPC layer deferred per spec §3 / ticket 03.
- **Reason codes (spec §1.4, AC-18 seed):** `SUBMARINE_REASON_CODES` catalog, 14 DESIGN-34 §27 codes + in-slice `SUBMARINE_RESOLUTION_DEFERRED` marker; INC-1 exercises only `INVALID_SUBMARINE_REPRESENTATION`.
- **Contracts (spec §1.3, AC-21 seed):** `submarine_strategic_asset_v1`, `submarine_types_v1`, `submarine_policies_v1` + `SHIPPED_*_CONTRACT` surfaces + fail-closed `validate*Contract` guards.
- **Explicitly deferred:** tactical allocation/loss (§2–3), returning-ship interception (§21), ASW resolution (§22), friendly-fire risk/outcome (§23–24), strategic attack loss application (§19) — battle/attack machinery or DESIGN-29 unassigned; INC-8 owns the full rollup, set-equality test, two-process determinism child, ADR, and consolidated report.

## Requirements evidence

- **AC-1** — `SubmarineStrategicAsset`, `assertSubmarineStrategicAssetSurface`, `strategicRepresentationForType`, `withSubmarineStrategicAssetAggregateHash` (`model.ts`); `test/submarines/strategic-representation.test.ts` (15 tests: canonical values, missing/mixed fail-closed, quantity≠1 for persistent, coherence both directions, hash round-trip).
- **AC-2** — `SHIPPED_SUBMARINE_TYPE_DEFINITIONS`, `submarineTypeDefinitionById`, `SUBMARINE_REMOTE_EFFICIENCY_BP`, `SUBMARINE_ASW_VULNERABILITY_BP`, `SUBMARINE_NEUTRAL_ASW_VULNERABILITY_BP` (`model.ts`); `test/submarines/type-definitions.test.ts` (14 tests: five-type closeness, §9/§10 exact tables, content-hash, fail-closed lookup).
- **AC-3** — `SHIPPED_SUBMARINE_POLICIES`, `submarinePolicyById`, `acceptSubmarinePolicyChange`, `SUBMARINE_POLICY_CHANGE_EFFECTIVE_AT` (`model.ts`); `test/submarines/policies.test.ts` (11 tests: sum-to-10_000 invariant, neutral scalar bounds, no-op/canonical-change verdicts).
- **AC-18/AC-21 seed** — `SUBMARINE_REASON_CODES` (`reasonCodes.ts`); three `*_v1` contracts + guards (`contracts.ts`); `test/submarines/contracts.test.ts` (11 tests: tamper fail-closed, weights derived from the single shipped constants source, `policyChangeEffectiveAt`).

## Commands and observed results

```text
pnpm -w turbo run build --force
18 successful, 18 total (clean uncached build)

pnpm --filter @bluewave/combat exec vp test run
154 files / 1828 tests passed (incl. 54 submarine; baseline 1774 + 54)

pnpm --filter @bluewave/combat exec vp test run test/submarines/
4 files / 54 tests passed (determinism re-run: identical 54 passing)

pnpm --filter @bluewave/campaign-engine exec vp test run
13 files / 79 tests passed (no cross-package regression)

pnpm -w exec tsc -b
exit 0, clean

node scripts/verify-golden-hashes.cjs
All 10 hashes match golden reference (goldens byte-identical)

pnpm --filter @bluewave/combat exec vp lint src/submarines test/submarines
Found 0 warnings and 0 errors (9 files, 112 rules)

node_modules/.bin/vp fmt --check packages/combat/src/submarines packages/combat/test/submarines packages/combat/src/index.ts
All matched files use the correct format.
```

Only the 10 new submarines files + the permitted `packages/combat/src/index.ts` re-export changed (code commit `c2caf64`). Pre-existing failures outside this increment (`content-schema/test/nation.test.ts` broken import; desktop `ConstructionWizard.test.tsx` `ship name` assertion; `campaignBridge.test.ts` NOT_IMPLEMENTED vs INVALID_PAYLOAD) were not touched.

## Determinism evidence

- Content artifact hash: `createEnvelope` (`@bluewave/deterministic`) domain-separated aggregate/content hashes for asset, type definitions, policies — stable-key-sorted, SHA-256, locale-independent.
- Cross-process replay / two-process child: **unavailable** — AC-20's `run-submarines-child.ts` two-process determinism proof is an INC-8 deliverable; the 54-test suite run twice in independent processes returned identical results.
- Golden hashes: 10/10 match.
- No ambient `Math.random()`, `Date.now()`, env, filesystem, or network in `src/submarines/`.

## Canonical artifact changes

None. No snapshot schema, phase, engine-stage, or golden change. `src/index.ts` gained the single module re-export.

## Tests added

- `strategic-representation.test.ts` — 15 tests (boundary fail-closed, coherence, hash).
- `type-definitions.test.ts` — 14 tests (exact tables, closeness, hash, lookup).
- `policies.test.ts` — 11 tests (weight-sum invariant, change predicate).
- `contracts.test.ts` — 11 tests (guard fail-closed, derived weights).
- Regression coverage: full combat suite 1828 passing (mines/torpedoes/weather/damage regression-free).

## Security and cancellation

None applicable at this boundary: pure, stateless functions; no I/O, parsing, or cancellation points in scope.

## Performance observations

Submarine suite: 4.5s in the full combinator run, ~135ms standalone; no measured regression.

## ADRs and dependencies

None new. New dep: none added (uses existing `@bluewave/contracts` `BluewaveError`/`SafeInt` and `@bluewave/deterministic` `createEnvelope`). Design-time interpretation recorded for the INC-8 ADR: DESIGN-34 §5 "weights MUST sum to exactly 10_000" is satisfied by the warship+merchant allocation (FLEET 8_000+2_000, PRIZE 5_000+5_000, UNRESTRICTED 2_500+7_500); the neutral-incident multiplier is an independent scalar (5_000/10_000/20_000) — the only self-consistent reading of the §5 shipped integers.

## Known limitations and deferred requirements

See "Scope delivered — explicitly deferred". The report and consolidation entries live in the INC-1..INC-8 sequence; module functions ship codes only for the boundaries they own (INC-1 fires only `INVALID_SUBMARINE_REPRESENTATION`).

## Changed files

Code (commit `c2caf64`):
- `packages/combat/src/submarines/` — new module (`constants.ts`, `model.ts`, `reasonCodes.ts`, `contracts.ts`, `index.ts`).
- `packages/combat/test/submarines/` — new tests (4 files).
- `packages/combat/src/index.ts` — added `export * from "./submarines/index.js";` (the single permitted existing-file change).

## Git and remote status

- Branch: `dev`.
- Commits: `c2caf64` (this increment); `c840711` (prior progress/turbo update).
- Working tree: doc updates staged next (`.ai/SPRINT-PLAN.md`, `docs/PROGRESS.md`, this report).
- Push status: not pushed (origin historical lead resolved per plan; push deferred to release boundary).
- Pull request: none (work lands on `dev`; release via PR to `main` at boundary).
- Merge performed: `no`.

## Secondary consistency check

- Submarine re-run (fresh process): identical 54/54.
- `git diff --name-only HEAD`: only `.ai/SPRINT-PLAN.md` + `docs/PROGRESS.md` + this report beyond the code commit — no foreign package touched.
- Reviewer (pre-commit): APPROVE, no BLOCKER/HIGH; its MEDIUM findings (format, coherence guard) repaired and re-validated (54 tests post-repair, format clean, cleanup applied).