# ADR-0063: Component-Level Ship Compiler Beneath DESIGN-21

## Status

Accepted 2026-10-08

## Context

DESIGN-21/23 define a template-level design pipeline (displacement, speed, armour, guns).
The ship-building brief (`.scratch/ship-building/spec.md`) needs component-driven weight,
space, power, stability and refit logic with the "no free stats" property.

## Decision

1. SB-1 fills pipeline stages 3-12 and 17-18 of DESIGN-21 §7 with component-driven
   calculations; layer names, immutability, families, similarity, hashing and reason-code
   registry are unchanged. Refits and construction phases map onto DESIGN-23 project types
   and work packages; no parallel project model is created.
2. New pure package `packages/ship-design` (no campaign/UI dependency).
3. Compiled output keeps ADR-0037 canonical fields so combat/campaign are unchanged.
4. Money is budget micro-units (DESIGN-07), not a new "minor unit".
5. All arithmetic is integer/fixed-point; fractional powers use a exact bigint integer-root routine in
   `@bluewave/deterministic` (no `Math.pow`/`Math.random`/`Date`).
6. Trials are the only seeded randomness (`@bluewave/random`, logged); validation takes no RNG.
7. Zone-based (9 fixed zones) arrangement, not 3-D layout.

## Consequences

Existing 1880 templates import as degenerate component designs (AC-13). Content (components,
hull forms, balance constants) is YAML and must be researched, not invented.

## Bigint bound analysis (Engineering Contract: Arithmetic)

Design formulas multiply mass (up to ~1e8 kg), length (up to ~3e5 mm), bp (1e4) and raise
to rational powers (x^p with p<=3 of values up to ~1e12), which exceeds 2^53. Intermediate
products and `integerRoot`/`powRational` therefore use `bigint`; every result is converted
back through checked `toSafe` and must fit a safe integer, else a typed error is raised.
