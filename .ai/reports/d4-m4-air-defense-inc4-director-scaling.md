# Validation Report: D-4-IMPL INC-4 — Director Scaling + Radar Saturation + CIWS Redundancy

## Outcome

`PASS`

## Scope delivered

D-4 INC-4 of the AA air-defense vertical slice (`@bluewave/combat/src/air-defense/`),
fourth of six D-4 implementation tickets. Delivered:

- **Director assignment + scaling** (`director-scaling.ts`) — AC-8, §11/§12:
  `assignAADirectors` assigns one operational director per engagement in the §11 total order
  (defense layer priority → threat score descending → time to impact ascending → target
  identifier ascending → director identifier ascending; deterministic codepoint residue so
  input order can never leak, §27 line 453). One director = one engagement channel (§11
  line 196); a director is never reused within a pass (§11 line 206). `computeDirectorFactorBp`
  implements the §12 table 0→5_000, 1→10_000, 2→18_000, 3→25_000, 4→31_000; count ≥ shipped
  cap 4 stays 31_000 with `AA_DIRECTOR_NORMAL_SCALING_CAP_REACHED`. The §17-derived threat
  comparator (`compareThreatPriority`) realizes "threat score descending" deterministically.
- **Radar-directed medium-AA saturation** (`radar-saturation.ts`) — AC-9, §13/§14:
  `isRadarDirectedMediumAaGroup` (ALL seven §13 predicates); `computeRadarFactorBp` keeps the
  UNDIVIDED §14 marginal sum (1..4→10_000, 5..6→5_000, 7..8→2_500, 9+→500) as the exact
  rational in the §19 `radarBp` numerator slot (4 groups → 40_000 = 4.0); count 0 → neutral
  10_000. Markers: 5..8 → DIMINISHING_RETURNS_ACTIVE, 9+ → REDUNDANT_GROUP_ACTIVE.
- **CIWS redundancy** (`ciws-redundancy.ts`) — AC-10, §15/§16: `isCiwsContributingSystem`
  (§15 line 266 zero-contribution filter); `computeCiwsSaturationFactorBp` keeps the
  UNDIVIDED §16 marginal sum (1..4→10_000, 5..6→5_000, 7..8→1_500, 9+→500) as the exact
  rational in the §19 `saturationBp` slot (4 systems → 40_000); count 0 → neutral 10_000.
  NOT a construction cap (§16 line 289) — every system above the eighth contributes the 9+
  residual 500. Markers: 5..6 → DIMINISHING_RETURNS_ACTIVE, 7+ → STRONG_REDUNDANCY_ACTIVE.
- **Two-class factor bound repair** (`engagement.ts`, replacing the INC-3 single-cap
  decision 10) — the §19 product splits into NORMAL-class slots (base, director, crew,
  damage, ammunition, targetProfile, weather) each enforced ≤ 31_000, and SATURATION-class
  slots (radar §14, saturation §16) admitted up to `Number.MAX_SAFE_INTEGER` (they carry the
  undivided group/system-count aggregates: 4 groups/systems → 40_000 > 31_000). Bound
  arithmetic corrected in the module documentation (numerator ≤ ~31_000^7 × (9.007e15)^2 ≈
  2.2e63; floored result can reach ~2.2e31 for pathological-but-legal aggregates, so the
  defensive throw is reachable by legal-boundary inputs and fires fail-closed).
- **Five §28 reason codes** (`reasonCodes.ts`): `AA_DIRECTOR_NORMAL_SCALING_CAP_REACHED`,
  `RADAR_MEDIUM_AA_DIMINISHING_RETURNS_ACTIVE`,
  `RADAR_MEDIUM_AA_REDUNDANT_GROUP_ACTIVE`, `CIWS_DIMINISHING_RETURNS_ACTIVE`,
  `CIWS_STRONG_REDUNDANCY_ACTIVE`. The full 20-code §28 rollup + set-equality guard lands in
  INC-5.
- **Exports** (`index.ts`): three new modules exported.

