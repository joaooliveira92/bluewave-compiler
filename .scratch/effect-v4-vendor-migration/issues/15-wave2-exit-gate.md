# 15 — Wave 2 exit gate & rollback checkpoint

**Type:** gate
**Status:** open
**Blocked by:** 14 (zod removed)
**Frontier:** no

## What to build

Orchestrator-run acceptance of **Wave 2 — Validation boundaries** before the
foundation wave begins.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — **MIG-WAVE2-ENTRY,
  MIG-WAVE2-EXIT, MIG-RB-2, MIG-WIRE-2, MIG-WIRE-3, MIG-ZOD-1..3, MIG-GATE-1**;
  Wave Plan table row 2.
- `.scratch/effect-v4-vendor-migration/plan.md` §4, §5.2.

## Acceptance criteria

- [ ] Entry gate satisfied: Wave 1 exit met (`MIG-WAVE2-ENTRY`).
- [ ] Every boundary in plan.md §4.1 is on Effect Schema (`MIG-ZOD-2`).
- [ ] Per-schema parity tests green; content-pack and event/IPC wire parity green
      (`MIG-WIRE-2`, `MIG-WIRE-3`).
- [ ] No boundary maintains both Zod and Effect Schema (`MIG-ZOD-1`).
- [ ] `zod` absent from all `package.json` and the root devDep; `pnpm why zod`
      empty (`MIG-ZOD-3`).
- [ ] `pnpm check` green (`MIG-GATE-1`).
- [ ] Rollback point recorded: reverting to the Wave 1 exit state restores a
      green `pnpm check` (Zod restored only if the whole wave is reverted)
      (`MIG-RB-2`).

## Notes

- On failure, revert Wave 2 to the Wave 1 exit state (ticket 07) and re-open the
  failing ticket; do not proceed to Wave 3.
- This ticket gates tickets 16–20.

## Comments

### Audit note (ticket 00, 2026-10-12)

Criterion 2 ("every §4.1 boundary is on Effect Schema") is already true in code
(ticket 00 §2); this gate reduces to ticket 14's removal, a green `pnpm check`,
and recording the rollback point.
