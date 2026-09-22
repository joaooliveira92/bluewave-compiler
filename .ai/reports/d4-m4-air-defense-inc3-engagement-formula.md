# Validation Report: D-4-IMPL INC-3 — Engagement Formula + Disruption + Ammunition + Damage

## Outcome

`PASS`

## Scope delivered

D-4 INC-3 of the AA air-defense vertical slice (`@bluewave/combat/src/air-defense/`),
third of six D-4 implementation tickets. Delivered:

- **Engagement formula** (`engagement.ts`) — AC-11, §19: `effectiveDefenseBp =
  floor(baseDefenseBp × director × radar × crew × damage × ammunition × targetProfile ×
  weather × saturation / 10_000^8)` with one FLOOR. Bigint numerator (10^32 denominator),
  bound analysis documented (≤ 31_000 × 10^8 ≈ 3.1e37 > MAX_SAFE_INTEGER → bigint
  necessary, gunnery precedent). Exactly-one-primary-outcome mutually exclusive cumulative
  table (§5, §19 lines 328-330): KILL → DAMAGE → ABORT → DISRUPTION → NO_EFFECT, one keyed
  draw 0..9_999 via `engine.stream` + `drawUniform`. Factor bound enforced at the boundary
  (≤ `MAX_ENGAGEMENT_FACTOR_BP` = 31_000).
- **`resolveEngagement`** — pure per-engagement entry point (INC-6 target). Ammunition and
  damage factors are derived from authoritative state (not bypassable by callers); rounds
  consumed on every drawn engagement (incl. drawn NO_EFFECT, §20 line 334); zero-contribution
  path (empty/destroyed/unpowered) takes no draw and consumes nothing (§20 line 346).
- **Disruption** (`disruption.ts`) — AC-12, §6: shipped severity multipliers (LIGHT
  9_000/9_500, MODERATE 7_500/8_500, SEVERE 5_000/6_500, MISSION_ABORT → 0/0), per-layer
  highest-severity reduction (§6 line 125), cross-layer product with one floor, fail-closed
  duplicate-layer + out-of-range guards (`AIR_DEFENSE_INVARIANT_FAILED`).
- **Ammunition** (`ammunition.ts`) — AC-13, §20: magazines seeded from `magazineCapacity`
  at state construction; consume decrements exactly (fail-closed on insufficient reserve);
  empty → 0 multiplier → contributes zero; absent entry = documented opt-in "present".
- **Damage/power** (`damage-power.ts`) — AC-14, §21: simplified OPERATIONAL/DAMAGED/
  DESTROYED classification, damage/power multipliers, damage×power fold (one floor), local
  control 5_000 bp when `localControlSupported`.
- **Definition fields** — `roundsPerEngagement` (default 1), `magazineCapacity` (default
  1_000), `localControlSupported` (default false), validated fail-closed, hashed.

**Explicitly deferred (per spec §1.3 / INC-4..6):** director/radar/saturation multiplier
APPLICATION (INC-4 — this sprint supplies them as inputs), records + contracts + reason-code
rollup (full 20) + guaranteed light-AA disruption (INC-5), engine stage + two-process + gate
(INC-6), SAM layers (E-track), full damage/ammunition model.

## Requirements evidence

| AC | Symbols | Proving tests |
|----|---------|---------------|
| AC-11 | `computeEffectiveDefenseBp`, `resolveEngagementOutcome`, `drawAirDefenseOutcome`, `airDefenseEngagementStreamId`, `resolveEngagement`, `ENGAGEMENT_FORMULA_DENOMINATOR` | `engagement-formula.test.ts` (31 tests) |
| AC-12 | `DISRUPTION_MULTIPLIERS`, `disruptionSeverityRank`, `disruptionSeverityMultiplier`, `resolveLayerDisruption`, `computeStackedDisruptionMultipliers` | `disruption.test.ts` (17 tests) |
| AC-13 | `createAirDefenseState` (magazine seeding), `hasAmmunition`, `ammunitionMultiplierBp`, `consumeAmmunition`, `roundsForSystem` | `ammunition.test.ts` (12 tests) |
| AC-14 | `SystemDamageStatus`, `classifySystemDamage`, `damageMultiplierBp`, `powerMultiplierBp`, `effectiveDamageMultiplierBp`, `localControlMultiplierBp` | `damage-power.test.ts` (10 tests) |

## Reviewer findings (adversarial pass, source-verified)

Reviewer `APPROVE` on first pass (no blocker/high) with 2 MEDIUM + 5 LOW findings. All
closed by orchestrator-directed repairs (re-validated, 220 air-defense tests green):

- **MEDIUM-1 (repaired):** `magazineCapacity` was dead and default states had infinite
  ammo. `createAirDefenseState` now seeds `ammunitionByType` from `magazineCapacity`
  (§20 line 334, §29.21); repeated engagements drain to 0 then contribute zero.
- **MEDIUM-2 (repaired):** damage factor now derived from authoritative state
  (`effectiveDamageMultiplierBp(state.damageBp, state.powerBp)`) in `resolveEngagement`,
  mirroring the ammunition override — DESTROYED/unpowered contributes zero even if a caller
  passes neutral damageBp.
