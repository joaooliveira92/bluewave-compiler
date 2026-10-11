# 07 — Wave 1 exit gate & rollback checkpoint

**Type:** gate
**Status:** done
**Blocked by:** 06 (persistence beachhead)
**Frontier:** no

## What to build

Orchestrator-run acceptance of **Wave 1 — Error + IO beachhead** before the
validation-boundary wave begins.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — **MIG-WAVE1-ENTRY,
  MIG-WAVE1-EXIT, MIG-RB-1, MIG-GATE-1**; Wave Plan table row 1.
- `.scratch/effect-v4-vendor-migration/plan.md` §5.2.

## Acceptance criteria

- [x] Entry gate satisfied: Wave 0 exit met (`MIG-WAVE1-ENTRY`).
- [x] `diagnostics` typed-error model + `persistence` beachhead landed with the
      full acceptance bar (tickets 05, 06) (`MIG-WAVE1-EXIT`).
- [x] Save round-trip loadable; `PERSISTENCE_*` codes survive as tagged errors;
      `SaveStore` API compatible (`MIG-WAVE1-EXIT`, `MIG-WIRE-1`, `MIG-WIRE-4`).
- [x] `pnpm --filter @bluewave/persistence test` green; `pnpm check` green
      (`MIG-GATE-1`).
- [x] Rollback point recorded: reverting to the Wave 0 exit state restores a
      green `pnpm check` (`MIG-RB-1`).

## Notes

- On failure, revert Wave 1 to the Wave 0 exit state (ticket 04) and re-open the
  failing ticket; do not proceed to Wave 2.
- This ticket gates tickets 08–13.

## Comments

**Gate PASS (orchestrator-run, 2026-10-11).** Evidence in
`.ai/reports/effect-v4-wave1-exit-gate.md`.

- Entry: Wave 0 exit met (ticket 04).
- Beachhead: `diagnostics` (`dd654dce`) + `persistence` (`8a789b91`) both landed
  with the full acceptance bar; both are real `workspace:*` consumers of the
  vendored `effect`.
- `pnpm --filter @bluewave/persistence test` → 8 files / 64 tests; `pnpm check`
  → **EXIT 0** end-to-end; goldens 10/10; cross-process `success:true`.
- **Rollback point:** Wave 0 exit state `6cc0e414` (a verified-green checkpoint);
  reverting the Wave 1 commits (`dd654dce`, `8a789b91`) restores it. The
  interleaved `854b64ca` is a docs-only tracker-cleanup commit with no code
  effect.
