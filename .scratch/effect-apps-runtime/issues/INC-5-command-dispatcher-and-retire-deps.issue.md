# INC-5 — CommandDispatcher in Effect; retire the `*Deps` seams

**Type:** implementation
**Status:** open
**Blocked by:** INC-2, INC-3, INC-4
**Frontier:** no

**What to build:** Make the `campaign:execute` registry a dispatcher over
`Effect<A, CommandError, CommandEnv>` handlers resolved from the service graph, and
delete the hand-rolled dependency objects (`defaultCompileCampaignDeps`,
`defaultContinuityDeps`, `defaultSessionCommandDeps`, battle-sandbox `defaultDeps`)
so exactly one dependency mechanism remains.

## Acceptance criteria

- [ ] Every `campaign:execute` registry entry is an `Effect<A, CommandError,
      CommandEnv>` program; the dispatcher decodes the command name, resolves the
      handler, runs via the managed runtime, and maps `Exit → BridgeResult` with the
      single total function from INC-1 (ERA-R4, R6).
- [ ] The payload adapters decode with `Schema.decodeUnknownResult` inside the Effect
      and fail with `InvalidCommandPayload`; `UNKNOWN_COMMAND`, `NOT_IMPLEMENTED` and
      `INVALID_PAYLOAD` reasons are preserved (ERA-R5).
- [ ] The debug-gated battle commands (ADR-0057), the accepted `resolveTacticalBattle`
      narrowing (INC-3), and the renderer-owned scripted-order parse are unchanged.
- [ ] No `default*Deps` object remains; there is one dependency mechanism (ERA-R16).
- [ ] The full `BridgeResult` fixture set (one success + every failure reason) is
      byte-identical; goldens byte-identical (ERA-R18, R7).
- [ ] `pnpm preflight` and the desktop main test suite are green.

## Notes for implementator

- The invariant test is the acceptance gate: assert the exact response JSON, not the
  handler's internal shape.
- Keep the error union closed; do not add a shared transformer/guard that probes the
  failure channel (RULES.md §Errors).
