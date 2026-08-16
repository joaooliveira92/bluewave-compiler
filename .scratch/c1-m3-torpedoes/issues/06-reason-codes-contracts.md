# Ticket 06 — Reason Codes & Contracts

**Type:** decision
**Status:** resolved
**Blocked by:** 01-scope-boundary

## Question

What reason-code surface and versioned constant contracts does the C-1 torpedo
slice ship, and what does it record-but-not-ship?

## Decision

- **Reason codes:** new `packages/combat/src/torpedoes/reasonCodes.ts` shipping the
  DESIGN-40 §29 codes relevant to this slice, with a `test/reason-codes-torpedoes.test.ts`
  set-equality partition (hand-code the full §29 list; partition into `IN_SLICE` +
  `DEFERRED`; assert the union covers §29 with no gaps/overlap, shipped catalog ==
  in-slice, no deferred code shipped, reused combat-catalog codes not redefined,
  module vs top-level catalogs disjoint). In-slice codes include at minimum:
  `INVALID_TORPEDO_MODEL_DEFINITION`, `INVALID_TORPEDO_LAUNCHER_STATE`,
  `TORPEDO_MODEL_INCOMPATIBLE`, `TORPEDO_AMMUNITION_UNAVAILABLE`,
  `TORPEDO_MANUAL_LAUNCH_MODE_PROHIBITED`, `TORPEDO_LAUNCH_AUTHORITY_DENIED`,
  `TORPEDO_TARGET_CONTACT_INSUFFICIENT`, `TORPEDO_FIRE_SOLUTION_INSUFFICIENT`,
  `TORPEDO_LAUNCH_ARC_INVALID`, `TORPEDO_LAUNCH_SPEED_LIMIT_MISSING`,
  `UNDERWATER_TUBE_SPEED_LIMIT_EXCEEDED`, `TORPEDO_FRIENDLY_FIRE_RISK_PROHIBITED`,
  `TORPEDO_LAUNCH_FAILURE`, `TORPEDO_DUD`, `TORPEDO_HIT_RESOLVED`,
  `TORPEDO_PROGRESSIVE_FLOODING_CREATED`, `TORPEDO_MACHINERY_DAMAGE_CREATED`,
  `TORPEDO_SYSTEM_SHOCK_DAMAGE_CREATED`, `UNDERWATER_TUBE_SEVERE_FLOODING`,
  `TORPEDO_CHAIN_REACTION`, `TORPEDO_STATE_INVARIANT_FAILED`; plus documented
  in-slice markers for deferred predicates (e.g. `TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED`
  per B-3 precedent) and reused catalog codes. Deferred §29 ownership is recorded
  (e.g. any submarine/air-specific codes → C-3/D-track) — never silently dropped.
- **Contracts:** versioned `*_v1` contracts + `SHIPPED_*_CONTRACT` + `validate*Contract`
  fail-closed guards for: `torpedo_v1` (model/launcher/ammo), `torpedo_launch_authority_v1`
  (§5 policy — DESIGN-40 names it), `underwater_tube_hit_hazard_v1` (§21 — DESIGN-40
  names it), and `torpedo_models_v1` (research-grounded model/constant set from
  `docs/research/c1-m3-torpedoes.md`, mirroring `gunnery_ballistics_v1`).
  `TorpedoModelDefinition` carries content version + content hash per §1.
- **Constant grounding policy:** exact shipped integers from DESIGN-40 are
  authoritative (no BALANCE override); research-grounded values use the
  `docs/research/c1-m3-torpedoes.md` recommendations; anything the research could
  not verify is authored as BALANCE TARGET and flagged — never claimed as grounded.
  Notable flagged items: §7's 25-kt underwater ceiling vs documented 15–20 kn
  practice (design-pinned; record in ADR), §23 oxygen wake multiplier, G7a range
  discrepancy (pick the NavWeaps values + record).

## Deferred (recorded)

- Command-layer codes (manual launch / division orders) — later command slice.
- Production/inventory-delivery + submarine + aerial torpedo codes — owning tracks.

## Rationale / authority

DESIGN-40 §29 lists exactly 21 required codes; §1 mandates content version + hash;
§5/§21 name their policy ids. The B-3/B-4 contract + set-equality precedent
(`reason-codes-gunnery.test.ts`, `reason-codes-damage.test.ts`) is the template.