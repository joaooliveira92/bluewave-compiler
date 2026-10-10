# 38 — Wave 5 exit gate & rollback checkpoint

**Type:** gate
**Status:** open
**Blocked by:** 37 (final acceptance)
**Frontier:** no

## What to build

Orchestrator-run acceptance of **Wave 5 — Unification & entrypoints**, closing
the migration and recording the final rollback point.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — **MIG-WAVE5-ENTRY,
  MIG-WAVE5-EXIT, MIG-RB-5, MIG-WAVE-ORDER-1, MIG-TICKET-1**; Wave Plan row 5.
- `.scratch/effect-v4-vendor-migration/plan.md` §5.2.

## Acceptance criteria

- [ ] Entry gate satisfied: Wave 4 exit met (`MIG-WAVE5-ENTRY`).
- [ ] Cross-package facades flipped; one long-lived `ManagedRuntime`; desktop
      main + IPC handlers + `compiler-cli` behind `runPromise` facades
      (`MIG-WAVE5-EXIT`).
- [ ] Packaged Electron smoke + `pnpm test:e2e` green; `pnpm check` green.
- [ ] Waves executed in dependency order 0→5; each depended only on earlier
      waves (`MIG-WAVE-ORDER-1`).
- [ ] Ticket set is complete and frontier-ordered with correct blocking edges
      (`MIG-TICKET-1`).
- [ ] Rollback point recorded: reverting to the Wave 4 exit state restores a
      green `pnpm check` (`MIG-RB-5`).

## Notes

- This closes the migration; hand off to the release boundary (PR from `dev` to
  `main` at a release point) — Git/PR choreography is owned by the orchestrator,
  not this planning artifact.
