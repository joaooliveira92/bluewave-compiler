# 22 — Domain: `campaign` on runtime-free Effect idioms

**Type:** implementation
**Status:** resolved
**Blocked by:** none
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

## Comments

### Audit note (ticket 00, 2026-10-12)

**Closed — not needed.** Renderer-reachable package: a top-level
`Data.TaggedError(...)` would bundle `effect` into the renderer
(`MIG-EXCL-1`/ADR-0125; ticket 00 §5-A, confirmed by experiment). It keeps its
plain error classes. Reopen only with an ADR giving the renderer an Effect-free
error contract.

Throws are `BluewaveError` with reason codes (`division.ts:138,149,160,172,192`)
plus `researchSpeed.ts:27`, `fleetSize.ts:68` (`TypeError`). Separate,
non-Effect finding deferred: `campaignInput.ts:7-8` reads the filesystem
inside a package ADR-0100 lists as pure (ticket 00 §6 item 4).
