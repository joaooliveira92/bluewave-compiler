# Spec — Desktop Diplomacy & War screen (B10c engine surface)

## Problem

The engine has B10c ACCEPTED: 7 diplomacy commands processed by
`MonthExecutor.command_collection`, `resolveDiplomacyPhase` (order 6.5)
monthly war-score/blockade effects, and snapshot state
(`politics.relations`, `wars.wars`, `wars.blockadeState`). The desktop cannot
view or issue any of it — Overview only shows `knownEnemyNations`. The
player's B10c strategic layer is unplayable on the desktop.

## Solution

A **Diplomacy & War** screen surfaced through the existing single-channel
`campaign:execute` bridge, mirroring the delivered Research & Technology
pattern (projection in `@bluewave/campaign-engine`, dedicated main-process
commands, honest renderer):

1. `inspectDiplomacyScreen` (payload `sessionId`) → `DiplomacyScreenProjection`,
   derived read-only from the compiled snapshot for the player nation:
   - known nations (every other nation: id + name),
   - relations (`relation`, `tension`, `nap`, `since`) for pairs involving the
     player,
   - wars involving the player (id, sides, member ids, both war scores,
     status, start/end dates),
   - blockades involving the player (`blockaderId`, `blockadedNationId`,
     `areaId`, `establishedMonth`).
2. `submitDiplomacyCommand` (payload `{ sessionId, expectedRevision,
   transportRequestId, command }` where `command` is a Zod-discriminated union
   over the 7 B10c command bodies) → builds the matching engine envelope,
   **runs `CommandLifecycle.validate(envelope, snapshot)`** (the engine's own
   public validator — authoritative codes, no hand mirror), queues a valid
   envelope, and the next `commitMonth` drains it into
   `MonthExecutor.execute(snapshot, [...commands], seed)` where
   command_collection applies it and order-6.5 applies monthly effects.

The per-session pending-command queue generalizes from the research slice's
`researchWorkspace.ts` so research + diplomacy share one drain seam in
`commitMonth`. Envelope construction exactly mirrors the research slice
(AiCommandGenerator scheme, issuer `PLAYER`, refreshed
`expectedSnapshotHash` at drain, deterministic id + timestamp, idempotency via
`transportRequestId`).

The radius-but-complete reduction across command types is handled by one
generic handler keyed on the Zod `command.type` field.

## User stories

- As a player, I can see who I'm allied/at war/neutral with, tensions, NAPs,
  active wars with war scores, and blockade coverage.
- As a player, I can DeclareWar, AcceptPeace, Form/Break Alliance, Form/Break
  NAP, and DeclareBlockade, and the engine applies the result on the next turn
  (honest: the screen says "queued, applies next turn").
- A rejected command surfaces the engine's code + message (e.g.
  `ALREADY_AT_WAR`) — never fabricated copy.
- No war/blockade → honest empty states ("no wars yet").

## Implementation decisions

- **D1 (authority):** desktop only queues envelopes; engine command_collection
  (order 2) + `resolveDiplomacyPhase` (order 6.5) are the only mutators of
  politics/wars/blockades. Issue-time validity = the engine's own
  `new CommandLifecycle().validate(envelope, snapshot)` — reuse, never mirror.
- **D2 (single generic command):** one `submitDiplomacyCommand` with a
  discriminated payload union over 7 `command.type`s, not 7 command names.
- **D3 (shared queue):** generalize `researchWorkspace.ts` to a
  per-session command queue both research + diplomacy handlers write to;
  `commitMonth` drains ALL. Empty-command campaigns stay byte-identical
  (proven by hashes).
- **D4 (projection derives):** every `DiplomacyProjection` field maps one-to
  one to `politics.relations` / `wars.wars` / `wars.blockadeState`.
  Nations list = all other snapshot nations (id+name). Nothing fabricated.

## Out of scope (recorded, not dropped)

- Trade agreements / treaties / strategic objectives UI (engine has none).
- Tactical battle-outcome surfacing (separate queue item).
- AI-negotiation / protest/warning state.

## Dependencies related

- Slot-promotion seam in `commitMonth.ts` (from the research slice) applies
  to ALL drained commands (command-agnostic) — re-verify unchanged hashes.
- `CAMPAIGN_COMMAND_NAMES` 24 → 26 (`inspectDiplomacyScreen`,
  `submitDiplomacyCommand`); `campaignBridge.test.ts` canary updated.
- No `packages/phase-engine` / `packages/combat` changes.

## Testing

- Unit: `diplomacyCommands.test.ts` — projection (from compiled production
  pack: known nations, relations, wars, blockades), issue of each of the 7
  types (correct envelope body + issuer), engine-code rejection for invalid
  requests (`ALREADY_AT_WAR`, `DECLARE_WAR_INVALID_TARGET`,
  `BLOCKADE_NOT_AT_WAR`, …), idempotent replay, `REVISION_MISMATCH`.
- Integration: issue DeclareWar + `commitMonth` → snapshot shows DECLARED
  war + at_war relation; FormAlliance + commit → allied; both with war score
  sourced from the projection. Determinism child or twin-session hash.
- Reducer + renderer tests for the 3 cards and honest empty/error states;
  screen render test.
- Bridge canary updated.

## Definition of done

AC-1 projection renders real relations/wars/blockades from the compiled
snapshot — no placeholder copy.
AC-2 each of the 7 commands issues a valid engine envelope through
`submitDiplomacyCommand`; a conforming `commitMonth` shows the applied
state (relation/war) in the projection.
AC-3 invalid commands are rejected at issue with the engine's code via
`CommandLine.validate` (no fabricated message); session untouched.
AC-4 idempotent replay + revision mismatch behave like research/construction;
no double-queue.
AC-5 determinism: same seed + same command → identical hashes (two
child-process runs).
AC-6 canary updated; desktop + campaign-engine suites + all gate steps green;
  empty-command campaigns stay byte-identical hash.
AC-7 deferred candidates recorded (scope doc + map).

## Ready-for-agent pointer

Frontier = lowest-numbered open ticket in
`.scratch/desktop-diplomacy-war/issues/` whose blockers are all resolved.