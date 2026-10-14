# INC-3 — Persistence and session services

**Type:** implementation
**Status:** open
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
