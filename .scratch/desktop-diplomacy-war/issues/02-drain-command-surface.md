- **Type:** task
- **Status:** resolved
- **Blocked by:** 01

# 02 — Bridge: generalize command drain + add diplomacy commands

**Design decision:** `commitMonth` currently drains research envelopes from
`researchWorkspace` into `MonthExecutor.execute(snapshot, [...], ...)`. For
diplomacy (and any future accepted command family) this must generalize into a
single per-session **command queue** both research and diplomacy handlers write
to. This is the RIGHT seam because the engine already treats all command types
uniformly in command_collection, and the slot-promotion seam is command-agnostic.

**Surface:**
- Rename/generalize `apps/desktop/src/main/researchWorkspace.ts` →
  a shared command queue (keep file name or create
  `apps/desktop/src/main/pendingCommands.ts`) keyed by session, storing
  `{ transportRequestId, envelope: CommandEnvelope<CommandBody>, payloadFingerprint }`.
  The idempotency/replay/conflict semantics + `expectedSnapshotHash` refresh at
  drain stay identical to the research slice (tests must pass unchanged-by-meaning).
- `commitMonth.ts` drains ALL queued envelopes (research + diplomacy) and
  passes them to `MonthExecutor.execute`. Empty-command behavior stays
  byte-identical (hash tests prove it).
- New bridge commands `inspectDiplomacyScreen` (read projection) +
  `submitDiplomacyCommand` (issue ONE of the 7 command types with a
  discriminated payload `{ commandType, ... }`)? — DECISION: single
  `submitDiplomacyCommand` with a per-type payload union (Zod discriminated
  union), mapping to the correct engine envelope. Do NOT add 7 separate
  command names.
- At issue time run `new CommandLifecycle().validate(envelope, snapshot)`; a
  non-`ok` outcome is returned to the renderer with the engine's code
  (no hand-mirrored validation, no fabricated code).

**Status: resolved (design recorded; implementation in INC-2).**