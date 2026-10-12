# INC-12c — Wire bulge protection into torpedo defence (or defer it)

**State:** READY_FOR_AGENT · **Frontier:** yes · **Blocked by:** none
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R25) · **ADR:** amends ADR-0130 (bulge refit kind)

## What to build

ADR-0130 adds `bulgeProtectionGainBp` as a recorded constant, but a bulge does **not** currently
change the ship's torpedo protection in combat — the manual says bulges "increase torpedo
protection" (p32). Either wire the constant into the ship's torpedo-protection stat, or record the
protection effect as explicitly deferred in ADR-0130 (no silent gap).

## Acceptance criteria

- [ ] Either: the compiled ship exposes a torpedo-protection value raised by `bulgeProtectionGainBp`
      for a bulged ship, with a test proving a bulged hull's protection exceeds an unbulged one's;
      or: ADR-0130 states plainly that the protection effect is **recorded but not yet consumed** by
      combat, with a follow-up ticket reference.
- [ ] The speed penalty continues to emerge from the compile's added mass (unchanged).
- [ ] No fabricated combat formula: if wired, the gain is the authored constant only.

## Notes for implementator

Check whether a torpedo-protection stat exists on the compiled design or the combat model first. If
no consumer exists in the EARLY band, the honest outcome is the ADR deferral plus a recorded
follow-up; do not invent a combat formula.
