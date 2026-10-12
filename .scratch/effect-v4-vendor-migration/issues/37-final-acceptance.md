# 37 — Final acceptance: full gate, smoke, wire parity, determinism record, ADRs

**Type:** implementation
**Status:** done
**Blocked by:** none (35, 36 resolved)
**Frontier:** no

## What to build

The end-to-end acceptance of the migration itself: run the full objective gate
across dependency graph, types, unit/integration/packaged-Electron/
serialization/determinism suites; confirm wire formats and exclusions; finalize
the ADR set and record any hash drift.

## Required reading (self-contained)

- `.scratch/effect-v4-vendor-migration/spec.md` — proves **MIG-GATE-1,
  MIG-GATE-SMOKE-1, MIG-GATE-TYPE-1, MIG-GATE-UNIT-1, MIG-GATE-INT-1,
  MIG-DET-1, MIG-ADR-1, MIG-SCOPE-1**; read "Acceptance Criteria" and
  "Testing Decisions".
- `.scratch/effect-v4-vendor-migration/plan.md` §7.

## Acceptance criteria

- [x] Dependency-graph validation: `node scripts/assert-single-effect.mjs` exits
      `0`; `pnpm why effect` shows exactly one (workspace) resolution
      (`MIG-GRAPH-1`, `MIG-GRAPH-2`).
- [x] Type checks: `pnpm typecheck` clean under tsgo with `skipLibCheck: true`
      (`MIG-GATE-TYPE-1`).
- [x] Unit + integration tests green: `pnpm test:run`; save/load and compiler
      fixtures green (`MIG-GATE-UNIT-1`, `MIG-GATE-INT-1`, `MIG-WIRE-1`,
      `MIG-WIRE-2`, `MIG-WIRE-3`).
- [x] Serialization compatibility: Effect values round-trip `canonicalSerialize`
      + envelope hashing and reload loadably (`MIG-WIRE-4`).
- [x] Packaged Electron smoke + `pnpm test:e2e` green (`MIG-GATE-SMOKE-1`).
- [x] Deterministic-behavior: cross-process harness runs (informational); any
      golden-hash drift recorded as an ADR note, never a blocker (`MIG-DET-1`).
      No drift.
- [x] Exclusions verified: renderer/preload/cross-process-test/test-support/
      content/golden/prototype/scripts unchanged except unavoidable compile-only
      adjustments (`MIG-EXCL-1`, `MIG-EXCL-2`).
- [x] ADR set present and linked (adopt, vendor, schema, determinism demotion +
      per-package hash notes) (`MIG-ADR-1`).
- [x] No implementation artifacts were introduced during spec/ticket production
      (`MIG-SCOPE-1`).
- [x] `pnpm check` green end-to-end (`MIG-GATE-1`).

## Notes

- This ticket is the reviewer/orchestrator's acceptance surface; repairs go back
  to the owning ticket.

### Gate PASS (orchestrator-run, 2026-10-12)

Evidence in `.ai/reports/effect-v4-final-acceptance.md`. Graph ok; `pnpm why
effect` no registry resolution; typecheck 37/37; `pnpm check` EXIT 0 (e2e 33);
packaged Electron smoke 14/14 PASS; cross-process hashes identical to every prior
wave exit (`success:true`); renderer bundle clean; docs-check ok (127 ADRs).
Wave 5's runtime scope was resolved by ADR-0128 (tickets 34–36 closed without
code); no production artifact was added in Wave 5.
