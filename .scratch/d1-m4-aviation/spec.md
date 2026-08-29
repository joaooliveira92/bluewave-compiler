# D-1 Spec — M4 Aviation: Aircraft Development, Squadrons, and Basing

- **Sprint:** D-1 (`.ai/SPRINT-PLAN.md` Track D row 1)
- **Kind:** implementation (this spec is the output of the D-1 scoping sprint; D-1-IMPL executes it)
- **Governing docs:** DESIGN-43 (`docs/rules/aircraft.md`) — **§§1-21, §§32-41** (aircraft types, model definitions, development pipeline, proposals, private ventures, inventory states, squadron lifecycle, auto-equip, re-equipment, expansion, basing capacity, damaged dispositions, basing classes, inventory allocation, records, ordering, reason codes, validation); cross-refs DESIGN-38 (records/ordering), DESIGN-07 (integer arithmetic), DESIGN-55 §5 (M4 depends on accepted M1+M2+M3).
- **Baseline:** C-6 (M3 acceptance gate) DONE (2026-08-29, PASS). M1+M2+M3 completed. `@bluewave/combat` has mature module patterns (smoke, torpedoes, submarines, mines, coastal-defense) at `packages/combat/src/<module>/`. `BattleResolver`/`StrengthCalculator` unmodified. 14-phase pipeline in `@bluewave/phase-engine`.
- **Target:** aircraft development pipeline, squadron lifecycle, and basing system as pure deterministic functions in `@bluewave/combat/src/aircraft/`, plus a new `resolve_aircraft_development` phase stage (order 7.2, rngAllowed: true) in the campaign phase pipeline. No carrier operations (D-2), no air defense (D-4), no tactical battle engagement wiring.
- **Delivery contract:** ENGINEERING-CONTRACT.md binding. Goldens will regenerate when the new phase stage wires in (ADR-0007 process). `BattleResolver`/`StrengthCalculator` unmodified.

---

## 1. Scope

D-1 delivers a deterministic, pure **aircraft development pipeline, squadron lifecycle, and basing system** as an `aircraft/` module under `@bluewave/combat`, plus a new `resolve_aircraft_development` phase stage (order 7.2, after `resolve_research` and before `battle_generation`) in the monthly pipeline. Aircraft state lives under `NationState.aircraft` — a new field following the existing pattern of `fleets`, `research`, `divisions`. No carrier operations, no air defense, no tactical battle engagement, no experience/fatigue binding (DESIGN-28).

### 1.1 Acceptance criteria (mapped to requirement IDs + tests)

