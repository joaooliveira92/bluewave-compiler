# 04 — Wave 0 exit gate & rollback checkpoint

**Type:** gate
**Status:** done
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

- [x] Entry gate satisfied: repo synced on `dev`; `pnpm preflight` green; no
      in-progress merge/rebase or conflict markers (`MIG-WAVE0-ENTRY`).
- [x] Vendor present and integrity-verified (`node scripts/vendor-effect-sync.mjs
      --verify`) (`MIG-WAVE0-EXIT`).
- [x] Single-copy guard green inside `pnpm preflight`; `duplicatePackage` clean
      under the tsgo/Oxlint gate (`MIG-WAVE0-EXIT`).
- [x] `repos/effect` read-only reference subtree present, excluded from
      lint/format/editor search, and `AGENTS.md` documents it (`MIG-REF-1`).
- [x] `pnpm check` green end-to-end (`MIG-GATE-1`).
- [x] Effect LSP / Oxlint lint gate green (`MIG-WAVE0-EXIT`).
- [x] `git diff --name-only` confined to `vendor/`, `repos/effect`,
      workspace/overrides, `scripts/`, toolchain config, `AGENTS.md`/
      `agent-patterns/`, and `docs/adr/` — **zero domain-package changes**
      (`MIG-WAVE0-EXIT`).
- [x] Rollback point recorded: Wave 0 is revertible with no domain code to unwind
      (`MIG-RB-0`).

## Notes

- If any exit criterion fails, roll back to the pre-Wave-0 state and re-open the
  failing ticket; do not proceed to Wave 1.
- This ticket gates ticket 05.

## Comments

**Gate PASS (orchestrator-run, 2026-10-11).** Evidence in
`.ai/reports/effect-v4-wave0-exit-gate.md` (the deterministic harness was run and
reported **unchanged** — see the ADR-0103 note there).

- Entry: on `dev`, 2 commits ahead of `origin/dev` (the Wave 0 work itself), 0
  behind; `pnpm preflight` green; no merge/rebase/conflict markers.
- Vendor: `node scripts/vendor-effect-sync.mjs --verify` → effect@4.0.2 +
  @effect/vitest@4.0.2 match the published tarballs.
- Guard: `pnpm preflight` runs `assert-single-effect.mjs` (self-test 9/9 + real
  lockfile ok; no registry `effect`); `lint:effect` `duplicatePackage: error`
  reports 0 errors.
- Reference: `repos/effect` subtree present; excluded from `vp lint`/`vp fmt`
  (`vite.config.ts`) and editor search (`.vscode/settings.json`); AGENTS.md
  documents it.
- `pnpm check` → **EXIT 0** end-to-end (incl. 30 e2e).
- One gap-tightening note: the Wave 0 delta also touches traceability files
  (`.ai/SPRINT-PLAN.md`, `.ai/reports/*`, `docs/PROGRESS.md`, `.scratch/*`) and
  one amended DESIGN doc (`docs/architecture/determinism-and-randomness.md`) —
  process records, not domain code. `packages/**` and `apps/**` are **untouched**
  (verified: empty diff).
- **Rollback point:** pre-Wave-0 baseline `95efface`; Wave 0 = `6fc7ed9d`
  (ticket 01 vendor) → `2e8db356` + `d01a3736` (repos/effect subtree) → `cc7eec0f`
  (ticket 02) → `5002edad` (ticket 03). `git revert`/reset to `95efface` restores
  the pre-Wave-0 state with **zero domain code to unwind** (non-destructive; no
  history rewrite).
