# 24 — Domain: `commands` on Effect `Schema`/`Data`/typed errors

**Type:** implementation
**Status:** open
**Blocked by:** none (21 done)
**Frontier:** yes

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

## Comments

### Audit note (ticket 00, 2026-10-12)

**Rescoped to the concrete gap.** `commands` is not reachable from the renderer.
22 throws, none `BluewaveError`: 5 plain `Error` (`settlement.ts:19,22,24,31,33`) and
17 `throw Object.assign(new Error(msg), { code })` (`lifecycle.ts:60,65,426`,
`canonicalization.ts:68`, `definition.ts:236`, `settlement.ts:162,167`,
`specRules.ts:62,69,183,215`, `validation.ts:93`, `registry.ts:11,17,35,45,49`).
Codes are also embedded in message text. Target:
`Data.TaggedError` keeping message text and `code` identical.
`validatePayloadSchema` (`canonicalization.ts:51`) is a field-allow-list
check, not a schema boundary; the `diplomacyValidation`/`divisionValidation`
validators return reason-code results and are deferred (ticket 00 §6 item 2).
Blocked-by corrected: 22 and 23 are closed.
