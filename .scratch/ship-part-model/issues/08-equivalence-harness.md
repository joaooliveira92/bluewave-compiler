# 08: Equivalence harness and derived-metric report (P1)

**Type:** implementation
**Status:** open
**Blocked by:** 04, 05, 06
**Frontier:** no
**Requirements:** SPM-R22, SPM-R23, SPM-R24 (structural and semantic) · Stories 40, 41, 42, 44

## What to build

A maintainer can run one command that compiles every reference design through both the
legacy and the parts pipelines and writes a `ship-part-migration-equivalence/1` report.
That report is the evidence for "nothing changed".

- A pure derived-metric extraction per design: displacement and ledger, hull and
  classification, machinery, speed and range, per-weapon armament and the full compiled
  weapon contract, protection, stability and systems, cost and construction, the findings
  multiset, and engine-facing outputs.
- Each report row has path, baseline, candidate, delta, tolerance and status (`equal`,
  `withinTolerance`, `orderingOnly`, `reclassified`, `changed`). Every metric is listed,
  including zero differences. Integer tolerances are 0, from a versioned tolerance manifest.
- Per-entry detail (§10.2): legacy placement, part, legacy barrels or tubes,
  `mountCount`, `gunsPerMount`, contained units, each quantity's value, basis,
  multiplier and contribution, and totals. Tubes also show launcher count and mass. The
  nine also show the legacy resolved type and disposition.
- `reclassified` is allowed only on the enumerated D18 identity paths of the nine, never
  on a number. It always carries old value, new value, design, placement and
  `DQ-ARMAMENT-001`.

## Acceptance criteria

- [ ] The harness covers 91/91 designs and 823/823 placements, aggregated across the gun
      (03), torpedo (04) and remaining-family (05) slices.
- [ ] The candidate pipeline runs fit validation (06) before derivation. A design with fit
      findings is reported as such and never compared on derived values that weren't
      validated.
- [ ] The structural gate fails when coverage differs. The semantic gate fails on any
      `changed` row, a `reclassified` row off a D18 path or on a number, or an
      `orderingOnly` row on an undeclared path. Each failure has a fixture test.
- [ ] Running against current content gives `changed` = 0.