**Explicitly deferred (per spec §1.3 / INC-5/6):** records + ordering + full 20-code §28
rollup + contracts (`air_defense_v1`) + guaranteed light-AA disruption (INC-5), engine stage
(step 7.8) + two-process child + gate (INC-6), SAM layers (E-track). `BattleResolver`/
`StrengthCalculator` unmodified.

## Slot-mapping decision (recorded in ADR-0042 decision 11)

In the §19 nine-factor product, `directorBp` ← this sprint's §12 value, `radarBp` ← §14
undivided group sum, `saturationBp` ← §16 undivided system sum. crew/damage/ammunition stay
INC-3 computed; targetProfile/weather are neutral-or-later (INC-5/6). Engine call site wired
in INC-6.

## Requirements evidence

| AC | Symbols | Proving tests |
|----|---------|---------------|
| AC-8 | `assignAADirectors`, `computeDirectorFactorBp`, `directorScalingMarkers`, `compareThreatPriority`, `DIRECTOR_NORMAL_SCALING_CAP` | `director-scaling.test.ts` (26) |
| AC-9 | `isRadarDirectedMediumAaGroup`, `computeRadarFactorBp`, `radarSaturationMarkers`, `RADAR_NEUTRAL_FACTOR_BP` | `radar-saturation.test.ts` (8) |
| AC-10 | `isCiwsContributingSystem`, `computeCiwsSaturationFactorBp`, `ciwsSaturationMarkers`, `CIWS_NEUTRAL_FACTOR_BP` | `ciws-redundancy.test.ts` (8) |
| AC-11 (bound repair) | `computeEffectiveDefenseBp` two-class caps, `FACTOR_CAPS_BP` | `engagement-formula.test.ts` (+8; 39 total) |

## Reviewer findings (adversarial pass, source-verified)

Reviewer `APPROVE` on first pass (no blocker/high) with 2 MEDIUM + 3 LOW findings. All
closed by orchestrator-directed repairs; re-validated, 271 air-defense tests green:

- **MEDIUM-1 (recorded):** ADR-0042 must record the INC-4 decisions — two-class bound
  superseding decision 10, §17-derived threat comparator with formationSize proxy,
  zero-count consumer-side neutrals. Addressed here (§ Decisions 11-13 below).
- **MEDIUM-2 (repaired):** `engagement.ts` bound arithmetic was wrong (claimed floored ≤
  ~2.3e7; actual ≈ 2.2e31 for legal-boundary saturation aggregates) and the documentation
  claimed the defensive throw was "unreachable". Corrected to the true bound (~31_000^7 ×
  MAX_SAFE^2 / 10^32 ≈ 2.2e31 > MAX_SAFE) and reachability (fires fail-closed on
  pathological-but-legal inputs; realistic ship-scale ≤ ~1.5e6 never trips it).
