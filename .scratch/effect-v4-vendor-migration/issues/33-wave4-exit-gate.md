# 33 — Wave 4 exit gate & rollback checkpoint

**Type:** gate
**Status:** open
**Blocked by:** 31, 32 (`phase-engine` complete)
**Frontier:** no

## What to build

Orchestrator-run acceptance of **Wave 4 — Domain core** before the unification
wave begins.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — **MIG-WAVE4-ENTRY,
  MIG-WAVE4-EXIT, MIG-RB-4, MIG-RUNTIME-1, MIG-GATE-1**; Wave Plan table row 4.
- `.scratch/effect-v4-vendor-migration/plan.md` §5.2.

## Acceptance criteria

- [ ] Entry gate satisfied: Wave 3 exit met (`MIG-WAVE4-ENTRY`).
- [ ] `campaign`, `ship-design`, `commands`, `campaign-engine`, `combat`, `ai`,
      `phase-engine` migrated bottom-up (`MIG-WAVE4-EXIT`).
- [ ] Pure packages runtime-free; full-Effect only at justified boundaries
      (`MIG-RUNTIME-1`).
- [ ] Cross-package facades still plain-TS-compatible (facade rule).
- [ ] `pnpm check` green (`MIG-GATE-1`); single-copy guard green.
- [ ] Any hash-surface changes recorded as ADR notes (record, not block).
- [ ] Rollback point recorded: reverting to the Wave 3 exit state restores a
      green `pnpm check` (`MIG-RB-4`).

## Notes

- On failure, revert Wave 4 to the Wave 3 exit state (ticket 21) and re-open the
  failing ticket; do not proceed to Wave 5.
- This ticket gates the Wave 5 tickets (34–38).