- **MEDIUM-3 (repaired + ADR-0042):** disruption stacking clamp (invented rule) removed;
  replaced with a fail-closed `[0, 10_000]` guard (`AIR_DEFENSE_INVARIANT_FAILED`). The
  stacking interpretation (one integer bp factor per metric, floored once at the stacking
  boundary, consumed by the final attack formula in ITS single final floor) recorded in
  ADR-0042.
- **LOW-4 (repaired):** engagement factors enforced ≤ 31_000 at the boundary; defensive
  `rawFloored > MAX_SAFE` throw.
- **LOW-5 (repaired):** `consumeAmmunition` fails closed on an insufficient explicit
  reserve instead of silently flooring to 0.
- **LOW-6 (recorded):** `draw: ZERO` sentinel documented (consumers disambiguate via
  `consumedRounds`); formalized in INC-5 records.
- **LOW-7 (repaired):** duplicate-layer representatives rejected in disruption stacking.
- **LOW-8 (repaired):** test file renamed `engagement.test.ts` →
  `engagement-formula.test.ts` (spec AC-11 traceability).

## Commands and observed results

```text
pnpm -w turbo run build --force
   Tasks: 18 successful, 18 total

npx tsc -b
   exit 0 (clean)

pnpm lint
   Found 0 warnings and 0 errors (1122 files)

packages/combat: npx vp test run test/air-defense/
   Test Files 12 passed (12) | Tests 220 passed (220)   # run twice, identical

packages/combat: npx vp test run
   254 files / 3457 tests passed

pnpm -w turbo run test
   35/36 tasks green. Known unrelated:
   - @bluewave/compiler-cli main.test.ts 15s timeout flake under parallel cold-transform
     load; passes standalone 95/95 (verified 3x). Not INC-3 (compiler-cli does not import
     the air-defense module).
   - apps/desktop 5 failures (TreasuryScreen, ConstructionWizard, project.test.ts ×3)
     verified PRE-EXISTING on clean HEAD (stash test, INC-2 gate).

node scripts/verify-golden-hashes.cjs
   All 10 hashes match golden reference

node packages/cross-process-test/dist/run-child.js
   success: true
```

## Determinism evidence

- Golden hashes 10/10 unchanged (module unwired; INC-6 wires the engine).
- Two-process determinism: `success: true`.
- Only randomness is the explicit keyed `RandomEngine` draw (`engine.stream(streamId)` +
  `drawUniform`); identical identity → identical stream → identical draw (tests prove
  reproducibility). No Math.random/wall-clock/env/locale. SafeInt + bigint-with-bound-analysis.
- Processes/OS: Windows, PowerShell 5.1, Node 24.

## Canonical artifact changes

None. Golden hashes unchanged. Air-defense state hashes remain provisional (ADR-0042).

## Tests added

- `packages/combat/test/air-defense/engagement-formula.test.ts` (31)
- `packages/combat/test/air-defense/disruption.test.ts` (17)
- `packages/combat/test/air-defense/ammunition.test.ts` (12)
- `packages/combat/test/air-defense/damage-power.test.ts` (10)

Types: unit, boundary/fail-closed, canonical-value, determinism/reproducibility.

## Security and cancellation

- Fail-closed strict Zod at construction boundaries (new definition fields), safe-int
  range rejection, factor-bound enforcement, insufficient-ammunition rejection.
- No ambient I/O/randomness/locale/timezone. No long-running operations (cancellation N/A).

## Performance observations

Bigint products are 9-factor × 10^32 at most — trivial. Not otherwise collected.

## ADRs and dependencies

- **ADR-0042 extended** (decision 7: disruption stacking rounding + fail-closed bound
  interpretation; decision 8: ammunition/damage factors state-authoritative in
  `resolveEngagement`; decision 9: magazine seeding at state construction).
- No third-party dependencies.

## Known limitations and deferred requirements

- Director/radar/saturation multiplier APPLICATION → INC-4 (this sprint consumes them as
  inputs).
- Records + full 20-code rollup + contracts + guaranteed light-AA disruption → INC-5.
- Engine stage + two-process child + gate → INC-6.
- Full damage model (weapon/director/radar/power/feed independent), full ammunition model
  (burst/cooling/reload/jams), post-release medium-AA → deferred (§1.3).
- Pre-existing unrelated: `pnpm format` repo-wide drift in this environment, desktop 5
  tests, compiler-cli parallel-timeout flake, `content-schema/test/nation.test.ts`.

## Changed files

`packages/combat/src/air-defense/` (new: engagement.ts, disruption.ts, ammunition.ts,
damage-power.ts; modified: constants.ts, air-defense-system-definition.ts,
air-defense-state.ts, reasonCodes.ts, index.ts); `packages/combat/test/air-defense/`
(new: engagement-formula.test.ts, disruption.test.ts, ammunition.test.ts,
damage-power.test.ts; modified: state.test.ts [magazine-seed assertion]).

## Git and remote status

- Branch: `dev`. Working tree: INC-3 changes to be committed by orchestrator.
- `BattleResolver`/`StrengthCalculator` unmodified (verified `git diff --name-only`).
- Push/PR: not performed. Merge performed: `no`.

## Secondary consistency check

- Air-defense suite run twice → identical 220/220.
- Scope confined to the air-defense module (git diff --name-only).
- Reviewer APPROVE + all MEDIUM/LOW closed with re-validation.