# 37 — Final acceptance: full gate, smoke, wire parity, determinism record, ADRs

**Type:** implementation
**Status:** open
**Blocked by:** 35 (desktop runtime), 36 (compiler-cli facade)
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

- [ ] Dependency-graph validation: `node scripts/assert-single-effect.mjs` exits
      `0`; `pnpm why effect` shows exactly one (workspace) resolution
      (`MIG-GRAPH-1`, `MIG-GRAPH-2`).
- [ ] Type checks: `pnpm typecheck` clean under tsgo with `skipLibCheck: true`
      (`MIG-GATE-TYPE-1`).
- [ ] Unit + integration tests green: `pnpm test:run`; save/load and compiler
      fixtures green (`MIG-GATE-UNIT-1`, `MIG-GATE-INT-1`, `MIG-WIRE-1`,
      `MIG-WIRE-2`, `MIG-WIRE-3`).
- [ ] Serialization compatibility: Effect values round-trip `canonicalSerialize`
      + envelope hashing and reload loadably (`MIG-WIRE-4`).
- [ ] Packaged Electron smoke + `pnpm test:e2e` green (`MIG-GATE-SMOKE-1`).
- [ ] Deterministic-behavior: cross-process harness runs (informational); any
      golden-hash drift recorded as an ADR note, never a blocker (`MIG-DET-1`).
- [ ] Exclusions verified: renderer/preload/cross-process-test/test-support/
      content/golden/prototype/scripts unchanged except unavoidable compile-only
      adjustments (`MIG-EXCL-1`, `MIG-EXCL-2`).
- [ ] ADR set present and linked (adopt, vendor, schema, determinism demotion +
      per-package hash notes) (`MIG-ADR-1`).
- [ ] No implementation artifacts were introduced during spec/ticket production
      (`MIG-SCOPE-1`).
- [ ] `pnpm check` green end-to-end (`MIG-GATE-1`).

## Notes

- This ticket is the reviewer/orchestrator's acceptance surface; repairs go back
  to the owning ticket.
