# 04 — Renderer decoupling: main serves content over a narrow IPC

**Type:** implementation
**Status:** open
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