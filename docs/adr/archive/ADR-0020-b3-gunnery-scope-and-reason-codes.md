# ADR-0020 (B-3): Gunnery Scope/Integration Boundary + Reason-Code and Constant Policy

## Status

Accepted

## Context

B-3 is the third M2 sprint: the DESIGN-39 (`docs/rules/gunnery.md`) **core surface
gunnery fire-resolution** subset (state, fire modes, accuracy, rate-of-fire/reload,
gun quality, ammunition, event record, ordering, and the in-slice reason-code
surface). It runs as a pure engine stage (`resolveGunnery`) inside the B-2
minute-advance simulation, after spotting (step 8). INC-1..4 shipped the state
contract, accuracy resolution, rate-of-fire/reload + gun quality, and the
salvo/event/ordering + engine wiring; DESIGN-39 §32 requires a documented,
closed reason-code surface, §33 requires exact shipped constants (not silent
defaults), and the ENGINEERING-CONTRACT ADR threshold covers reason-code/constant
decisions that materially constrain the ruleset. Three questions were open going
into INC-5: (1) exactly which DESIGN-39 §32 codes does this slice ship vs. defer,
(2) what is the authoritative surface-mode fire-control-solution threshold (not
pinned by DESIGN-39 itself), and (3) how is the 1880s RML heavy-gun
`baseReloadMilliseconds` grounded when no primary source pins a precise integer.

## Decision

1. **Scope = core surface fire-resolution subset**, mirroring ADR-0018's B-2
   scope decision. B-3 implements DESIGN-39 §§1–5, §28, §30–32, and the §33
   validation items that pertain to this slice: `GunneryState` (§1), the seven
   fire modes with `RAPID`/`AA_TRACKING`/`AA_BARRAGE` *defined but eligibility
   deferred* (§2), the 17-factor accuracy formula with exact integer basis-point
   arithmetic and one final `FLOOR` (§3), the 11-factor rate-of-fire/reload
   formula with one final `CEIL` and the gun-quality table (§4–5), atomic
   ammunition reserve+consume (§28), and the immutable `GunneryEventRecord` with
   canonical ordering (§30–31). **Deferred, enumerated, owning track**:
   autoloaders (§6–10), dual-purpose guns (§11–15), armor/penetration (§16–24 →
   B-4), straddle registration + RAPID/AA eligibility predicates (§25, later
   straddle/AA slice), target allocation/manual orders (§26–27), damage effects
   on gunnery state (§29 → B-4/DAMAGE), and phase-pipeline wiring replacing
   `BattleResolver` (B-6). This mirrors the B-2 pattern of shipping a genuine
   engine slice without silently absorbing later tracks' scope.
2. **Engine-only — not wired into the phase pipeline.** As ADR-0018 established
   for B-2, B-3 does not modify the campaign snapshot schema, the phase
   registry, or `battle_resolution`; `BattleResolver` and `StrengthCalculator`
   remain unmodified (verified by diff each increment). Results→campaign
   integration remains B-6.
3. **Reason-code policy (AC-10, DESIGN-39 §32).** This slice ships exactly the
   seven in-slice §32 codes — `INVALID_GUNNERY_STATE`,
   `GUNNERY_ACCURACY_FACTOR_MISSING`, `GUNNERY_RATE_FACTOR_MISSING`,
   `GUN_QUALITY_OUT_OF_RANGE`, `GUNNERY_AMMUNITION_UNAVAILABLE`,
   `GUNNERY_FIRE_CONTROL_SOLUTION_INSUFFICIENT`, `GUNNERY_STATE_INVARIANT_FAILED`
   — plus one code that is **not** a §32 code: `GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED`,
   a deferred-predicate marker a firing guard reports for `RAPID`/`AA_TRACKING`/
   `AA_BARRAGE` rather than fabricating an eligibility rule DESIGN-39 doesn't
   define this slice. It reuses four existing shared combat-catalog codes
   (`TACTICAL_STATE_INVARIANT_FAILED`, `TACTICAL_FOG_OF_WAR_VIOLATION`,
   `INVALID_TACTICAL_CLOCK`, `INVALID_TACTICAL_TIME_CONTRACT`) rather than
   redefining them. The remaining twelve §32 codes (autoloader/dual-purpose/
   armor/target-allocation/straddle) are recorded here as deferred to their
   owning tracks, never shipped by this slice. `combat/test/reason-codes-gunnery.test.ts`
   enforces this partition by set-equality so a future change cannot silently
   grow the shipped surface without updating this ADR.
