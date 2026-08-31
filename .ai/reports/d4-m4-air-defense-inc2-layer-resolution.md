# Validation Report: D-4-IMPL INC-2 — Layer Resolution + Eligibility (heavy/medium/light/CIWS)

## Outcome

`PASS`

## Scope delivered

D-4 INC-2 of the AA air-defense vertical slice (`@bluewave/combat/src/air-defense/`),
as the second of six D-4 implementation tickets. Delivered:

- `AirDefenseAttack` descriptor (DESIGN-45 §4) — immutable attack input with all 11
  attack types and the mandatory field set: release range, release altitude, speed
  profile (knots), terminal profile, formation size, cohesion, defensive
  susceptibility, target identifier. Fail-closed strict Zod boundary validation;
  `isMediumAaEligible()` derived from attack type (§8/§18).
- Layer resolution (`layer-resolution.ts`) — pure deterministic
  `resolveLayerEligibility()` resolving layers in the canonical order
  HEAVY_AA → MEDIUM_AA → LIGHT_AA → CIWS (AC-3), with empty layers emitting successful
  empty results and surviving attacks proceeding to the next layer (DESIGN-45 §1).
- Heavy AA eligibility (AC-4) — own ship + nearby protected ship within the §7 shipped
  protected radius (5 nm = 9_260 m), range/altitude/speed/ammunition/mount checks,
  sunk/unable-to-operate rejection, no engagement of unrelated formations.
- Medium AA eligibility (AC-5) — `mediumAaEligible` profile + one pre-release window +
  fire-control solution ≥ 4_000 bp + free channel + ammunition.
- Light AA eligibility + windows (AC-6) — §18 matrix gate + §9 per-profile windows and
  knot speed-band multipliers via `effectiveLightAAWindowMilliseconds`.
- CIWS eligibility — §18 matrix + explicit-capability gating for heavy/medium ASM via
  `REQUIRES_EXPLICIT_CAPABILITY` (ADR-0042).

Reviewer returned `NEEDS_REWORK`; all source-verified findings repaired (see below).

**Explicitly deferred (per spec / INC-3/4/5/6):** engagement resolution + ammunition
consumption + disruption + damage (INC-3), director/radar-saturation/CIWS-redundancy
resolution (INC-4), reason-codes enum rollup + `*_v1` contracts (INC-5), engine stage
wiring (INC-6), SAM layers (E-track).

## Requirements evidence

| AC      | Symbols                                                                                                              | Proving tests                  |
| ------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| AC-3    | `RESOLUTION_ORDER`, `resolveLayerEligibility`, `LayerEligibilityOutcome`                                             | `layer-order.test.ts`          |
| AC-4    | `checkHeavyAAEligibility`, `PROTECTED_RADIUS` (= 9_260 m = 5 nm)                                                     | `heavy-aa-eligibility.test.ts` |
| AC-5    | `checkMediumAAEligibility`, `MEDIUM_AA_FIRE_CONTROL_MIN_BP` (= 4_000)                                                | `medium-aa-timing.test.ts`     |
| AC-6    | `checkLightAAEligibility`, `LIGHT_AA_WINDOW_DURATIONS`, `LIGHT_AA_SPEED_BANDS`, `effectiveLightAAWindowMilliseconds` | `light-aa-windows.test.ts`     |
| CIWS    | `checkCiwsEligibility`, `REQUIRES_EXPLICIT_CAPABILITY` (CIWS:HEAVY_ASM, CIWS:MEDIUM_ASM)                             | `ciws-eligibility.test.ts`     |
| §4 desc | `AirDefenseAttack`, `createAirDefenseAttack`, `validateAirDefenseAttack`, `AttackType`, `TerminalProfile`            | `air-defense-attack.test.ts`   |

## Reviewer findings repaired (source-verified against docs/rules/air-defense.md)

- **F1 (HIGH):** CIWS+HEAVY_ASM now requires explicit capability
  (`CIWS_TERMINAL_DEFENSE:HEAVY_ASM` in `REQUIRES_EXPLICIT_CAPABILITY`); §18 line 311.
  `ciws-eligibility.test.ts` now proves reject + accept.
- **F2 (MEDIUM):** `terminalProfile` added to `AirDefenseAttack` (required §4 field set),
  typed literal union, fail-closed via strict Zod; tests prove missing→fail, valid→ok,
  invalid→fail.
- **F3 (MEDIUM):** CIWS+MEDIUM_ASM "compatible terminal defense" resolves to declared
  capability (`CIWS_TERMINAL_DEFENSE:MEDIUM_ASM`) per §18 line 318 fail-closed rule;
  decision recorded in **ADR-0042**. Tests prove reject + accept.
- **F4 (LOW):** speed conversion now uses `SafeInt.div(SafeInt.mul(...), SafeInt(3600),
"floor")` integer arithmetic instead of `Math.floor(Number(...) * ... / 3600)`.
- **F7 (LOW):** constants.ts comment corrected to reference §7.

## Canonical value corrections

- **PROTECTED_RADIUS** corrected from INC-1's `5_000` (m) to `9_260` m = 5 nm × 1852 m/nm.
  INC-1 shipped the constant but §7 semantics (5 nautical miles, permitted 3..8 nm,
  shipped 5 nm) land with layer resolution; the corrected value is the faithful reading
  and is documented (added `NAUTICAL_MILE_M = 1_852`). INC-1 report's known-limitation
  note on this unit is now resolved.