| AC | Requirement (DESIGN-43 + contract) | Proving test |
|----|-------------------------------------|--------------|
| AC-1 | **Aircraft type enum** — 12 canonical types (`FIGHTER`, `TORPEDO_BOMBER`, `DIVE_BOMBER`, `MEDIUM_BOMBER`, `PATROL_AIRCRAFT`, `FLOATPLANE_SCOUT`, `AIRSHIP`, `LIGHT_JET_FIGHTER`, `HEAVY_JET_FIGHTER`, `JET_ATTACK_AIRCRAFT`, `HELICOPTER`, `SPECIAL_SQUADRON`) as a closed enum; an unrecognised type fails with `INVALID_AIRCRAFT_MODEL_DEFINITION`. (§1) | `aircraft/model.test.ts` |
| AC-2 | **AircraftModelDefinition** — immutable definition with all §2 fields, scores 0-100, integer fixed-point payload/range/cost/work; `aircraftModelId` is a stable authored string; missing data fails with `INVALID_AIRCRAFT_MODEL_DEFINITION`. (§2) | `aircraft/model.test.ts` |
| AC-3 | **Aircraft state under NationState** — aircraft inventory (count per model+condition), development projects, squadron assignments, basing allocation live under `NationState.aircraft`; the field is typed `AircraftNationState` and mirrors `ResearchState`, `FleetState[]` pattern. (§3) | `aircraft/state.test.ts` |
| AC-4 | **Inventory counts** — flat count per model+condition (not per-aircraft tracking); 9 inventory states (§13); an aircraft MUST NOT exist in two states simultaneously; counts are non-negative integers; invariant enforced via `AIRCRAFT_STATE_INVARIANT_FAILED`. (§3, §13) | `aircraft/inventory.test.ts` |
| AC-5 | **Development request** — `RequestAircraftProposalCommand` with exactly one role, two distinct emphasised traits, basing class, nation, expected tech hash, policy version, idempotency key; duplicate traits → `AIRCRAFT_DEVELOPMENT_TRAITS_NOT_DISTINCT`. (§4) | `aircraft/development-request.test.ts` |
| AC-6 | **One active proposal** — at most one player-requested proposal in `REQUESTED`/`DEVELOPING`/`READY_FOR_REVIEW` status; second → `AIRCRAFT_PROPOSAL_ALREADY_ACTIVE`. Private ventures have separate limit of 3 unexpired. (§5) | `aircraft/proposal-slot.test.ts` |
| AC-7 | **DevelopmentProject** — immutable project with all §6 fields, status progression (`REQUESTED`→`DEVELOPING`→`DELAYED`→`READY_FOR_REVIEW`→`ACCEPTED`/`REJECTED`/`CANCELLED`), project hash. (§6) | `aircraft/development-project.test.ts` |
| AC-8 | **Development duration** — authored `aircraft_development_duration_v1` constants: base 4 paid months, range 3-6, modifiers for complexity/technology/industry; `clamp(3,6,4+modifiers)`. (§7) | `aircraft/development-duration.test.ts` |
| AC-9 | **Deterministic proposal generation** — keyed RNG stream `aircraft/development/nation/<role>/proposal`; generated once when final paid month completes; identical inputs → identical proposal + model; never rerolled. (§8) | `aircraft/proposal-generation.test.ts` |
| AC-10 | **Proposal attribute allocation** — start from role baseline vector; +10 per emphasised trait; -10 total via deterministic weighted trade-off; no attribute below role min or above 100; technology/traits/industry apply explicit integer modifiers. (§9) | `aircraft/attribute-allocation.test.ts` |
| AC-11 | **AircraftProposal** — immutable proposal with all §10 fields, expiry month, proposal hash; acceptance creates immutable model + production eligibility (no inventory). (§10) | `aircraft/proposal.test.ts` |
| AC-12 | **Private ventures** — via typed event `private_aircraft_venture_v1`; eligibility predicates (§11); cooldown 12 months; max 3 unexpired; stream `event/month/nation/private_aircraft_venture`; purchase via `PurchasePrivateAircraftProposalCommand`. (§11-12) | `aircraft/private-venture.test.ts` |
| AC-13 | **SquadronState** — immutable state with all §14 fields, squadron experience 0-100, state hash. (§14) | `aircraft/squadron.test.ts` |
| AC-14 | **Auto-equip eligibility** — `AutoEquipSquadronCommand` (issuer `SYSTEM_AUTOMATION`) with all §15 eligibility predicates; no aircraft creation, no damaged inventory use, no unaccepted proposals. (§15) | `aircraft/auto-equip.test.ts` |
| AC-15 | **Deterministic auto-equip selection** — ordered by §16 criteria (desc role-fit, desc generation month, asc burden, asc model id); first model with ≥7500bp of strength selected; no randomness consumed. (§16) | `aircraft/auto-equip-selection.test.ts` |
| AC-16 | **Re-equipment** — `ReequipSquadronCommand`; reserves aircraft+basing+pilot+training+cost; duration 2 paid months; squadron unavailable during re-equipment. (§17) | `aircraft/reequipment.test.ts` |
| AC-17 | **Re-equipment experience penalty** — -10 points base, additional -5 for family change; 8000bp readiness multiplier for 3 months; clamp 0-100. (§18) | `aircraft/reequipment-penalty.test.ts` |
| AC-18 | **Squadron expansion** — expansion ratio formula (§19); penalty bands -5/ -10/ -20; same-month commands aggregate before band selection. (§19) | `aircraft/expansion.test.ts` |
| AC-19 | **Basing capacity** — every operational/assigned/damaged/reserved aircraft consumes one physical slot; squadron must not exceed host capacity; damaged aircraft consume capacity until removed. (§20) | `aircraft/basing.test.ts` |
| AC-20 | **Damaged aircraft disposition** — `REPAIR_LOCALLY`, `AWAIT_REPAIR_CAPACITY`, `TRANSFER_FOR_REPAIR`, `WRITE_OFF`, `CANNIBALIZE`, `CAPTURED`, `LOST`; cannibalization removes aircraft from inventory + creates spare parts; damage never clears on month transition. (§21) | `aircraft/damaged-disposition.test.ts` |
| AC-21 | **Basing classes** — 6-class enum (`LAND_BASED`, `CARRIER_BASED`, `SEAPLANE_SUPPORTED`, `AIRSHIP_BASED`, `HELICOPTER_DECK_BASED`, `SPECIAL_EXPLICIT`); host must support class + have capacity. (§32) | `aircraft/basing-classes.test.ts` |
| AC-22 | **Inventory allocation** — deterministic §35 priority (battle squadrons → carrier air groups → patrol → replacement → re-equipment → expansion → training); equal-priority ordered by squadron+demand id; no randomness. (§35) | `aircraft/inventory-allocation.test.ts` |
| AC-23 | **Records + ordering** — every operation creates immutable records (§38); canonical ordering per §39 (nation→project→proposal→model→inventory→squadron→demand→basing→mission). (§38-39) | `aircraft/records.test.ts`, `aircraft/ordering.test.ts` |
| AC-24 | **Reason-code set-equality** — this slice ships exactly the DESIGN-43 §40 codes relevant to the slice (see §1.4) plus markers for deferred codes; set-equality guard prevents silent additions. (§40) | `aircraft/reason-codes-rollup.test.ts` |
| AC-25 | **Phase wiring** — new `resolve_aircraft_development` phase (order 7.2, rngAllowed: true) executes `resolveAircraftDevelopment` per nation; strict no-op when no nation has aviation tech; goldens regenerate under ADR-0007. | `campaign-engine/phase-wiring.test.ts` + orchestrator gate |
| AC-26 | **Contracts + validate guards** — every new aircraft constant ships `*_v1` + `SHIPPED_AIRCRAFT_CONTRACT` + validate guard; fail-closed validation. | `aircraft/contracts.test.ts` |
| AC-27 | **Two-process determinism** — identical state+inputs produce identical hashes and records; verified by two child processes (byte-compared). | `cross-process-test/run-aircraft-child` |
| AC-28 | **`BattleResolver`/`StrengthCalculator` unmodified** — verified by diff; integration-boundary test proves zero wiring. | orchestrator gate |

