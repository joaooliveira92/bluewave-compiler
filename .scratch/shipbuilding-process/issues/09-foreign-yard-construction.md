# 09: Foreign-yard construction

**Type:** grilling
**Status:** resolved
**Blocked by:** 02

## Question

Decide foreign-yard construction so it matches the manual, reconciled with DESIGN-23 and the code.

Manual (printed p33): if you cannot build at home you can contract ships to foreign yards, limited
by the building nation's dock size; this helps if your nation lacks technology or industry; the
drawback is impoundment risk if war breaks out, based on tension with the builder (a treaty
guarantees delivery); the advantage is insight into the builder's technology. DESIGN-23 §1
(builder nation and facility) and §11 (Builder Quality, Foreign Yard) already reference foreign
builders, but foreign-yard construction is unimplemented in code (only component-import appetite
and `nationalConstruction.ts` foreign-procurement inputs exist).

Decide: the foreign-yard ordering flow; the builder-nation dock-size constraint; the impoundment
roll (timing, tension input, deterministic stream) and the treaty-delivery guarantee; the
technology-insight transfer; and where in the phase engine delivery/impoundment resolves.

## Answer

Resolved 2026-10-12 (autonomous; grounded in `docs/research/manual-building-ships-rules.md` p33,
DESIGN-13 `bases-and-infrastructure.md` §13–14, DESIGN-23 §1/§2/§11, and the code).

**The normative target exists in DESIGN-13 §13–14 and matches the manual; it is unimplemented.** The
manual's four foreign-yard properties map one-to-one:

- **"limited by the building nation's dock size"** → §13.1–13.2: a `ForeignConstructionContract` exists
  only when the compiled design's displacement and dimensions are within the **builder's** dock limits,
  technology, capacity and treaty permission (`FOREIGN_CONSTRUCTION_CONTRACT_REQUIRED` otherwise).
- **"impounded if a war breaks out … risk depends on tension"** → §13.6 `foreign_contract_war_policy_v1`
  (outcomes CONTINUE / DELAY / SUSPEND / IMPOUND / CANCEL_WITH_SETTLEMENT / PHYSICALLY_IMPOSSIBLE) and
  §13.7 impoundment records; the already-specified `IMPOUNDED` project status (DESIGN-23 §2) carries the
  incomplete hull. Tension enters the policy predicate.
- **"if you have a treaty … always delivered"** → §14 delivery guarantee: a valid treaty/contract clause
  prohibits discretionary `IMPOUND` (but not physical impossibility).
- **"you may gain insight into the technology"** → §13.5 `foreign_construction_insight_v1`: design-study,
  50%-work and delivery research micro-points (500 / 1000 / 1500, max 3000 per family) when the ordering
  nation lacks the technology; never grants a technology outright.

Also: payment schedule with a 1-month grace then `PAYMENT_DEFAULT_DELAYED` (§13.4); foreign capacity
consumes the **builder's** pools, not the ordering nation's (§13.3); builder-quality defect weights are
DESIGN-23 §11 foreign-yard values (10_000 / 11_000 / 13_000 bp).

**Decision:** implement DESIGN-13 §13–14 as written; no constant or boundary change. Constants already
fixed (grace 1 month; insight 500/1000/1500/3000; defect weights); the tension→impound policy predicate
values are BALANCE TARGET (map fog).

Hand-off: implementation slices — (a) `ForeignConstructionContract` + builder-capability validation;
(b) payment/grace; (c) war effects + impoundment + delivery guarantee; (d) tech-insight milestones —
feeding the "Player-facing building-ships flow".
