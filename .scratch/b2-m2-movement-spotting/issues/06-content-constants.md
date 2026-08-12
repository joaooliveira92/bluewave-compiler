---
Type: research
Status: resolved
Blocked by:
---

# B-2 / 06 — Formation & movement constants (research-grounded)

## Question

What real-world values ground the formation/movement constant set B-2 ships?

## Answer

Resolved by `docs/research/b2-m2-movement-spotting.md` (high-trust naval reference):
typical battle-line column spacing, division station offsets, standard
cruise/flank-speed and acceleration/turning-rate reference values for late-19th /
early-20th century surface ships, and visual detection horizon/range references —
all converted to integer basis-point / fixed-point constants in the B-2 versioned
constant contracts. Because these are engine-authoritative versioned constants
(`*_v1` + `SHIPPED_*_CONTRACT`), no production-pack YAML change is required this
sprint; a future tactical-constants content collection may absorb them at
integration.
