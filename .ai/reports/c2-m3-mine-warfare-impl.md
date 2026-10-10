# Validation Report: C-2 — M3 Mine-Pressure Lifecycle (Mine Warfare)

## Outcome

`PASS` (with two environment caveats recorded — see Known limitations).

## Scope delivered

All AC-1..AC-25 of `.scratch/c2-m3-mine-warfare/spec.md` (§1.1) implemented via
the orchestrator pipeline (8 increments, each implementator → reviewer →
gate → commit). Engine-only, deterministic **mine-pressure lifecycle** in a
new `packages/combat/src/mines/` module: type definitions (§2), sources (§3),
laying value (§4), pressure increase/reinforcement (§5), sweeping eligibility /
base values / dual ASW-mine equipment / effective value (§6–9), regional
aggregation + §10 allocation, defensive-standoff value (§16), route-risk value
(§13), mine report + misidentification classifier (§19–20), decay (§21),
post-war persistence (§22), ownership/control dispositions (§23), knowledge
(§24), clearance (§27), and the §28 resolution record + §29 canonical ordering +
in-slice §30 codes (INC-8).

**Explicitly deferred (recorded, never dropped):** mine-strike resolution
(battle-hazard generation §11/§17, strike eligibility/outcome §14–15/§18,
friendly-fire §25–26) — C-2 continuation; phase-engine/campaign-snapshot wiring
(mirrors B-5→B-6); route-strike application (blocked on DESIGN-25, unassigned);
submarine-laid operational mechanics (C-3); scenario-special content (content
track); command-layer laying orders (later command slice). See the C-2 ADR
(`docs/adr/ADR-0033-…`).

## Requirements evidence

| Requirement                    | Implementation                          | Proving tests                                   |
| ------------------------------ | --------------------------------------- | ----------------------------------------------- |
| AC-1 AreaMinePressureRecord    | `mines/pressure-record.ts`              | `pressure-record.test.ts`, mine 17              |
| AC-2 MineTypeDefinition        | `mines/model.ts`                        | `type-definitions.test.ts` (25)                 |
| AC-3 Mine sources              | `mines/sources.ts`                      | `sources.test.ts` (18)                          |
| AC-4 Laying value              | `mines/laying.ts`                       | `laying-value.test.ts` (20)                     |
| AC-5 Pressure increase         | `mines/pressure-increase.ts`            | `pressure-increase.test.ts` (19)                |
| AC-6 Sweeping eligibility      | `mines/sweeping-eligibility.ts`         | `sweeping-eligibility.test.ts` (16)             |
| AC-7 Base values               | `mines/sweeping-base-values.ts`         | `sweeping-base-values.test.ts` (10)             |
| AC-8 Dual equipment            | `mines/dual-equipment.ts`               | `dual-equipment.test.ts` (14)                   |
| AC-9 Effective value           | `mines/effective-sweeping.ts`           | `effective-sweeping.test.ts` (15)               |
| AC-10 Aggregation + allocation | `mines/sweeping-aggregation.ts`         | `sweeping-aggregation.test.ts` (28)             |
| AC-11 Defensive standoff       | `mines/defensive-standoff.ts`           | `defensive-standoff.test.ts` (18)               |
| AC-12 Route risk               | `mines/route-risk.ts`                   | `route-risk.test.ts` (17)                       |
| AC-13 Mine report              | `mines/mine-report.ts`                  | `report.test.ts` (6)                            |
| AC-14 Misidentification        | `mines/misidentification.ts`            | `misidentification.test.ts` (12)                |
| AC-15 Decay                    | `mines/decay.ts`                        | `decay.test.ts` (20)                            |
| AC-16 Post-war                 | `mines/post-war-persistence.ts`         | `post-war-persistence.test.ts` (14)             |
| AC-17 Ownership                | `mines/ownership-transitions.ts`        | `ownership-transitions.test.ts` (20)            |
| AC-18 Knowledge                | `mines/knowledge.ts`                    | `knowledge.test.ts` (11)                        |
| AC-19 Clearance                | `mines/clearance.ts`                    | `clearance.test.ts` (10)                        |
| AC-20 Records + ordering       | `mines/records.ts`, `mines/ordering.ts` | `records.test.ts` (10), `ordering.test.ts` (10) |
| AC-21 Reason-code set-equality | `mines/reasonCodes.ts`                  | `reason-codes-mines.test.ts` (6)                |
| AC-22 Integration boundary     | `mines/*` (pure)                        | `integration-boundary.test.ts` (3)              |
| AC-23 Two-process determinism  | `simulation/run-mines-child.ts`         | `determinism.test.ts` (4)                       |
| AC-24 Contracts rollup         | `mines/contracts.ts`                    | `contracts-rollup.test.ts` (5)                  |
| AC-25 Goldens unchanged        | — (no snapshot/phase change)            | orchestrator gate                               |

Mines suite total: **26 files / 357 tests green**.

## Commands and observed results

```text
pnpm exec vitest run test/mines                     # 26 files, 357 tests passed
pnpm exec vitest run test/mines/determinism.test.ts # 4/4 passed (byte-identical ×2)
pnpm exec tsc --noEmit -p packages/combat           # exit 0, clean
pnpm exec vp fmt --check src/mines test/mines src/simulation/run-mines-child.ts
                                                    # "All matched files use the correct format."
pnpm -w turbo run build --force                     # 18/18 tasks successful
pnpm exec vitest run (packages/combat)              # 150 files / ~1772 tests green when C-1 worktrees excluded
node scripts/verify-golden-hashes.cjs               # 10/10 at INC-2..INC-7 gates (see KNOWN LIMITATION for INC-8 gate)
```

