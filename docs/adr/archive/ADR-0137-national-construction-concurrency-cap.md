# ADR-0137: National construction concurrency cap and AMC/small-corvette exemptions

## Status

Accepted (2026-10-12).

## Context

The reference manual (BUILDING SHIPS, printed pp32–33) limits how much tonnage a
nation may have under construction at once: "the total tonnage of your ships under
construction cannot exceed a multiple of dock size", with rebuilds, AMCs and small
corvettes exempt and submarines counted. `DESIGN-16` (Bases And Infrastructure)
already specifies the pool model that governs *how fast* work is applied
(section 7), the project-to-pool mapping (section 8), and the shape of a capacity
exemption (section 9) — but section 9 ships both exemptions at **`0` basis
points**, so neither is exempt, and no code implemented the concurrency cap at
all.

INC-7 adds the manual's cap as a displacement reservation at order time, separate
from the work-rate pools. It also exercises section 9's non-zero exemption path for
the first time, which requires fixing the two values the manual and DESIGN-16 leave
unstated: the exemption fraction and the "small corvette" threshold.

## Decision

1. **Concurrency cap.** `maxConcurrentConstructionMassKg = floor(dockMaxMassKg ×
   shipyardCapacityMultipleBp / 10_000)`, where `dockMaxMassKg` is the nation's
   authored `maximumNewConstructionMassKg` (ADR-0135). At order time the new hull's
   displacement is reserved against the `NEW_CONSTRUCTION` pool's committed mass;
   an order beyond the cap fails with `INSUFFICIENT_PROJECT_CAPACITY`. The cap
   governs *how much* is under construction; the section 7 work pools keep
   governing *how fast*. The two are never conflated.
2. **Pools.** A `REBUILD` project books to `REFIT_REBUILD` and does not count
   against the new-construction cap; submarine new construction uses
   `NEW_CONSTRUCTION` and **does** count.
3. **Non-zero exemptions (amends `DESIGN-16` §9).** AMC and a designated
   small-corvette type are exempt through a `ConstructionCapacityExemptionDefinition`
   (eligible type, predicate, max qualifying displacement, exempt bp, monthly
   aggregate cap, external capacity source id, stacking rule, version). The exempt
   share is carried by the declared external capacity source and never creates
   capacity from nothing: `normalPoolConsumption = ceiling(appliedWork ×
   (10_000 − exemptBp) / 10_000)` and `externalPoolConsumption = appliedWork −
   normalPoolConsumption`.
4. **Versioned BALANCE TARGETs** (the manual gives no numbers), in
   `ship-building/balance.yaml` with provenance: `shipyardCapacityMultipleBp =
   30_000` (3× dock mass), `amcCapacityExemptionBp = 8_000` (80 % exempt),
   `smallCorvetteMaxDisplacementKg = 1_000_000` (1 000 t). The reservation is
   persisted per project as an optional `ConstructionProject.newConstructionReservedMassKg`
   (backward-compatible; old saves fall back to recomputing from the design).

## Consequences

- The manual's concurrency limit is enforced at order time with a stable code; the
  batch-order path (INC-8) reserves against the same cap.
- `DESIGN-16` §9's shipped `0` bp exemptions are superseded by the versioned
  non-zero values above; the DESIGN text stands everywhere this ADR is silent.
- The new project field is optional, so saves written before it remain valid.

## Alternatives considered

- **Keep the shipped `0` bp exemptions.** Rejected: the manual explicitly exempts
  AMC and small corvettes from the concurrency cap, and the mission requires a
  non-zero exemption backed by an external source.
- **Model the cap as a work-rate pool.** Rejected: the manual's limit is tonnage
  under construction (how much), not monthly work (how fast); conflating them would
  change the existing pool semantics.
