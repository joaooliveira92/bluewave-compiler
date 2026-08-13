# INC-2 — Armor Model (DESIGN-39 §§16–24)

**State:** READY_FOR_AGENT · **Blocked by:** INC-1
**Spec:** `.scratch/b4-m2-armor-damage/spec.md` (AC-5)

## Acceptance criteria
- AC-5 armor: zone set incl. the §16 canonical zones; each zone stores thickness (µm), quality, slope, coverage, manufacturing policy.
- Zone maxima: main belt 508 000 µm; turret face / barbette / conning-tower 660 400 µm; every other zone MUST declare a maximum → `ARMOR_ZONE_MAXIMUM_MISSING`; above-max → `ARMOR_THICKNESS_LIMIT_EXCEEDED` (equality legal).
- `thick_armor_manufacturing_v1`: threshold 304 800 µm, `manufacturingEffectiveThickness = baseThickness + floor(excess × 7 500 / 10 000)` (7 500 bp shipped; permitted range 6 000..9 000 recorded).
- `qualityAdjustedThickness = floor(manufacturingEffectiveThickness × qualityMultiplierBp / 10 000)` (§20); missing family → `ARMOR_QUALITY_MULTIPLIER_MISSING`.
- Impact geometry / obliquity (§21) applied after manufacturing+quality; full exact-µm operand record; no rounded UI operands.
- Splinter (§22/§23): ≥ 50 800 µm threshold; LIGHT/MEDIUM qualifying protection; HEAVY/EXTREME explicit formulas.
- 7 penetration outcomes (§24) via deterministic predicate or keyed draw.
- Contracts: `armor_v1` + `SHIPPED_ARMOR_CONTRACT` + `validateArmorContract` (fail-closed), grounded in `docs/research/b4-m2-armor-damage.md`.

## Notes
Pure functions only; no engine wiring this INC. Table-exactness + bound tests mirror `combat/test/gunnery/gun-quality.test.ts`.