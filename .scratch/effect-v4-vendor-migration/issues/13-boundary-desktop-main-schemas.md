# 13 — Boundary: desktop `src/main` schemas Zod → Effect Schema (atomic)

**Type:** implementation
**Status:** done
**Blocked by:** 00 (reconciliation audit), 07 (Wave 1 exit)
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

- [x] The seven files are converted to Effect Schema; no `zod` import remains in
      `apps/desktop/src/main`; `zod` removed from `@bluewave/desktop`
      dependencies once the last main-process use is gone; no dual definition
      (`MIG-ZOD-1`).
- [x] IPC request/response envelope byte formats are unchanged; existing
      `campaignBridge` tests and IPC envelope tests green (`MIG-WIRE-3`).
- [x] `src/preload/**` and `src/renderer/**` are untouched and import no
      `effect` (`MIG-EXCL-1`, `MIG-EXCL-2`).
- [x] `pnpm --filter @bluewave/desktop typecheck` and main-process tests green.

## Notes

- Do not introduce the Effect runtime into `src/main` here; this is schema
  conversion only (runtime orchestration is Wave 5).
- Keep IPC validation at the main-process boundary; renderer stays presentational.

## Comments

### Audit note (ticket 00, 2026-10-12)

**Already satisfied in code — closed.** Landed in `0c7370d4` (migration) and
`248cd6ed` (parity repairs).

- All seven modules import only `{ Result, Schema, SchemaIssue }` from `effect`
  (`campaignBridge.ts:1`, `campaignCommandSchemas.ts:3`,
  `campaignSaveSchema.ts:1`, `campaignSessionMetadata.ts:4`,
  `drawingBoardDraft.ts:4`, `monthInput.ts:3`, `pendingCommands.ts:6`); no
  `zod` import remains in `apps/desktop/src/main`; no runtime introduced.
- `src/preload/**` and `src/renderer/**` import no `effect`
  (`content-boundary.test.ts:18-19` guards it); bundle guard clean.
- `pnpm --filter @bluewave/desktop exec vp test run src/main`: 30 files / 335
  tests passed (incl. `campaignBridge`/`campaignCommandSchemas`);
  `@bluewave/desktop typecheck`: exit 0.
- **Carried to 14:** the `zod` dependency line in `apps/desktop/package.json:43`
  is not removable here because the *renderer* shim
  `src/renderer/zodJitless.ts` still imports it. The main-process criterion
  ("no `zod` import remains in `src/main`") is met.
