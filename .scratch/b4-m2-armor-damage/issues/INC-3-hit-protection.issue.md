# INC-3 — Hit Location + Protection Interaction (Stages 1–2)

**State:** READY_FOR_AGENT · **Blocked by:** INC-2
**Spec:** `.scratch/b4-m2-armor-damage/spec.md` (AC-4, AC-5 wiring)

## Acceptance criteria
- AC-4 Stage 1 hit location: deterministic impact→zone from authoritative impact position + target geometry + zone geometry + current damage; exactly one primary compartment/external zone (+ optional adjacent); `DAMAGE_HIT_LOCATION_INVALID`; never relocates to an undamaged component for convenience.
- AC-5 wiring Stage 2: protection interaction against the armor model using the weapon's energy/penetration operands (from the B-3 event-record reserved seam, or an authored hazard package for later contracts); returns exact operand set + outcome (7-outcome set incl. `ARMOR_ZONE_MAXIMUM_MISSING`/`ARMOR_THICKNESS_LIMIT_EXCEEDED` paths); `DAMAGE_PROTECTION_INTERACTION_INVALID` on missing operands.

## Notes
Define the in-slice **impact/hazard package** type (= the shared Stage-2 input surface future torpedo/mine/bomb contracts will populate). No minute-advance wiring yet.