# B10b Milestone: Research + Ship Design

## Scope

### Research (aligned to DESIGN-20)

Production-ready research in the monthly phase pipeline. The existing `research_progress` phase (month.ts:533-585) is a random-draw single-project mechanic. B10b replaces it with the canonical DESIGN-20 research resolution, grounded in paid research expenditure from the B10a financial ledger.

In scope:

- **Research expenditure**: Research is funded from treasury via an explicit `researchBudget` command or proportional appropriation. Uses the same `RESEARCH_EXPENDITURE` category in the financial ledger. Extends the B10a appropriation/obligation pattern — research is a discretionary spend competing with construction.

- **Paid-research rule (DESIGN-20 §7)**: Only actual paid expenditure creates research resources. Unpaid allocation produces zero progress. `researchResourceConversionBp` is exactly `10_000` basis points.

- **15 canonical fields (DESIGN-20 §1)**: `HULL_CONSTRUCTION`, `MACHINERY`, `SHIP_DESIGN`, `GUNNERY`, `FIRE_CONTROL`, `TORPEDOES`, `SUBMARINES`, `MINES_AND_ASW`, `AVIATION`, `CARRIER_OPERATIONS`, `RADAR_AND_ELECTRONICS`, `MISSILES`, `AMPHIBIOUS_OPERATIONS`, `INFRASTRUCTURE`, `DAMAGE_CONTROL`. Every nation has exactly one priority per field.

- **Field priorities (DESIGN-20 §5)**: `HIGH` (4), `MEDIUM` (2), `LOW` (1). At least one field must be `HIGH`, at most five. Priority changes are validated commands effective next `RESOLVE_RESEARCH` phase. A command naming an exact technology MUST be rejected with `EXACT_TECHNOLOGY_SELECTION_PROHIBITED`.

