# ADR-0031 (C-1): Torpedo Fire-Resolution Slice — Scope/Integration Boundary, Reason Codes, and Detonation-Fuze Authority

## Status

Accepted 2026-08-16

Superseded by: ADR-0046 (decision 3 — swept-segment hits).

## Context

C-1 is the M3 (Track C) torpedo fire-resolution vertical slice of DESIGN-40,
scoped as an engine-only, deterministic, minute-advancing resolution in
`@bluewave/combat` (model → launcher → ammunition → launch legality → launch →
track → hit → detonation → damage package; INC-1..INC-8). The spec
(`.scratch/c1-m3-torpedoes/spec.md`) requires the C-1 scope/integration +
reason-code/constant decision to be recorded as an ADR. DESIGN-40 §14/§15 pin
the hit predicates and the closed detonation-outcome set but not (a) how the
target's "authoritative collision geometry" is represented, (b) where the fuze
policy (which changes authoritative detonation outcomes) is carried, or (c) the
§15 probability multipliers — those are authored values whose source must be
pinned so the authoritative hash surface has a canonical carrier.

A concurrency note: the spec's planned "ADR-0029" number was already consumed by
the desktop debug-mode gate (ADR-0029-desktop-debug-mode-screens.md), so the C-1
ADR is numbered **ADR-0031** (desktop later claimed plate 0030 for the bridge
boundary). This renumbering is recorded here once.

## Decision

1. **Scope/integration boundary.** C-1 ships pure, deterministic torpedo
   fire-resolution functions in `@bluewave/combat/src/torpedoes/`. **No**
   campaign snapshot schema change, **no** phase/snapshot change, **no**
   `BattleResolver`/`StrengthCalculator` modification. The engine stage wiring
   (`resolveTorpedoes` after damage, strict no-op) is INC-7; phase-engine
   integration and `resolveBattleAuto` torpedo wiring is a later battle-results
   slice (mirrors B-3 gunnery → B-6 deferral). INC-6 reuses the B-4 damage seams
   by import only (`resolveStructureFlotation`, `applyTurretDamage`,
   `ComponentOutcome`, `evaluateMagazineHazard` shape, `evaluateTerminalSeam`,
   the deepFreeze+envelope record pattern); `src/damage/` and
   `src/battleResolution/` are unmodified (diff-verified). Goldens unchanged
   (AC-25, verified 10/10).

2. **§14 collision geometry (INC-5).** No production target geometry exists in
   the codebase; DESIGN-40 pins the predicate, not the shape. The hit resolver
   takes a caller-supplied `TargetHitProfile` — integer-circle collision radius,
   target draft, and the legal contact position as the anchoring point — so the
   subtle-circle test is pure integer/bigint (`floor`); a miss is a resolved
   `GEOMETRY_MISS`, never a thrown engine error. The anchor is the **legal
   contact position** (firing-side knowledge only, no clairvoyance), mirroring
   the reused `validateTargetOrder` rule set (confidence > 0); any decayed/
   unknown contact is a §14 miss, not a throwing fog-of-war violation.

3. **Fuze authority (INC-5, HIGH-1 repair).** Fuze changes authoritative
   detonation outcomes (`MAGNETIC` + wake → `PREMATURE_DETONATION`; fuze multiplier
   on the detonation probability), so it cannot be a free caller argument. Fuze is
   carried by a **versioned model→fuze mapping** `TORPEDO_MODEL_FUZE_POLICY`
   keyed by `torpedoModelId`, grounded in `docs/research/c1-m3-torpedoes.md`:
   `whitehead_18in_1894`/`rn_21in_mk_iv_1916` = `CONTACT` (contact pistol);
   `ger_533mm_g7a_1934`/`ger_533mm_g7e_1936`/`jpn_61cm_type93_1935` = `MAGNETIC`
   (Pi MZ magnetic pistols / Mk-14 magnetic-exploder + Type-93 premature/wake
   detonations). Unknown model ids fail closed
   (`TORPEDO_STATE_INVARIANT_FAILED`), no silent default.

