# ADR-0031 (C-1): Torpedo Fire-Resolution Slice — Scope/Integration Boundary, Reason Codes, and Detonation-Fuze Authority

## Status

Accepted 2026-08-16

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
   slice (mirrors B-3 gunnery → B-6 deferral). Goldens unchanged (AC-25,
   verified 10/10).

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
   documented in-slice markers (`TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED`,
   `TORPEDO_FIRE_SOLUTION_FACTOR_MISSING`, `TORPEDO_STUCK_IN_TUBE`),
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

## Consequences

- INC-5's detonation resolver is fully determined by the track + model id:
  identical inputs ⇒ identical hit verdict / detonation outcome / probability
  / provenance, cross-process.
- Torpedo suite grew to 350 tests; full combat suite 1364/1364 green; goldens
  unchanged 10/10; `BattleResolver`/`StrengthCalculator` unmodified.
- INC-6 (chain-reaction §22) MUST preserve the reliability draw as the sole/
  stable draw in the detonation evaluation so draw consumption and save
  continuity do not shift (documented in `detonation.ts`).
- INC-8 folds the full `*_v1` contracts rollup (INCLUDING the torpedo
  detonation contract) and the `reason-codes-torpedoes.test.ts` set-equality
  partition; ADR numbers referenced from INC-5's code headers.

## Related requirements

DESIGN-40 §§1,5–23,29 (§24-friendly-fire), ENGINEERING-CONTRACT (determinism,
RNG domain separation, hashing, arithmetic), DESIGN-55 §2.

## Related ADRs

ADR-0029 (name collision avoided — renumbering; desktop debug-mode); refer to
ADR-0020 (B-3 scope), ADR-0021 (B-4), ADR-0007 (cross-process/golden).