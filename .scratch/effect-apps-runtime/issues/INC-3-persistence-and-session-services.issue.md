# INC-3 — Persistence and session services

**Type:** implementation
**Status:** resolved
**Blocked by:** INC-1
**Frontier:** no

**What to build:** Model the persistence and session seams as services —
`ProjectStore` (`SaveStore` operations + the `session.json` sidecar + month-input;
owns `ConstructionSnapshotStore`), `CampaignSessionStore` (in-memory session,
construction-workspace and pending-command registries), `CommandQueueStore`, and
`ReplayService` — and migrate the continuity, session and construction commands onto
them as Effect programs.

## Acceptance criteria

- [ ] `ProjectStore`, `CampaignSessionStore`, `CommandQueueStore` and `ReplayService`
      are `Context.Service` values with `Effect<A, E, never>` methods (ERA-R3).
- [ ] The continuity commands (`loadCampaign`, `listCampaigns`, `verifyCampaign`,
      `replayCampaign`, `recoverCampaign`), the session commands (`saveCampaign`,
      `closeCampaign`, `copyCampaign`) and the construction snapshot mutations resolve
      their services from context and run as Effect programs (ERA-R4).
- [ ] Every `BridgeResult` JSON is byte-identical, including each failure reason
      (`LOAD_FAILED`, `SESSION_METADATA_MISSING`, `REPLAY_FAILED`,
      `RECOVERY_FAILED`, `SAVE_FAILED`, …) (ERA-R5, R18).
- [ ] Replay/determinism behaviour is unchanged: `check:determinism` and the golden
      hashes are byte-identical (ERA-R8).
- [ ] `pnpm preflight` and the desktop main test suite are green.

## Notes for implementator

- The existing DIP seam `ConstructionSnapshotStore` becomes the persistence owner;
  keep its persist semantics (recompute envelope + hash, persist, re-register).
- `CampaignSessionStore` is process-local in-memory state — model it as a service with
  a single construction-time ref, not per-command construction.
- Do not delete the `default*Deps` objects here; INC-5 retires them once all call
  sites resolve from context.

## Answer

Resolved 2026-10-14 on branch `feat/effect-apps-runtime`, behaviour-preserving.
**Split:** this ticket landed the persistence/session **services** and the
dialog-free session commands; the continuity/replay/copy/construction command
migrations moved to **INC-3b** (they depend on the `NativeDialog` service from
INC-4), so INC-3 is not silently over-scoped.

**What landed.**
- `runtime/campaignSessionStore.ts` — `CampaignSessionStore` `Context.Service`
  (`get` fails `SessionNotFound`, `register`, `remove`, `clearConstructionWorkspace`,
  `clearPendingEnvelopes`) + `campaignSessionStoreLayer`.
- `runtime/projectStore.ts` — `ProjectStore` (`isCurrent`, `save`) + layer, mapping
  a store throw to `SAVE_FAILED` `CommandFailed`.
- `runtime/desktopMainLayer.ts` — the combined `CommandEnv` (`ContentArtifact |
  ProjectStore | CampaignSessionStore`) and `desktopMainLayer()`.
- `commandError.ts`/`bridgeResult.ts` — `SessionNotFound` tag + its
  `SESSION_NOT_FOUND` projection.
- `commands/sessionCommands.ts` — `saveCampaignProgram` and `closeCampaignProgram`
  as Effect programs (`copyCampaign` stays legacy — it needs the dialog).
- `campaignBridge.ts` — `CommandProgram` R widened to `CommandEnv`, a
  `withSchemaProgram` decode adapter (fails `InvalidCommandPayload`), the two
  commands moved from the legacy registry to `defaultCommandPrograms`, and the
  default runtime built from `desktopMainLayer()`.
- `index.ts` — the app runtime now uses `desktopMainLayer()`.

**Validation.**
- `pnpm --filter @bluewave/desktop typecheck`.
- Targeted: `sessionCommands` (18), `campaignBridge` (44), `continuityCommands` (20).
- Full desktop suite: **2017 passed / 1 skipped**.
- `pnpm preflight` 37/37.

**Carried to INC-3b:** `CommandQueueStore`/`ReplayService` (beyond the pending
envelopes already on `CampaignSessionStore`), and migrating the continuity
(`loadCampaign`, `listCampaigns`, `verifyCampaign`, `replayCampaign`,
`recoverCampaign`), `copyCampaign`, and construction snapshot-mutation commands —
all of which need `NativeDialog` (INC-4).
