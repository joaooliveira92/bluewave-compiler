# 17 — Foundation: `deterministic` on Effect `Schema`/`Data` (runtime-free)

**Type:** implementation
**Status:** open
**Blocked by:** 16 (`contracts`)
**Frontier:** no

## What to build

Adopt the runtime-free Effect subset in `@bluewave/deterministic` (canonical
serialization, SHA-256 envelope hashing) without changing any hash algorithm,
key ordering, or envelope structure. `Effect` execution is **not** introduced.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1,
  MIG-WIRE-4, MIG-DET-1**; read "Runtime-usage policy" and "Determinism gate
  demoted".
- `packages/deterministic/src/**`;
  `docs/architecture/determinism-and-randomness.md` (deprecated context);
  `docs/research/effect-v4-runtime-determinism.md` §3.1, §3.5.
- `.ai/ENGINEERING-CONTRACT.md` (Identity, serialization, and hashing).

## Acceptance criteria

- [ ] `deterministic` uses Effect `Schema`/`Data` idioms where appropriate; the
      canonical serializer's key ordering, integer representation, Unicode
      normalization, and SHA-256 envelope structure are **unchanged**
      (`MIG-WIRE-4`).
- [ ] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime`.
- [ ] Any change to a hash-surface output is recorded as an ADR note (record, not
      block) (`MIG-DET-1`).
- [ ] Existing determinism/hash tests green; `pnpm typecheck` green.

## Notes

- This is the load-bearing serializer; prefer zero behavioral change.
- The v4 core `effect` has zero runtime dependencies, so no new serialization
  dependency (the RC-era `msgpackr` caveat does not apply to the stable pin —
  re-verify `effect`'s `dependencies` at the pin).