- **8-stage research pipeline (DESIGN-20 §6)**: `CALCULATE_PAID_RESEARCH_RESOURCES` → `ALLOCATE_BY_FIELD_PRIORITY` → `ADVANCE_ELIGIBLE_TECHNOLOGIES` → `RESOLVE_DETERMINISTIC_DISCOVERY_SELECTION` → `APPLY_DISCOVERY` → `CREATE_IMMEDIATE_KNOWLEDGE_EFFECTS`. (Stages 2, 4, 8's adoption/production/refit branches deferred — see out of scope.)

- **Stage 3: Allocation by field priority (DESIGN-20 §9)**: Largest-remainder proportional allocation of `effectivePaidResearchResources` across eligible fields. Eligible fields have at least one undiscovered, prerequisite-satisfied, availability-reached technology.

- **Stage 5: One active candidate per field (DESIGN-20 §11.1)**: Each field has at most one active technology receiving progress. Progress never exceeds cost. When a technology is discovered, the field's active-candidate slot is released.

- **Stage 6: Deterministic discovery selection (DESIGN-20 §12)**: Weighted selection using stream `research/month/nation/field` keyed by RNG version, campaign seed, month, nation, field, candidate-set hash, and formula version. Non-discovery months (no candidate) emit `NO_ELIGIBLE_TECHNOLOGY`.

- **Stage 7: Apply discovery (DESIGN-20 §13)**: Revalidates prerequisites and availability, marks technology discovered, sets discovery month, applies `IMMEDIATE_KNOWLEDGE` effects only. No automatic adoption/production/refit.

- **Technology graph**: The existing `TechnologyPrerequisiteChainSchema` is used. A technology definition has `techId`, `researchFieldId`, `prerequisites`, `cost`, `discoveryWeight`, `availabilityMonth`. The compiler validates acyclicity in canonical topological order. Cycles fail with `TECHNOLOGY_PREREQUISITE_CYCLE`.

- **Reason codes**: Implement `INVALID_TECHNOLOGY_DEFINITION`, `INVALID_RESEARCH_STATE`, `EXACT_TECHNOLOGY_SELECTION_PROHIBITED`, `RESEARCH_PRIORITY_CONSTRAINT_VIOLATED`, `NO_ELIGIBLE_RESEARCH_FIELD`, `NO_ELIGIBLE_TECHNOLOGY`, `TECHNOLOGY_NOT_YET_AVAILABLE`, `TECHNOLOGY_PREREQUISITE_MISSING`, `TECHNOLOGY_PREREQUISITE_CYCLE`, `TECHNOLOGY_DISCOVERY_VALIDATION_FAILED`, `TECHNOLOGY_ALREADY_DISCOVERED`, `RESEARCH_STATE_INVARIANT_FAILED`.

- **Historical timing modifier (DESIGN-20 §12.2)**: Shipped basis points: `5_000` (25-60mo before), `8_000` (1-24mo before), `10_000` (canonical through 60mo after), `12_500` (60+mo after). Final campaign availability month is a hard eligibility boundary.

Explicitly out of scope for B10b (deferred):

- **Stage 2: National/education modifiers** (national traits system deferred — B10d or later).
- **Stage 4: Reallocation of exhausted-field progress** (single-field-active per nation is the MVP; reallocation deferred until multiple fields are concurrently active and one exhausts mid-month).
- **Intelligence insight** (DESIGN-20 §11.3) — B10d intelligence or later.
- **Multiple discoveries per month** (DESIGN-20 §14) — deferred; each field discovers at most one tech per month.
- **Mutual exclusion** (DESIGN-20 §18) — deferred until branch-choice techs exist in content.
- **Adoption pipeline** for doctrine, equipment, refit, installation, ammunition (DESIGN-20 §15.2-15.7) — only `IMMEDIATE_KNOWLEDGE` effects for B10b.
- **Technology variation** (DESIGN-20 §17) — DESIGN-03 campaign variation not yet implemented.
- **AI research behavior** (DESIGN-20 §19) — B10d.
- **Research resolution record** (DESIGN-20 §20) — basic record emitted, but the full 26-field record is deferred.

### Ship Design (aligned to DESIGN-21)

Production-ready ship design as a compile-time entity referenced by construction and fleet state. The existing `Ship` type carries bare `classId`, `speed`, `firepower`, `armor`, `hitPoints`. B10b formalizes this into an immutable `CompiledDesignVersion` record without the full 20-stage compilation pipeline.

In scope:

- **Design templates**: YAML-defined ship design blueprints. Each design specifies: `designId`, `nationId`, `className`, `hullType`, `displacementKg`, `speedUms`, `armorBeltUm`, `mainGuns` (caliber, count, mounts), `machineryType`, `hitPoints`, `crewComplement`. Templates are compiled into immutable `CompiledDesignVersion` records at campaign compile time.

- **CompiledDesignVersion**: An immutable record per DESIGN-21 §4 containing: `compiledDesignVersionId`, `designFamilyId`, `className`, `nationId`, `hullType`, `normalizedDisplacementKg`, `normalizedSpeedUms`, `normalizedArmorUm`, `normalizedMainGuns`, `normalizedMachineryType`, `hitPoints`, `contentVersion`, `compiledHash`. No mutable editing — a change requires a new design template.

- **DesignFamily**: A simple identity record per DESIGN-21 §5: `designFamilyId`, `nationId`, `rootCompiledDesignVersionId`, `memberDesignVersionIds`, `familyCreationMonth`. A compiled design belongs to exactly one family.

- **Ship integration**: The `Ship` interface in `NationState` gains `designVersionId` (references `CompiledDesignVersion`) and `className` (display name). The existing `classId`, `speed`, `firepower`, `armor`, `hitPoints` fields are retained but derived from the design version at construction completion.

- **Construction integration**: `ConstructionProject.targetId` gains a `designVersionId` field. When `completedWork` reaches `totalWork`, the ship is created from the design's compiled attributes. The existing `isUnderConstruction` / `constructionProgress` / `constructionTotalWork` promotion logic (B10a) is extended to populate all ship fields from the design.

- **Design presets**: The 1880 fixture includes pre-defined designs for GBR and FRA starting ships (Dreadnought-class, Invincible-class, Courbet-class). Designs are compile-time YAML, not player-created in the MVP.

- **Compiler**: The `CampaignCompiler` reads design YAML files, produces `CompiledDesignVersion` records, and embeds them in the `CampaignSnapshot`. A new `designs` map on the snapshot (keyed by `designVersionId`).

Explicitly out of scope for B10b (deferred):

- **Full design compilation pipeline** (DESIGN-21 §7: 20 stages) — no hull capacity, machinery/speed, fuel/range, armor weight, stability/flotation, or cost computation stages. Designs are authored, not computed.
- **Similarity assessment** (DESIGN-21 §9-17) — no derived-design check, no study discount.
- **Overweight tolerance and penalties** (DESIGN-21 §20-24).
- **Design study projects** (DESIGN-21 §3) — no time/cost study before construction.
- **Parametric design tool** — no player-facing design editor; designs are YAML-authored.
- **Refit / rebuild / conversion** (DESIGN-21 design layers) — post-MVP.
- **Treaty compliance, dock restrictions, builder limits** — B10c or later.
- **Aesthetic data** (DESIGN-21 §26).
- **Design draft** (DESIGN-21 §2) — designs compile directly to `CompiledDesignVersion` without a mutable draft layer.

### Fixture

- Extend the B10a 3-nation fixture (GBR, FRA, GER) with a minimal 1880 tech tree: 5-6 technologies across 3 fields (HULL_CONSTRUCTION, MACHINERY, GUNNERY). Each nation has pre-set field priorities and a small research budget.
- Add pre-compiled design templates for the existing starting ships. GBR: Dreadnought-class (battleship), Invincible-class (battlecruiser). FRA: Courbet-class (battleship). GER: one pre-dreadnought design.
- All nations start with research budget and treasury sufficient for at least one active research project.

### Command surface

- Add a `SetResearchPriorityCommand` in `@bluewave/commands`: sets field priorities for a nation. Validated through `CommandLifecycle` — rejected if fewer than 1 or more than 5 fields are `HIGH`, or if a field has no priority.
- Add a `ResearchBudgetCommand` (or extend the existing `BudgetProjectCommand` with a `type: "research"` variant): allocates treasury to research expenditure for the month.
- Commands are consumed in the `RESOLVE_RESEARCH` phase, replacing the old random-draw phase.

### Package placement

- **Extend `@bluewave/campaign`**: new `CompiledDesignVersion`, `DesignFamily` types; expanded `ResearchState` (field priorities, `researchBudget`); `CampaignSnapshot` gains a `designs` map.
- **Extend `@bluewave/phase-engine`**: the `research_progress` phase is rewritten to implement the DESIGN-20 pipeline. Phase registry is updated to include `RESOLVE_RESEARCH` as the canonical phase id (aliased from `research_progress`).
- **Extend `@bluewave/commands`**: `SetResearchPriorityCommand`, research budget support.
- **Extend `@bluewave/content-schema`**: `DesignTemplateSchema` for YAML design blueprints; expand `TechnologyPrerequisiteChainSchema` with `researchFieldId`, `discoveryWeight`, `availabilityMonth`.
- **No new packages** for B10b.

## Out of scope

- Education/national research modifiers, national traits (B10d)
- Exhausted-field reallocation (mid-month field exhaustion)
- Intelligence insight for research
- Multiple discoveries per month per field
- Mutual-exclusion groups
- Adoption pipeline (doctrine, equipment, refit, installation, ammunition)
- Technology variation / campaign variation (DESIGN-03)
- AI research priority-setting (B10d)
- Full design compilation pipeline (20 stages)
- Design similarity assessment, study discount
- Overweight tolerance, penalties, operational effects
- Design study projects
- Player-facing parametric design tool
- Refit / rebuild / conversion / scrapping
- Treaty compliance, dock restrictions, builder limits
- Full ResearchResolutionRecord (26-field record) — basic record only
- Naval base construction, fortifications, infrastructure (B10c)
- Wartime research modifiers (blockade, captured equipment — B10c)

## Acceptance criteria

1. `MonthExecutor` runs a full monthly turn with research resolution for all 3 nations (GBR, FRA, GER).
2. Each nation's research expenditure is deducted from treasury and recorded as a balanced ledger posting (RESEARCH_EXPENDITURE category).
3. Research resources are zero when paid expenditure is zero; positive expenditure produces resources proportional to `researchResourceConversionBp`.
4. Field priorities are set via `SetResearchPriorityCommand`; at least 1 and at most 5 fields are `HIGH`; a command violating this is rejected with `RESEARCH_PRIORITY_CONSTRAINT_VIOLATED`.
5. A command naming an exact next technology is rejected with `EXACT_TECHNOLOGY_SELECTION_PROHIBITED`.
6. Research resources are allocated across eligible fields using largest-remainder proportional allocation (DESIGN-20 §9).
7. Each eligible field has at most one active technology candidate receiving progress; progress never exceeds technology cost.
8. A technology reaching progress equal to cost is discovered in the same phase — prerequisites and availability are revalidated, `IMMEDIATE_KNOWLEDGE` effects are applied.
9. Discovery selection uses the keyed stream `research/month/nation/field` with deterministic weighted selection.
10. A technology not yet available (prerequisite missing or availability month not reached) remains ineligible and does not consume resources.
11. A technology graph cycle is detected at compile time and fails with `TECHNOLOGY_PREREQUISITE_CYCLE`.
12. Ship designs are compiled from YAML templates into immutable `CompiledDesignVersion` records.
13. Construction projects reference a `designVersionId`; completion creates a `Ship` with the design's compiled attributes.
14. Ships in initial fleet state carry a `designVersionId` linking to their compiled design.
15. All state changes are deterministic for a fixed seed (replay produces identical snapshots and hashes).
16. Existing compiler, command, phase, persistence, and determinism test suites still pass.
17. `vitest run` passes across the workspace.

## Stop conditions

- A DESIGN-20 invariant (e.g., exactly 15 canonical fields, priority weights 4/2/1) cannot be expressed within the existing `ResearchState`/`CampaignSnapshot` structure without a breaking persistence change (then stop and propose a migration ADR).
- The `ResearchState` expansion requires a new aggregate type that conflicts with the existing `NationState.research` inline shape (then stop and propose extracting `ResearchState` as a separate aggregate with its own hash).
- The DESIGN-20 8-stage pipeline cannot be implemented within the `MonthExecutor` single-method sequential-phase pattern (then stop and propose a phase-engine refactor before proceeding).
- Ship design integration requires a change to the `Ship` interface that breaks the existing `BattleResolver` or `FleetState` invariants (then stop and propose a design-version compatibility layer).
- Determinism cannot be preserved for a fixed seed across the new research resolution and design compilation stages.
