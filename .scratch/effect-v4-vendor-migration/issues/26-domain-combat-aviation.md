# 26 — Domain: `combat` aviation modules on runtime-free Effect idioms

**Type:** implementation
**Status:** open
**Blocked by:** none (21 done)
**Frontier:** yes

## What to build

Adopt the runtime-free Effect subset across the `@bluewave/combat` aviation
modules: `air-combat`, `aircraft`, `carrier-operations`, `air-defense`
(contract schemas already Schema'd in ticket 12). Preserve all pure combat math
and reason codes.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-1,
  MIG-DET-1**; "Runtime-usage policy" (pure combat math stays runtime-free).
- `packages/combat/src/{air-combat,aircraft,carrier-operations,air-defense}/**`.
- `docs/adr/ADR-0042-d4-air-defense-layer-resolution-eligibility.md`,
  `docs/adr/ADR-0012-b1-division-boundary.md` (boundary context).

## Acceptance criteria

- [ ] The four aviation modules use runtime-free Effect subset idioms; structured
      failures typed via `Data.TaggedError` (`MIG-RUNTIME-1`).
- [ ] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime`; no `Effect.run*`.
- [ ] Combat outcomes, record fields, and reason codes unchanged (any
      hash-surface change → ADR note, `MIG-DET-1`).
- [ ] Focused aviation tests green; `pnpm typecheck` green.

## Notes

- Do not modify `gunnery`/`damage`/`torpedoes`/`mines`/`smoke`/`coastal-defense`
  (ticket 27) or the engagement/foundation modules (ticket 28).

## Comments

### Audit note (ticket 00, 2026-10-12)

**Rescoped and merged with 27/28.** 429 of `combat`'s 432 throws are
`BluewaveError` (stays plain, renderer-reachable class from `contracts`). The
residual plain throws are: `air-combat/records.ts:43`,
`mines/contracts.ts:153,170`. Convert those three to a `Data.TaggedError`
(combat-local) or to `BluewaveError`; keep reason codes and messages. Combat
is not renderer-reachable. Blocked-by corrected: 22 is closed.
