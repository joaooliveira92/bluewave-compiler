# Decision 04: Smoke spatial model

## Question

DESIGN-42 §7 requires spatial SmokeCloud records with "canonical polygon or volume representation, centroid position, density, vertical extent, wind-drift vector, expansion rate." What spatial model should C-5 implement?

## Options

**A. Point-cloud density model.** A smoke cloud is a point (centroid) with a density value, drift vector, and expansion radius. Line intersection checks distance from centroid vs effective radius. No true polygon or volume geometry.

**B. Simplified line-segment model (as used in B-2/B-3 geometry).** Smoke clouds are represented as line segments (for smokescreens that follow ship movement) or points (for funnel smoke), with width and density. Intersection uses the same line-segment math as B-2's LOS checks.

**C. Full polygon model.** Explicit polygon vertices per cloud. Full spatial intersection logic.

## Decision

**Option B.** Follow the precedent of B-2's movement/spatial geometry: use line segments for smokescreens (generated along the ship's movement path) and centroid+radius for point sources (funnel smoke, floats, generators). Intersection checks reuse the line-segment math already in `@bluewave/combat`. The density contribution formula from §9 (`pathDensityContribution = floor(cloudDensityBp * pathLengthInsideCloud / max(1, cloudReferencePathLength))`) uses the same line-intersection primitives as B-2's LOS checks. This avoids introducing a full polygon geometry library while meeting the §7 requirements for spatial, deterministic smoke clouds.