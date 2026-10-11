# 07 — Wave 1 exit gate & rollback checkpoint

**Type:** gate
**Status:** open
**Blocked by:** 06 (persistence beachhead)
**Frontier:** yes

## What to build

Orchestrator-run acceptance of **Wave 1 — Error + IO beachhead** before the
validation-boundary wave begins.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — **MIG-WAVE1-ENTRY,
  MIG-WAVE1-EXIT, MIG-RB-1, MIG-GATE-1**; Wave Plan table row 1.
- `.scratch/effect-v4-vendor-migration/plan.md` §5.2.

## Acceptance criteria

- [ ] Entry gate satisfied: Wave 0 exit met (`MIG-WAVE1-ENTRY`).
- [ ] `diagnostics` typed-error model + `persistence` beachhead landed with the
      full acceptance bar (tickets 05, 06) (`MIG-WAVE1-EXIT`).
- [ ] Save round-trip loadable; `PERSISTENCE_*` codes survive as tagged errors;
      `SaveStore` API compatible (`MIG-WAVE1-EXIT`, `MIG-WIRE-1`, `MIG-WIRE-4`).
- [ ] `pnpm --filter @bluewave/persistence test` green; `pnpm check` green
      (`MIG-GATE-1`).
- [ ] Rollback point recorded: reverting to the Wave 0 exit state restores a
      green `pnpm check` (`MIG-RB-1`).

## Notes

- On failure, revert Wave 1 to the Wave 0 exit state (ticket 04) and re-open the
  failing ticket; do not proceed to Wave 2.
- This ticket gates tickets 08–13.
