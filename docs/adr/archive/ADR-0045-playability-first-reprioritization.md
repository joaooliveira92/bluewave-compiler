# ADR-0045: Playability-First Re-prioritization of the Sprint Backlog

## Status

Accepted (2026-10-06, approved by the project owner)

## Context

Bluewave is a reimagining of _Rule the Waves 3_. A 2026-10-06 diagnosis of the
repository against that reference found:

- The strategic kernel (M1) and surface tactical core (M2) are accepted and
  reachable from the desktop app, but every campaign battle is auto-resolved by
  `resolveBattleAuto` (`packages/combat/src/battleResolution/resolve.ts`), which
  supplies only gunnery, weather and damage to `advanceMinute`.
- The M3 modules (torpedoes, mines, submarines, coastal defense, smoke, damage
  control) were signed COMPLETED at the C-6 gate, yet no campaign battle can
  exercise them — their engine stages are strict no-ops without a context that
  the campaign path never builds.
- M4 aviation (D-1..D-4) is likewise unreachable, and irrelevant to the locked
  primary scenario `scen_1880` for roughly 35 game-years.
- The features that define the reference game are missing or minimal: no ship
  designer (construction picks from 37 fixed templates), no player-fought
  battles (the tactical sandbox is debug-gated), a uniform-random legal-only AI,
  and no events / politics / unrest layer.
- The full repo gate is permanently red on pre-existing desktop timeouts
  (`.scratch/desktop-test-failures/`).

The backlog was ordered by DESIGN-document milestone (M3 → M4 → M5), so each
sprint added rules depth that a player cannot reach.

## Decision

1. **Finish D-4 INC-6** (engine wiring + two-process gate) to close the open
   branch, then **pause** D-5 and all of Track E.
2. Insert a new **Track P — Playable Campaign** ahead of D-5/E, executed in this
   order:
   - **P-0** Repo gate green (desktop `useNewGameFlow` timeouts).
   - **P-1** Battles that matter — wire torpedoes, smoke, damage control (and
     mines where the battle area has fields) into campaign auto-resolution;
     re-verify M3 acceptance against campaign-reachable battles.
   - **P-2** Ship designer — tech-gated hull/armor/armament/machinery design
     with displacement, cost and speed derivation, feeding construction.
   - **P-3** Intentful AI — doctrine-weighted budget, rival-aware building,
     tension-driven war decisions (replaces uniform-random selection).
   - **P-4** Living world — events (DESIGN-49), politics/unrest (DESIGN-18),
     tension → crisis → war.
   - **P-5** Strategic fleet map (`.scratch/fleet-movement-strategy-map/`
     INC-1..6).
   - **P-6** Player-fought tactical battle screen built on the sandbox.
3. **Acceptance criterion added to every future gate: campaign reachability.** A
   capability is not ACCEPTED unless a deterministic test drives it from a
   compiled campaign month (not only a unit fixture) and observes its effect on
   authoritative state.
4. D-5 and Track E resume only after P-1..P-4 land and the 1880 campaign plays
   meaningfully into the 1910s.

## Consequences

- M3's COMPLETED status stands historically but is re-verified under the
  reachability criterion in P-1; any capability that fails is recorded, not
  silently downgraded.
- Track P scoping follows the existing wayfinder → spec → tickets pipeline; each
  P sprint opens its own `.scratch/<slug>/`.
- `SPRINT-PLAN.md` "Immediate next action" points at D-4 INC-6, then P-0.
- The next ADR number is **0046**.
