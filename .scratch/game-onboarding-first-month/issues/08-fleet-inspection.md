**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

Spec §11 (Fleet Inspection) of [01-diagnosis.md](../01-diagnosis.md).

The real per-ship model (`packages/campaign-engine/src/fleet.ts:44-48`)
carries only `name`, `designId`, and a derived `status`
(`"commissioned" | "under_construction"`, from `isUnderConstruction`) — none
of the doc's other assumed fields (hull type, displacement, maintenance
cost, class, design summary) exist directly on the ship.

Decide:

1. **What's genuinely showable** (§11.1): hull/displacement are reachable by
   joining through `snapshot.designs` (`CompiledDesignVersion`, confirmed
   present per `construction.ts:105-129`) — confirm this join is feasible
   from the Fleet page's projection layer. No per-ship maintenance cost
   exists anywhere — cut it, or decide whether a fleet-wide aggregate
   (already used on Overview/Treasury) is an acceptable substitute for a
   per-row figure. Confirm the doc's own exclusion list (no reserve status,
   overseas assignment, crew quality, exact age, region assignment) matches
   reality — it does, per the charting audit; don't re-litigate it, just
   carry it into the spec.

## Answer

Verified against `packages/campaign/src/state.ts:6-22` (`Ship`),
`packages/campaign-engine/src/fleet.ts`, and `CompiledDesignVersion`
(`state.ts:48-64`). The real `Ship` is richer than the ticket's opening
assumption (`fleet.ts` only *projects* `name`/`designId`/derived `status`;
the underlying `Ship` also carries `classId`, `speed`, `firepower`, `armor`,
`hitPoints`/`maxHitPoints`, `constructionProgress`, `isUnderConstruction`).

### 1. Genuinely showable rows (§11.1)

- **identity** — `name` (real), `classId` (direct, no join).
- **hull type + displacement** — via `snapshot.designs.get(designVersionId)`
  → `hullType`, `normalizedDisplacementKg`. Feasible: `buildFleetScreenView`
  already receives the whole `CampaignSnapshot` (`fleet.ts:95`), and the
  construction projection (`construction.ts:105-129`) proves the same design
  join works. **In scope.**
- **design summary** — the join also yields `normalizedSpeedUms`,
  `normalizedArmorUm`, `mainGunsCaliber`/`mainGunsCount`, `machineryType`
  (real `CompiledDesignVersion` fields); showable in the detail panel.
- **status** — presentation derivation of `isUnderConstruction`
  (`"commissioned" | "under_construction"`, `fleet.ts:111`); real.
- **maintenance cost (per row)** — **cut.** No per-ship maintenance figure
  exists anywhere. The fleet-wide maintenance aggregate (already derived on
  Overview/Treasury from ships) is the acceptable substitute; there is no
  per-row figure and none will be fabricated.
- **Doc's exclusion list** (no reserve status, overseas assignment, crew
  quality, exact age, region assignment) — matches reality; **carried into
  the spec verbatim.** `locationAreaId` and `inBattleId?` exist on `Ship` but
  the doc's exclusions (region assignment, battle detail) still hold for this
  read-only inspection surface.

### 2. Filtering, sorting, summary (§11.2–§11.3)

All computable from the fields + design join above:

- **Filters:** ship type (`hullType` via join), class (`classId`), status
  (derived). Real.
- **Sorting:** name (`name`), ship type (`hullType`), displacement
  (`normalizedDisplacementKg` via join). **`maintenance cost` is dropped**
  from the sort list (no such figure). All sorts stable by `id` tie-break.
- **Summary:** active ship count + count by ship type (real); **total
  maintenance** uses the fleet-wide aggregate (per ticket 03's
  maintenance-re-derivation pattern — never the raw `maintenanceCost` which
  is 0 before first `commitMonth`); **most expensive active class** — **cut**
  (no per-class maintenance cost); **largest active ship by displacement**
  (via join, real). All figures derived in projection builders, never in
  React.

### 3. Ship detail panel (§11.4)

Shows only: identity, class/design, and the principal characteristics the
design catalog already exposes (displacement, speed, armor, main-guns,
machinery, hit points). **No refit / scrap / reserve / rename / deploy
actions** — per the doc's own "don't show nonfunctional buttons" rule, and
none are implemented. The panel is a renderer detail view over the same
projection; no new command or state.
2. **Filtering, sorting, summary** (§11.2–§11.3): confirm each is
   computable from the two-field-plus-join model above.
3. **Ship detail panel** (§11.4): confirm it can only show identity, class/
   design, and whatever performance/armor/armament data the design catalog
   already exposes — no refit/scrap/reserve/rename/deploy actions, per the
   doc's own "don't show nonfunctional buttons" rule.
