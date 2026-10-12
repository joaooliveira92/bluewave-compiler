# 16 — Foundation: `contracts` on Effect `Schema`/`Data`

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

## What to build

Adopt the runtime-free Effect subset in `@bluewave/contracts` (shared contract
types: branded safe-integer units, reason codes): express contract shapes/types
with Effect `Schema`/`Data` where a schema is warranted, keeping the package
pure (no Effect runtime).

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1**; read
  "Runtime-usage policy" and Wave 3.
- `packages/contracts/src/index.ts`;
  `.ai/ENGINEERING-CONTRACT.md` (branded safe-integer units, hashing, identity).
- `.scratch/effect-v4-vendor-migration/plan.md` §3, §5.1.

## Acceptance criteria

- [ ] `contracts` uses Effect `Schema`/`Data` idioms for its contract
      types/brands where appropriate, with no change to the authoritative
      semantics of branded integer units or reason codes (`MIG-RUNTIME-1`).
- [ ] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime`; no fibers/services.
- [ ] Public API remains compatible for existing consumers (facade rule).
- [ ] `pnpm --filter @bluewave/contracts typecheck` and its tests green;
      `pnpm check` not regressed.
- [ ] Single-copy guard green (`MIG-GRAPH-1`).

## Notes

- `contracts` has no current Zod use; this is an idiom adoption, not a boundary
  migration. Keep changes minimal and semantically neutral.

## Comments

### Audit note (ticket 00, 2026-10-12)

**Closed — not needed.** Renderer-reachable package: a top-level
`Data.TaggedError(...)` would bundle `effect` into the renderer
(`MIG-EXCL-1`/ADR-0125; ticket 00 §5-A, confirmed by experiment). It keeps its
plain error classes. Reopen only with an ADR giving the renderer an Effect-free
error contract.

`BluewaveError` (`packages/contracts/src/index.ts:57`) is reachable from the
renderer through `SafeInt`; 1707 references in 310 files.
Throw sites: `index.ts:9,12,42,49,109,117,125,133`.
