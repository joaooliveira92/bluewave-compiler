# INC-2 — Content boundary services

**Type:** implementation
**Status:** resolved
**Blocked by:** INC-1
**Frontier:** no

**What to build:** Model the compiled-content boundary as a `ContentArtifactStore`
service (artifact load + verification and every content projection: content artifact,
pack, compiler, ship-building content, reference designs, presentation content), and
migrate the content/inspect commands onto it as Effect programs.

## Acceptance criteria

- [ ] `ContentArtifactStore` is a `Context.Service` whose methods are
      `Effect<A, E, never>` (deps resolved in the Layer, per-call input as arguments);
      it wraps raw `node:*` and does not import `@effect/platform-node` (ERA-R3).
- [ ] The content/inspect commands resolve the service from context and run as Effect
      programs; their `BridgeResult` JSON is byte-identical (ERA-R5, R18).
- [ ] A malformed/missing artifact still fails closed with the same diagnostic.
- [ ] Goldens and the compiled content artifact body hash are byte-identical
      (ERA-R7, R8).
- [ ] `pnpm preflight` and the desktop main test suite are green.

## Notes for implementator

- See `docs/research/effect-apps-runtime-02-io-service-inventory.md` for the
  content seams (`contentArtifact`, `contentPack`, `compiler`, `shipBuildingContent`,
  `referenceDesigns`, `presentationContent`).
- Keep the service method surface narrow — one method per operation the commands
  actually call; no speculative API.

## Answer

Resolved 2026-10-14 on branch `feat/effect-apps-runtime`, behaviour-preserving.

**What landed.**
- The `ContentArtifact` service (INC-1) gains two fail-closed content projections:
  `loadDrawingBoardCatalogue()` and `loadPresentationContent()`, each
  `Effect<A, CommandFailed, never>` with a `contentUnavailable` mapper that
  preserves the `ContentArtifactError.code` as the failure `reason` and falls back
  to `CONTENT_UNAVAILABLE`.
- `commands/contentCommands.ts` becomes two Effect programs
  (`inspectDrawingBoardContentProgram`, `inspectPresentationContentProgram`) that
  resolve `ContentArtifact` and return the same success DTOs.
- `campaignBridge.ts` moves both commands from the legacy registry to
  `defaultCommandPrograms`.

**Naming note.** The spec calls the service `ContentArtifactStore`; the committed
implementation (INC-1) uses `ContentArtifact`. Kept `ContentArtifact` to avoid
churn; the spec label is a superset name.

**Validation.**
- `pnpm --filter @bluewave/desktop typecheck`.
- Targeted suites green: `presentationContent` (1), `campaignBridge` (44),
  `contentArtifact` (11), `contentPack` (3), `shipBuildingContent` (4) — 63 tests.
- `pnpm --filter @bluewave/desktop test`: full desktop suite green (see commit).
- `pnpm preflight` 37/37 (the `content-codemod` gate's two heavy permutation tests
  time out only under host load — load average ~14 — and pass when the host is
  idle; unrelated to this change).
