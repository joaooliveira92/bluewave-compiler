# Validation Report: D-4-IMPL INC-1 — Air Defense System Definitions + State Model + Constants

## Outcome

`PASS`

## Scope delivered

D-4 INC-1 of the AA air-defense vertical slice (`@bluewave/combat/src/air-defense/`),
as the first of six D-4 implementation tickets. Delivered:

- `AirDefenseSystemDefinition` (DESIGN-45 §3) with all fields, fail-closed strict Zod
  boundary validation (top-level `.strict()`, nested `fireControl`/`radar` `.strict()`,
  safe-int validation on every numeric field, known-field whitelist on partial input).
- `AirDefenseState` (DESIGN-45 §2) with all required fields and a deterministic
  `computeAirDefenseStateHash` via `createEnvelope` (sort-stabilized map/set collections,
  fixed key order, excludes the `stateHash` field).
- Canonical constants aligned to DESIGN-45: §12 director scaling (0..4 → 5_000/10_000/
  18_000/25_000/31_000), §14 radar medium-AA marginal schedule, §16 CIWS marginal
  schedule, §9 light-AA window durations (torpedo = 120), §9 knot speed bands with
  basis-point multipliers + `effectiveLightAAWindowMilliseconds` formula, §4 base
  defense values.
- `INVALID_AIR_DEFENSE_STATE` / `INVALID_AIR_DEFENSE_SYSTEM_DEFINITION` reason codes
  (§28) thrown as `BluewaveError` at construction/validation failures.

Reviewer returned `NEEDS_REWORK`; all source-verified findings repaired (see below).

**Explicitly deferred (per spec §1.3 / INC-5/6):** reason-codes rollup enum (full 20
codes → INC-5), `*_v1` contracts (INC-5), engine stage wiring (INC-6), layer
resolution/eligibility (INC-2), engagement/ammunition/damage/distruption (INC-3),
director/radar-saturation/CIWS-redundancy resolution (INC-4), SAM layers (E-track).

## Requirements evidence

| AC          | Symbols                                                                                                                                                                                                                                 | Proving tests                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| AC-1        | `validateAirDefenseSystemDefinition`, `createAirDefenseSystemDefinition`, `AirDefenseSystemDefinitionSchema`                                                                                                                            | `air-defense/system-definition.test.ts` (30 tests)                        |
| AC-2        | `createAirDefenseState`, `computeAirDefenseStateHash`, `AirDefenseState`                                                                                                                                                                | `air-defense/state.test.ts` (21 tests, incl. map/set ordering invariance) |
| (constants) | `DIRECTOR_SCALING_TABLE`, `RADAR_SATURATION_TABLE`, `CIWS_REDUNDANCY_TABLE`, `LIGHT_AA_WINDOW_DURATIONS`, `LIGHT_AA_SPEED_BANDS`, `effectiveLightAAWindowMilliseconds`, `radarMediumAaMarginalMultiplierBp`, `ciwsMarginalMultiplierBp` | `air-defense/constants.test.ts` (11 tests)                                |

## Reviewer findings repaired (source-verified against docs/rules/air-defense.md)

- HIGH-1: `baseKillBp/baseDamageBp/baseAbortBp/baseDisruptionBp/rate/saturationGroup`
  now validated with `safeIntSchema` (reject unsafe integers) instead of plain `z.number().int()`.
- HIGH-2: `RADAR_SATURATION_TABLE` corrected to §14 marginal schedule (1-4→10k, 5-6→5k,
  7-8→2.5k, 9+→500).
- HIGH-3: `CIWS_REDUNDANCY_TABLE` corrected to §16 marginal schedule (1-4→10k, 5-6→5k,
  7-8→1.5k, 9+→500).
- HIGH-4: failures now throw `BluewaveError` with `code: INVALID_AIR_DEFENSE_SYSTEM_DEFINITION`
  / `INVALID_AIR_DEFENSE_STATE`.
