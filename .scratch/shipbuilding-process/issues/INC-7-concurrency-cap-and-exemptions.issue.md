# INC-7 — National concurrency cap + exemptions

**State:** RESOLVED (engine slice; UI panel split to INC-7b) · **Frontier:** yes · **Blocked by:** INC-5
**Spec:** `.scratch/shipbuilding-process/spec.md` (SB3-R18, R19) · **ADR:** ADR-0137 (amends DESIGN-16 §9)

## What to build

Add the manual's national shipyard-capacity limit — "the total tonnage of your ships under construction
cannot exceed a multiple of dock size" — as a displacement reservation at order time, with the manual's
exemptions (rebuilds, AMC, small corvettes out; submarines in). This is the cap the batch-order path
(INC-8) reserves against.

## Acceptance criteria

- [x] `maxConcurrentConstructionMassKg = shipyardCapacityMultipleBp × dockMaxMassKg`; at order time the
      new ship's displacement is reserved against it; an order beyond it is rejected with
      `INSUFFICIENT_PROJECT_CAPACITY`.
- [x] Ships **under rebuild** book to the `REFIT_REBUILD` pool and do not count against the
      new-construction cap; **submarines do count**. The cap governs *how much tonnage may be under
      construction at once*; DESIGN-13 §7's per-shipyard work pools keep governing *how fast* — both
      kept, never conflated.
- [x] AMC and a designated small-corvette type are exempt via a non-zero
      `ConstructionCapacityExemptionDefinition` (ADR-0137 amends DESIGN-16 §9), backed by a declared
      **external capacity source** so exemption never creates capacity from nothing; constants
      `amcCapacityExemptionBp` and `smallCorvetteMaxDisplacementKg` are versioned BALANCE TARGETs.
- [ ] The Construction screen shows the capacity cap and its current utilisation as compiled values.
      **Split to INC-7b.**
- [x] Tests: unit (reservation and rejection at the cap; rebuild excluded; submarine counted); boundary
      (exactly at the cap; an AMC/small-corvette boundary); determinism (allocation order by pool
      priority then project id).

## Answer (engine slice, 2026-10-12)

Landed `@bluewave/ship-design/src/constructionCapacity.ts` (cap derivation, pool mapping, exemption
definition + consumption formulas, deterministic reservation allocation), the order-time reservation in
`@bluewave/phase-engine` (`INSUFFICIENT_PROJECT_CAPACITY`), the optional persisted
`ConstructionProject.newConstructionReservedMassKg`, and the three versioned BALANCE TARGET constants
(`shipyardCapacityMultipleBp: 30_000`, `amcCapacityExemptionBp: 8_000`,
`smallCorvetteMaxDisplacementKg: 1_000_000`). ADR-0137 amends DESIGN-16 §9. `check:golden` and
cross-process determinism unchanged. The capacity panel is INC-7b.

## Notes for implementator

The exemption ADR also fixes the "small corvette" definition (the manual and DESIGN-13 both leave it
unstated). Record the ADR in `docs/adr/AMENDMENTS.md` with the DESIGN-13 §9 banner per ADR-0095.
