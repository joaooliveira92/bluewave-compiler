# ADR-0098: Post-caliber-correction auto-resolution lethality rebalance

## Status

Accepted (2026-10-10). Follows and does **not** reverse ADR-0094 (the caliber
unit correction); it restores the ADR-0053 auto-resolution duration/lethality
target that ADR-0094 measured as unmet. Auto-resolution only; the tactical
(player-fought) balance is out of scope.

## Context

ADR-0094 corrected a pre-existing caliber unit-scale defect: production gun
content authors `caliberUm` in micrometres (343 mm = `343_000`), and the live
penetration model had converted it with `floor(caliberUm / 1_000_000)`, flooring
every production gun to **zero** penetration capability. The corrected
conversion `floor(caliberUm * velocityMS / 1_000)` is right and is preserved
here.

The correction changed the measured balance. Before it, the combat fixtures fed
an inflated pseudo-caliber (`343_000_000`) on which the model was
non-degenerate; at production scale a 343 mm gun yields a `261_366` µm
capability against a `304_950` µm HARVEY 305 mm belt — a **PARTIAL_PENETRATION**,
where the inflated fixtures produced `FULL_PENETRATION`. ADR-0094 §5/§7 recorded
the consequence: equal `2×10-gun` fleets ran a **~321-minute mean**, ended
mostly by withdrawal/time_limit (70% / 30%), and typically sank **no** ships
(`sinkMean = 0.00`). The ADR-0053 length target (30–90 min) was not met, and the
`p1-balance-sweep` tripwire had been relaxed to `[30, 360]`.

### Diagnosis (measured, before any constant changed)

The limiting stage is **post-penetration consequence propagation**, not accuracy,
salvo cadence or a missing damage multiplier. At production scale the dominant
belt hit (40% of hits by `ZONE_HIT_WEIGHT_BP`) resolves `PARTIAL_PENETRATION`,
which previously had **no progressive consequence at all**: `hullBreach` was
false, so no immediate flotation damage; `evaluateFloodingCreation` accepted only
`FULL_PENETRATION`, so no flooding source; and `PARTIAL` is not an ignition
outcome, so no fire. The only flotation drain left was the 3% magazine share
(`CRITICAL_PENETRATION` + 80% detonation), so flotation almost never reached 0:
ships could not sink, and the strength-threshold withdrawal fired only after a
long grind. A secondary finding: fires, once created, produce smoke and decay but
no reserve damage, and the DESIGN-41 §22 rate-of-fire penalty is not wired into
auto-resolution gunnery.

Measured baseline (30 fixed seeds, `resolveBattleAuto`, equal 2×10-gun 30 kn
fixture): mean **312–321 min**, median 325, `sinkMean 0.00`, 70% withdrawal / 30%
`time_limit`.

## Decision

The rebalance propagates the missing consequence of the dominant hit outcome and
restores the breach flood rate; it introduces **no** new ballistics formula, no
muzzle-velocity/decay term, no explosive filler, no national modifier and no
global damage multiplier.

### 1. Bounded partial-penetration breach (consequence propagation)

A waterline-zone (`BELT` / `MAGAZINE`) hit now opens a hull breach on a
**near-penetration** `PARTIAL_PENETRATION` as well as on full penetration. The
partial breach is **bounded**:

- it opens only when the shell came close to defeating the plate,
  `capability × 10_000 ≥ resistance × PARTIAL_BREACH_MIN_RATIO_BP` (6_500 bp =
  65%), so a glancing partial against very thick armor stays a pure structural
  hit (the 343 mm vs 508 mm case is still non-breaching, as ADR-0094 recorded);
- its immediate flotation loss uses `PARTIAL_BREACH_FLOAT_LOSS_RATIO_BP`
  (1_500 bp) instead of the full-penetration `FLOAT_LOSS_RATIO_BP` (5_000 bp);
- its flooding-source chance is 3_000 bp instead of the full-penetration
  8_000 bp.

All three are monotone: thicker armor can only reduce the outcome, larger
caliber can only increase it, and a partial consequence is always strictly less
than the full-penetration consequence.

### 2. Breach flood rate

`BASE_FLOODING_RATE_KG_MIN` 500 → **800** (`immediateFireFlooding.ts`). A breach
is the only path from a hit to progressive flotation loss; after the correction
the number of full breaches fell and the surviving partials are bounded, so the
per-breach rate is raised to keep a breach's lethality within the ADR-0053
envelope. This is a documented abstract-model input (breach size estimate), not a
shell-damage multiplier.

