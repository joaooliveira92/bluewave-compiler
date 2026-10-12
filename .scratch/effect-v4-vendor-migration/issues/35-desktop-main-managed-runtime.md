# 35 — Desktop main: one `ManagedRuntime` + IPC handler orchestration

**Type:** implementation
**Status:** open
**Blocked by:** 34 (facades unified)
**Frontier:** no

## What to build

Wire `apps/desktop/src/main` as an Effect application: one long-lived
`ManagedRuntime` built from an app `Layer`, with IPC handlers and command
orchestration run through it. Renderer and sandboxed preload remain runtime-free.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-WAVE5-EXIT,
  MIG-EXCL-1, MIG-EXCL-2, MIG-GATE-SMOKE-1**; read Wave 5 and "Runtime-usage
  policy".
- `.scratch/effect-v4-vendor-migration/plan.md` §5.2.
- `apps/desktop/src/main/**`, `apps/desktop/electron.vite.config.ts`,
  `docs/research/effect-v4-toolchain-compatibility.md` (preload externalization
  gotcha).
- `docs/agents/desktop-view.md` (`pnpm snap`).

## Acceptance criteria

- [ ] `src/main` owns exactly one long-lived `ManagedRuntime`; IPC handlers/
      command orchestration run through it; no per-call runtime construction
      (`MIG-WAVE5-EXIT`).
- [ ] Renderer (`src/renderer/**`) imports no `effect`; renderer bundle delta
      ≈ 0 (`MIG-EXCL-1`).
- [ ] Sandboxed preload (`src/preload/**`) imports no `effect` and still builds
      (`MIG-EXCL-2`).
- [ ] Packaged Electron smoke test + `pnpm test:e2e` green; `pnpm snap` captures
      the affected screen (console clean, no churn warning) (`MIG-GATE-SMOKE-1`).
- [ ] `pnpm check` green.

## Notes

- Keep `contextIsolation`/sandbox posture intact; validate IPC at the main
  boundary (Effect Schema).

## Comments

### Audit note (ticket 00, 2026-10-12)

Concrete targets: `apps/desktop/src/main/index.ts:149-171` (6 `ipcMain`
handlers), `:217` (`whenReady`), the 12 plain throws and the two
`Error` subclasses `project.ts:25`, `contentArtifact.ts:20` (ticket 00 §5-B).
`src/main` is not renderer-reachable, so `Data.TaggedError` is fine here.
Run the bundle guard and `pnpm snap` as the criteria already require.
