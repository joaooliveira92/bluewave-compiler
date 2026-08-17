- **Type:** task
- **Status:** resolved
- **Blocked by:** 01

# 02 — Bridge command surface for the Research & Technology screen

**Scope decision:** add two `campaign:execute` commands through the existing
single-channel bridge (no new IPC channel):

1. `inspectResearchScreen` (payload: `sessionId`) → `BridgeResult<ResearchScreenProjection>`.
   Projection is derived, read-only, from the compiled snapshot only — the
   engine already stores `ResearchState { technologies, fieldPriorities,
   researchBudget, activeCandidates, discoveredTechs }` per nation. TV shows
   the player's own research state as **progress** (invested points, targets)
   — never fabricated success copy.
2. `setResearchPriorityCommand` (payload: `{ sessionId, expectedRevision,
   transportRequestId, fieldPriorities, exactTechId? }`) → issues a real
   `SetResearchPriorityCommand` envelope through the SAME
   `MonthExecutor.execute` lifecycle path `commitMonth` already uses — passing
   the command into `executor.execute(snapshot, commands, ...)`. Rationale:
   `MonthExecutor` already interprets `SetResearchPriority` in command
   collection; reusing it keeps the engine authoritative (no desktop-side
   mutation of research state).

Contract-level additions: `shared/research-contract.ts`, new names in
`CAMPAIGN_COMMAND_NAMES`, overload in `CampaignCommandClient`, a `researchCommands.ts`
main-process handler with the same envelope/revision/idempotency conventions
as `constructionCommands.ts`. `campaignBridge.test.ts` must be updated (name
set is compared).

**Standing decisions:**

- The projection and issue surface are both read/issue-only; the
  `expectedSnapshotHash` on the issued envelope must come from the session's
  snapshot hash (engine requires it), matching the AI generator's pattern
  (`packages/ai/src/aiCommandGenerator.ts`).
- `fieldPriorities` uses the SAME per-field scale the compiler emits
  (SafeInt basis points); desktop renders/adjusts with integer guards.
- Rejected prioritess (e.g., unknown field, non-integer) fail with the engine
  code, never a fabricated desktop code.

**Status: resolved (frontier design recorded; implementation handled by its
own INC tickets).**