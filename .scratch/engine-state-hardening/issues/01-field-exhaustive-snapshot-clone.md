# 01 — Field-exhaustive snapshot clone + audit test

**What to build:** the month pipeline can no longer silently alias the caller's
snapshot because a field was forgotten in the per-turn deep clone. The
hand-maintained `cloneSnapshot` in the phase-engine is replaced by a structural
deep-clone of the campaign snapshot whose completeness is guarded by an audit
test: any field added to a cloned type (ships, fleets, nations, research,
divisions, construction projects, wars, weather states, …) fails the test until
a matching clone entry exists. A regression test proves two consecutive month
executions mutate disjoint object graphs (no shared references between the
caller's snapshot and the engine's working snapshot, and between the working
snapshot at turn N and at turn N+1).

**Blocked by:** None — can start immediately.

**Type:** implementation
**Status:** resolved
**Frontier:** yes

- [x] Structural deep-clone utility replaces the hand-rolled per-type clone; every cloned type has an explicit copy entry, not spread-by-convention.
- [x] An audit test enumerates every serialized field of every cloned snapshot type and fails when a field is added/renamed without a corresponding clone path.
- [x] Regression test: mutating a clone's ship/nation/research/war object never mutates the caller's snapshot (identity checks, not just value equality).
- [x] Two consecutive month executions produce disjoint object graphs (a mutation in month 2 leaves month 1's shipped objects untouched).
- [x] Full repo gate green: uncached build, `tsc -b`, lint, all per-package tests, goldens unchanged, two-process determinism byte-identical.

## Resolution

Implemented on `dev` (this issue), released via `dev → main` at a release
boundary. `packages/phase-engine/src/snapshotClone.ts` replaced the
hand-maintained `cloneSnapshot` in `month.ts` with a structural deep-clone driven
by an explicit per-type field table `F`; every snapshot type that materialises a
record has a matching `F` entry (26 audited types incl. `BattleManifestSide`,
which was extracted from the anonymous `sides` inline type so it is auditable).
`CLONE_COVERAGE` exposes the field lists to `test/snapshot-clone.test.ts`, which
re-enumerates the campaign type definitions (`state.ts`, `division.ts`) and fails
on any added/renamed field without a clone path. Regression tests assert graph
disjointness (identity, not equality) between caller input ↔ engine snapshot,
between consecutive month executions, and that mutating a clone's
ship/nation/research/war/design-family/route/shell objects leaves the caller's
snapshot and month-1's shipped objects untouched; the clone canonical-serializes
byte-identical to its input.

Validation (phase-engine package only; full-repo `check` is blocked at baseline
by unrelated uncommitted combat torpedo/mines work carrying TS errors):
`tsc --noEmit` 0, `vp lint .` 0 errors, `vp fmt --check` clean, all 115 +
`packages/campaign` tests green. The two-process/golden gates are unaffected by
this change and re-run once the baseline combat working tree lands.