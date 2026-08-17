# ADR-0033 (C-2): Mine-Pressure Lifecycle — Scope/Integration Boundary, Strike Deferral, and Reason-Code/Constant Policy

## Status

Accepted 2026-08-16

## Context

C-2 is the M3 (Track C) mine-warfare vertical slice of DESIGN-35
(`docs/rules/mine-warfare.md`), scoped as an engine-only, deterministic
**mine-pressure lifecycle** in `@bluewave/combat` (new `packages/combat/src/mines/`
module; INC-1..INC-8). The spec (`.scratch/c2-m3-mine-warfare/spec.md`) requires the
C-2 scope/integration boundary, the strike-resolution deferral rationale, and the
reason-code/constant policy to be recorded as an ADR (mirrors ADR-0018/0020/0029
and C-1's ADR-0031).

Two decisions dominate this sprint. First, mine **strike resolution** is split
across two candidate consuming mechanics that do not yet exist: (a) tactical
battle mine-hazard generation (§11/§17) needs a new `@bluewave/combat`
minute-advance engine stage (never built, analogous to but independent of
`resolveTorpedoes`), and (b) **strategic route-transit strike application**
(§13–15 voyage checks) needs `deployment-and-logistics.md` (DESIGN-25), which
`docs/acceptance/m1-capability-registry.md` records as `CONTENT_ONLY`/deferred
(ADR-0011) and `.ai/SPRINT-PLAN.md` still lists as unassigned. Building strike
resolution against neither consumer would invent a missing mechanic's shape — a
documented scope boundary, not a silent drop (map ticket 03).

Second, DESIGN-35 §30 is authoritative for the subsystem's reason codes, and
unlike DESIGN-40 (torpedoes) every numeric constant C-2 ships is an exact
`MUST`-level integer already inside the design document (sweeping base values
§7, dual-equipment modes §8, resistance multipliers §9, severity weights §15,
standoff thresholds/effects §16, decay retentions §21). No primary-source
grounding pass was required (`docs/research/c2-m3-mine-warfare.md`).

The planned ADR number "ADR-0029" was already consumed (desktop debug-mode gate);
the C-2 ADR is numbered ADR-0033 (ADR-0032 used by the concurrent persistence
hardening). Renumbering recorded once here.

## Decision

1. **Scope/integration boundary.** C-2 ships pure, deterministic functions in
   `packages/combat/src/mines/`: `AreaMinePressureRecord` (§1), `MineTypeDefinition`
   (§2), mine sources (§3), laying value (§4), pressure increase/reinforcement (§5),
   minesweeping eligibility/base values/dual equipment/effective value (§6–9),
   regional aggregation + §10 allocation, defensive-standoff **value** (§16),
   route-risk **value** (§13), mine report (§19), underwater-explosion
   misidentification classifier (§20), decay (§21), post-war persistence (§22),
   ownership/control dispositions (§23), knowledge (§24), clearance (§27), and the
   §28 resolution record + §29 canonical ordering + in-slice §30 codes. **No**
   phase-engine registration, **no** `CampaignSnapshot` schema change, **no**
   `@bluewave/combat` minute-advance engine stage, **no** `BattleResolver`/
   `StrengthCalculator` modification. Phase/snapshot wiring is deferred to a later
   C-2 continuation (mirrors the B-5 → B-6 weather sequencing and C-1's ADR-0031
   boundary). Goldens unchanged (verified 10/10 at the INC-2..INC-7 gates; the
   INC-8 gate's golden run is blocked by a concurrent C-1 work-in-progress that
   edits `phase-engine`/`events`/`cross-process-test` in the same working tree —
   those are the C-1 agent's files, not changed by C-2, and the mines
   determinism child (AC-23) proves byte-identical mine output independently).
   The AC-22 integration-boundary test proves zero imports of
   phase-engine/snapshot/minute-advance from `mines/`.

2. **Strike-resolution deferral (C-2 continuation).** Mine-strike resolution
   (§11 battle-hazard generation, §14–15 battle + route-transit strike
   eligibility/outcome, §17 `BattleMineHazard`, §18 damage/loss application,
   §25–26 friendly-fire risk) is owned by the C-2 continuation. The §28
   resolution record ships the deferred sub-collections
   (`battleAndRouteProbabilities.battle`, `strikeDecisionsAndOutcomes`,
   `friendlyFireChecks`) as **explicitly-typed, explicitly-empty** arrays so the
   continuation populates them without a breaking type change; a non-empty value
   fails closed with `MINE_WARFARE_INVARIANT_FAILED`. Route-risk (§13) ships as a
   pure value (`routeRiskBp`) with **no movement-blocking/consuming behavior**
   (Section 13 explicitly says a route-risk check does not auto-deny movement;
   the consuming mechanic is DESIGN-25). `MINE_STRIKE_RESOLUTION_DEFERRED` is a
   shipped but never-fired **non-§30** marker (mirrors C-1's
   `TORPEDO_ELIGIBILITY_PREDICATE_DEFERRED`) for would-be-strike boundaries.

3. **Reason-code/constant policy.** `mines/reasonCodes.ts` ships exactly
   **16** codes: 15 of DESIGN-35 §30's 18 (14 direct/value codes +
   `MINE_WARFARE_INVARIANT_FAILED` formalized into the shipped map) plus the
   non-§30 marker. The three §30 strike codes (`MINE_BATTLE_HAZARD_GENERATED`,
   `MINE_STRIKE_OCCURRED`, `FRIENDLY_MINE_STRIKE_OCCURRED`) are **deferred** to
   the C-2 continuation and MUST NOT be shipped until strike resolution lands.
   `reason-codes-mines.test.ts` enforces set-equality against §30 + the existing
   combat catalog and fails on silent addition or collision. Every new constant
   ships as a versioned `*_v1` contract (`mine_pressure_v1`, `mine_sweeping_v1`,
   `dual_asw_mine_equipment_v1`, `mine_defensive_standoff_v1`,
   `underwater_explosion_identification_v1`, `mine_decay_v1`,
   `mine_type_definitions_v1`, `mine_warfare_resolution_v1`) with a
   `SHIPPED_*_CONTRACT` + fail-closed `validate*Contract` guard and a
   `validateAllMineContracts()` registry rollup (INC-8).

