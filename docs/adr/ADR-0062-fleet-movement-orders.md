# ADR-0062: Fleet movement orders (`MoveFleet`) and a connected 1880 map

Status: accepted (2026-10-08). Roadmap item 4 (`docs/research/rtw3-parity-engine-roadmap.md`).

## Decision
- New engine command `MoveFleet { nationId, fleetId, toAreaId }` (16th player command). One fleet moves **one route
  hop per month**: the destination must be directly connected to the fleet's area by a sea route (routes are
  two-way), must not be land, and must differ from the current area; the fleet needs a commissioned ship.
  The rule is one pure function, `fleetMoveProblem` (`packages/campaign/src/movement.ts`), used by the
  `CommandLifecycle` validator at issue time **and** re-checked when `command_collection` applies the order
  (`applyMoveFleet`), so a stale order is skipped with a diagnostic instead of teleporting a fleet.
- Applying it relocates the fleet, its ships and any division founded on one of its ships. Battle generation
  later in the same month sees the new positions, so movement has real consequences (contact, blockades).
- Desktop: `submit/replace/cancelMovementCommand` are real bridge commands. One order per fleet: the command id
  is derived from turn + fleet, so a new order supersedes the old one (this is what "replace" does) and cancel
  drops it. The Fleet screen offers only areas one hop away; the engine still decides each order.
- **Content:** in the 1880 production pack almost every home coast, colony and several seas had **no route at
  all** (e.g. English Home Waters, Malta), so fleets could never sail. 52 sea routes were authored
  (`routes.yaml`, ids `r_x_*`) so every area is reachable; distances are approximate and unused by the one-hop
  rule. Atlantic and Mediterranean were also joined (Channel and Western Med to the North Atlantic).

## Consequences
The compiled 1880 snapshot hash changed (pinned in `commitMonth.test.ts`); the cross-process golden hashes are
unaffected (that run does not use the production pack) and verify. Campaigns with no movement orders behave as
before apart from the larger route list.

## Not done
- Multi-hop pathing and travel time (`distance` is not used); fuel/range; the AI does not move fleets yet
  (its movement belongs with the intentful-AI work in Track P).
- Moving part of a fleet (ships are moved with their fleet; use divisions to regroup).
