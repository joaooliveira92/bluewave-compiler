# Ticket 02 — Armor Model Integration

**Type:** decision
**State:** RESOLVED
**Blocked by:** 01

## Question
How does the DESIGN-39 §§16–24 armor model land, given it was deferred out of B-3?

## Decision
Ship the full armor model as the protection-interaction backend of the B-4
damage pipeline, as versioned engine constants (`armor_v1` +
`SHIPPED_ARMOR_CONTRACT` + `validateArmorContract`, fail-closed) and pure
functions:
- **Armor zones** (§16): canonical zone list; each zone stores thickness (µm),
  quality, slope, coverage, manufacturing policy.
- **Thickness limits** (§17): main-belt max 508 000 µm (20 in); turret face /
  barbette / conning-tower vertical 660 400 µm (26 in); every other zone MUST
  declare a maximum → `ARMOR_ZONE_MAXIMUM_MISSING`; above-max → `ARMOR_THICKNESS_LIMIT_EXCEEDED` (equality legal).
- **Thick-armor manufacturing** (§18/§19): threshold 304 800 µm (12 in);
  `manufacturingEffectiveThickness = baseThickness + floor(excess × 7 500 / 10 000)`;
  excess effectiveness exactly 7 500 bp (permitted range 6 000..9 000 recorded).
- **Armor quality** (§20): `qualityAdjustedThickness = floor(manufacturingEffectiveThickness × qualityMultiplierBp / 10 000)`; active technology supplies multiplier + armor-family id.
- **Impact geometry** (§21): obliquity / normalized obliquity applied after
  manufacturing+quality; every check records the full operand set (µm exact, no
  rounded UI values).
- **Splinter** (§22/§23): protect threshold ≥ 50 800 µm (2 in) vs LIGHT/MEDIUM
  qualifying splinters; HEAVY/EXTREME explicit formulas.
- **Penetration outcomes** (§24): NO_EFFECT / SPLINTER_EFFECT /
  PARTIAL_PENETRATION / FULL_PENETRATION / PASS_THROUGH / DUD /
  CRITICAL_PENETRATION selected by deterministic predicate or keyed draw — never
  narrative text.

## Rationale / authority
DESIGN-39 §§16–24 (B-3 spec §3 records their fold-in to B-4). Mirrors the B-3
versioned-constant pattern (B-3 ticket 06).

## Consequence
Completes the seam B-3's `GunneryEventRecord` reserved ("impact/armor inputs
(reserved this slice)") without touching the B-3 gunnery modules.