4. **Reliability is bound to the authoritative track.** INC-5 detonation reads
   reliability from `track.reliabilityState.reliabilityBp`, never from a
   caller-supplied value — the track hash is the tamper-evidence envelope, and
   the probability composition must come from the canonical entity.

5. **§15 probability constants (INC-5).** The §15/detonation multipliers
   (fuze/protection/damage/depth-band/obliquity) are authored BALANCE TARGET
   anchors, not claimed canonical numbers; they are pinned by
   `SHIPPED_TORPEDO_DETONATION_CONTRACT` + `validateTorpedoDetonationContract`
   (fail-closed tamper guard) and versioned. Production tuning is a version
   bump under the same contract, never silent.

6. **Reason-code partition (per spec §1.4 + AC-21).** The C-1 slice ships the
   DESIGN §29 in-slice reason codes only (`INVALID_TORPEDO_MODEL_DEFINITION` …
   `TORPEDO_LAUNCH_FAILURE`, `TORPEDO_HIT_RESOLVED`, `TORPEDO_DUD`, etc.) plus
   documented in-slice markers (`TORPEDO_FIRE_SOLUTION_FACTOR_MISSING`,
   `TORPEDO_STUCK_IN_TUBE`),
   reusing existing combat catalog codes (`TORPEDO_STATE_INVARIANT_FAILED`,
   fog-of-war, damage pipeline) — the set-equality partition
   (`reason-codes-torpedoes.test.ts`, AC-21) prevents silent addition; deferred
   §-29 ownership (submarine launch → C-3, aerial → D-track, command/denial →
   command slice) is recorded, not dropped.

7. **Fuze field on the model surface: NOT added (deferred decision).** DESIGN-40
   §1 pins model fields and does not include fuze; the model surface is already
   shipped in INC-1 and content hashes are versioned. Adding fuze to the model
   would change model content hashes (AC-25 golden risk) for no benefit while the
   versioned model→fuze mapping already carries it authoritatively. If DESIGN is
   later amended to require per-model fuze on the model, it is a content-hash
   change versioned under the model contract, not a silent edit.

8. **§17 TUBE_BAY impact-zone flotation multiplier = 12_500 (INC-6).** DESIGN-40
   §17 ships exactly five impact-zone rows (extremity / machinery / magazine /
   central / breached); the engine zone enum adds `TUBE_BAY` (INC-5,
   `detonation.ts`), which §21/§22 hit-hazard mechanics require. The authored
   12_500 ordnance-class interior multiplier is a new canonical constant DESIGN-40
   did not anticipate; it is contract-pinned (`TorpedoDamageContract`) and clearly
   marked BALANCE TARGET. Forward/lower displacement than a magazine (which
   DESIGN-40 sets at 12_500 and the torpedo convention of an underwater-tube
   bay near the hull's waterline makes the ordnance-class 12_500 a defensible
   judgment). This is recorded here as an explicit decision rather than a silent
   constant; a future DESIGN amendment for TUBE_BAY supersedes it under the same
   contract, never silently.

9. **§21 severe "immediate flooding" is flotation-reserve loss (INC-6).** DESIGN-40
   §16 separates an *immediate flooding* field from a *progressive-flooding source
   rate*; §21's "immediate additional flooding equal to `5_000` bp of remaining
   reserve (capped)" is therefore immediate flotation loss per §17 semantics,
   applied as a deduction from the flotation reserve (floor-at-0, capped by
   remaining reserve) flowing through `evaluateTerminalSeam` (can reach SINKING/
   SUNK). It is NOT summed into `progressiveFloodingTotal`. The 15_000 bp
   `extraFloodingSource` flooding record remains the separate C-5 progressive
   source (creation-only; per-minute resolution C-5).

10. **INC-6 authored BALANCE TARGET integers (recorded, never silent).** Where
    DESIGN-40 leaves magnitudes open, INC-6 authors integer values all pinned in
    `TorpedoDamageContract` and marked in code: base flotation rate 16
    reserve-units/kg-equivalent, structural rate 48 (×3 of flotation), base
    breach rate 1_000 kg/min·m², immediate-flooding seawater density 1_000 kg/m³
    + min-depth floor 1 m, tube-crew casualty base 5_000 bp / 2_500 bp at-risk
    share; the §22 five-modifier manifest requires neutral 10_000 passed
    explicitly (fail-closed, no silent default). All re-tunable via a version bump
    under the same contract, never silently.

