# Validation Report: D-4-IMPL INC-2 — Layer Resolution + Eligibility (Heavy/Medium/Light) + CIWS

## Outcome

`PASS`

## Scope delivered

D-4 INC-2 of the AA air-defense vertical slice (`@bluewave/combat/src/air-defense/`),
second of six D-4 implementation tickets. Delivered:

- **Incoming attack model** — `AirDefenseAttack` per DESIGN-45 §4 (`attack.ts`): 11
  canonical attack types, strict fail-closed Zod boundary validation, safe-int on every
  numeric field, bearing constrained 0..360.
- **Layer resolution** — `resolveDefenseLayers` (`layer-resolution.ts`) resolves the
  four AA layers in canonical order HEAVY_AA → MEDIUM_AA → LIGHT_AA →
  CIWS_TERMINAL_DEFENSE (§1); a layer with no eligible system emits the §1 "successful
  empty result" (`emptyEligible`); deterministic candidate ordering (codepoint `systemId`
  ascending × input attack order).
- **Heavy AA eligibility** (`heavy-aa-eligibility.ts`) — AC-4, §7: own-ship protection
  OR nearby protected ship within exactly 5 nm (resolved 9_260 m); range/altitude/speed/
  arc/director/radar/ammunition/power/operability predicates; unrelated-formation
  rejection outside the protected radius.
- **Medium AA eligibility + timing** (`medium-aa-eligibility.ts`) — AC-5, §8: single
  pre-release window, fire-control solution ≥ 4_000 bp, envelope + released-missed +
  resource predicates.
- **Light AA eligibility + windows** (`light-aa-eligibility.ts`) — AC-6, §9: base
  windows per profile (2/1/2/1/1 min), speed-band multipliers, `effectiveWindowMilliseconds
  = max(1_000, floor(base·bp/10_000))`, window-open test vs `timeToImpactMs`.
- **§18 eligibility matrix** (`eligibility.ts`) — layer×attack-type matrix restricted to
  the four AA layers with the canonical light-ASM exclusion on MEDIUM_AA and the
  heavy-AA dive/skip/torpedo exclusion; system-level gate via `profileEligibility`.
- **Reason-code seed** (`reasonCodes.ts`) — 7 canonical §28 eligibility codes +
  `INVALID_AIR_DEFENSE_ATTACK` boundary code (decision recorded in ADR-0042).
- **`arcDegreesMax`** added to `AirDefenseSystemDefinition` (spec §1.1 item 4 arc
  predicate; default 360, participates in the state hash).

**Explicitly deferred (per spec §1.3 / INC-3..6):** engagement formula/outcomes (INC-3),
director scaling + radar saturation + CIWS redundancy application (INC-4), records +
reason-codes rollup (full 20) + contracts + guaranteed light-AA disruption (INC-5),
engine stage + two-process + gate (INC-6), SAM layers (E-track), post-release medium-AA
modeling, CIWS nearby-ship protection (§25).

## Requirements evidence

| AC | Symbols | Proving tests |
|----|---------|---------------|
| AC-3 | `resolveDefenseLayers`, `DEFENSE_LAYER_ORDER`, `DefenseLayerResolution.emptyEligible` | `layer-resolution.test.ts` (8 tests) |
| AC-4 | `isHeavyAaEligible`, `HEAVY_AA_PROTECTED_RADIUS_M`, `HEAVY_AA_PROTECTED_RADIUS_NM` | `heavy-aa-eligibility.test.ts` (23 tests) |
| AC-5 | `isMediumAaEligible`, `MEDIUM_AA_FIRE_CONTROL_MINIMUM_BP` | `medium-aa-eligibility.test.ts` (13 tests) |
| AC-6 | `computeLightAaEligibility`, `effectiveLightAAWindowMilliseconds`, `LIGHT_AA_SPEED_BANDS` | `light-aa-eligibility.test.ts` (25 tests) |
| (attack model, §4) | `AirDefenseAttack`, `createAirDefenseAttack`, `validateAirDefenseAttack` | `attack.test.ts` (19 tests) |

## Reviewer findings (adversarial pass, source-verified)

Reviewer returned `NEEDS_REWORK` on first pass; all findings repaired, re-reviewed
`APPROVE`:

- **HIGH-1 (repaired):** `MEDIUM_AA` row of the §18 matrix included `LIGHT_ASM` —
  DESIGN-45 §18 line 313 lists light-ASM layers as CAP/MEDIUM_SAM/LIGHT_SAM/HEAVY_AA/
  LIGHT_AA/CIWS only; MEDIUM_AA is deliberately absent and §18 line 318 forbids a layer
  absent from the explicit eligibility set. Removed from the matrix + added a
  `NOT_ELIGIBLE` regression test even when the medium-AA system lists `LIGHT_ASM`.
- **MEDIUM-1 (orchestrator decision, ADR-0042):** `INVALID_AIR_DEFENSE_ATTACK` is not
  among the §28 codes. §28 says "MUST define at least" — a minimum set, so a documented
  21st boundary code is canonical-legal. INC-5's set-equality guard will assert presence
  of the 20 canonical codes, not exclusivity.
- **LOW-1 (orchestrator decision, ADR-0042):** `arcDegreesMax` in the state-hash body
  supersedes the provisional INC-1 hash; no persistence wiring yet (INC-6), so the model
  version bump is deferred to INC-6 persistence.
- **LOW-2 (repaired):** renamed a light-AA test that overclaimed the 1_000 ms clamp
  (asserted value 15_000 unchanged, correct math).
- **LOW-3 (orchestrator decision, ADR-0042):** `ANTI_RADIATION_WEAPON` mapped to the
  GUIDED light-AA profile by §18 line 316 inference, gated by explicit system listing.