### 1.2 In scope

1. **Aircraft model + type definitions** (INC-1): 12-type enum, `AircraftModelDefinition` with all §2 fields, scores 0-100, fixed-point units, `*_v1` contract, `INVALID_AIRCRAFT_MODEL_DEFINITION`.
2. **Aircraft state model** (INC-2): `AircraftNationState` interface under `NationState.aircraft`, inventory counts per model+condition (9 states), `AircraftDevelopmentProject`, `AircraftProposal`, `SquadronState`, `BasingSlot` types; `*_v1` contracts + validation guards.
3. **Development pipeline** (INC-3): `RequestAircraftProposalCommand`, one-active-proposal slot, `AircraftDevelopmentProject` lifecycle, development duration (`aircraft_development_duration_v1` with base 4/range 3-6), proposal generation (keyed RNG stream), attribute allocation (role baseline +10 per trait -10 trade-off), `AircraftProposal` creation, acceptance/rejection.
4. **Private ventures** (INC-4): typed event `private_aircraft_venture_v1`, 12-month cooldown, max 3 unexpired, `PurchasePrivateAircraftProposalCommand`, 12-month expiry.
5. **Squadron lifecycle** (INC-5): `SquadronState`, auto-equip eligibility + deterministic selection, re-equipment (2-month duration + experience penalty), expansion (ratio bands + penalties), inventory allocation per §35 priority.
6. **Basing + damaged disposition** (INC-6): 6 basing classes, per-slot capacity tracking, 7 damaged dispositions, cannibalization, capacity invariant.
7. **Phase stage + engine wiring** (INC-7): `resolve_aircraft_development` phase (order 7.2), `resolveAircraftDevelopment` per-nation function, strict no-op contract, goldens regenerate under ADR-0007.
8. **Records, ordering, reason codes** (INC-8): §38 records, §39 canonical ordering, §40 reason codes (shipped + markers), set-equality guard.
9. **Contracts rollup + ADR** (INC-9): all `*_v1` contracts, `SHIPPED_AIRCRAFT_CONTRACT` rollup, validate guards, ADR for scope/integration boundary + constants policy.

### 1.3 Out of scope (deferred)

