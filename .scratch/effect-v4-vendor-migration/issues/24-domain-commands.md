# 24 — Domain: `commands` on Effect `Schema`/`Data`/typed errors

**Type:** implementation
**Status:** done
**Blocked by:** none (21 done)
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

- [x] `commands` uses Effect `Schema`/`Data`/typed errors where appropriate;
      payload validation boundaries use Effect Schema (`MIG-RUNTIME-1`).
- [x] Command reason codes and the accept/reject contract unchanged
      (`MIG-WIRE-3`).
- [x] Runtime-free unless a genuine async/IO boundary exists in the package
      (documented if so); no fibers in pure validation.
- [x] `pnpm --filter @bluewave/commands test` green; `pnpm typecheck` green.

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

### Evidence (2026-10-12)

**Delivered.** Added `packages/commands/src/errors.ts` —
`CommandError extends Data.TaggedError("CommandError")<{ message; code?;
diagnostics? }>` (imports only `{ Data } from "effect"` plus a type-only
`Diagnostic`; runtime-free). Converted all 22 throws (5 plain `Error` + 17
`Object.assign(new Error, { code })`), preserving every `message` string and
`code` byte-for-byte; `registry.ts`/`definition.ts` keep the attached
`diagnostics`. Re-exported from `index.ts`; added `effect` to
`packages/commands/package.json`.

| Check | Result |
| --- | --- |
| `rg "throw Object.assign\(new Error\|throw new (Error\|TypeError\|RangeError)" packages/commands/src` | no matches |
| `pnpm --filter @bluewave/commands test` | 2 files / 29 tests passed (+4 new `errors.test.ts`) |
| `pnpm --filter @bluewave/commands typecheck` | exit 0 |
| `pnpm typecheck` | 37/37 successful |
| `pnpm lint:effect` | 0 errors (278 pre-existing warnings) |

**Residual:** none. `code` is optional (the 5 plain settlement throws had none);
their reason code remains inside the message text as before.