## Determinism evidence

- Mines two-process child (`dist/simulation/run-mines-child.js`, spawned twice,
  byte-compared): identical — **AC-23 PASS** (also spawned manually post-fix:
  `BYTE-IDENTICAL`, 804 bytes).
- Record hash: domain-separated `createEnvelope("mine_warfare_resolution",
  "mine_warfare_resolution_v1", …)` over the non-hash surface; identical content
  → identical 64-hex hash; tamper breaks verification (records.test).
- No `Math.random`/`Date`/`process.env`/localeCompare/fs-order in mines source
  (grep-verified in integration-boundary test).
- Keyed RNG only: `mine_warfare/report/underwater_explosion` stream with a
  recorded `RandomDecision` (misidentification).

## Canonical artifact changes

NONE. No campaign snapshot schema change, no phase-engine registration, no
`BattleResolver`/`StrengthCalculator`/engine-file modification (AC-22 boundary
proven by test + diff). Golden hashes were unchanged 10/10 at each of the
INC-2..INC-7 gates. **No golden regeneration** (ADR-0007 process not engaged).

## Tests added

47 test files under `packages/combat/test/mines/` (via the 8 increments),
covering the 25 ACs (see the evidence table), plus the two-process determinism
child and the integration-boundary test. Exact-vector floored-formula locks
(e.g. 21.09375 → 21, 56.25 → 56), saturation/clamp boundaries, fail-closed
guards, tamper detection, and input-order-independence regressions (incl. the
INC-8 reviewer HIGH-1/2 fixes: `allocatedSweeping` §10 order and `warIds`
canonical sort).

## Security and cancellation

Pure, immutable functions; no I/O/fs/shell/network; no ambient state reads; no
cancellation surface required (no long-running operations). Trust boundary is the
caller-supplied mine data, validated fail-closed on every entry point.

## Performance observations

Not collected; pure-function module with no benchmark fixture requirement
(matches the brief's scoping note).

## ADRs and dependencies

- **NEW ADR-0033** (`docs/adr/ADR-0033-c2-mine-warfare-scope-reason-codes.md`):
  scope/integration boundary, strike-deferral rationale, reason-code/constant
  policy (16 shipped incl. marker + invariant; 3 deferred), record-hash/marshal
  decisions. No new third-party dependencies (reuses `@bluewave/contracts`,
  `@bluewave/deterministic`, `@bluewave/random`, `@bluewave/events` type).
- Renumbering: the planned number was consumed by the concurrent C-2/C-1 track;
  ADR-0033 chosen (ADR-0031 = C-1 torpedo, ADR-0032 = persistence hardening).

## Known limitations and deferred requirements

1. **Golden gate at INC-8 blocked by concurrent C-1 WIP (environment, not this
   sprint).** A parallel agent edits `phase-engine`/`events`/`cross-process-test`
   (validation hardening) in the same working tree; the golden child now fails a
   strict Zod `datetime` envelope validation on a `timestamp` produced by their
   in-flight `MonthExecutor`. Mines has zero wiring into those packages (AC-22),
   and the mines determinism child independently proves byte-identical mine
   output (AC-23). This is a pre-existing/parallel red recorded per the failure
   policy — not caused by C-2 and not to be repaired here.
2. **Working tree is shared with the concurrent C-1 agent (torpedoes, desktop,
   persistence, phase-engine/events hardening).** C-2 commits were scoped
   mines-only (`git add packages/combat/src/mines/`,
   `test/mines/`, `src/simulation/run-mines-child.ts`); the tree as a whole was
   never clean during this sprint and is not expected to be until the C-1 agent
   lands its work. No C-2 file outside `mines/`(+ the child) was modified.
3. **Deferred (recorded, not fabricated):** strike resolution, phase/snapshot
   wiring, route-strike application (DESIGN-25), submarine-laid ops (C-3),
   scenario-special content, command layer, amphibious/blockade standoff
   consumption. See ADR-0033 and the SPRINT-PLAN C-2 row.
4. `individual` report-uncertainty threshold (10_000) and §4 base laying value
   (100) are authored (comment-logged), not DESIGN-35 literals; the production
   content pack is the future differentiator.

## Changed-file summary (C-2, all commits on `dev`)

- `4b5dde3` INC-1 mine types + contracts + reason codes (pre-session)
- `fc769e4` INC-2 sources + laying value + pressure increase
- `4792bad` INC-3 sweeping eligibility/values/dual-equipment/effective value
- `3ed06b8` INC-4 regional aggregation + allocation (localeCompare → codepoint)
- `…` INC-5 defensive standoff + route risk
- `398ed2b` INC-6 mine report + misidentification classifier
- `…` INC-7 decay/post-war/ownership/knowledge/clearance
- `d1ac1e2` INC-8 records/ordering/contracts rollup/determinism (+ ADR-0033, this report)

Files: `packages/combat/src/mines/{constants,model,sources,pressure-record,
laying,pressure-increase,sweeping-eligibility,sweeping-base-values,
dual-equipment,effective-sweeping,sweeping-aggregation,defensive-standoff,
route-risk,mine-report,misidentification,decay,post-war-persistence,
ownership-transitions,knowledge,clearance,records,ordering,contracts,
reasonCodes,index}.ts` + `packages/combat/src/simulation/run-mines-child.ts` +
26 test files under `packages/combat/test/mines/`. `docs/adr/ADR-0033…`,
`.ai/reports/c2-m3-mine-warfare-impl.md`, SPRINT-PLAN row, PROGRESS.
