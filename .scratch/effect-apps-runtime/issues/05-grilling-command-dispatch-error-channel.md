# 05: Command-dispatch and error-channel shape

**Type:** grilling
**Status:** resolved
**Blocked by:** 03

## Question

How does `campaignBridge` command dispatch become an Effect program without
changing the wire contract?

- Decide whether each registry handler becomes `Effect<A, E, R>` (with `E` a
  tagged error channel, `R` a service requirement) behind the existing
  `BridgeResult<unknown>` boundary, and how the dispatcher composes them.
- Decide the **`BridgeResult` mapping at the edge**: `ipcMain.handle` calls
  `runtime.runPromise`/`runPromiseExit`, maps `Exit` → `{outcome, reason,
  diagnostics}`; confirm the payload stays structured-clone (no Effect types
  cross IPC). Preserve `UNKNOWN_COMMAND`/`NOT_IMPLEMENTED`/`INVALID_PAYLOAD`.
- Decide the **error-channel vocabulary** for the app surface: `Data.TaggedError`
  in-process vs `Schema.TaggedError` for anything serialized (ADR-0152), and the
  `Effect.catchTag` sites. Replace the per-handler `CommandOutcome` objects
  without adding a shared error transformer (RULES.md §Errors).
- Decide how the existing `withSchema`/`withStrictSchema`/`payloadless` adapters
  translate (decode-in-Effect via `Schema.decodeUnknownResult`, or keep the
  sync adapter and wrap).
- Confirm the **debug-gated** seams (battle sandbox, `resolveTacticalBattle`'s
  accepted narrowing, ADR-0057) and the renderer-owned `RawScriptedForceOrder[]`
  parse are preserved.

Deliverable: the dispatch + error-channel design, with a byte-identical
`BridgeResult` invariant test named, carried into the spec.

## Answer

Resolved autonomously 2026-10-14.

**Contract.** The `campaign:execute` wire contract is unchanged: `ipcMain.handle`
returns a `BridgeResult<unknown>` (structured-clone, no Effect types). Every
existing `outcome`/`reason`/`diagnostics` string and the
`UNKNOWN_COMMAND`/`NOT_IMPLEMENTED`/`INVALID_PAYLOAD` reasons are preserved
byte-for-byte.

**Handlers become Effect programs.** Each registry entry is
`Effect<A, CommandError, CommandEnv>`; the payload adapters (`withSchema`/
`withStrictSchema`/`payloadless`) become combinators that decode with
`Schema.decodeUnknownResult` inside the Effect and fail with an
`InvalidCommandPayload` tagged error carrying the issue messages.

**Error channel.** `CommandError` is a `Data.TaggedError` union — `UnknownCommand`,
`NotImplemented`, `InvalidCommandPayload`, `SessionNotFound`, `CompileFailed`,
`SaveFailed`, `LoadFailed`, `ReplayFailed`, `RecoveryFailed`,
`SessionMetadataMissing`, plus the business-rejected outcomes
`SaveLocationCancelled`/`PackageSelectionCancelled`/`InvalidCampaignConfiguration`/
`UnknownPlayerSlot`/`PlayerSlotNotSupported`/`CopyTarget*` — each carrying
`{ reason, diagnostics }`. The dispatcher runs via `runtime.runPromiseExit` and a
single total mapping `Exit → BridgeResult` (success→`success`; failure→the tag's
`reason`/`diagnostics`; interruption→`error`/`INTERRUPTED`), so the wire bytes are
identical. No shared transformer/guard probing the channel — recovery uses
`Effect.catchTag` at the handler where intentional (RULES.md §Errors).

**Preserved seams.** The ADR-0057 debug-gated battle commands, the accepted
`resolveTacticalBattle` narrowing (INC-3), and the renderer-owned
`RawScriptedForceOrder[]` parse are unchanged.

**Invariant test.** A fixture set asserts the exact `BridgeResult` JSON for one
success and each failure reason, proving the mapping is byte-identical.