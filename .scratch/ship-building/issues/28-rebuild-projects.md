# 28: REBUILD / CONVERSION projects (what a past-redesign change becomes)

**Type:** implementation (engine milestone)
**Status:** in progress (28a done; 28b-e open, see ADR-0078)
**Blocked by:** none (29 resolved)
**Frontier:** yes

Spec: `.scratch/ship-building/spec.md` section 15.4 (T3) and AC-8; `docs/rules/construction-repair-and-rebuild.md` (DESIGN-23) sections 1, 17-23.

## State today

`ReviseProject` (ADR-0070) refuses a change past the redesign window with `REVISION_REQUIRES_REBUILD`. The Revision panel and the bridge
now tell the player what to do instead: finish the ship as designed, then submit the new version as a new class and order it.

## What it needs (nothing here is invented; it is DESIGN-23)

1. Project types `REBUILD` and `CONVERSION` on `ConstructionProject` (today only `NEW_CONSTRUCTION`), with the DESIGN-23 section 2 statuses.
2. `rebuild_validation_v1` (section 21): retained-hull limits (displacement +20 %, speed +3 kn, length and beam +/-5 %, no pressure-hull or
   flight-deck conversion), damage and defects, technology, dock capacity, stability, treaty clauses.
3. Ship availability `UNAVAILABLE` for the whole project (section 20): the ship cannot move, train or enter battle generation.
4. Completion creates exactly one new `CompiledDesignVersion` and a ship transition record; the old version is kept (section 22).
5. Cancellation with settlement (section 23, DESIGN-11): paid, refundable and salvageable values explicit; no silent restore.
6. A command (`StartRebuild`), its lifecycle checks, the desktop bridge and the Drawing Board entry point ("Rebuild this ship").

## Acceptance

- A completed ship can be rebuilt within the retained-hull limits; outside them the validator returns a report and changes nothing.
- The ship is unavailable until trials pass; fleets and battle generation respect that.
- Determinism and save/load round trips hold; the old design version stays loadable.

## Comments

### 2026-10-09 orchestrator

Sliced in ADR-0078. **28a done:** `rebuild.ts` (`validateRebuild`, `rebuildFactsOf`, `checkRebuildBalance`), `balance.yaml` `rebuild:` with the rule's shipped values, `ShipBuildingContent.rebuild`. Tests: `rebuild.test.ts` (inclusive boundaries of each limit, all failures at once in a fixed order, finding shape, measures, dock, determinism, shipped values). ship-design 38 files / 410 tests; tsc and lint exit 0. Next: 28b (state and availability).

### 2026-10-09 orchestrator (28b-1)

**28b-1 done: ship availability, enforced.** `Ship.availability?: "DEGRADED" | "UNAVAILABLE"` and `availabilityProjectId?` (absent = available) and one shared `isShipOperational` (commissioned and not UNAVAILABLE) in `campaign`. Used wherever a ship would move, train or fight: `fleetMoveProblem` (a fleet with an unavailable ship aboard cannot sail, new code `SHIP_UNAVAILABLE`; one with no operational ship still gives `SHIP_NOT_OPERATIONAL`), battle loser ships (`phase-engine/battles.ts`), division formation and the opening briefing (`campaign-engine`), division asset eligibility (`divisionCommands.ts`), and combat strength, resolution and promotion (`combat`). DEGRADED still operates. Snapshot clone covers both fields. Nothing sets availability yet (28b-2/28c do), so no behaviour or golden changes.
Tests: `ship-availability.test.ts` (campaign, 5), fleet-movement (+3, a fleet always has two ships so no silent skip), combat strength (+2), division screen (+1), clone audit. campaign 113, combat 3687, campaign-engine 102, phase-engine 224.