- **Mission-role feasibility engine** (§§22-31): which roles each type can perform, launch/recovery eligibility, weather/range/equipment predicates → D-2 or later tactical slice.
- **Experience/fatigue binding** (§36 → DESIGN-28) — DESIGN-28 unassigned.
- **Aircraft production pipeline** (§37) — industrial capacity, materials, line conversion.
- **Tactical battle engagement** — how aircraft participate in minute-advance battle loop → D-2/D-3.
- **Content YAML constants** — aircraft model definitions, basing classes → CONTENT-track.

### 1.4 Reason-code in-slice map

DESIGN-43 §40 lists 21 required reason codes. D-1 ships 15 + 1 marker; 6 deferred.

**Shipped (§40)**: `INVALID_AIRCRAFT_MODEL_DEFINITION`, `INVALID_AIRCRAFT_STATE`, `AIRCRAFT_DEVELOPMENT_ROLE_INVALID`, `AIRCRAFT_DEVELOPMENT_TRAITS_NOT_DISTINCT`, `AIRCRAFT_PROPOSAL_ALREADY_ACTIVE`, `AIRCRAFT_DEVELOPMENT_PAYMENT_INSUFFICIENT`, `AIRCRAFT_PRIVATE_VENTURE_INELIGIBLE`, `AIRCRAFT_PRIVATE_PROPOSAL_EXPIRED`, `AIRCRAFT_INVENTORY_INSUFFICIENT`, `SQUADRON_AUTO_EQUIP_UNAVAILABLE`, `SQUADRON_REEQUIPMENT_INELIGIBLE`, `SQUADRON_EXPANSION_INELIGIBLE`, `AIRCRAFT_BASING_CAPACITY_INSUFFICIENT`, `DAMAGED_AIRCRAFT_DISPOSITION_REQUIRED`, `AIRCRAFT_STATE_INVARIANT_FAILED`.

**Deferred (§40, marker `AIRCRAFT_MISSION_ROLE_DEFERRED`)**: `AIRCRAFT_MISSION_ROLE_INELIGIBLE`, `AIRCRAFT_MISSION_TECHNOLOGY_UNAVAILABLE`, `FLOATPLANE_LAUNCH_REQUIRES_STOPPED_SHIP`, `AIRSHIP_WEATHER_PROHIBITS_OPERATION`, `JET_CARRIER_INCOMPATIBLE`, `HELICOPTER_BASING_INCOMPATIBLE`.

### 1.5 Phase registry update

New phase entry:

| Order | Phase | RNG allowed | Notes |
|-------|-------|-------------|-------|
| 7.2 | `resolve_aircraft_development` | yes | Aircraft development pipeline per nation; strict no-op when no nation has aviation tech |

### 1.6 NationState schema change

New field on `NationState`:

```typescript
aircraft: AircraftNationState;
```

Where `AircraftNationState` contains:
- `models: Record<string, AircraftModelDefinition>` — accepted models keyed by `aircraftModelId`
- `inventory: Record<string, InventoryByCondition>` — aircraft counts per model+condition
- `developmentProjects: AircraftDevelopmentProject[]`
- `proposals: AircraftProposal[]`
- `privateProposals: AircraftProposal[]`
- `squadrons: SquadronState[]`
- `basingAllocations: BasingSlot[]`

### 1.7 Constants shipped

- `aircraft_development_duration_v1`: base 4 paid months, range 3-6, modifier constants
- `aircraft_role_baselines_v1`: per-role base attribute vectors
- `aircraft_trait_weights_v1`: trait trade-off weights
- `aircraft_basing_capacities_v1`: default basing capacities per class

---

## 2. Implementation increments (INC-1..INC-9)

