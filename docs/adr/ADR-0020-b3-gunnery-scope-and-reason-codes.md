# ADR-0020 (B-3): Gunnery Scope & Integration Boundary + In-Slice Reason-Code/Constant Policy

## Status

Accepted

## Context

B-3 is the third M2 sprint: the DESIGN-39 (`docs/rules/gunnery.md`) **core surface
gunnery fire-resolution** subset. DESIGN-39 defines the full gunnery subsystem — fire
modes (§2), accuracy (§3), rate-of-fire/reload (§4), gun quality (§5), autoloaders
(§6–10), dual-purpose (§11–15), armor zones/penetration (§16–24), straddle (§25),
target allocation (§26–27), ammunition (§28), damage effects (§29), event records
(§30), ordering (§31), and reason codes (§32). DATUM: `@bluewave/combat` already ships
a strategic strength-based `BattleResolver` (AUTO_RESOLVE default, ADR-0017) and, from
B-2 (ADR-0018), a `TacticalClock`-driven minute-advance simulation with movement/
spotting/contact state. B-2 produced the B-2 scope/integration-boundary ADR-0018;
B-3 needs the analogous scope/integration record plus a reason-code and content-constant
policy, because the slice ships authoritative versioned constants and eight reason
codes (one of which, `GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED`, is not present in the
authoritative DESIGN-39 §32 set).

Two related questions were open: (1) what is the B-3 scope / integration boundary vs.
the existing `BattleResolver` auto-resolution path and the newer B-2 minute-advance
engine, and (2) how new reason codes and constant surfaces — one not pinned by
DESIGN-39 — are recorded rather than fabricated.

## Decision

1. **Scope = core surface gunnery fire-resolution subset, engine-stage integration.**
   B-3 implements, as a pure deterministic engine in `@bluewave/combat`, the DESIGN-39
   §§1–5, §28, §30–32 and §33 validation items that pertain to the core surface
   fire-resolution slice: authoritative `GunneryState` (§1), the seven closed fire-mode
   records (§2), exact integer-basis-point accuracy with the §3 manifest (§3), integer
   tactical-ms reload with the §4 factor order and `ceil` (§4), gun quality `-3..+2`
   (§5), atomic ammunition reserve+consume (§28), immutable `GunneryEventRecord`s (§30)
   with canonical ordering (§31), and the in-slice §32 reason codes. The resolution runs
   as a new engine stage `resolveGunnery` in the B-2 minute-advance simulation **after**
   spotting (step 8) each minute, emitting events through the existing `BattleLedger` +
   `canonicalEventOrder`. **`BattleResolver` and `StrengthCalculator` remain unmodified.**
   Phase-pipeline wiring that replaces the strategic auto-resolution path is **B-6**;
   there is **no snapshot schema / phase change** and **no golden hash change** (no
   ADR-0007 regeneration).
2. **In-slice §32 reason-code policy.** DESIGN-39 §32 is authoritative for this
   subsystem. B-3 ships the §32 codes relevant to the core fire-resolution surface and
   records, rather than drops, the deferred codes. The in-slice gunnery catalog is
   exactly eight codes: `INVALID_GUNNERY_STATE`, `GUNNERY_STATE_INVARIANT_FAILED`,
   `GUNNERY_FIRE_CONTROL_SOLUTION_INSUFFICIENT`, `GUNNERY_ACCURACY_FACTOR_MISSING`,
   `GUNNERY_RATE_FACTOR_MISSING`, `GUN_QUALITY_OUT_OF_RANGE`, `GUNNERY_AMMUNITION_UNAVAILABLE`,
   and the new `GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED`. RAPID / AA_TRACKING / AA_BARRAGE
   eligibility predicates are **deferred** to a later straddle/AA slice; a firing guard
   reports the deferred predicate rather than fabricating one, so
   `GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED` is a genuinely new, versioned-ruleset code
   recorded here (it is **not** in DESIGN-39 §32 because §32 assumes those predicates
   resolve in-slice). B-3 additionally reuses four existing combat-catalog codes with no
   new record: `TACTICAL_STATE_INVARIANT_FAILED`, `TACTICAL_FOG_OF_WAR_VIOLATION`,
   `INVALID_TACTICAL_CLOCK`, `INVALID_TACTICAL_TIME_CONTRACT`. The remaining twelve §32
   codes are **recorded as deferred** (owned by named later slices/tracks):
   `AUTOLOADER_TECHNOLOGY_UNAVAILABLE`, `AUTOLOADER_MOUNT_INELIGIBLE`,
   `AUTOLOADER_FEED_JAMMED` (autoloaders §6–10); `DUAL_PURPOSE_GUN_CONTRACT_MISSING`,
   `DUAL_PURPOSE_ROLE_SWITCHING`, `DUAL_PURPOSE_AA_INELIGIBLE` (dual-purpose §11–15);
   `ARMOR_ZONE_MAXIMUM_MISSING`, `ARMOR_THICKNESS_LIMIT_EXCEEDED`,
   `ARMOR_MANUFACTURING_POLICY_MISSING`, `SPLINTER_PROTECTION_NOT_QUALIFIED` (armor/
   penetration §16–24 → B-4 armor-and-damage track); `GUNNERY_TARGET_ILLEGAL`
   (target-allocation/manual-orders §26–27); and `GUNNERY_STRADDLE_INVALID` (straddle
   §25). A `reason-codes-gunnery.test.ts` set-equality check against §32 + the existing
   catalog prevents silent addition (AC-10).
