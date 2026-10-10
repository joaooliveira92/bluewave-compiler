# 24 — Domain: `commands` on Effect `Schema`/`Data`/typed errors

**Type:** implementation
**Status:** open
**Blocked by:** 22 (`campaign`), 23 (`ship-design`)
**Frontier:** no

## What to build

Adopt `Schema`/`Data`/tagged errors across `@bluewave/commands` (payload
validation, authorization, canonicalization, lifecycle, reservation, settlement),
preserving the command/event contract and the reason-code vocabulary.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1,
  MIG-WIRE-3**; "Runtime-usage policy", Wave 4.
- `packages/commands/src/**`; `packages/commands/src/reasonCodes.ts`.
- `.ai/ENGINEERING-CONTRACT.md` (Commands never mutate authoritative state
  directly; validate→authorize→reserve→accept/reject→lock→resolve→emit).

## Acceptance criteria

- [ ] `commands` uses Effect `Schema`/`Data`/typed errors where appropriate;
      payload validation boundaries use Effect Schema (`MIG-RUNTIME-1`).
- [ ] Command reason codes and the accept/reject contract unchanged
      (`MIG-WIRE-3`).
- [ ] Runtime-free unless a genuine async/IO boundary exists in the package
      (documented if so); no fibers in pure validation.
- [ ] `pnpm --filter @bluewave/commands test` green; `pnpm typecheck` green.

## Notes

- Keep the package domain-pure (no Node/fs/Electron/IPC imports).
