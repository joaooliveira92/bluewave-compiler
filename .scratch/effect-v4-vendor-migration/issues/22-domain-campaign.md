# 22 — Domain: `campaign` on runtime-free Effect idioms

**Type:** implementation
**Status:** open
**Blocked by:** 21 (Wave 3 exit)
**Frontier:** no

## What to build

Adopt the runtime-free Effect subset across `@bluewave/campaign` (compilation,
scenario, state, timeline, continuity): `Schema`/`Data`/tagged errors where
appropriate, keeping all derivations pure and outputs unchanged.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1**;
  "Runtime-usage policy", Wave 4.
- `packages/campaign/src/**`.
- `.scratch/effect-v4-vendor-migration/plan.md` §3, §5.1.

## Acceptance criteria

- [ ] `campaign` uses runtime-free Effect subset idioms; structured failures use
      `Data.TaggedError` where previously thrown/ad-hoc (`MIG-RUNTIME-1`).
- [ ] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime`.
- [ ] Compilation/snapshot outputs, envelope hashes, and continuity behavior
      unchanged (any hash-surface change → ADR note, `MIG-DET-1`).
- [ ] `pnpm --filter @bluewave/campaign test` green; `pnpm typecheck` green.

## Notes

- `campaign` already depends on `content-schema`/`content-compiler` (Schema-based
  since Wave 2); do not reintroduce Zod.
