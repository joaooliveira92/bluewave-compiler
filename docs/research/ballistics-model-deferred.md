# Deferred: historically grounded naval ballistics model (engineering/research ticket)

Status: **deferred, not implemented**. Created by ADR-0094 (combat caliber unit correction) to scope
the follow-up that replaces the ADR-0021 linear penetration approximation. This ticket is **not** part
of the unit correction: ADR-0094 changes only the caliber unit at the armament-to-combat boundary.

## Problem

The live auto-resolution penetration model
(`packages/combat/src/battleResolution/damage.ts::shellPenetrationUm`) is
`capabilityUm = floor(caliberUm * velocityMs / 1_000)` with a single authored muzzle velocity
(`SHELL_MUZZLE_VELOCITY_MS = 762`) and a zero impact angle for every impact
(`SHELL_IMPACT_ANGLE_DEG = 0`). It has:

- no velocity loss over range (results are range-invariant);
- no shell mass or form factor; the `projectileMass` argument is accepted and ignored;
- no armor type/quality research beyond the five `armor_v1` quality families;
- no capped-vs-uncapped projectile distinction;
- no explosive filler / bursting-charge effect;
- no impact-angle (obliquity/angle-of-fall) simulation.

It is a deliberate first approximation (ADR-0021), retained through ADR-0094.

## Scope of the future model (one ticket per area where possible)

1. **Muzzle velocity content.** Author `nominalMuzzleVelocityUmPerSec` per gun model (currently
   unauthored on the armament model) with provenance, and calibrate against primary sources.
2. **Velocity loss over range.** A time-of-flight drag model (or tabulated remainder velocity by
   range) so penetration is range-sensitive; replace the range-invariant result proven by the ADR-0094
   reference cases.
3. **Shell mass and form.** Use `shellMassG` and a shell-form factor; stop ignoring `projectileMass`.
4. **Armor type and quality.** Extend beyond the current `armor_v1` families if research supports it
   (e.g. face-hardened Harvey/Krupp behaviour by thickness).
5. **Impact angle.** Model angle of fall and obliquity; retire the fixed `SHELL_IMPACT_ANGLE_DEG = 0`
   and the geometry-free comparison.
6. **Capped vs uncapped projectiles.** Distinguish APC/CPC/Common with a cap/penetration effect.
7. **Explosive filler.** Bursting charge effect on behind-armor damage (currently a function of
   penetration outcome only).
8. **Formula selection and calibration.** Choose a named penetration equation (e.g. Thompson-F,
   de Marre, Krupp) or an interpolated gunnery table, calibrate it to the reference cases, and version
   it as a `*_v1` contract with fail-closed validation.

## Constraints to preserve

- Deterministic integer/fixed-point arithmetic (no floats in resolved values), single rounding at the
  end, no nation-id conditionals in shared combat logic.
- Canonical micrometre caliber unit at the boundary (ADR-0094) stays; the future model converts from it
  exactly.
- Content is researched, not invented; unauthored fields stay absent (ADR-0093 §2).
- New baselines are re-pinned through the ADR-0007 process; the balance/tuning implications are
  reviewed separately.

## References

- `docs/research/b3-m2-gunnery.md` (naval gun data).
- `docs/research/b4-m2-armor-damage.md` (armor/damage grounding).
- ADR-0021 (linear penetration), ADR-0026 (auto-resolution constants), ADR-0093 (armament domain),
  ADR-0094 (caliber unit correction).
