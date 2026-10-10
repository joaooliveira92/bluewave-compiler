# 04 — Wave 0 exit gate & rollback checkpoint

**Type:** gate
**Status:** open
**Blocked by:** 01, 02, 03
**Frontier:** no

## What to build

Orchestrator-run acceptance of **Wave 0 — Vendor & toolchain** before any
migration wave begins. No product code changes. Records exact observed results.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — **MIG-WAVE0-ENTRY,
  MIG-WAVE0-EXIT, MIG-RB-0, MIG-GATE-1**; read the Wave Plan table row 0.
- `.scratch/effect-v4-vendor-migration/plan.md` §5.2–§5.3.

## Acceptance criteria

- [ ] Entry gate satisfied: repo synced on `dev`; `pnpm preflight` green; no
      in-progress merge/rebase or conflict markers (`MIG-WAVE0-ENTRY`).
- [ ] Vendor present and integrity-verified (`node scripts/vendor-effect-sync.mjs
      --verify`) (`MIG-WAVE0-EXIT`).
- [ ] Single-copy guard green inside `pnpm preflight` (`MIG-WAVE0-EXIT`).
- [ ] `pnpm check` green end-to-end (`MIG-GATE-1`).
- [ ] `effect-best-practices` lint gate green (`MIG-WAVE0-EXIT`).
- [ ] `git diff --name-only` confined to `vendor/`, workspace/overrides,
      `scripts/`, toolchain config, and `docs/adr/` — **zero domain-package
      changes** (`MIG-WAVE0-EXIT`).
- [ ] Rollback point recorded: Wave 0 is revertible with no domain code to unwind
      (`MIG-RB-0`).

## Notes

- If any exit criterion fails, roll back to the pre-Wave-0 state and re-open the
  failing ticket; do not proceed to Wave 1.
- This ticket gates ticket 05.