- MEDIUM-1: nested `fireControl`/`radar` schemas now `.strict()`.
- MEDIUM-2: `TORPEDO` light-AA window corrected to 120s (§9).
- MEDIUM-3: `LIGHT_AA_SPEED_BANDS` corrected to §9 knot schedule with bp multipliers
  (10_000/7_500/5_000/2_500); `effectiveLightAAWindowMilliseconds` added.
- Tests added: unsafe-integer rejection, nested unknown-field rejection, map/set
  ordering-invariance determinism, constants value assertions vs DESIGN-45, reason-code
  `.code` assertions.

## Commands and observed results

```text
pnpm -w turbo run build --force
  18 successful, 18 total

npx tsc -b
  exit 0 (clean)

pnpm lint
  Found 0 warnings and 0 errors (1110 files)

pnpm format
  All matched files use the correct format.

pnpm -w turbo run test --force
  Tasks: 36 successful, 36 total (0 failed)

node scripts/verify-golden-hashes.cjs
  All 10 hashes match golden reference

cd packages/combat && npx vp test run test/air-defense/
  3 files passed (62 tests): constants 11, system-definition 30, state 21

cd packages/cross-process-test && npx vp test run
  3 files, 17 tests passed
```

## Determinism evidence

- No authoritative content/snapshot hashes changed this increment (engine no-op).
- Golden verify: 10/10 unchanged (verified twice).
- Cross-process two-process determinism: 17/17 passed.
- `computeAirDefenseStateHash` order-invariance proven by tests (different map/set
  insertion order → identical hash).
- Processes/OS: current session (macOS, danwin), Node via pnpm workspace.

## Canonical artifact changes

None. No golden hash, content hash, or authoritative snapshot hash changed.

## Tests added

- `packages/combat/test/air-defense/system-definition.test.ts` (30)
- `packages/combat/test/air-defense/state.test.ts` (21)
- `packages/combat/test/air-defense/constants.test.ts` (11)

Types: unit, boundary/fail-closed, determinism/order-invariance, reason-code dispatch.

## Security and cancellation

- Fail-closed Zod schemas at all construction boundaries; nested objects strict.
- Unknown-field rejection; safe-integer range rejection at boundaries.
- No ambient I/O, wall-clock, Math.random, or locale/timezone dependence.
- No long-running operations; cancellation concerns N/A for this pure module.

## Performance observations

Not collected; pure synchronous data structures, negligible footprint.

## ADRs and dependencies

No new ADRs and no third-party dependencies. Uses existing `@bluewave/contracts`
(SafeInt, BluewaveError) and `@bluewave/deterministic` (createEnvelope).

## Known limitations and deferred requirements

- Full 20-code reason-codes enum + `*_v1` contracts → INC-5.
- Layer resolution, eligibility, engagement, ammunition, damage/disruption, director /
  radar / CIWS resolution logic → INC-2/3/4/6.
- SAM layers (HEAVY/MEDIUM/LIGHT_SAM) → E-track (deferred per spec).
- `PROTECTED_RADIUS` unit (m vs nm) and full §7 eligibility resolved in INC-2/4 (this
  increment defines the constant; eligibility semantics land with layer resolution).

## Changed files

`packages/combat/src/air-defense/` (constants.ts, air-defense-system-definition.ts,
air-defense-state.ts, index.ts); `packages/combat/test/air-defense/`
(system-definition.test.ts, state.test.ts, constants.test.ts [new]).

## Git and remote status

- Branch: `dev`.
- Working tree: has accumulated pre-existing uncommitted changes from prior
  interrupted session (separate commits). INC-1 air-defense module committed by
  orchestrator in a scoped commit (see commit hash in gate record).
- Push: not performed (no explicit request; remote sync handled separately).
- Pull request: none.
- Merge performed: `no`.

## Secondary consistency check

- Re-ran air-defense test files after repairs and formatting — 62 tests green.
- Re-verified lint/format/tsc clean and full 36/36 turbo test tasks plus 10/10 goldens
  and 17/17 cross-process before marking PASS.
