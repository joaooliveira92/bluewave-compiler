# Milestone C-2: M3 Mine-Pressure Lifecycle (Advanced Surface Warfare)

## Objective

A deterministic, engine-only **mine-pressure lifecycle** function set in a new
`packages/combat/src/mines/` module (`@bluewave/combat`) that models
`AreaMinePressureRecord` laying, reinforcement, minesweeping (eligibility,
values, dual-purpose ASW/mine equipment, regional aggregation, allocation),
defensive-standoff and strategic-route-risk value computation, mine reporting,
mine/torpedo misidentification, monthly decay, post-war persistence,
ownership/control-change dispositions, mine knowledge, and clearance — the
complete DESIGN-35 lifecycle **except mine-strike resolution**, which is
explicitly deferred pending a not-yet-built tactical engine stage and/or
DESIGN-25 (deployment/logistics) acceptance. No campaign snapshot schema
change; no phase-engine wiring; goldens 10/10 unchanged.

## Canonical requirements

DESIGN-35 §§1–10, §13 (value only), §16 (value only), §19–24, §27–30 (mine-
pressure-lifecycle slice); DESIGN-38 §3 step 9 (confirms mines have a tactical
substep, deferred here); DESIGN-25 (deployment-and-logistics — blocks route-
strike application, unassigned); DESIGN-07 (integer arithmetic); DESIGN-55 §4
(`docs/delivery/release-scope-and-implementation-order.md` — M3 scope).

## Starting state

Verified baseline (2026-08-16): M2 COMPLETED (B-6 gate, 2026-08-15). C-1
(torpedoes) scoping DONE, C-1-IMPL in flight on a separate worktree — this
milestone's implementation must not touch `packages/combat/src/torpedoes/` or
`packages/combat/test/torpedo/`. `@bluewave/combat` has the B-2 minute-advance
engine, B-3 gunnery stage, B-4 damage pipeline, B-5 weather stage (including the
`generateStrategicWeather` precedent for strategic/monthly logic living in
`@bluewave/combat`), B-6 `resolveBattleAuto`; versioned `*_v1` contracts +
validate guards; per-module reason-code catalogs with set-equality tests;
two-process determinism children. `BattleResolver`/`StrengthCalculator`
unmodified.

## In scope

- `MineTypeDefinition` (§2, six canonical types) + mine sources (§3).
- Mine-laying value (§4) + pressure increase/reinforcement (§5).
- Minesweeping eligibility (§6) + base values (§7) + dual ASW/mine equipment
  (§8) + effective sweeping value (§9) + regional aggregation/allocation (§10).
- Defensive standoff (§16) — value computation only, no consumer wired.
- Strategic route risk (§13) — value computation only, no consumer wired.
- Mine report (§19) + mine/torpedo misidentification classifier (§20).
- Mine decay (§21) + post-war persistence (§22) + ownership/control-change
  dispositions (§23) + mine knowledge (§24) + clearance (§27).
- Records (§28) + canonical ordering (§29) + reason codes (§30, in-slice
  subset) + versioned contracts.

## Out of scope (deferred)

- Tactical battle-mine hazard generation + `BattleMineHazard` + battle
  mine-strike resolution (§11, §17–18, in-battle §14–15) — C-2 continuation
  (new engine stage).
- Strategic route-transit mine-strike application (§14–15 for routes) —
  blocked on DESIGN-25 acceptance (unassigned).
- Friendly-fire risk/outcome (§25–26) — deferred alongside strike resolution.
- Phase-engine/campaign-snapshot wiring — deferred, mirrors B-5→B-6 sequencing.
- Submarine-laid mine operational mechanics (C-3), scenario-special mine
  content (content track), command-layer mine-laying orders (later command
  slice), amphibious/blockade consumption of standoff (DESIGN-36 unassigned,
  DESIGN-32 basic-only).

## Required implementation

