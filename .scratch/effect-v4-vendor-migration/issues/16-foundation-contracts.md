# 16 — Foundation: `contracts` on Effect `Schema`/`Data`

**Type:** implementation
**Status:** open
**Blocked by:** 15 (Wave 2 exit)
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
