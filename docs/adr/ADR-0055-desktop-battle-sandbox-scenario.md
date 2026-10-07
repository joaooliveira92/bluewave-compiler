# ADR-0055: Desktop Tactical Sandbox Runs on an Ephemeral Scenario Copy

## Status

Accepted (2026-10-07). Chooses option A of `.scratch/desktop-battle-sandbox/spec.md`.

## Context

The Tactical Sandbox could not produce a battle: its four bridge commands were `NOT_IMPLEMENTED`
stubs, and wiring them would not have helped on its own, for three independent reasons found while
building it:

1. **No contact.** `generateBattles` yields a mission only when both sides of an ACTIVE or
   DECLARED_NOT_ACTIVE war have completed ships in the same area (ADR B-1-7). Movement commands are not
   implemented in the desktop app, so a player can never create contact.
2. **Strength floors out of scale.** The eligibility floors (`FLEET_BATTLE_MIN_STRENGTH` 300,
   `CRUISER_BATTLE_MIN_STRENGTH` 150) are compared with summed `ship.firepower`
   (`resolveShipStrength`), which is about 16-24 per 1880 ship. UK plus France combined is ~60, so a real
   turn can never generate a battle with current content (eight months at war produced none).
3. **A content defect.** The production UK ship `gbr_malta_temp` has an empty `designVersionId`.
   `resolveBattleAuto` fails closed on a committed ship with no design (`TACTICAL_UNIT_PROMOTION_INVALID`),
   and the eligibility check never looks for a design.

## Decision

1. `generateBattle` and `resolveBattle` are implemented for real in
   `apps/desktop/src/main/commands/battleSandboxCommands.ts`, using the same engine entry points,
   versions and seed shape as the month executor's `battle_generation` / `battle_resolution` phases.
2. They run on an **ephemeral copy** of the session snapshot. The copy (a) treats ships with no compiled
   design as unavailable, (b) places the war attacker's completed ships and fleets in the defender's area
   (or a requested area where the defender has ships), and (c) scales ship strength by
   `strengthScale` (default 100) for the eligibility check only. The session snapshot, its hash, its
   saves and the pending-command queue are never mutated. Every deviation is reported in the result's
   `diagnostics`, so the player is never shown a synthetic scenario as if it were real.
3. The sandbox commands are available only in a debug build. `electron.vite.config.ts` defines
   `__BLUEWAVE_DEBUG__` from the same `VITE_BLUEWAVE_DEBUG=true` flag as the renderer gate (ADR-0029);
   a normal build answers every sandbox command with `DEBUG_ONLY`.
4. `resolveTacticalBattle` and `replayBattleBoundary` answer `TACTICAL_RESOLUTION_UNAVAILABLE` /
   `BOUNDARY_REPLAY_UNAVAILABLE`. The minute-by-minute loop (generation -> movement -> gunnery ->
   battle-end driven by scripted orders) has no engine orchestrator; building it is B-6's job
   (`.scratch/cli-battle-debug-surface/map.md`) and was explicitly not duplicated here.
5. `resolveBattle` applies no campaign state, so `warScoreChange` is reported as 0 with a diagnostic
   saying so.

## Consequences

- Agents and the owner can generate and auto-resolve a battle in the desktop app (`pnpm snap:debug`),
  deterministically (same session, war, area and scale give the same manifest hash).
- The synthetic scenario is NOT a prediction of what a real turn does: real turns still cannot reach a
  battle until the strength-floor scale and the `gbr_malta_temp` data are fixed. Both are recorded as
  findings for the combat and content tracks; neither is changed here.
- If the floors are rescaled or movement lands, the sandbox keeps working; `strengthScale: 1` shows the
  real behaviour and the defaults can then be dropped.
- Sandbox state per `(session, battle)` is held in memory (max 32 entries, pruned when the session is
  gone) and is never persisted.
