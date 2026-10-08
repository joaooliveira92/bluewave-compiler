# D-1 (M4 Aviation) — Wayfinder Map

## Destination

A first vertical slice of M4 Aviation: the **aircraft development pipeline, squadron lifecycle, and basing system** (DESIGN-43) implemented as pure deterministic functions in `@bluewave/combat` and wired into the campaign phase pipeline — with no carrier operations (D-2), no air defense (D-4), no tactical battle engagement wiring (deferred). Deliverable: a spec + brief at `.ai/briefs/d1-m4-aviation.md`, the `.scratch/d1-m4-aviation/spec.md`, and a set of frontier-ordered implementation tickets.

## Notes

- **Domain:** DESIGN-43 (Aircraft, 768 lines). M4 Aviation's largest governing doc.
- **Scope boundary:** D-1 covers §§1-21, §§32-41 (aircraft types, model definitions, development pipeline, proposals, private ventures, inventory states, squadron lifecycle, auto-equip, re-equipment, expansion, basing capacity, damaged dispositions, records, ordering, reason codes). Excludes §§22-31 (mission roles, per-type mission eligibility) — those belong in D-2 (carrier ops integration) or a later tactical slice. Excludes §§36 (experience/fatigue binding to DESIGN-28) — DESIGN-28 is unassigned.
- **Battle integration:** deferred. D-1 produces the authoritative aircraft/squadron/basing state model and phase-stage development pipeline, but tactical battle resolution using aircraft (CAP, strikes, ASW etc.) is not wired.
- **Phase wiring:** aircraft development resolves as a new phase stage (order TBD, likely after `resolve_research` and before `battle_generation`). No snapshot schema change required if aircraft state lives under `NationState`.
- **Goldens:** likely regenerate when a new phase stage wires in (ADR-0007 process).
- **`BattleResolver`/`StrengthCalculator`:** unmodified (integration-boundary test required).
- **Existing patterns:** follow the C-track module convention (`packages/combat/src/aircraft/`, `*_v1` contracts, reason codes, integration-boundary test, two-process determinism child).
- **Key skills:** research (aircraft performance constants/grounding), to-spec, to-tickets.
- **Constants:** shipped constants per DESIGN-43 §7 (development duration), §9 (trait points), §17/§18/§19 (re-equipment/expansion penalties), §20/§21 (basing/damage rules). No YAML constants this sprint.

## Decisions so far

| Ticket | Type | Status | Decision |
|--------|------|--------|----------|
| 01 | research | **RESOLVED** | `docs/research/d1-m4-aviation-performance-baseline.md` — 295 lines, 3 tables. Score range calibration (linear speed formula, qualitative firepower/maneuverability/toughness anchors). Development duration 3-6 months grounded. Basing capacity: ~18/field, 10-26/WWI carrier. |
| 02 | task | **RESOLVED** | Aircraft state under `NationState.aircraft` (new `AircraftNationState`). Flat count per model+condition. Squadron→model via `modelId`+count. Basing via per-host `BasingSlot` records. |
| 03 | task | **RESOLVED** | D-1 covers §§1-21, §§32-41 per map. §§22-31 (mission roles) → D-2. §§36-37 → deferred. |
| 04 | task | **RESOLVED** | Phase `resolve_aircraft_development` at order 7.2 (after `resolve_research`, before `battle_generation`). `rngAllowed: true`. Strict no-op when no aviation tech. Golden regen under ADR-0007. |
| 05 | task | **RESOLVED** | 15/21 §40 codes shipped. 6 deferred behind marker `AIRCRAFT_MISSION_ROLE_DEFERRED`. Set-equality guard per C-sprint pattern. |
| 06 | task | **RESOLVED** | 7 contracts: `AircraftModelDefinition_v1`, `AircraftDevelopmentProject_v1`, `AircraftProposal_v1`, `SquadronState_v1`, `AircraftInventoryRecord_v1`, `BasingSlot_v1`, `aircraft_development_duration_v1`.

## Not yet specified

- Aircraft mission-role feasibility engine (§§22-31) — which roles each type can perform, launch/recovery eligibility per type, weather/range/equipment predicates. Likely its own decision ticket once the core aircraft model and squadron state are stable.
- Experience/fatigue binding (§36 → DESIGN-28). DESIGN-28 is unassigned; this may need a separate scoping effort.
- Production pipeline (§37) — industrial capacity, materials, line conversion. Locked content through accepted-model eligibility only for now.
- Tactical battle engagement — how aircraft participate in the minute-advance battle loop. Requires D-2/D-3 (carrier ops, CAP/strikes) or a dedicated tactical aviation sprint.
- Content YAML constants for aircraft model definitions, basing classes, etc. — CONTENT-track.

## Out of scope

- Carrier operations (D-2, DESIGN-44) — separate sprint.
- Air defense (D-4, DESIGN-45) — separate sprint.
- Mission-role resolution in tactical combat (deferred beyond D-1).
- Experience/fatigue full system (DESIGN-28, unassigned).
- Aircraft production pipeline beyond accepted-model eligibility (DESIGN-43 §37).
- Player UI for aircraft development, squadron management — desktop-track.