- **LOW-4 (repaired):** medium-AA predicate order moved envelope-check before
  released-check to mirror §8's listing.

## Commands and observed results

```text
pnpm -w turbo run build --force
   Tasks: 18 successful, 18 total

npx tsc -b
   exit 0 (clean)

pnpm lint
   Found 0 warnings and 0 errors (1122 files)

pnpm format
   Repo-wide format check FAILS on pre-existing drift in this environment: vp v0.2.8
   flags ~1192 committed files including untouched files (e.g. packages/combat/src/
   air-combat/reasonCodes.ts, packages/combat/test/air-defense/constants.test.ts from
   INC-1, .ai/*.md). The 12 new INC-2 files pass `vp fmt --check` individually
   ("All matched files use the correct format."). Drift is pre-existing and unrelated
   to INC-2; recorded, not mass-reformatted (scope/rewrite discipline).

packages/combat: npx vp test run test/air-defense/
   Test Files 8 passed (8) | Tests 150 passed (150)

packages/combat: npx vp test run
   250 files / 3386 tests passed

pnpm -w turbo run test (warm)
   35 successful, 36 total; failures only pre-existing/unrelated:
   - @bluewave/compiler-cli test timeout on cold cache (flaky transform timing);
     warm re-run 7 files / 95 tests passed.
   - apps/desktop 5 failures (TreasuryScreen, ConstructionWizard, project.test.ts ×3)
     verified PRE-EXISTING: same 5 fail on clean HEAD with this sprint's changes
     stashed. M3 gate already documented 2 of these; INC-2 does not touch desktop.

node scripts/verify-golden-hashes.cjs
   All 10 hashes match golden reference

node packages/cross-process-test/dist/run-child.js
   success: true (two-process byte-identical)
```

## Determinism evidence

- No authoritative content/snapshot golden hash changed (10/10 unchanged; the module is
  not wired into any engine stage — INC-6).
- Cross-process two-process determinism: `success: true`.
- All predicates are pure; string ordering via codepoint (`<`/`>`, no `localeCompare`);
  no `Math.random`/wall-clock/env/locale; SafeInt everywhere at boundaries.
- Processes/OS: Windows, PowerShell 5.1, Node 24 via pnpm workspace.

## Canonical artifact changes

None. Golden hashes 10/10 unchanged. The air-defense state/definition hashes are
provisional (module unwired); the `arcDegreesMax` schema addition supersedes the INC-1
provisional hash (ADR-0042).

## Tests added

- `packages/combat/test/air-defense/attack.test.ts` (19)
- `packages/combat/test/air-defense/heavy-aa-eligibility.test.ts` (23)
- `packages/combat/test/air-defense/medium-aa-eligibility.test.ts` (13)
- `packages/combat/test/air-defense/light-aa-eligibility.test.ts` (25)
- `packages/combat/test/air-defense/layer-resolution.test.ts` (8)

Types: unit, boundary/fail-closed, canonical-value, determinism/ordering.

## Security and cancellation

- Fail-closed strict Zod at all construction boundaries (attack + system definition);
  unknown-field rejection; safe-int range rejection.
- No ambient I/O, wall-clock, randomness, locale, or timezone dependence.
- No long-running operations; cancellation N/A for this pure module.

## Performance observations

Not collected; pure synchronous eligibility predicates, negligible footprint.

## ADRs and dependencies

- New: **ADR-0042** (D-4 air-defense layer-resolution/eligibility decisions: protected-
  radius unit resolution, `arcDegreesMax` schema addition + provisional-hash
  supersession, `INVALID_AIR_DEFENSE_ATTACK` boundary code, ARW→GUIDED inference,
  §18 matrix encoding for the four AA layers).
- No third-party dependencies.

## Known limitations and deferred requirements

- Attack survival flow ("a surviving attack proceeds to the next eligible layer", §1)
  becomes meaningful with INC-3 engagement outcomes (kill/abort); INC-2 leaves the
  attack set unchanged by design.
- Post-release medium-AA engagement modeling deferred (INC-3+); released attacks
  report `PRE_RELEASE_MISSED`.
- CIWS nearby-ship protection (§25) deferred.
- Light-ASM system-specific terminal window modeled as `null` base window; the
  guaranteed-disruption substep lands in INC-5.
- Full 20-code reason-codes enum + contracts rollup → INC-5.
- SAM layers → E-track.
- Pre-existing unrelated failures documented: repo-wide `pnpm format` drift in this
  environment, desktop 5 tests, `content-schema/test/nation.test.ts` broken import.

## Changed files

`packages/combat/src/air-defense/` (new: attack.ts, reasonCodes.ts, eligibility.ts,
heavy-aa-eligibility.ts, medium-aa-eligibility.ts, light-aa-eligibility.ts,
layer-resolution.ts; modified: constants.ts, air-defense-system-definition.ts,
air-defense-state.ts, index.ts); `packages/combat/test/air-defense/` (new: attack.test.ts,
heavy-aa-eligibility.test.ts, medium-aa-eligibility.test.ts, light-aa-eligibility.test.ts,
layer-resolution.test.ts; modified: system-definition.test.ts [+arcDegreesMax fixture]).

## Git and remote status

- Branch: `dev`. Working tree: INC-2 changes staged by orchestrator in scoped commits.
- `BattleResolver`/`StrengthCalculator` unmodified (verified `git diff --name-only`).
- Push/PR: not performed (no explicit request).
- Merge performed: `no`.

## Secondary consistency check

- Air-defense suite run twice → identical 150/150 (no ordering flakes).
- `git diff --name-only` confirms the change set is confined to the air-defense module.
- Reviewer re-pass APPROVE after repairs.