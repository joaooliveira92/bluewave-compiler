# Decision 04: Placement rules

## Question

DESIGN-48 says: "Battles use valid predefined geographic placement zones. Random placement selects among valid zones. Seed-driven placement prevents tactical optimization. Batteries cannot appear in geographically invalid positions." What is the minimal implementable placement model?

## Options

**A. Pure placement function.** A function `selectCoastalDefensePositions(areaId, geographicZones, rng, seed)` that returns a list of placed battery positions from valid zones. Zones are a simple collection of string identifiers per area. The RNG draws from a keyed stream `coastal_defense/placement/<areaId>/<seed>`. No geometry or map data required — zones are authored data (content-side).

**B. Full geographic model.** Implement actual coordinates, bounding boxes, land-vs-sea detection.

## Decision

**Option A.** Pure placement function over authored zone sets. Geographic validation ("cannot appear in geographically invalid positions") is a content-side concern (the zones themselves are valid by construction in authored data). The model only rejects zones not in the area's valid set. Seed-driven selection uses a domain-separated keyed RNG stream.