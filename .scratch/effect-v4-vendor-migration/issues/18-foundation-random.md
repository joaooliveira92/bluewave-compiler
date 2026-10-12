# 18 — Foundation: `random` (keep the DESIGN-08 named-stream ledger)

**Type:** implementation
**Status:** resolved
**Blocked by:** none
**Frontier:** no

## What to build

Adopt Effect `Schema`/`Data`/typed errors in `@bluewave/random`, **without**
replacing the hand-rolled PRNG or the DESIGN-08 named hierarchical stream
ledger with Effect `Random`. The RNG authority stays Bluewave-owned.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-RUNTIME-2,
  MIG-RUNTIME-1**; read "Runtime-usage policy" and "Further Notes" (the `random`
  PRNG default is **no**).
- `.scratch/effect-v4-vendor-migration/plan.md` §3, "Not yet specified".
- `packages/random/src/**`; `docs/architecture/determinism-and-randomness.md`;
  `docs/research/effect-v4-runtime-determinism.md` §3.2, §3.5 (Effect `Random` is
  one flat per-scope stream; named streams must remain Bluewave-owned).

## Acceptance criteria

- [ ] `random` uses the runtime-free Effect subset where appropriate; **no**
      replacement of the PRNG or the named-stream ledger by Effect `Random`
      (`MIG-RUNTIME-2`).
- [ ] Runtime-free: no `Effect`/`Layer`/`ManagedRuntime` (no ambient randomness).
- [ ] Named-stream ledger tests green; stream identity/records unchanged.
- [ ] `pnpm --filter @bluewave/random typecheck` + tests green.
- [ ] If any hash/stream output changes, record an ADR note (`MIG-DET-1`).

## Notes

- If a future ticket wants Effect `Random`, it requires its own decision + ADR;
  out of scope here.

## Comments

### Audit note (ticket 00, 2026-10-12)

**Closed — not needed.** `random` is 94 LOC with 0 throws, 0 error classes, no
schema and no IO. `MIG-RUNTIME-2` forbids replacing the named-stream ledger with
Effect `Random`. There is nothing to adopt.