- **LOW-3 (report wording):** corrected in this report.
- **LOW-4 (repaired):** the parallel `FACTOR_CAPS_BP` array collapsed into a
  slot-name-keyed `Record<FactorSlotName, number>` — adding a slot without a cap is now a
  compile error (alignment can't drift).
- **LOW-5 (repaired):** the closed-form continuations in `computeRadarFactorBp`/
  `computeCiwsSaturationFactorBp` now accumulate through `SafeInt.add`/`SafeInt.mul`, so a
  count large enough to overflow the aggregate is rejected fail-closed exactly like the
  loop.

## Commands and observed results

```text
pnpm -w turbo run build --force
   Tasks: 18 successful, 18 total (0 cached)

npx tsc -b
   exit 0 (clean)

pnpm -w turbo run typecheck
   Tasks: 33 successful, 33 total

pnpm --filter @bluewave/combat exec vp lint src/air-defense/ test/air-defense/
   Found 0 warnings and 0 errors (33 files)

pnpm -w exec vp fmt --check <11 changed files>
   All matched files use the correct format.  # repo-wide drift pre-existing (documented)

packages/combat: npx vp test run test/air-defense/
   Test Files 15 passed (15) | Tests 271 passed (271)   # run twice, identical

pnpm -w turbo run test --filter=@bluewave/combat --force
   Test Files 257 passed (257) | Tests 3508 passed (3508)

node scripts/verify-golden-hashes.cjs
   All 10 hashes match golden reference

node packages/cross-process-test/dist/run-child.js
   success: true
   { ...Hashes + "success": true }
```

## Determinism evidence

- Golden hashes 10/10 unchanged (module unwired; INC-6 wires the engine).
- Two-process determinism: `success: true`.
- New code uses only `SafeInt`/bigint arithmetic, codepoint string comparisons (never
  localeCompare), and no randomness/clock/env/locale. `compareThreatPriority`/
  `compareCandidates` are total deterministic orders.
- Processes/OS: Windows, PowerShell 5.1, Node 24, pnpm 11.21.0, vp v0.2.8.

## Canonical artifact changes

None. Golden hashes unchanged. Air-defense state hashes remain provisional (ADR-0042). The
INC-4 extension to `constants.ts` is comment-only; `MAX_ENGAGEMENT_FACTOR_BP = 31_000`
value unchanged.

## Tests added

- `packages/combat/test/air-defense/director-scaling.test.ts` (26)
- `packages/combat/test/air-defense/radar-saturation.test.ts` (8)
- `packages/combat/test/air-defense/ciws-redundancy.test.ts` (8)
- `engagement-formula.test.ts` extended (+8: two-class bound repair — 100×radar 40_000 →
  400, 100×saturation 40_000 → 400, mixed 720, cap-rejection on NORMAL-class > 31_000,
  saturation-class > 31_000 admitted, etc.)

Types: unit, boundary/fail-closed, canonical-value, determinism/reproducibility.

## Security and cancellation

- Fail-closed BP boundaries (two-class factor caps, non-negative safe counts), defensive
  `rawFloored > MAX_SAFE` throw, `SafeInt` overflow-checked accumulation.
- No ambient I/O/randomness/locale/timezone. No long-running operations (cancellation N/A).

## Performance observations

Fully bounded: CRITICAL director table lookups, O(1) assignment per candidate (sort-bound),
O(9) marginal loop + O(1) closed-form tail for large group/system counts. Not otherwise
collected.

## ADRs and dependencies

- **ADR-0042 extended** (decisions 11-13): §19 slot mapping + §17 threat comparator +
  §14/§16 zero-count neutrals and two-class bound superseding decision 10.
- No third-party dependencies.

## Known limitations and deferred requirements

- Records + full 20-code §28 rollup + contracts (`air_defense_v1`) + guaranteed light-AA
  disruption → INC-5.
- Engine stage (step 7.8) + two-process child + gate → INC-6.
- Full damage model (weapon/director/radar/power/feed independent), full ammunition model
  (burst/cooling/reload/jams), post-release medium-AA → deferred (§1.3).
- Pre-existing unrelated: `pnpm format` repo-wide drift in this environment, desktop 5
  tests (`RulesOfTheNavalAgeScreen` intermittent renderer flake observed once, passes 7/7
  standalone and in re-runs), compiler-cli parallel-timeout flake (passes 95/95 standalone),
  `content-schema/test/nation.test.ts`.

## Changed files

`packages/combat/src/air-defense/` (new: director-scaling.ts, radar-saturation.ts,
ciws-redundancy.ts; modified: engagement.ts [two-class bound repair + corrected bound
arithmetic], constants.ts [comment-only], reasonCodes.ts [+5 §28 codes], index.ts [+3
exports]); `packages/combat/test/air-defense/` (new: director-scaling.test.ts,
radar-saturation.test.ts, ciws-redundancy.test.ts; modified: engagement-formula.test.ts).

## Git and remote status

- Branch: `dev`. Commit: `ef0950f` (code) + docs commit.
- `BattleResolver`/`StrengthCalculator` unmodified (verified `git diff --name-only`).
- Push/PR: not performed. Merge performed: `no`.

## Secondary consistency check

- Air-defense suite run twice → identical 271/271.
- Scope confined to the air-defense module (git diff --name-only).
- Reviewer APPROVE + all MEDIUM/LOW closed with re-validation (gate green after repairs).