11. **§22 chain-reaction modifiers collapse to neutral in the engine stage
    (INC-7).** `resolveTorpedoes` (the minute-advance stage) hard-codes all five
    §22 modifiers to neutral 10_000 and fires the chain only on a **severe** §21
    tube hit; a `MAGAZINE`-zone chain reaction (which `detonation.ts` selects via
    the `MAGAZINE_OR_TUBE_CHAIN_REACTION` outcome class) is not wired into the
    stage. This is an explicit deferral of the finer damage-control surface the
    stage does not yet expose; the INC-6 `chainReaction.ts` explicit-modifier
    contract is unchanged (a caller that supplies real modifiers still gets the
    full §22 composition). Recorded here; resolved when the stage exposes
    scene/damage-derived modifiers (before INC-8 phase wiring relies on chain
    probabilities).

12. **Engine-stage authored defaults (INC-7, recorded).** `resolveTorpedoes`
    defaults command-supplied torpedo inputs where DESIGN-40 leaves them open:
    `TORPEDO_RESOLUTION_DEFAULT_DEPTH_M = 5` (attack depth when a command omits
    it), `deviationMdeg = 0` (straight-on impact), `wakeIntercept = false`, and
    the §13 gyro-guide default (unset `orderedGyroAngleMdeg` = launch heading,
    consistent with the running-gyro invariant). The `target.scene` fields
    (impact side / longitudinal / breach / fire / casualties / accessibility /
    isolation) are **required caller inputs** (the engine has no ship-design
    knowledge) — never silently defaulted.

13. **Whole-minute track-sampling approximation (INC-7, recorded).** The stage
    advances each torpedo as a single end-of-minute jump and evaluates the §14
    collision at only the sampled end position; a torpedo that crosses the target
    circle mid-minute and ends beyond it MISSES. End-of-minute sampling is a
    documented approximation, not DESIGN-40-authorized; reviewed before phase
    wiring (INC-8/battle-results) relies on it.

14. **`battleLedger` ordering tie-break locale-independent (INC-7).**
    `canonicalEventOrder`'s `localeCompare` tie-break was replaced with a plain
    `<`/`>` comparator, removing locale/ICU dependence from cross-process
    determinism (§28/AC-23). Verified byte-identical against the committed
    B-2..B-6 no-context golden hashes (0 ordering diffs) and the existing
    `test/simulation/` suite.

## Consequences

- INC-5's detonation resolver is fully determined by the track + model id:
  identical inputs ⇒ identical hit verdict / detonation outcome / probability
  / provenance, cross-process.
- Torpedo suite: 504 tests; full combat suite green except concurrent-session
  C-2 mines mid-edit; goldens unchanged 10/10; `BattleResolver`/
  `StrengthCalculator` unmodified.
- INC-6 (chain-reaction §22) MUST preserve the reliability draw as the sole/
  stable draw in the detonation evaluation so draw consumption and save
  continuity do not shift (documented in `detonation.ts`).
- INC-7 engine stage: strict no-op path (absent torpedo context) keeps B-2..B-6
  per-minute hashes byte-identical (proven); same-minute gunnery→damage→torpedo
  state composes (BLOCKER-2 fixed); §22 chain records/events are unique
  (BLOCKER-1 fixed); machinery/shock evaluated once (single-eval).
- INC-8 folds the full `*_v1` contracts rollup (INCLUDING the torpedo
  detonation + damage contracts) and the `reason-codes-torpedoes.test.ts`
  set-equality partition; ADR numbers referenced from INC-5..INC-7 code headers.

## Related requirements

DESIGN-40 §§1,5–23,29 (§24-friendly-fire), ENGINEERING-CONTRACT (determinism,
RNG domain separation, hashing, arithmetic), DESIGN-55 §2.

## Related ADRs

ADR-0029 (name collision avoided — renumbering; desktop debug-mode); refer to
ADR-0020 (B-3 scope), ADR-0021 (B-4), ADR-0007 (cross-process/golden).