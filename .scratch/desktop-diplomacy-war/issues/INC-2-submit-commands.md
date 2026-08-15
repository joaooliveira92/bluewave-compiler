# INC-2 — Generalize command queue + `submitDiplomacyCommand`

**Type:** task
**Status:** resolved
**Blocked by:** INC-1

## What to build

1. **Generalize the queue:** refactor `apps/desktop/src/main/researchWorkspace.ts`
   into a shared per-session command queue (office: keep the file or create
   `apps/desktop/src/main/pendingCommands.ts`) storing
   `{ transportRequestId, envelope: CommandEnvelope<CommandBody>,
   payloadFingerprint }`. Semantics identical to the research slice:
   same-`transportRequestId` + same fingerprint → replay; different payload →
   `IDEMPOTENCY_CONFLICT`; `expectedSnapshotHash` refreshed at drain against
   the promotion-seam snapshot. Update research + commitment call sites.
   Empty-command behavior byte-identical (existing hash tests prove it).
2. `apps/desktop/src/main/commands/diplomacyCommands.ts`:
   `submitDiplomacyCommand(payload)` where payload.command is a Zod
   discriminated union over the 7 B10c bodies. Build the matching engine
   envelope (AiCommandGenerator scheme: deterministic id + timestamp,
   `issuerClass: "PLAYER"`, body type + fields). **Run
   `new CommandLifecycle().validate(envelope, snapshot)` at issue time** —
   surface a non-ok outcome with the engine's code; do NOT hand-mirror
   validators.
3. `commitMonth.ts` drains ALL pending envelopes (research + diplomacy) into
   `MonthExecutor.execute(snapshot, [...all], seed, ...)`.
4. Wire bridge (`inspectDiplomacyScreen`, `submitDiplomacyCommand`) —
   `CAMPAIGN_COMMAND_NAMES` 24 → 26, overloads, Zod schemas, canary.

## Acceptance (spec AC-2..AC-5)

- All 7 types produce a valid envelope whose `expectedSnapshotHash` equals the
  engine's recompute; issue of an invalid command returns the engine code
  (`ALREADY_AT_WAR`, `DECLARE_WAR_INVALID_TARGET`, `BLOCKADE_NOT_AT_WAR` …).
- After a valid DeclareWar + `commitMonth`, the projection shows the new war
  (DECLARED_NOT_ACTIVE) + at_war relation; FormAlliance → allied.
- Idempotent replay + REVISION_MISMATCH behave like research/construction.
- Determinism: two child-process runs (or twin sessions) with the same seed +
  command produce identical final `rawHash`.
- Research slice still green (generalization is behavior-preserving).

## Validation

`pnpm -w turbo run test --filter=@bluewave/desktop` (new
`diplomacyCommands.test.ts` + updated researchWorkspace tests),
`tsc -b` clean.