Pure functions (explicit inputs → explicit outputs, no ambient state reads,
no I/O) mirroring the shape of `resolveGunnery`/`resolveTorpedoes` but with NO
minute-advance engine-stage wiring: mine-type/source validation, laying-value
formula, pressure-increase formula, sweeping eligibility predicate,
base-value table lookup, dual-equipment mode resolution, effective-sweeping-
value formula, regional aggregation + allocation ordering, standoff-level
formula, route-risk formula, report/misidentification classifier (keyed RNG
stream `mine_warfare/report/underwater_explosion`), decay formula,
persistence/disposition validators, knowledge-assertion builders, clearance
predicate, and the monthly `MineWarfareResolutionRecord` assembler with §29
canonical ordering. Every formula uses integer/basis-point arithmetic with
explicit `FLOOR` rounding per DESIGN-07. Every new constant ships as a
versioned `*_v1` contract with a `SHIPPED_*_CONTRACT` + `validate*Contract`
fail-closed guard. Reason codes ship via a new `mines/reasonCodes.ts` with a
set-equality partition test against DESIGN-35 §30.

## Acceptance tests

25 ACs total (AC-1..AC-25) — see `.scratch/c2-m3-mine-warfare/spec.md` §1.1.
Includes unit tests per function, an integration-boundary test proving zero
coupling to `phase-engine`/`CampaignSnapshot`/the minute-advance engine, a
reason-code set-equality test, a contracts/validate-guard test, and two-process
determinism via a new `run-mines-child.ts`.

## Determinism proof

Two separate child-process spawns (byte-compared) of `run-mines-child.ts`
producing identical canonical-serialized output for identical inputs; only
keyed `mine_warfare/...` RNG streams used (misidentification classifier);
`verify-golden-hashes.cjs` 10/10 unchanged (no snapshot/phase touched, so no
authoritative hash can move).

## Compatibility and versions

No save/snapshot format change. No new phase in `phase-engine`. New versioned
constants: `mine_pressure_v1`, `mine_sweeping_v1`, `dual_asw_mine_equipment_v1`,
`mine_defensive_standoff_v1`, `underwater_explosion_identification_v1`,
`mine_decay_v1`, `mine_type_definitions_v1`. New reason codes per §1.4 of the
spec. No command or event contract changes (no command layer ships this
sprint).

## Performance observations

Not applicable at this scoping stage; no benchmark fixtures required for a
pure-function lifecycle module of this size (comparable to B-4's damage-
formula modules). Record any material perf finding during implementation, not
as an authoritative gate.

## Stop conditions

In addition to the permanent `.ai/AUTONOMOUS-AGENT.md` rules:

- If DESIGN-25 (deployment/logistics) is accepted mid-sprint, do NOT
  opportunistically expand this sprint to include route-strike application —
  that remains a separate C-2-continuation-scoped decision, to avoid scope
  creep inside an already-running sprint.
- If any formula in DESIGN-35 §4–10/§13/§16/§20–21 cannot be implemented as
  written with exact integer arithmetic (i.e. genuinely requires a rounding or
  ordering choice DESIGN-35 doesn't specify), stop and write a decision
  request rather than guessing — none were found during scoping, but
  implementation may surface edge cases the scoping pass missed.
- Do not touch `packages/combat/src/torpedoes/`, `packages/combat/test/torpedo/`,
  or `.scratch/c1-m3-torpedoes/` — C-1-IMPL owns those concurrently.

## Required delivery

- code and tests (`packages/combat/src/mines/`, `packages/combat/test/mines/`);
- traceability updates (SPRINT-PLAN C-2 row, PROGRESS.md);
- ADR(s) for the scope/integration boundary + strike-resolution deferral +
  reason-code/constant policy (mirrors ADR-0018/0020/0029);
- validation report (`.ai/reports/c2-m3-mine-warfare-impl.md`);
- changed-file summary;
- small Conventional Commits on `dev`;
- pull-request description when available;
- clean working tree.
