# 15: SENSOR_FC_UPDATE refit, growth/fatigue

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

Spec: `.scratch/ship-building/spec.md` (see §26 row SB-15). Acceptance: the ACs named in the spec for this slice,
with unit, boundary, invalid-design, serialization and determinism tests per spec §22.

## Comments

- Landed: `evaluateRefit`/`ShipState` with GrowthBudget, HullFatigue, remaining life; refit = diff re-compile; only NEW blocking/critical findings block; kind rules, economics vs replacement, out-of-service time. All nine kinds have rule slots; SENSOR_FC_UPDATE is exercised by tests, other kinds are data-only until their content/tests land (SB-19+).
