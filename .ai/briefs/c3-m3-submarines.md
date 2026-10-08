# Milestone C-3: M3 Strategic Submarine-Operations Lifecycle (Advanced Surface Warfare)

## Objective

A deterministic, engine-only **strategic submarine-operations lifecycle** function
set in a new `packages/combat/src/submarines/` module (`@bluewave/combat`) that
models strategic representation (persistent unit vs flotilla pool), submarine type
definitions, policies (target weights summing to 10_000), mission eligibility,
reliability, base-proximity bands, type remote-efficiency multipliers, long-range
ASW vulnerability, strategic mission effectiveness (one FLOOR), coastal range
restriction, sea-state profile (scale + detection/observation/attack/surface-
snorkel multipliers), heavy-ship screening balance, strategic attack-opportunity
**selection** (value/keyed-decision only, no loss application), submarine-laid
mine laying (produces `AreaMinePressureRecord` via C-2's mine model + consumes
inventory), records, canonical ordering, and reason codes — the complete
DESIGN-34 strategic layer **except tactical allocation/loss, post-battle
returning-ship interception, ASW resolution application, friendly-fire
risk/outcome, and strategic attack loss application**, which are explicitly
deferred pending a not-yet-built battle/attack machinery or DESIGN-29
(intelligence) acceptance. No campaign snapshot schema change; no phase-engine
wiring; goldens 10/10 unchanged.

## Canonical requirements

