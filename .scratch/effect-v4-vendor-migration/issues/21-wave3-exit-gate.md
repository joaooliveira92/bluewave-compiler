# 21 — Wave 3 exit gate & rollback checkpoint

**Type:** gate
**Status:** open
**Blocked by:** 20 (`events` remainder)
**Frontier:** no

## What to build

Orchestrator-run acceptance of **Wave 3 — Foundation core** before the domain
core wave begins.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — **MIG-WAVE3-ENTRY,
  MIG-WAVE3-EXIT, MIG-RB-3, MIG-RUNTIME-1, MIG-RUNTIME-2, MIG-GATE-TYPE-1,
  MIG-GATE-UNIT-1**; Wave Plan table row 3.
- `.scratch/effect-v4-vendor-migration/plan.md` §5.2.

## Acceptance criteria

- [ ] Entry gate satisfied: Wave 2 exit met (`MIG-WAVE3-ENTRY`).
- [ ] Remainder-`events` migrated (ticket 20); `contracts`, `deterministic`,
      `random`, `armament` verified runtime-free and closed not-needed (16–19);
      no pure package imports `Effect`/`Layer`/`ManagedRuntime`
      (`MIG-RUNTIME-1`, `MIG-RUNTIME-2`).
- [ ] `pnpm typecheck` clean under tsgo with `skipLibCheck: true`
      (`MIG-GATE-TYPE-1`).
- [ ] Focused package tests green (`MIG-GATE-UNIT-1`); `pnpm check` green.
- [ ] Single-copy guard green.
- [ ] Rollback point recorded: reverting to the Wave 2 exit state restores a
      green `pnpm check` (`MIG-RB-3`).

## Notes

- On failure, revert Wave 3 to the Wave 2 exit state (ticket 15) and re-open the
  failing ticket; do not proceed to Wave 4.
- This ticket gates the Wave 4 tickets (22–32).

## Comments

### Audit note (ticket 00, 2026-10-12)

Wave 3 shrank to one implementation ticket (20). The gate also re-runs
`node apps/desktop/scripts/check-renderer-bundle.mjs` (with the `~effect/`
marker added by ticket 14) against a fresh `electron-vite build` to prove `MIG-EXCL-1` still holds.
