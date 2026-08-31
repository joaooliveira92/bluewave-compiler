# Validation Report: D-4-IMPL INC-4 — Director Scaling + Radar Saturation + CIWS Redundancy

## Outcome

`PASS`

## Scope delivered

D-4 INC-4 of the AA air-defense vertical slice (`@bluewave/combat/src/air-defense/`),
the fourth of six D-4 implementation tickets. Delivered as a new pure module
`scaling.ts`:

- **AC-8 (§11/§12)** — director assignment order + scaling table values.
  - `orderDirectorAssignments()`: canonical §11 comparator over
    `DirectorAssignmentCandidate`s — (1) defense layer priority
    (HEAVY_AA → MEDIUM_AA → LIGHT_AA → CIWS), (2) threat score **descending**,
    (3) time to impact **ascending**, (4) target id **ascending**, (5) director id
    **ascending**. Deterministic, locale-free (codepoint string comparison), does
    NOT mutate the input array.
  - `directorScalingBp()`: shipped §12 schedule (0→5_000, 1→10_000, 2→18_000,
    3→25_000, 4→31_000). `DIRECTOR_NORMAL_SCALING_CAP` = 4. Directors above index 4
    contribute NO additional aggregate directed-fire value (§12) — they map to the
    cap value (31_000) for scaling and their cap-reached condition is surfaced by
    the INC-5 reason-code layer (`AA_DIRECTOR_NORMAL_SCALING_CAP_REACHED`).
- **AC-9 (§13/§14)** — radar-directed medium-AA saturation diminishing returns.
  - `evaluateRadarSaturation()`: marginal schedule (groups 1-4→10_000, 5-6→5_000,
    7-8→2_500, 9+→500) via the existing `radarMediumAaMarginalMultiplierBp`;
    effective group count per §14 as an exact rational (`sum(marginal bp)/10_000`)
    retained until the owning formula rounds; step flags for diminishing / heavy
    diminishing / redundant-group states.
- **AC-10 (§15/§16)** — CIWS redundancy schedule.
  - `evaluateCiwsRedundancy()`: marginal schedule (systems 1-4→10_000, 5-6→5_000,
    7-8→1_500, 9+→500) via `ciwsMarginalMultiplierBp`; effective system count as an
    exact rational; step flags. Deliberately an **additive-value** schedule, NOT a
    construction cap (§16): a 40-system stack retains positive cumulative value
    (proven by test).

The three schedules are additive / clamp-tolerable rather than hard bans: radar
groups and CIWS beyond the diminishing thresholds always contribute a positive
500 bp residual.

**Explicitly deferred (per spec / INC-5/6):** `AirDefenseEngagementRecord` + canonical
ordering + the full 20-code reason-codes enum + set-equality guard + `*_v1`
contracts + guaranteed light-AA disruption (INC-5), engine stage wiring (INC-6),
SAM layers (E-track).

## Requirements evidence

| AC    | Symbols                                                                        | Proving tests                  |
| ----- | ------------------------------------------------------------------------------ | ------------------------------ |
| AC-8  | `orderDirectorAssignments`, `directorScalingBp`, `DIRECTOR_NORMAL_SCALING_CAP` | `director-scaling.test.ts` (9) |
| AC-9  | `evaluateRadarSaturation`                                                      | `radar-saturation.test.ts` (8) |
| AC-10 | `evaluateCiwsRedundancy`                                                       | `ciws-redundancy.test.ts` (9)  |

## Commands and observed results

```text
cd packages/combat && npx vp test run test/air-defense/
  16 files passed (281 tests)   [director-scaling 9, radar-saturation 8, ciws-redundancy 9 new]

pnpm -w turbo run build --force
  18 successful, 18 total

npx tsc -b
  exit 0 (clean)

pnpm lint
  Found 0 warnings and 0 errors (1128 files)

pnpm format
  All matched files use the correct format.

pnpm -w turbo run test --force
  Tasks: 36 successful, 36 total (0 failed)
  combat: 3499 tests passed
  desktop: 528 tests passed

node scripts/verify-golden-hashes.cjs
  All 10 hashes match golden reference

cd packages/cross-process-test && npx vp test run
  3 files, 17 tests passed
```

## Determinism evidence

- All INC-4 functions are pure and deterministic: no ambient I/O, no `Math.random`,
  no wall-clock. Inputs are explicit parameters; sorting is locale-free (codepoint).
- The effective-count division is retained as an exact rational (JS number holds
  the finite 2-decimal sums: 4.0 / 5.0 / 5.5 / 5.55 for radar; 4.0 / 5.0 / 5.3 /
  5.35 for CIWS), documented to be rounded later by the owning formula (INC-5
  wiring / engagement stage).
- Golden verify 10/10 unchanged (pure module, no snapshot/phase change);
  cross-process 17/17 passed.

## Canonical artifact changes

None. No golden hash, content hash, or authoritative snapshot hash changed. This is a
pure un-wired module; `BattleResolver`/`StrengthCalculator` unmodified.

## Tests added

- `packages/combat/test/air-defense/director-scaling.test.ts` (9)
- `packages/combat/test/air-defense/radar-saturation.test.ts` (8)
- `packages/combat/test/air-defense/ciws-redundancy.test.ts` (9)

Types: unit, boundary/fail-closed (negative counts → BluewaveError), exact shipped
schedule equality, exact rational effective-count sums, immutability of the §11
comparator, deterministic ordering across all five precedence keys.

## Security and cancellation

- Fail-closed parameter validation at every function boundary (negative director
  count, negative group/system count → BluewaveError).
- No ambient I/O, wall-clock, `Math.random`, or locale/timezone dependence.
- No long-running operations; cancellation N/A.

## Known limitations and deferred requirements

- Directors above the §12 cap (4) are treated as contributing zero additional
  directed-fire for scaling; their §28 cap-reached reason code
  (`AA_DIRECTOR_NORMAL_SCALING_CAP_REACHED`) is emitted by the INC-5 reason-code layer.
- Radar/CIWS step flags are exposed here for testability; the §28 reason codes
  (`RADAR_MEDIUM_AA_DIMINISHING_RETURNS_ACTIVE`, `RADAR_MEDIUM_AA_REDUNDANT_GROUP_ACTIVE`,
  `CIWS_DIMINISHING_RETURNS_ACTIVE`, `CIWS_STRONG_REDUNDANCY_ACTIVE`) are emitted in INC-5.
- Wiring of these scaling tables into the INC-3 engagement factor inputs
  (`directorMultiplierBp`, `saturationMultiplierBp`) lands with the INC-5/INC-6
  resolution + engine-stage work.

## Changed files

`packages/combat/src/air-defense/scaling.ts` [new], `index.ts` (export);
`packages/combat/test/air-defense/` (director-scaling, radar-saturation,
ciws-redundancy [all new]). `.scratch/d4-m4-air-defense/issues/04-*.md`
(director-scaling ticket) DONE. New report file.

## Git and remote status

- Branch: `dev`.
- INC-4 committed by orchestrator after the full orchestrator validation gate.
- Push: not performed (no explicit request; remote sync handled separately).
- Pull request / merge: none.

## Secondary consistency check

- Re-ran air-defense suite (281 green) + full turbo test (36/36) after changes.
- Verified lint/format/tsc clean, goldens 10/10, cross-process 17/17 before marking PASS.
- Confirmed `git diff HEAD -- packages/combat/src/resolver packages/combat/src/strength-calculator`
  empty (`BattleResolver`/`StrengthCalculator` unmodified).