DESIGN-34 §§1, 4–20 (opportunity selection value-only), 23 (value-only), 25–27
(records/ordering/reason codes), and the §28 validation items pertaining to this
slice; DESIGN-14 (AreaMinePressureRecord — produced by §20 via C-2's mine model);
DESIGN-29 (intelligence — blocks ASW/friendly-fire application, unassigned);
DESIGN-07 (integer arithmetic); DESIGN-55 §4 (`docs/delivery/release-scope-and-implementation-order.md` — M3 scope).

## Starting state

Verified baseline (2026-08-16): M2 COMPLETED (B-6 gate, 2026-08-15). C-1
(torpedoes) COMPLETE, C-2 (mines) COMPLETE. `@bluewave/combat` has the B-2
minute-advance engine, B-3 gunnery, B-4 damage pipeline, B-5 weather stage
(incl. `generateStrategicWeather` precedent), B-6 `resolveBattleAuto`, C-1
torpedo stage, and C-2 `mines/` module (with `AreaMinePressureRecord` + the
`SUBMARINE_LAID` mine type). Versioned `*_v1` contracts + validate guards;
per-module reason-code catalogs with set-equality tests; two-process determinism
children. `BattleResolver`/`StrengthCalculator` unmodified.

**Concurrency note:** the shared tree has concurrent-session in-flight work in
`packages/random/`, `packages/phase-engine/` tests, and the desktop-e2e harness
draft. This milestone's implementation must write only NEW files under
`packages/combat/src/submarines/` + `packages/combat/test/submarines/` (+ the
cross-process child + ADR + docs) and must NOT modify `mines/`, `torpedoes/`,
`weather/`, `phase-engine/`, `random/`, or the desktop-e2e harness.

## In scope

- `SubmarineStrategicAsset` (§1) + representation rule + `INVALID_SUBMARINE_REPRESENTATION`.
- `SubmarineTypeDefinition` (§4, five canonical types) + `MISSILE`→`PERSISTENT_UNIT` mapping.
- Policies (§5, three policies, weights sum to 10_000).
- Mission eligibility (§6, seven missions) + reliability (§7, 0..100 + multiplier table).
- Base proximity bands (§8) + remote-efficiency multipliers (§9).
- Long-range ASW vulnerability (§10, 10_000..12_500 bp).
- Strategic mission effectiveness (§11, one FLOOR) + coastal range restriction (§12).
- Sea-state profile (§13–17) + §16 fail-closed guard + §17 predicate.
- Screening balance (§18) + attack-opportunity **selection** value-only (§19).
- Submarine-laid mine laying → `AreaMinePressureRecord` + inventory consumption (§20).
- Friendly-identification base probability value-only (§23).
- Records (§25) + canonical ordering (§26) + reason codes (§27, all 14) + versioned contracts.

## Out of scope (deferred)

- Tactical allocation + loss application (§2–3) — battle-integration slice.
- Post-battle returning-ship interception (§21) — battle-attack machinery.
- ASW resolution application (§22) — DESIGN-29 intelligence, unassigned.
- Friendly-fire risk/outcome (§23–24) — DESIGN-29 + ASW contacts.
- Strategic attack loss application (§19) — owning battle/attack resolver.
- Mine-strike resolution — C-2 continuation.
- Phase-engine/campaign-snapshot wiring — deferred, mirrors B-5→B-6.
- Command-layer submarine mission/policy orders — later command/AI slice.
- Missile-payload mechanics — E-track (M5).

## Required implementation

Pure functions (explicit inputs → explicit outputs, no ambient state reads, no
I/O) mirroring the C-2 `mines/` module shape: representation validation,
type-definition table, policy-weight table, mission-eligibility predicate,
reliability multiplier, proximity classifier, remote-efficiency lookup, long-range
ASW-vulnerability lookup + range guard, effectiveness formula (one FLOOR), coastal
restriction predicate, sea-state scale + multiplier lookups + §17 predicate, screen
ratio formula + opportunity table, keyed attack-opportunity selection
(`submarine/month/war/area/attack_opportunity`), mine-laying (→ C-2
`AreaMinePressureRecord` + inventory consumption), friendly-identification value
function, and the monthly `SubmarineOperationsRecord` assembler with §26 canonical
ordering. Every formula uses integer/basis-point arithmetic with explicit `FLOOR`
rounding per DESIGN-07. Every new constant ships as a versioned `*_v1` contract
with a `SHIPPED_*_CONTRACT` + `validate*Contract` fail-closed guard. Reason codes
ship via a new `submarines/reasonCodes.ts` with a set-equality partition test
against DESIGN-34 §27.

## Acceptance tests

22 ACs total (AC-1..AC-22) — see `.scratch/c3-m3-submarines/spec.md` §1.1.
Includes unit tests per function, an integration-boundary test proving zero
coupling to `phase-engine`/`CampaignSnapshot`/the minute-advance engine and zero
modification of `mines/`/`torpedoes/`/`weather/`, a reason-code set-equality test,
a contracts/validate-guard test, and two-process determinism via a new
`run-submarines-child.ts`.

## Determinism proof

Two separate child-process spawns (byte-compared) of `run-submarines-child.ts`
producing identical canonical-serialized output for identical inputs; only keyed
`submarine/...` RNG streams used (attack-opportunity, friendly-identification);
`verify-golden-hashes.cjs` 10/10 unchanged (no snapshot/phase touched, so no
authoritative hash can move).

## Compatibility and versions

No save/snapshot format change. No new phase in `phase-engine`. New versioned
constants: `submarine_strategic_asset_v1`, `submarine_types_v1`,
`submarine_policies_v1`, `submarine_missions_v1`, `submarine_reliability_v1`,
`submarine_proximity_v1`, `submarine_remote_efficiency_v1`,
`submarine_long_range_asw_vulnerability_v1`, `submarine_effectiveness_v1`,
`submarine_sea_state_v1`, `submarine_screening_balance_v1`,
`submarine_attack_opportunity_v1`, `submarine_mine_laying_v1`,
`submarine_friendly_identification_v1`. New reason codes per §1.4 of the spec. No
command or event contract changes (no command layer ships this sprint).

## Performance observations

Not applicable at this scoping stage; no benchmark fixtures required for a
pure-function lifecycle module of this size (comparable to C-2's `mines/`).
Record any material perf finding during implementation, not as an authoritative
gate.

## Stop conditions

In addition to the permanent `.ai/AUTONOMOUS-AGENT.md` rules:

- If DESIGN-29 (intelligence) or DESIGN-25 (deployment/logistics) is accepted
  mid-sprint, do NOT opportunistically expand this sprint to include ASW /
  friendly-fire / returning-ship application — those remain separate
  battle-integration/DESIGN-29-scoped decisions, to avoid scope creep inside an
  already-running sprint.
- If any formula in DESIGN-34 §5/§7/§9–11/§13–18/§23 cannot be implemented as
  written with exact integer arithmetic (i.e. genuinely requires a rounding or
  ordering choice DESIGN-34 doesn't specify), stop and write a decision request
  rather than guessing — none were found during scoping, but implementation may
  surface edge cases the scoping pass missed.
- Do not modify `packages/combat/src/torpedoes/`, `packages/combat/src/mines/`,
  `packages/combat/src/weather/`, `packages/phase-engine/`, `packages/random/`,
  or the desktop-e2e harness — concurrent sessions own those in the shared tree.
  `mines/` may be _read_ for the `AreaMinePressureRecord` type only.

## Required delivery

- code and tests (`packages/combat/src/submarines/`, `packages/combat/test/submarines/`);
- traceability updates (SPRINT-PLAN C-3 row, PROGRESS.md);
- ADR(s) for the scope/integration boundary + tactical/ASW/friendly-fire/loss
  deferral + reason-code/constant policy (mirrors ADR-0018/0020/0029/0031/0033);
- validation report (`.ai/reports/c3-m3-submarines-impl.md`);
- changed-file summary;
- small Conventional Commits on `dev`;
- pull-request description when available;
- clean working tree.
