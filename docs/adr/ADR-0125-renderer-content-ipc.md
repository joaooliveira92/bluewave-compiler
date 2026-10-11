# ADR-0125: Renderer decoupling over a narrow content IPC — executing `MIG-EXCL-1`

## Status

Accepted (2026-10-11).

## Context

ADR-0105 recorded a known deviation (`MIG-EXCL-1`): the renderer validated
bundled ship-building YAML through `@bluewave/content-schema`, transitively
bundling `yaml` and `effect` into the renderer bundle. ADR-0122/0123/0124 made
the main process run on one verified, hash-pinned content artifact; the renderer
was the last consumer still parsing authored YAML directly.

Ticket 04 owns that deviation. The intended fix was "move validation to the main
process and pass decoded content over IPC". Investigating the bundle showed the
premise was incomplete: removing the renderer's `content-schema` import removed
`yaml`, but `effect` survived because the renderer value-imports
`@bluewave/campaign-engine`, whose `priorities.ts` builds Effect schemas at module
scope, and (via the research screen) `@bluewave/content-schema`'s barrel. The
renderer legitimately uses two plain constants declared next to those schemas
(`NEAR_COMPLETION_WORK_RATIO`) and the research-field constants, so the effect
subtree stayed reachable.

## Decision

### 1. One narrow, capability-specific content IPC

Main decodes the ship-building catalogue once from the verified artifact and
serves it as a data-only DTO (`DrawingBoardContentDto` — `{ catalogue:
ShipBuildingData }`) over a new `inspectDrawingBoardContent` command on the
existing `campaign:execute` boundary. It exposes no file path, no generic file
read, and no parser — only already-decoded game content (ADR-0008, ADR-0105).
The DTO carries the authored reference-design order, so the drawing board's first
reference design stays the historical default (ADR-0109).

### 2. The renderer stops parsing content behind an injectable seam

`drawing-board/content.ts` no longer imports `yaml`, `@bluewave/content-schema`,
`node:fs`, or `?raw` documents; it rebuilds the runtime `ShipBuildingContent`
from the injected DTO with the effect-free `buildShipBuildingContent`. The loader
the board already calls stays synchronous, reading the injected DTO and failing
loudly if it has not arrived. In the app a hook
(`useDrawingBoardContentSource`) fetches the DTO over IPC once and injects it;
the dialog renders the board only once it is ready, and fails closed otherwise.
Renderer tests seed the same seam from the compiled artifact in the vitest setup,
so no renderer test parses YAML.

### 3. `yaml` and `effect` leave the renderer bundle

Three changes were required and are recorded because they constrain bundling:

- `campaign-engine` declares `"sideEffects": false`. It is a pure package (only
  schemas and pure functions; no top-level registration), so this lets Rollup
  drop the Effect-schema module when none of its runtime exports is used.
- `content-schema` declares `"sideEffects": false`. Its modules are pure schema
  definitions; this lets the renderer keep the effect-free `research-fields`
  constants without pulling the `effect`/`SchemaIssue` subtree through the barrel
  for the research screen.
- The two plain priority/construction thresholds (`MIN_RESEARCH_SHARE_BP`,
  `NEAR_COMPLETION_WORK_RATIO`) move to an effect-free `priorityConstants.ts`;
  `priorities.ts` imports them and `index.ts` re-exports them, so the public
  surface is unchanged and the renderer no longer reaches `priorities.ts` at
  runtime.

### 4. The exit is guarded

A source scan (`src/renderer/content-boundary.test.ts`) rejects any renderer
module importing `yaml`, `effect`, `@effect/*`, `@bluewave/content-schema`,
`node:fs`, or a `?raw` document. A build-time tripwire
(`apps/desktop/scripts/check-renderer-bundle.mjs`, wired into the desktop
`build`/`build:debug` scripts) scans every emitted renderer chunk for
`YAMLParseError`/`EffectTypeId` and fails the build if either reappears.

## Consequences

- `MIG-EXCL-1` is executed: the renderer bundle contains neither `yaml` nor
  `effect`; the renderer is a presentational consumer of decoded domain DTOs.
- The `sideEffects` declarations and the constants split are bundling-affecting
  and package-level; they are recorded here so a later change that reintroduces
  a module-scope side effect in `campaign-engine`/`content-schema` or a runtime
  dependency from the effect-tainted priority module is a conscious decision.
- The IPC surface grows by exactly one capability query; it exposes no
  filesystem or parsing capability.
- The content identity and replay-divergence contract are untouched (ADR-0123):
  the DTO is decoded from the same verified artifact.

## References

- ADR-0008 (Electron desktop boundary)
- ADR-0105 (`content-schema` Effect boundary; `MIG-EXCL-1`)
- ADR-0122 (compiled content bundle), ADR-0123 (artifact-derived identity),
  ADR-0124 (campaign-file collections through the artifact)
- `.scratch/content-runtime-integrity/issues/04-renderer-ipc-decoupling.md`
