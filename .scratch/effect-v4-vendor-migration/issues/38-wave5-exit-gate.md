# 38 — Wave 5 exit gate & rollback checkpoint

**Type:** gate
**Status:** done
**Blocked by:** none (37 done)
**Frontier:** no

## What to build

Orchestrator-run acceptance of **Wave 5 — Unification & entrypoints**, closing
the migration and recording the final rollback point.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — **MIG-WAVE5-ENTRY,
  MIG-WAVE5-EXIT, MIG-RB-5, MIG-WAVE-ORDER-1, MIG-TICKET-1**; Wave Plan row 5.
- `.scratch/effect-v4-vendor-migration/plan.md` §5.2.

## Acceptance criteria

- [x] Entry gate satisfied: Wave 4 exit met (`MIG-WAVE5-ENTRY`).
- [x] Cross-package facades flipped; one long-lived `ManagedRuntime`; desktop
      main + IPC handlers + `compiler-cli` behind `runPromise` facades
      (`MIG-WAVE5-EXIT`). _Resolved by ADR-0128: not warranted — facades stay
      plain (renderer-reachable or synchronous); no runtime introduced._
- [x] Packaged Electron smoke + `pnpm test:e2e` green; `pnpm check` green.
- [x] Waves executed in dependency order 0→5; each depended only on earlier
      waves (`MIG-WAVE-ORDER-1`).
- [x] Ticket set is complete and frontier-ordered with correct blocking edges
      (`MIG-TICKET-1`).
- [x] Rollback point recorded: reverting to the Wave 4 exit state restores a
      green `pnpm check` (`MIG-RB-5`).

## Notes

- This closes the migration; hand off to the release boundary (PR from `dev` to
  `main` at a release point) — Git/PR choreography is owned by the orchestrator,
  not this planning artifact.

### Gate PASS (orchestrator-run, 2026-10-12)

Evidence in `.ai/reports/effect-v4-final-acceptance.md` (shared with ticket 37).

- **Entry:** Wave 4 exit met (ticket 33 PASS, `99651575`/`e77cea39`).
- **Wave 5 resolved as a documented decision (ADR-0128):** facade flips are
  barred by renderer reachability (`MIG-EXCL-1`/ADR-0125) and the blind-wrapping
  prohibition (ADR-0100 §2); no `ManagedRuntime`/`runPromise` facade is added
  because there is no composable async service graph. Tickets 34–36 closed
  without code.
- **Certified:** `pnpm check` EXIT 0 (e2e 33); packaged Electron smoke 14/14;
  graph ok; cross-process hashes unchanged; docs-check ok (127 ADRs).
- **Order:** waves executed 0→5; each depended only on earlier waves.
- **Rollback point:** Wave 4 exit state `99651575`/`e77cea39`.