### 3. Structured withdrawal reasons (observational)

`decideBattleEnd` now returns a `WithdrawalReason`
(`FLEET_STRENGTH_FLOODING` / `_FIRE` / `_GUNFIRE` / `_STRUCTURAL` /
`MUTUAL_DISENGAGEMENT`), classifying *why* the ADR-0073 fleet-strength threshold
was crossed (dominant flotation loss, an active fire, dominant structural loss,
or mutual disengagement). It is derived deterministically from the already
resolved per-ship states (no draw) and surfaced on `BattleResolutionResult` as an
**observational** field, excluded from `resultHash`.

### 4. Observational gunnery telemetry (benchmark support)

`MinuteResult` gains an optional `gunneryRecords` surface and
`resolveBattleAuto` accumulates an observational `BattleTelemetry`
(salvoes/rounds/hits/hit-rate), excluded from `resultHash`. This lets the
deterministic benchmark record the required engagement metrics without
duplicating the minute loop.

## Balance targets (BALANCE_TARGET — not historical facts)

Preserved from ADR-0053 where still applicable; the rest are new explicit
targets, recorded as bands over a fixed deterministic scenario matrix, never
historical claims.

| Target | Band |
| --- | --- |
| Decisive fleet engagement median | 30–90 min |
| 90th-percentile duration | ≤ 180 min |
| `time_limit` ending share | ≤ 15% (test bound ≤ 20%) |
| Equal-fleet withdrawal/disengagement share | non-trivial (> 0) |
| Heavy-gun (capital) sinking incidence | non-zero and repeatable |
| Identical seeds | byte-identical outcomes |

Cruiser and asymmetric scenarios use a wider lower bound (20 min) because they
resolve faster by design.

## Tuning log (one lever at a time; 20-seed diagnostic matrix)

| # | Change | Equal-fleet median | `time_limit` | `sinkMean` | Notes |
| --- | --- | --- | --- | --- | --- |
| 0 | baseline (post ADR-0094) | 325 | 30% | 0.00 | ~312–321 mean; no progressive consequence for PARTIAL |
| 1 | + bounded partial breach (`FLOAT_LOSS_RATIO 1_500`, chance 3_000) | 65 | 0% | 0.00 | duration fixed; still no sinkings (flotation drains but withdrawal precedes it) |
| 2 | + breach rate 500 → 800 | 70 | 0% | 0.05 | sinkings appear; medians land 68–80 |
| 3 | partial-breach near-penetration gate (≥ 65% of resistance) | 79 | 0% | 0.13 | preserves the thick-belt non-breach property; evens national matchups |

Rejected levers: `SHELL_MUZZLE_VELOCITY_MS` bump (a global penetration
multiplier that would restore the pre-correction `FULL` behaviour ADR-0094
rejected); `HIT_DAMAGE_OUTCOME_BP` inflation (a global damage multiplier that
would hide the missing-consequence cause); lower withdrawal threshold (would
merely lengthen battles without a credible reason to remain engaged);
progressive-flooding severity scaling (inert — severity is bp of *displacement*,
so it stays MINOR for capital hulls).

## Measured results (ADR-0098, 30 fixed seeds per scenario)

Full matrix: `docs/research/p1-tactical-benchmark.md`.

| Scenario | median (min) | p90 | time_limit | sinkMean (sinking battles) | cause |
| --- | --- | --- | --- | --- | --- |
| UK BB vs France BB | 80 | 95 | 0% | 0.27 (8/30) | flooding |
| UK BB vs Germany BB | 80 | 92 | 0% | 0.17 (5/30) | flooding |
| France BB vs Germany BB | 84 | 104 | 0% | 0.23 (7/30) | flooding |
| capital vs capital (equal) | 79 | 90 | 0% | 0.13 (4/30) | flooding |
| armoured cruiser vs armoured cruiser | 50 | 57 | 0% | 0.23 (7/30) | flooding |
| protected cruiser vs protected cruiser | 50 | 58 | 0% | 0.53 (14/30) | flooding |
| capital vs armoured cruiser | 68 | 79 | 0% | 0.60 (17/30) | flooding |
| capital vs protected cruiser | 69 | 80 | 0% | 0.70 (19/30) | flooding |

