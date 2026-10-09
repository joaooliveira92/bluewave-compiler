# ADR-0083: Fittings are inside the hull weight; fitting components carry no extra mass

## Status

Accepted 2026-10-09. Resolves ticket 36.

## Context

`hullCoeffMilliKg` is fitted to White's *Manual of Naval Architecture* (1894) hull fractions: "weight of hull" is 38 % of
displacement, 18 % structure plus 20 % "fittings in magazines, shell-rooms, store-rooms, cabins, crews' quarters, etc.; and
arrangements for pumping, drainage, ventilation, electric lighting" (pp. 409-410, VERIFIED). The component catalogue also gave
`magazine_*`, `quarters_crew`, `pumps_damage_control` and `ventilation_plant` their own masses (unsourced), so that weight was
counted twice.

## Decision

Keep the verified 38 % hull fit and give those components zero mass: they keep their volume, crew, power and capacity
effects. The alternative, refitting the hull to the 18 % structure share, would replace a verified fit with fitting masses that
have no source. `dynamo_small` keeps its mass: White counts the electric lighting arrangements, and the generating machinery
is read as equipment; its mass stays an open marker.

## Consequences

Designs are 2-30 t lighter, depending on the magazines fitted. Omitting a magazine no longer saves weight, which matches White's
accounting: the hull fraction includes the fittings either way. Only designed ships are affected; goldens are unchanged.
