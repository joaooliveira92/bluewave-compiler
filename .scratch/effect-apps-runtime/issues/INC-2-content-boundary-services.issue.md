# INC-2 — Content boundary services

**Type:** implementation
**Status:** open
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
