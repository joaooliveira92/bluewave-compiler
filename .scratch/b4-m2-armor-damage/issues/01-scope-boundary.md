# Ticket 01 — Scope Boundary

**Type:** decision
**State:** RESOLVED
**Blocked by:** none

## Question
What is the B-4 (M2 "basic armor & damage") subset of DESIGN-41, and what is the
M2/M3 damage boundary?

## Decision
B-4 ships DESIGN-41 **basic armor & damage**: §§1–9 (§1 damage state; §2
categories; §3 10-stage pipeline; §4 hit location; §5 protection interaction via
DESIGN-39 §§16–24; §6 local component damage; §7 turret states; §8 structure &
flotation; §9 immediate fire/flooding *creation* only), plus §45 damage event
record, §46 canonical ordering, §47 in-slice reason codes, §48 validation items
that pertain to the incorporated stages. **Deferred to M3/C-5 (recorded, never
dropped):** §§10–18 (secondary-hazard full set, flooding control/serious–major/
progressive/containment/dewatering), §§19–26 (fire resolution/spread/suppression/
night-visibility/smoke/aluminum), §§27–28 (damage-control resources/priority
operational allocation), §§29–44 (terminal states, stabilization, abandonment,
scuttling/capture/recovery, sinking credit, victory timing, post-battle survival,
survivors/rescue), §44 fire/flooding persistence.

## Rationale / authority
DESIGN-55 §4 (M2 contents) and SPRINT-PLAN B-4 row ("DESIGN-41 basic subset;
detailed damage control deferred to M3 per DESIGN-55 §4") and C-5 row ("remainder
of DESIGN-41"). Matches the B-2/B-3 "bounded subset + recorded boundary + ADR"
pattern.

## Consequence
Engine stage strictly no-op when no impact/hazard is presented → goldens unchanged.