Before/after (equal 2×10-gun fixture): mean ~312 → ~80 min; `time_limit` 30% →
0%; `sinkMean` 0.00 → 0.13 (capital-vs-capital) and non-zero across every
heavy-gun scenario. All withdrawals are attributed `FLEET_STRENGTH_FLOODING`
(the dominant loss is progressive flooding / breaches), which is the intended
progressive mechanism.

## Compatibility and persistence

- **Caliber contract unchanged.** `shellPenetrationUm` and the micrometre
  contract are untouched; the ADR-0094 regression and reference-case tests are
  unchanged and green.
- **No persistence change.** No save/wire format, no `CompiledDesignVersion`
  field, no `CompiledArmamentMount` change. Old saves load; compiled armament
  snapshots are unchanged; mixed legacy and first-class-armed fleets fight in the
  same battle (benchmark scenario).
- **Observational fields only.** `withdrawalReason` and `telemetry` are excluded
  from `resultHash`, so they cannot move a replay hash. Tactical battle state
  remains `DERIVED_REBUILDABLE` from the manifest + seed (ADR-0034).
- **Balance version change.** Battle outcomes intentionally changed (documented
  here); pinned combat baselines were re-pinned through the ADR-0007 process
  (`auto-resolve.test.ts`, `ac6-damage-control-gate.test.ts`, `outcome.test.ts`,
  `gunnery-fidelity.test.ts`, `p1-balance-sweep.test.ts`). This is a balance
  version change, not a save-corruption issue.
- **No nation-id conditional** is introduced anywhere in the shared path; the
  monotonicity and no-nation-conditional properties are test-pinned.

## Alternatives considered

- **Restore full penetration via `SHELL_MUZZLE_VELOCITY_MS`.** Rejected: it is a
  global penetration multiplier and would resurrect the pre-correction `FULL`
  behaviour ADR-0094 explicitly declined to preserve.
- **Inflate `HIT_DAMAGE_OUTCOME_BP`.** Rejected by the brief: a global damage
  multiplier hides the actual cause (missing consequence propagation).
- **Add fire → reserve structural damage.** Rejected after measurement:
  structural integrity already saturates before the end of an engagement (the
  binding constraint is flotation), so fire structural damage would be inert and
  unprincipled. Fire's DESIGN-41 §21/§22 component/rate-of-fire consequences
  remain unwired in auto-resolution and are recorded as deferred.
- **Lower the ADR-0073 withdrawal threshold.** Rejected: it would lengthen
  battles without giving ships a credible reason to remain engaged.
- **Severity-scaled progressive flooding.** Rejected as inert (see tuning log).

## Deferred realism (recorded, not dropped)

- Historically grounded ballistics (muzzle velocity, velocity decay by range,
  shell mass/form, armor quality research, obliquity, capped shells, explosive
  filler): `docs/research/ballistics-model-deferred.md`, unchanged.
- The model still reads the shell caliber from the **target's** compiled
  main-battery caliber (ADR-0026), so a hull's vulnerability depends on its own
  caliber/belt rather than the shooter's gun. This is a pre-existing abstraction,
  not introduced here; correcting it is a future ballistics-model change.
- Fire's reserve/component/ROF consequences in auto-resolution (§21/§22).
- A bounded offline deterministic parameter search harness was not required: the
  scenario matrix is fully deterministic and the selected levers were measured
  one at a time (ADR-0053 method); no production constant is auto-rewritten.

## Rollback

Code-only revert of the four constants (`PARTIAL_BREACH_FLOAT_LOSS_RATIO_BP`,
`PARTIAL_BREACH_MIN_RATIO_BP`, `FLOODING_CHANCE_BP`, `BASE_FLOODING_RATE_KG_MIN`)
and the `synthesizeImpact` / `evaluateFloodingCreation` branches. No save or wire
format changed; the observational fields and re-pinned baselines are independent.
Reverting restores the ADR-0094 measured state (long, non-lethal battles), which
is not desirable but is mechanically safe.

## Consequences

- Representative auto-resolved combat no longer defaults to extremely long,
  non-lethal engagements; the ADR-0053 duration band is met across the matrix.
- `time_limit` endings are bounded (0% in the measured matrix).
- Heavy-gun engagements have a repeatable non-zero sinking incidence, driven by
  the newly-propagated progressive flooding consequence.
- Withdrawals carry a structured, deterministic reason.
- New tests: `tactical-benchmark.test.ts`, `partial-breach.test.ts`,
  `fire-spread-bound.test.ts`, plus the withdrawal-reason coverage.
- New docs: this ADR and `docs/research/p1-tactical-benchmark.md`.
