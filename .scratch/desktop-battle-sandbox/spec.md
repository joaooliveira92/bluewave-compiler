# Spec: Desktop Tactical Sandbox — generate and view a battle on demand

Slug: `desktop-battle-sandbox`
Status: implemented for generate + auto-resolve (2026-10-07, ADR-0055, option A). Scripted tactical resolution and boundary replay are deferred to B-6: they reject with a specific reason.

## Problem

The combat-tuning track (ADR-0051 to 0053) can only be inspected through the CLI. In the desktop app
(debug build) the Tactical Sandbox renders, but "Generate Engagement" returns `NOT_IMPLEMENTED`:
`generateBattle`, `resolveBattle`, `resolveTacticalBattle` and `replayBattleBoundary` are all in the
stub set in `apps/desktop/src/main/campaignBridge.ts`. The renderer side (SandboxProvider, state
reducers, result cards) and the shared contracts (`campaign-command-contract.ts`) already exist.

Two findings make this more than plumbing:

1. **`generateBattles` has no per-war entry point.** It scans the snapshot: an opportunity exists only
   when both sides of a `DECLARED_NOT_ACTIVE`/`ACTIVE` war have non-construction ships in the **same
   area** (`packages/combat/src/generation/opportunity.ts`, ADR B-1-7). The sandbox's `warId` input can
   only filter the result, not create a battle.
2. **A normal desktop campaign can never reach contact.** Movement commands are `NOT_IMPLEMENTED`
   (ticket 10 ruling), and eight months at war (UK vs Austria-Hungary) produced "No battles resolved".
   So wiring the bridge alone would answer every request with "no eligible battle".

## Decision (taken: option A — see ADR-0055)

How does the debug sandbox get two opposing fleets into one area? Options:

- **A. Debug scenario override (recommended).** A debug-only bridge command (or a `generateBattle`
  option) that builds an *ephemeral copy* of the session snapshot with a chosen enemy fleet moved into a
  chosen area of the player's, then runs `generateBattles` on the copy. The session snapshot and its hash
  are never mutated, so determinism, saves and replay are untouched. Gated by the debug build flag
  (ADR-0029).
- **B. Ship movement for real.** Implement movement commands so a player can create contact. Correct
  long term, far larger, and outside the playability-first track (ADR-0045).
- **C. CLI only.** Keep the CLI as the battle surface and drop the desktop sandbox. Cheapest, but gives
  agents and the owner no way to look at battle screens.

## Solution (for option A)

1. Bridge: implement `generateBattle` (debug-gated). Input `{ sessionId, warId, areaId? }`. Use the same
   resolver callbacks and version defaults as `phase-engine/src/month.ts`'s battle_generation phase (as
   `runBattleGenerate` in `apps/compiler-cli/src/commands.ts` does) so results match a real turn. Return
   `{ manifest, randomDecisions }` or a rejected result with a specific reason
   (`NO_ELIGIBLE_BATTLE`, `WAR_NOT_FOUND`, `WAR_NOT_ACTIVE`), never `NOT_IMPLEMENTED`.
2. Bridge: implement `resolveBattle` (auto-resolution), `resolveTacticalBattle` and
   `replayBattleBoundary` against the manifest the sandbox holds. Battle ids come from the generated
   manifest; the bridge keeps the ephemeral snapshot per `(sessionId, battleId)` for the sandbox's
   lifetime and discards it on `closeCampaign`.
3. Renderer: show the rejection reason in the setup card instead of a bare code; no other UI change.
4. Snap support: a documented `snap:debug` recipe in `docs/agents/desktop-view.md` that generates and
   resolves a battle in one command, so reviewers can capture battle screens.

## Requirements

- R1. `generateBattle` never returns `NOT_IMPLEMENTED`; it succeeds with a manifest or rejects with a
  specific reason.
- R2. For the same session, war, area and seed, two calls return an identical manifest hash.
- R3. The session snapshot, its hash and saves are byte-identical before and after any sandbox command.
- R4. All four commands are unavailable (rejected, not crashing) in a non-debug build.
- R5. `resolveBattle` output matches what `commitMonth`'s auto-resolution would produce for the same
  manifest (same `BattleResult` shape; verified by a parity test).
- R6. A captured sandbox run (`snap:debug`) shows manifest, resolution and event ledger with a clean
  console and no churn warning.

## Tests

- Bridge unit tests per command: success, `WAR_NOT_FOUND`, `NO_ELIGIBLE_BATTLE`, unknown session,
  non-debug rejection.
- Determinism: repeat-call manifest hash equality; snapshot hash unchanged (R2, R3).
- Parity: `resolveBattle` vs the `commitMonth` auto-resolution for a hand-built co-located fixture (R5).
- Cross-process determinism entry if the command touches `packages/cross-process-test` coverage.
- e2e (debug build): generate -> auto-resolve -> outcome card visible.

## Out of scope

- Real ship movement (option B), player-controlled tactical orders UI, battle animation.
- Changing combat balance (ADR-0053 owns that).

## Definition of done

R1-R6 pass; the decision above is recorded as an ADR; `pnpm check` is green; a `snap:debug` capture of a
resolved battle is attached to the closing ticket comment.

## Outcome (2026-10-07)

Implemented per ADR-0055. R1-R5 are covered by `battleSandboxCommands.test.ts` (18 tests) and
`campaignBridge.test.ts`; R6 was verified by a `snap:debug` capture (UK vs France, 2 vs 1 ships,
auto-resolved). Not done, by design: `resolveTacticalBattle` and `replayBattleBoundary` (they need the
B-6 tactical-loop orchestrator) — they reject with `TACTICAL_RESOLUTION_UNAVAILABLE` /
`BOUNDARY_REPLAY_UNAVAILABLE`.

Three findings made the sandbox need more than a bridge command: no contact (movement unimplemented),
strength floors out of scale with `firepower`, and a ship (`gbr_malta_temp`) with no design. See ADR-0055.