4. **Surface fire-control-solution minimum: `SURFACE_FIRE_CONTROL_MINIMUM_BP =
   2_000`.** DESIGN-39 does not pin the surface-mode (`NORMAL`) firing-guard
   threshold itself — only the `RAPID` autoloader-eligibility threshold (§7,
   `6_000` bp, out of this slice's scope). Research (`docs/research/b3-m2-gunnery.md`
   §2) grounds fire-control-solution quality as a confidence measure bounded by
   firing practice and observation, with `RAPID` already requiring `≥6_000`;
   a materially lower ceiling is appropriate for ordinary surface fire so that a
   battery in early `RANGING`/ladder practice (low solution quality) is
   correctly barred from `NORMAL` fire while a battery with even a rough
   solution can engage. `2_000` bp (20% of the 10_000-bp perfect ceiling) is
   authored as a versioned-ruleset **BALANCE TARGET** constant — not a primary-
   sourced figure, tunable within later fire-control-slice bounds without
   changing this ADR's intent.
5. **1880s RML heavy-gun `baseReloadMilliseconds` = `210_000` ms.** The research
   note (`docs/research/b3-m2-gunnery.md` §1) grounds six calibers directly from
   NavWeaps per-gun cyclic-rate figures (6 in through 16 in, `7_000`–`40_000` ms)
   but finds **no single primary table pins a precise integer** for `scen_1880`'s
   1880s muzzle-loading heavy RML guns (12–17.7 in), only a qualitative "1–5
   minutes per round" figure narrowed to a defensible `120_000`–`300_000` ms
   (2–5 min) range. Per the research note's explicit flag ("should author...
   and flag it, never silently resolve, either as an ADR'ed constant or an OPEN
   DECISION"), this ADR resolves it as an **authored BALANCE TARGET at the
   midpoint of the grounded range, `210_000` ms (3.5 min)** — not a primary
   fact, tunable by a later content/balance pass within the same
   `120_000`–`300_000` ms bound without requiring a new ADR. The full six-caliber
   plus RML-heavy set ships as the versioned `gunnery_ballistics_v1` contract
   (`SHIPPED_GUNNERY_BALLISTICS_CONTRACT` + `validateGunneryBallisticsContract`,
   `packages/combat/src/gunnery/constants.ts`), fail-closed on drift, with a
   `baseReloadMsForCaliber` lookup that fails `GUNNERY_RATE_FACTOR_MISSING` on
   an unrecognized caliber rather than a silent default.
6. **Contracts rollup (AC-14).** Every gunnery constant set shipped by INC-1..5
   — base state/ammo/fire-mode (`gunnery_v1`), accuracy manifest
   (`gunnery_accuracy_v1`), rate manifest (`gunnery_rate_v1`), gun quality
   (`gun_quality_v1`), and ballistics (`gunnery_ballistics_v1`) — ships as a
   `SHIPPED_*_CONTRACT` + a `validate*Contract` guard that fails closed
   (`GUNNERY_STATE_INVARIANT_FAILED`) on any drift from the shipped shape,
   proven by `combat/test/gunnery/contracts.test.ts`.

## Consequences

- B-3 adds core surface gunnery capability without disturbing the accepted M1
  strategic auto-resolution path or the B-2 movement/spotting/contact engine;
  goldens stay unchanged (no ADR-0007 regeneration) and `BattleResolver` is
  verifiably unmodified.
- The reason-code surface is closed and enforced by a dedicated set-equality
  test; a future slice (autoloader, dual-purpose, armor, target-allocation,
  straddle/AA) adds its own §32 codes and its own ADR rather than silently
  extending this one.
- `SURFACE_FIRE_CONTROL_MINIMUM_BP` and the RML-heavy `baseReloadMilliseconds`
  are explicitly flagged as authored BALANCE TARGET constants (non-primary-
  sourced), tunable by a later balance pass within their documented bounds
  without requiring a new ADR, per ENGINEERING-CONTRACT's balance-target
  policy.
- Autoloaders, dual-purpose guns, armor/penetration, straddle, target
  allocation, and phase-pipeline wiring remain explicitly out of scope for B-3
  and are not silently absorbed.

## Related requirements

- DESIGN-39 §§1–5, §7 (RAPID threshold cross-ref), §28, §30–33.
- DESIGN-38 (tactical minute pipeline, contact/fog-of-war reuse), DESIGN-07
  (fixed-point arithmetic), DESIGN-55 §3 (M2 dependency).

## Related ADRs

- ADR-0018 (B-2 movement/spotting scope/integration boundary — mirrored here),
  ADR-0019 (B-2 contact shape), ADR-0017 (B-1 auto-resolution scope), ADR-0007
  (cross-process determinism).