3. **`SURFACE_FIRE_CONTROL_MINIMUM_BP = 2_000` as a versioned-ruleset constant.** The
   surface-mode firing guard reports `GUNNERY_FIRE_CONTROL_SOLUTION_INSUFFICIENT` when a
   battery's fire-control solution quality falls below this basis-point threshold. The
   exact surface threshold is **not pinned by DESIGN-39** (§7 pins only that `RAPID`
   eligibility needs ≥6 000 bp, which is deferred here); it is therefore recorded as a
   documented, authorable `gunnery_v1` versioned-ruleset constant — **recorded, not
   fabricated**. Tuning is a balance-bound decision, not a decision-request.
4. **Research-grounded ballistics constant deliverable.** The §4 `baseReloadMilliseconds`
   grounding is shipped as engine versioned constants (`gunnery_ballistics_v1` +
   `SHIPPED_GUNNERY_BALLISTICS_CONTRACT` + `validateGunneryBallisticsContract`, fail-closed),
   grounded in `docs/research/b3-m2-gunnery.md` §1: base reload ms by broad caliber
   (152 mm→7 000, 203 mm→18 000, 305 mm→25 000, 356 mm→36 000, 381 mm→35 000,
   406 mm→40 000). These are BALANCE TARGET values (grounded reference figures, not
   primary-sourced exact integers). The scen_1880 1880s-RML heavy-gun reload
   (12–17.7 in muzzle-loading rifles, ~2–5 min/round) has **no precise primary integer**;
   it is recorded as a documented BALANCE TARGET lower-bound flag
   (`GUNNERY_SCEN1880_RML_HEAVY_BASE_RELOAD_MIN_MS = 120_000`) and flagged as **NOT fully
   grounded → needs content-owner/ADR decision**, never silently pinned as a primary
   fact. No production-pack YAML (`content/production/1880/`) change; golden hashes
   unchanged.

## Consequences

- B-3 adds engine capability without disturbing the accepted M1 strategic auto-resolution
  path or the B-2 minute-advance engine: goldens stay 9/9, there is no snapshot schema or
  phase change, and `BattleResolver`/`StrengthCalculator` are verifiably unmodified.
- The relationship to DESIGN-39 is bounded and explicit: §§1–5, §28, §30–32 in-slice;
  autoloader/dual-purpose/armor/straddle/target-allocation and damage effects deferred and
  recorded, never silently dropped; `RAPID`/`AA_TRACKING`/`AA_BARRAGE` codes are defined
  but their eligibility predicates report a deferred predicate.
- New codes and constants are authoritative and versioned; the one genuinely new code
  (`GUNNERY_ELIGIBILITY_PREDICATE_DEFERRED`) and the surface fire-control threshold and
  ballistics values are recorded here as versioned-ruleset decisions, satisfying the
  ENGINEERING-CONTRACT ADR + traceability requirement.
- Ballistics values and the surface fire-control threshold are authored BALANCE TARGETs;
  tuning them is a balance-bound decision. The 1880s RML heavy-gun reload remains an OPEN
  DECISION for the content owner.

## Related requirements

- DESIGN-39 §§1–5, §7, §28, §30–32, §33 (subset); DESIGN-38 (minute-advance + reason-code
  catalog); DESIGN-07 (integer arithmetic); DESIGN-55 §3 (M2 dependency).

## Related ADRs

- ADR-0018 (B-2 movement/spotting scope & integration boundary), ADR-0017 (B-1-6
  auto-resolution scope), ADR-0007 (cross-process determinism).