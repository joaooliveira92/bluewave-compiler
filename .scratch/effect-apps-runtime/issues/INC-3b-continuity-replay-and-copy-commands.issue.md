# INC-3b — Continuity, replay and copy command migration

**Type:** implementation
**Status:** open
**Blocked by:** INC-3, INC-4
**Frontier:** no

**What to build:** Migrate the remaining session/continuity command flows onto
Effect programs and the service graph (split out of INC-3, whose command set
depends on the `NativeDialog` service from INC-4): `loadCampaign`,
`listCampaigns`, `verifyCampaign`, `replayCampaign`, `recoverCampaign`,
`copyCampaign`, and the construction snapshot-mutation commands. Add the
`CommandQueueStore` (the `pending-commands.json` sidecar) and `ReplayService`
(`ReplayVerifier`/`RecoveryManager`) services, and move each command from the
legacy registry to `defaultCommandPrograms`.

## Acceptance criteria

- [ ] `CommandQueueStore` and `ReplayService` are `Context.Service` values with
      `Effect<A, E, never>` methods; the continuity/copy/construction commands
      resolve their services from context and run as Effect programs.
- [ ] Every `BridgeResult` JSON is byte-identical, including each failure reason
      (`LOAD_FAILED`, `SESSION_METADATA_MISSING`, `REPLAY_FAILED`,
      `RECOVERY_FAILED`, `PACKAGE_SELECTION_CANCELLED`, `SAVE_LOCATION_CANCELLED`,
      the `COPY_TARGET_*` reasons, …).
- [ ] Replay/determinism behaviour is unchanged: `check:determinism` and the
      golden hashes are byte-identical.
- [ ] `pnpm preflight` and the desktop main test suite are green.

## Notes for implementator

- The native-dialog call sites resolve `NativeDialog` (INC-4); keep the dynamic
  `await import("electron")` inside the service layer so tests can substitute a
  fake.
- Construction snapshot mutations use `ConstructionSnapshotStore` (owned by
  `ProjectStore` per the spec); preserve its persist semantics (recompute envelope
  + hash, persist, re-register).
- Do not delete the `default*Deps` objects here; INC-5 retires them once all call
  sites resolve from context.
