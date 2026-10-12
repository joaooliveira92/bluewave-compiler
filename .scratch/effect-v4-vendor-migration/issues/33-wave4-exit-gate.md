# 33 — Wave 4 exit gate & rollback checkpoint

**Type:** gate
**Status:** done
**Blocked by:** none (30 done)
**Frontier:** no

## What to build

Orchestrator-run acceptance of **Wave 4 — Domain core** before the unification
wave begins.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — **MIG-WAVE4-ENTRY,
  MIG-WAVE4-EXIT, MIG-RB-4, MIG-RUNTIME-1, MIG-GATE-1**; Wave Plan table row 4.
- `.scratch/effect-v4-vendor-migration/plan.md` §5.2.

## Acceptance criteria

- [x] Entry gate satisfied: Wave 3 exit met (`MIG-WAVE4-ENTRY`).
- [x] `commands`, `combat` (residual), `ai`, `phase-engine` migrated
      (tickets 24, 26, 29, 30); `campaign`, `ship-design`, `campaign-engine`
      closed not-needed (22, 23, 25) because the renderer reaches them
      (`MIG-WAVE4-EXIT`, `MIG-EXCL-1`).
- [x] Pure packages runtime-free; full-Effect only at justified boundaries
      (`MIG-RUNTIME-1`).
- [x] Cross-package facades still plain-TS-compatible (facade rule).
- [x] `pnpm check` green (`MIG-GATE-1`); single-copy guard green.
- [x] Any hash-surface changes recorded as ADR notes (record, not block).
- [x] Rollback point recorded: reverting to the Wave 3 exit state restores a
      green `pnpm check` (`MIG-RB-4`).

## Notes

- On failure, revert Wave 4 to the Wave 3 exit state (ticket 21) and re-open the
  failing ticket; do not proceed to Wave 5.
- This ticket gates the Wave 5 tickets (34–38).

## Comments

### Audit note (ticket 00, 2026-10-12)

Wave 4 shrank to 24, 26, 29, 30. Re-run
`node apps/desktop/scripts/check-renderer-bundle.mjs` (with the `~effect/`
marker added by ticket 14) against a fresh renderer build as part of this gate.

### Gate PASS (orchestrator-run, 2026-10-12)

Evidence in `.ai/reports/effect-v4-wave4-exit-gate.md`.

- **Entry:** Wave 3 exit met (ticket 21, `0f2cd986`).
- **Migrated:** `commands` (24, `e5bb77f1`), `combat` residual (26, `2e668e99`),
  `ai` (29, `ca0ea1d2`), `phase-engine` (30, `a2cc02eb`); `campaign`/
  `ship-design`/`campaign-engine` already closed not-needed (22/23/25).
- **Runtime-free:** every Wave 4 package imports only `{ Data }` from `effect`;
  no `Layer`/`Context`/`ManagedRuntime`/`Effect.run*`.
- **ADR:** ADR-0100 §2 table amended (ticket 30) — `ai`/`phase-engine` →
  runtime-free row; `content-compiler` → IO row; `campaignInput.ts` read noted.
- **Gates:** `pnpm check` EXIT 0 (e2e 33); single-copy guard ok; renderer bundle
  clean on a fresh build (20 chunks, `~effect/` 0 hits); `docs-check` ok.
- **Determinism:** `pnpm test:cross-process` hashes identical to the Wave 3 exit
  (artifact `103c60d3…`, snapshot `bdc8d346…`, replay `097f9929…`, `success:true`).
- **Rollback point:** Wave 3 exit state `0f2cd986` (verified-green gate commit).
  Reverting the Wave 4 code delta restores it.