4. **Record hash / marshal decisions.** The §28 `MineWarfareResolutionRecord`
   hash is a domain-separated canonical envelope
   (`createEnvelope("mine_warfare_resolution", "mine_warfare_resolution_v1", …)`)
   over the non-hash surface; every collection is canonically sorted inside the
   assembler by §29's ordering (codepoint comparators only — never
   `localeCompare`), so DB/UI/wall-clock/insertion order cannot affect the hash.
   Two concrete §29 points are enforced by regression tests: `warIds` inside each
   area context sort canonically; `allocatedSweeping` keeps the **§10 five-key
   order** (not minePressureId order). `mine_decay_v1` is a pinned view over the
   `model.ts` `decayPolicy` carrier (the §21 values' single source of truth)
   rather than a second copy of the retention table. Authored (not DESIGN-35
   literal) constants are comment-logged only: the report-certain threshold
   (`MINE_REPORT_CAUSE_CERTAIN_CONFIDENCE_BP = 10_000`) and the §4 base laying
   value (uniform `100` BALANCE TARGET); neither changes authoritative gameplay,
   and the production content pack is the future differentiator.

## Alternatives considered

- **Splitting the sprint to include route-strike application** was rejected:
  the consuming mechanic (DESIGN-25 deployment/logistics) is unassigned and
  deferred `CONTENT_ONLY`; building it now would mean inventing its shape or
  building it twice.
- **Shipping per-mine-type modelled content** (named historical mines, like
  torpedo models) was rejected: DESIGN-35 defines categories, not a catalogue;
  specific minelayer content belongs to the production content pack track.
- **Writing the record with `undefined` for deferred fields** was rejected in
  favour of explicitly-typed empty arrays (stable, never-`undefined` surface).

## Consequences

- A later C-2 continuation sprint can add the `mine_warfare_generation` phase,
  `AreaMinePressureRecord[]` on the snapshot, and the tactical battle-hazard
  stage with stable §28 fields to populate.
- The reason-code partition is enforced by test; adding a code requires
  deliberate review (the deferred strike codes remain owned by the continuation).
- The route-risk value is available as an authoritative input once DESIGN-25
  lands; INC-4's §10 `recordRiskPriority` accessor is already wired to it via
  `routeRiskBpToAllocationPriority` (default `DEFAULT_STRIKE_RISK_PRIORITY`
  documented, no fabricated value).