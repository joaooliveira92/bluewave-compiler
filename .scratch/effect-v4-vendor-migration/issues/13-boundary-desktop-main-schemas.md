# 13 — Boundary: desktop `src/main` schemas Zod → Effect Schema (atomic)

**Type:** implementation
**Status:** open
**Blocked by:** 07 (Wave 1 exit)
**Frontier:** no

## What to build

Migrate the seven desktop main-process Zod schema modules to Effect Schema
atomically, preserving the IPC envelope wire formats exactly:
`campaignBridge`, `campaignCommandSchemas`, `campaignSaveSchema`,
`campaignSessionMetadata`, `drawingBoardDraft`, `monthInput`,
`pendingCommands`. Do **not** touch `src/preload` or `src/renderer`.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-ZOD-1, MIG-WIRE-3,
  MIG-EXCL-1, MIG-EXCL-2**; Wave 2.
- `.scratch/effect-v4-vendor-migration/plan.md` §4.1–§4.3, §6.
- `apps/desktop/src/main/{campaignBridge,campaignCommandSchemas,campaignSaveSchema,campaignSessionMetadata,drawingBoardDraft,monthInput,pendingCommands}.ts`.
- `docs/research/effect-v4-toolchain-compatibility.md` (preload/Electron gotcha).

## Acceptance criteria

- [ ] The seven files are converted to Effect Schema; no `zod` import remains in
      `apps/desktop/src/main`; `zod` removed from `@bluewave/desktop`
      dependencies once the last main-process use is gone; no dual definition
      (`MIG-ZOD-1`).
- [ ] IPC request/response envelope byte formats are unchanged; existing
      `campaignBridge` tests and IPC envelope tests green (`MIG-WIRE-3`).
- [ ] `src/preload/**` and `src/renderer/**` are untouched and import no
      `effect` (`MIG-EXCL-1`, `MIG-EXCL-2`).
- [ ] `pnpm --filter @bluewave/desktop typecheck` and main-process tests green.

## Notes

- Do not introduce the Effect runtime into `src/main` here; this is schema
  conversion only (runtime orchestration is Wave 5).
- Keep IPC validation at the main-process boundary; renderer stays presentational.