| INC | Deliverable | Files | Tests |
|-----|-------------|-------|-------|
| INC-1 | Aircraft model + type definitions: enum, `AircraftModelDefinition`, `*_v1` contract, basic model validation | `aircraft/model.ts`, `aircraft/contracts.ts`, `aircraft/reasonCodes.ts` (seed) | `aircraft/model.test.ts` |
| INC-2 | Aircraft state model: `AircraftNationState`, inventory, development project, proposal, squadron, basing types + contracts + validation | `aircraft/state.ts`, `aircraft/contracts.ts`, `aircraft/inventory.ts` | `aircraft/state.test.ts`, `aircraft/inventory.test.ts` |
| INC-3 | Development pipeline: request command, proposal slot, project lifecycle, duration, proposal generation (RNG), attribute allocation, acceptance | `aircraft/development.ts`, `aircraft/proposal.ts`, `aircraft/development-duration.ts`, `aircraft/attribute-allocation.ts`, `aircraft/constants.ts` | `aircraft/development-request.test.ts`, `aircraft/proposal-slot.test.ts`, `aircraft/development-project.test.ts`, `aircraft/development-duration.test.ts`, `aircraft/proposal-generation.test.ts`, `aircraft/attribute-allocation.test.ts`, `aircraft/proposal.test.ts` |
| INC-4 | Private ventures: typed event, eligibility, cooldown, purchase, expiry | `aircraft/private-venture.ts`, `aircraft/event-types.ts` | `aircraft/private-venture.test.ts` |
| INC-5 | Squadron lifecycle + auto-equip + re-equipment + expansion + inventory allocation | `aircraft/squadron.ts`, `aircraft/auto-equip.ts`, `aircraft/reequipment.ts`, `aircraft/expansion.ts`, `aircraft/inventory-allocation.ts` | `aircraft/squadron.test.ts`, `aircraft/auto-equip.test.ts`, `aircraft/reequipment.test.ts`, `aircraft/expansion.test.ts`, `aircraft/inventory-allocation.test.ts` |
| INC-6 | Basing model + damaged disposition | `aircraft/basing.ts`, `aircraft/damaged-disposition.ts` | `aircraft/basing.test.ts`, `aircraft/damaged-disposition.test.ts` |
| INC-7 | Phase stage + engine wiring: `resolve_aircraft_development` phase, per-nation resolver, strict no-op, golden regeneration | `aircraft/engine-wiring.ts`, `aircraft/records.ts`, `aircraft/ordering.ts` | `aircraft/records.test.ts`, `aircraft/ordering.test.ts`, `aircraft/engine-wiring.test.ts`, `cross-process/run-aircraft-child.ts` |
| INC-8 | Reason codes rollup + set-equality guard + missing reason codes from earlier INCs | `aircraft/reasonCodes.ts` (full), `aircraft/contractRollup.ts` | `aircraft/reason-codes-rollup.test.ts` |
| INC-9 | Contracts rollup + ADR + traceability + full validation gate | ADR document, `.ai/reports/`, PLAN/PROGRESS update | orchestrator gate |

---

## 3. Key decisions (resolved during scoping)

| Ticket | Decision |
|--------|----------|
| 01 | **Score grounding**: Speed scores map to real aircraft (Wright Flyer ~7, SPAD S.XIII ~72) via linear formula `clamp(0,100,(realSpeed_mph-20)*0.65)`; firepower anchors at 0/25/50 for unarmed/single-twin MGs; maneuverability peaks at 60-65 (Camel, Dr.I); toughness progresses 10→60. All exact integers are BALANCE TARGET. Development duration base 4 months (range 3-6) grounded on real WWI aircraft timelines. |
| 02 | **State model**: Aircraft state lives under `NationState.aircraft` as a new `AircraftNationState` field. Inventory uses flat counts per model+condition (not per-aircraft tracking). Squadron assignments reference model by `modelId` + count. Basing uses per-host `BasingSlot` records. |
| 03 | **Scope boundary**: D-1 covers §§1-21, §§32-41 exactly per the wayfinder map. §§22-31 (mission roles) deferred to D-2. §§7-10 (development pipeline core) included because without them no aircraft can be developed. §§36-37 deferred (DESIGN-28 unassigned / production separate). |
| 04 | **Phase wiring**: New `resolve_aircraft_development` phase at order 7.2 (after `resolve_research` 7, before `battle_generation` 7.5). `rngAllowed: true`. Strict no-op when no nation has aviation technology. Golden regeneration required under ADR-0007. |
| 05 | **Reason codes**: 15 of 21 §40 codes shipped in D-1; 6 deferred behind marker `AIRCRAFT_MISSION_ROLE_DEFERRED`. Set-equality test per C-sprint pattern. |
| 06 | **Contracts**: `AircraftModelDefinition_v1`, `AircraftDevelopmentProject_v1`, `AircraftProposal_v1`, `SquadronState_v1`, `AircraftInventoryRecord_v1`, `BasingSlot_v1`, `aircraft_development_duration_v1` policy constants. |