# 15 — Wave 2 exit gate & rollback checkpoint

**Type:** gate
**Status:** done
**Blocked by:** none (14 done)
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

- [x] Entry gate satisfied: Wave 1 exit met (`MIG-WAVE2-ENTRY`).
- [x] Every boundary in plan.md §4.1 is on Effect Schema (`MIG-ZOD-2`).
- [x] Per-schema parity tests green; content-pack and event/IPC wire parity green
      (`MIG-WIRE-2`, `MIG-WIRE-3`).
- [x] No boundary maintains both Zod and Effect Schema (`MIG-ZOD-1`).
- [x] `zod` absent from all `package.json` and the root devDep; `pnpm why zod`
      empty (`MIG-ZOD-3`).
- [x] `pnpm check` green (`MIG-GATE-1`).
- [x] Rollback point recorded: reverting to the Wave 1 exit state restores a
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

### Gate PASS (orchestrator-run, 2026-10-12)

Evidence in `.ai/reports/effect-v4-wave2-exit-gate.md`.

- **Entry:** Wave 1 exit met (ticket 07, `8c4f7199`).
- **Boundaries on Schema:** ticket 08/09 (`d51eada3`), 10 (`6f3c007d`), 11
  (`b2abb4b8`), 12 (`5df46569`, hardened by `652da67e`/`248cd6ed`), 13
  (`0c7370d4`); ticket 00 §2 verified every plan.md §4.1 boundary against the
  code.
- **No dual Zod/Schema:** `rg "from ['\"]zod"` over `apps`, `packages`,
  `scripts` → zero; `rg '"zod"'` in any workspace `package.json` → zero.
- **Zod removed:** ticket 14 (`0f67bedd`) deleted the renderer shim, the
  `tsconfig.web.json` entry, the `apps/desktop/package.json` dependency and the
  lockfile lines; `pnpm why zod` empty; `pnpm install --frozen-lockfile` green.
- **`pnpm check` green:** EXIT 0 end-to-end — preflight, format, lint,
  `lint:effect`, `test:scripts`, licenses, typecheck 37/37, build 20/20,
  `test:run`, balance reports, desktop e2e **33 passed**.
- **Repair before the gate:** the three pre-existing reds that ticket 14
  recorded (Rules unit test, fleet-method e2e, theme e2e) were diagnosed as
  regressions from `6dbe595d` and fixed under
  `.scratch/desktop-test-failures/issues/02-new-game-master-detail-regressions.md`.
  No gate was weakened; the Rules screen was restored to its ADR-0127
  single-press behaviour and its test passed unmodified.
- **Rollback point:** Wave 1 exit state `8c4f7199` (a verified-green checkpoint,
  ticket 07). Reverting the Wave 2 commits (`d51eada3`, `6f3c007d`, `b2abb4b8`,
  `5df46569`, `0c7370d4`, `652da67e`, `248cd6ed`, `45fe3cbc`, `2c593992`,
  `7d3bfcc0`, `0f67bedd`) restores it; `zod` returns only with the whole wave.
  The interleaved new-game/archetype commits are independent of Wave 2.
