# 08: Dock size and shipyard capacity

**Type:** grilling
**Status:** resolved
**Blocked by:** 02

## Question

Decide the dock-size and shipyard-capacity model so it matches the manual, reconciled with the
code.

Manual (printed p32–33): dock size limits the largest ship a nation can build/operate and, with a
multiplier, sets total shipyard capacity (total tonnage under construction); you cannot build
larger than your dock size; docks take one year to build and each step adds 1000–2000 t depending
on the period; dock size may occasionally rise on its own from private shipbuilding; rebuilds,
AMCs and small corvettes do not count toward the capacity limit while submarines do.

Compare `packages/ship-design/src/yards.ts` (`Yard`, `yardCapacityFor`, `yardFits`, `yardMisfits`)
and `yardChoice.ts`, plus `docs/rules/economy.md` and `docs/rules/construction-repair-and-rebuild.md`,
which today model per-yard length/beam/displacement/crane fit but not the nation-level dock-size
ceiling, growth, or capacity-as-a-multiple-of-dock-size.

Decide: the nation dock-size construct and its cap on build/operate; the capacity formula
(multiple of dock size) and what counts toward it (rebuilds/AMC/corvettes excluded, submarines
included); dock growth (one-year build, +1000–2000 t steps by period, private auto-increase); and
how these are surfaced and persisted.

## Answer

Resolved 2026-10-12 (autonomous; grounded in `docs/research/manual-building-ships-rules.md` p32–33,
DESIGN-13 `bases-and-infrastructure.md` §4–7, DESIGN-23, ADR-0067 §6, `yards.ts`).

**The normative target already exists in DESIGN-13 and matches the manual; the gap is implementation.**

1. **Dock size (DESIGN-13 §4).** Store a nation's dock as `maximumNewConstructionMassKg` (plus
   `maximumMajorRepairMassKg`, `maximumRebuildMassKg`, `maximumConversionMassKg`) with a ship-dimension
   predicate — the manual's "dock size limits the largest ship you can build/operate". A design above the
   mass limit is rejected with `SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT` (§4.2). This does not exist in code
   today (only per-yard length/beam/displacement/crane fit in `yards.ts`); implement it.
2. **Dock expansion (DESIGN-13 §5).** `dock_expansion_v1`: `baseDurationMonths` exactly `12` (the
   manual's "docks take one year to build"); era step schedule §5.2 `1000/1250/1500/1750/2000` t for
   EARLY…LATE (the manual's "+1000–2000 t depending on the period"); a completed step raises every
   covered mass limit by the step. Implement.
3. **Private industrial expansion (DESIGN-13 §6).** The manual's "dock size may occasionally increase by
   itself as a result of private shipbuilding" is `private_dock_expansion_opportunity_v1`: a seeded
   event (≥7500 bp utilisation over 12 months, 60-month cooldown, one active per nation) that creates a
   normal §5 project — never an instant increase. Implement.
4. **National shipyard capacity (the manual's "multiple of dock size").** Add the manual's concurrency
   cap `maxConcurrentConstructionMassKg = shipyardCapacityMultipleBp × dockMaxMassKg` (no number in the
   manual → a versioned `balance.yaml` constant, BALANCE TARGET). At order time, reserve the new ship's
   displacement against it and reject with a capacity reason when exceeded. Exclusions/inclusions per the
   manual: **rebuilds** book to the `REFIT_REBUILD` pool (excluded), **AMC and small corvettes** exempt,
   **submarines** counted. This sits alongside DESIGN-13 §7's per-shipyard work-micro-unit pools
   (reserved/occupied): §7 governs *how fast* work advances (per-yard rate scaled by `maxDisplacementKg`,
   ADR-0067 §6, `yardCapacityFor`); the new cap governs *how much tonnage may be under construction at
   once*. Keep both — the manual's cap for concurrency, §7 for throughput.
5. **Deviation recorded.** The manual states the limit as tonnage; DESIGN-13 §7 states it as work
   micro-units. Keep work micro-units as the canonical capacity unit and express the manual's tonnage cap
   as a displacement-denominated reservation layered on top; note the unit choice so the two numbers are
   not confused.
6. **Constants:** `shipyardCapacityMultiple` (BALANCE TARGET); expansion schedule fixed (§5.2); private
   event thresholds fixed (§6). `yardWorkPerTonneMonth` already exists (ADR-0067 §6, ESTIMATE).

Hand-off: implementation slices — (a) DESIGN-13 §4 dock ceiling + `SHIP_EXCEEDS_DOMESTIC_DOCK_LIMIT`;
(b) `dock_expansion_v1` + private event; (c) national concurrency cap + reservation exclusions — feeding
the "Player-facing building-ships flow".
