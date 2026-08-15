# 14 — Construction Ordering

Status: resolved

## Answer

Implemented for real against `packages/commands`' `CommandRegistry`/
reservation-settlement machinery (not simplified), per ticket 10's answer
and ADR-0023. All four commands land in `constructionCommands.ts` +
`constructionWorkspace.ts` with a restoration-overload restore-in-flight
atomicity repair (reviewer F2): replace preflights its reserve before
any mutation, and submit/cancel/replace persist first, rolling back fully on
save failure. `inspectConstructionScreen` surfaces both the nation's real
snapshot `constructionProjects` (incl. authored starting projects) and the
in-flight ledger; the workspace is rebuilt from the snapshot's projects when
a fresh session opens an existing save directory (reviewer F1), so
post-restart cancel/replace work. Zod payload schemas
(`ConstructionOrderPayloadSchema` etc.) + `expectedRevision`/
`transportRequestId` idempotency proven by tests.

**What to build:** `inspectConstructionScreen`, `submitConstructionCommand`,
`replaceConstructionCommand`, and `cancelConstructionCommand` wired to
`packages/commands`'s real command-lifecycle machinery (`CommandRegistry`,
reservation/settlement), per
[Construction & Fleet Contract](10-construction-fleet-contract.md).

**Blocked by:** [New Game → Overview](12-new-game-to-overview.md).

- [x] Construction screen shows real available designs and the nation's
      current construction projects.
- [x] Submitting a construction command against a real design queues a real
      project, visible on next inspect.
- [x] Replace and cancel work against an in-flight command, respecting
      `expectedRevision`/`transportRequestId` optimistic concurrency.
- [x] A stale `expectedRevision` is rejected, not silently applied.
