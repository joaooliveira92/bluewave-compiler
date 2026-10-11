# 04 — Renderer decoupling: main serves content over a narrow IPC

**Type:** implementation
**Status:** resolved
**Blocked by:** 03
**Frontier:** no

## What to build

The renderer stops parsing content. The drawing board receives decoded content
(catalogue + reference designs) from main over a narrow, typed content-query IPC;
it no longer imports YAML as raw modules or validates with the schema package.
`yaml` and `effect` leave the renderer bundle. This executes the deviation the
content-schema boundary ADR records (`MIG-EXCL-1`) and satisfies the doc's
Electron boundary rules (renderer receives domain DTOs; main exposes only narrow
query capabilities).

**Wide refactor.** Many renderer modules and tests consume the synchronous
content loader (the drawing board, its panels, and a large test set). Sequence it
as expand–contract: first add the IPC content query beside the existing loader
(nothing breaks), then migrate consumers in batches that each stay green, then
contract by deleting the old loader and the raw YAML imports.

## Acceptance criteria

- [ ] Main exposes a narrow content API (e.g. design lookup / list + reference
      designs). It does not expose filesystem paths, generic file reads, or YAML
      parsing.
- [ ] The drawing board and its panels render from IPC-delivered content;
      `pnpm snap` shows the affected screen unchanged (aria stable, console
      clean).
- [ ] The renderer bundle no longer includes `yaml` or `effect` (verified by
      removing direct imports and by a bundle check).
- [ ] Renderer tests inject content instead of parsing YAML.
- [ ] No renderer module reads the filesystem or parses YAML.

## Notes

- Grounds on the content-schema Effect-boundary ADR's known deviation #1 and its
  scheduled Wave 5 `MIG-EXCL-1`; this ticket owns that work. The plan to "move
  validation to the main process and pass decoded content over IPC" is exactly
  this change.
- The packaged smoke already carries a workaround for the renderer's `new
  Function` eval probe — a symptom of the renderer doing too much; removing the
  schema/effect import should remove the need for it.
- If the migration batches cannot stay green on their own, share an integration
  branch and make this ticket the integrate-and-verify gate.

## Comments

**Resolved (2026-10-11).** The renderer stops parsing content; `yaml` and
`effect` left the built renderer bundle (ADR-0125, executing ADR-0105
`MIG-EXCL-1`).

- **Narrow content IPC (CRI-IPC-1).** A new `inspectDrawingBoardContent` command
  on the existing `campaign:execute` boundary returns the data-only
  `DrawingBoardContentDto` (`{ catalogue: ShipBuildingData }`, in
  `src/shared/content-contract.ts`). Main decodes it once from the verified
  artifact (`loadShipBuildingData` extracted from `shipBuildingContent.ts`;
  `commands/contentCommands.ts`). No path, generic file-read, or parse capability
  is exposed.
- **Renderer seam (CRI-IPC-2/4).** `drawing-board/content.ts` no longer imports
  `yaml`, `@bluewave/content-schema`, `node:fs`, or `?raw` documents; it rebuilds
  the runtime catalogue from the injected DTO with the effect-free
  `buildShipBuildingContent`. `useDrawingBoardContentSource` fetches the DTO over
  IPC once and injects it; `DrawingBoardDialog` renders the board only when ready
  and fails closed otherwise. The vitest setup seeds the same seam from the
  compiled artifact, so every drawing-board/panel test renders decoded content
  instead of parsing YAML (60 construction files / 433 tests green).
- **Bundle exit (CRI-IPC-3).** Removing the renderer's `content-schema` import
  removed `yaml`; `effect` survived via `campaign-engine`'s module-scope Effect
  schemas and `content-schema`'s barrel. Fixed by `"sideEffects": false` on
  `campaign-engine` and `content-schema` and moving the two plain priority
  constants (`MIN_RESEARCH_SHARE_BP`, `NEAR_COMPLETION_WORK_RATIO`) into an
  effect-free `priorityConstants.ts` (public surface unchanged). The built
  renderer is now clean across all 20 chunks.
- **Guards (CRI-IPC-5).** `src/renderer/content-boundary.test.ts` scans renderer
  sources for forbidden imports/raw docs; `scripts/check-renderer-bundle.mjs`
  (wired into the desktop `build`/`build:debug` scripts) fails the build if
  `YAMLParseError`/`EffectTypeId` reappear in any renderer chunk.
- `@content` vite/vitest/tsconfig aliases and `raw.d.ts` deleted (no longer
  needed).

Tests: desktop 252 files / 1656 green (incl. new `useDrawingBoardContent`,
`content-boundary`, and the bridge content-command test); `pnpm typecheck` green;
renderer build emits a clean bundle. ADR-0125 records the decision; ADR-0105's
deviation #1 is marked executed.
