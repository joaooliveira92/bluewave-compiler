# Weather Components & Visibility

- **Type:** grilling
- **Status:** resolved

## Question

What are the exact tactical weather components and their types/ranges? What is
the visibility formula and its constants? What are the glare, fog, precipitation,
and night/twilight models?

## Answer

**12 tactical weather components** (§3) as integer fields with canonical units:
sea state (0..9), wind direction (canonical angular), wind speed (µm/s),
precipitation type (enum), precipitation intensity (0..10_000 bp), fog/mist
density (0..10_000 bp), cloud cover (0..10_000 bp), time-of-day (enum),
solar bearing/elevation (integer), glare intensity (0..10_000 bp),
base visibility distance (µm), local smoke fields (reserved for M3).

**Visibility** (§5): `effectiveVisibility = floor(baseVisibility * precipMultiplierBp * fogMultiplierBp * daylightMultiplierBp * glareMultiplierBp * smokeMultiplierBp / 10_000^5)`, one FLOOR.

**Glare** (§24): angular separation bands — <10°: 5_000 bp, 10–20°: 7_500,
20–30°: 9_000, ≥30°: 10_000. Disabled when cloud cover >7_500 bp.

**Fog** (§25): density→visibility multiplier: 0–999: 10_000, 1_000–2_499: 8_500,
2_500–4_999: 6_000, 5_000–7_499: 3_500, 7_500–10_000: 1_500 bp.

**Precipitation** (§26): none: 10_000, light: 9_000, moderate: 7_500, heavy: 5_000,
extreme: 2_500 bp.

**Night/twilight** (§27): five states — DAY, TWILIGHT_DAY, TWILIGHT_NIGHT, NIGHT,
DAWN_DUSK_TRANSITION. Derived from battle date, location, tactical time, and
canonical daylight profile.

All shipped as `weather_visibility_v1` constants with `SHIPPED_WEATHER_VISIBILITY_CONTRACT`
+ validate guard. Missing constant → `WEATHER_VISIBILITY_FORMULA_MISSING`.