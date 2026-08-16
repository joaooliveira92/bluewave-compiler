# Ticket 03 — Incremental Adoption Path

**Type:** research
**Status:** resolved
**Blocked by:** none

## Question

What is Effect's officially recommended path for adopting v4 **incrementally**
into an existing codebase — Schema first? Data-only? Effect confined to isolated
modules? Which submodules (`effect/Schema`, `effect/Data`, `effect/Error`,
`effect/Effect`, `effect/Cause`, `effect/Either`) can be adopted standalone
without pulling in the runtime? How does Effect Schema coexist with other
validators (Zod) in the same codebase, and is there official guidance on gradual
adoption vs. the "all-in" stance?

Resolve via a `/research` subagent against primary sources (official docs,
migration/adoption guides). Context pointer →
`docs/research/effect-v4-incremental-adoption.md`.

## Answer

Research note: `docs/research/effect-v4-incremental-adoption.md`. Official
gradual adoption IS the designed stance, and the official order is
**architectural, not a module ladder**: centralize platform edges → one
self-contained boundary-heavy service (incl. Schema) → conventions day one →
leaf services first, orchestration last → unify into one `ManagedRuntime` →
entrypoints last behind `runPromise` facades. No official
schema→data→errors→effect order; the anti-pattern is sprinkling Schema before a
service hosts it. **Standalone-adoptable without the runtime**: `Schema` (sync
decode), `Data`, `Option`, `Predicate`, `Result`, `Cause`/`Exit`, `Equal`/`Hash`
— all in the single `effect` root barrel (`effect/Error` does not exist in v4;
errors are `Data.TaggedError` vs wire `Schema.TaggedErrorClass`). **Zod
coexistence**: officially supported during transition with one hard rule —
Schema is the single source of truth and Zod is **derived from the Schema AST**;
never dual-maintain; no official bridge package. Tooling: no codemod;
`@effect/tsgo` LSP linter (incl. `outdatedApi` diagnostic); no
`@effect/tsconfig` on npm.