- **LIGHT_AA_WINDOW_DURATIONS** gained `GUIDED_WEAPON: 60` (§9, aircraft-delivered guided
  weapon window), previously absent.

## Commands and observed results

```text
pnpm -w turbo run build --force
  18 successful, 18 total

npx tsc -b
  exit 0 (clean)

pnpm lint
  Found 0 warnings and 0 errors (1119 files)

pnpm format
  All matched files use the correct format.

pnpm -w turbo run test --force
  Tasks: 36 successful, 36 total (0 failed)

cd packages/combat && npx vp test run test/air-defense/
  9 files passed (160 tests)
  : layer-order, heavy-aa-eligibility, medium-aa-timing, light-aa-windows,
    ciws-eligibility, air-defense-attack, constants, system-definition, state

cd packages/combat && npx vp test run        (full combat suite)
  251 files, 3397 tests passed

node scripts/verify-golden-hashes.cjs
  All 10 hashes match golden reference

cd packages/cross-process-test && npx vp test run
  3 files, 17 tests passed
```

## Determinism evidence

- `resolveLayerEligibility`, all layer predicates, and `createAirDefenseAttack` are pure
  functions: no ambient I/O, no `Math.random`, no wall-clock, no mutation of the passed
  state; output is new structured data. Deterministic for identical inputs.
- `AirDefenseState` hash ordering invariance unchanged (INC-1).
- Golden verify 10/10 unchanged; cross-process 17/17 passed.
- Speed conversion uses checked SafeInt arithmetic (floor) — deterministic.

## Canonical artifact changes

None. No golden hash, content hash, or authoritative snapshot hash changed. The only
authoritative-constant value changes (`PROTECTED_RADIUS` 5_000→9_260, `GUIDED_WEAPON`
window entry) are within the un-hashed air-defense constants and are canonical-value
corrections documented above.

## Tests added

- `packages/combat/test/air-defense/layer-order.test.ts`
- `packages/combat/test/air-defense/heavy-aa-eligibility.test.ts`
- `packages/combat/test/air-defense/medium-aa-timing.test.ts`
- `packages/combat/test/air-defense/light-aa-windows.test.ts`
- `packages/combat/test/air-defense/ciws-eligibility.test.ts`
- `packages/combat/test/air-defense/air-defense-attack.test.ts`
- `packages/combat/test/air-defense/test-helpers.ts` (shared fixtures)

Types: unit, boundary/fail-closed, order-independence, §18/§7/§8/§9 exact-value,
reason-code dispatch. Boundary cases: exactly 5 nm (9_260 m) accepted / beyond rejected;
FC exactly 4_000 accepted / 3_999 rejected; window floor `max(1_000, ...)`; knot
speed-band boundaries 200/350/500.

## Security and cancellation

- Fail-closed strict Zod schemas at all construction boundaries.
- Capability-gated CIWS engagement (fail-closed per §18 line 318).
- No ambient I/O, wall-clock, `Math.random`, or locale/timezone dependence.
- No long-running operations; cancellation concerns N/A for this pure module.

## Performance observations

Not collected; pure synchronous data structures, negligible footprint.

## ADRs and dependencies

- New: **ADR-0042** (CIWS "compatible terminal defense" requires declared MEDIUM-ASM
  capability). No third-party dependencies; uses `@bluewave/contracts` (SafeInt,
  BluewaveError) and `@bluewave/deterministic` (createEnvelope).

## Known limitations and deferred requirements

- Engagement resolution, ammunition consumption, disruption, and damage application →
  INC-3.
- Director/radar-saturation/CIWS-redundancy resolution scaling → INC-4 (tables are
  defined in constants but not yet used for scaling).
- Full 20-code reason-codes enum + `*_v1` contracts → INC-5 (this increment emits the
  relevant §28 string literals only).
- Engine stage wiring (step 7.8) → INC-6.
- SAM layers (HEAVY/MEDIUM/LIGHT_SAM) → E-track.
- Arc/bearing and radar-reach checks (DESIGN-45 §7 line 133) are not yet enforced —
  the data model does not carry arc/bearing or target bearing yet; deferred to INC-4/6
  (documented, not fabricated).
- Light-AA §9 gating uses the authoritative §18 matrix (the §9 window table is the
  timing source); ASM classes require explicit system capability.

## Changed files

`packages/combat/src/air-defense/` (air-defense-attack.ts [new], layer-resolution.ts
[new], constants.ts, index.ts); `packages/combat/test/air-defense/` (layer-order,
heavy-aa-eligibility, medium-aa-timing, light-aa-windows, ciws-eligibility,
air-defense-attack, test-helpers [new], constants.test.ts); `docs/adr/ADR-0042-*.md`
[new]; `.scratch/d4-m4-air-defense/issues/02-*.md` (status DONE, AC-3..6 ticked).

## Git and remote status

- Branch: `dev`.
- INC-2 committed by orchestrator as a scoped `feat(air-defense)` commit following the
  full orchestrator validation gate.
- Also folded into a docs commit: PROGRESS.md M4 row, SPRINT-PLAN "Immediate next
  action" (→ INC-3) + INC-2 DONE entry, and a formatting fix to the INC-1 report.
- Push: not performed (no explicit request; remote sync handled separately).
- Pull request / merge: none.

## Secondary consistency check

- Re-ran air-defense test files after repairs and formatting — 160 tests green; combat
  suite 3397 green.
- Re-verified lint/format/tsc clean and full 36/36 turbo test tasks plus 10/10 goldens
  and 17/17 cross-process before marking PASS.
