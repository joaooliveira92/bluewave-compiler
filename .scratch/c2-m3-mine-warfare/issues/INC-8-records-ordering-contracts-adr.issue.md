# INC-8 — Records/Ordering + Contracts Rollup + Determinism + ADR + Traceability + Gate

**Type:** implementation
**Status:** open
**Blocked by:** INC-7
**Frontier:** no

## Acceptance (spec AC-20..AC-25)

- §28 records: every monthly resolution creates one immutable
  `MineWarfareResolutionRecord` with all §28 fields (area/war contexts,
  opening pressure records, laying sources/values, sweeping ships/modes/
  values, dual-equipment reductions, allocated sweeping, pressure removed,
  battle/route probabilities [route only, this slice], strike decisions/
  outcomes [deferred — field present, empty this slice], standoff levels,
  decay, post-war/ownership dispositions, reports/knowledge changes,
  friendly-fire checks [deferred — field present, empty this slice],
  inventory/war-score/political/damage effects, RNG decisions, ruleset/
  formula versions, record hash) (`test/mines/records.test.ts`).
- §29 canonical ordering: wars by id → areas by id → mine-pressure records by
  laying-participant/type/id → laying sources by id → sweeping ships by id →
  sweep allocation per §10 → route/battle checks by target id → friendly-fire
  checks by ship id [deferred, no-op this slice] → effects by declared
  ordinal; DB/UI/wall-clock order MUST NOT affect outcomes
  (`test/mines/ordering.test.ts`).
- Integration-boundary proof: no `phase-engine` registration, no
  `CampaignSnapshot` change, no `@bluewave/combat` minute-advance stage
  touched; diff-clean against every pre-existing engine file outside
  `packages/combat/src/mines/` (`test/mines/integration-boundary.test.ts`).
- Two-process determinism: new `simulation/run-mines-child.ts` (fixed seed,
  one canonical-serialized JSON line to stdout) +
  `test/mines/determinism.test.ts` (two node-spawn child processes,
  byte-compared).
- Full `*_v1` contracts rollup (`mine_pressure_v1`, `mine_sweeping_v1`,
  `dual_asw_mine_equipment_v1`, `mine_defensive_standoff_v1`,
  `underwater_explosion_identification_v1`, `mine_decay_v1`,
  `mine_type_definitions_v1`) + `reason-codes-mines.test.ts` set-equality
  (in-slice/deferred/catalog partition against DESIGN-35 §30).
- C-2 ADR (scope/integration boundary + strike-resolution deferral rationale +
  reason-code/constant policy — mirrors ADR-0018/0020/0029). PROGRESS/
  SPRINT-PLAN traceability update. Goldens unchanged (10/10) — orchestrator
  gate.

## Hints

Mirror `run-gunnery-child.ts`/`run-torpedo-child.ts` for the child-process
harness shape. The `MineWarfareResolutionRecord` assembler is the natural
place to prove AC-20/AC-22 together: build it purely from this sprint's
already-shipped functions (INC-1..7), with the deferred strike/friendly-fire
sub-records present as explicitly-typed empty arrays (never omitted, never
`undefined`) so the C-2-continuation sprint has a stable field to populate
without a breaking type change.
