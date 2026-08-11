# 03 — B10b research and ship design scope

## Question

What exact scope does B10b (Milestone 1b: Research + Ship Design) cover?

This sub-milestone extends the existing technology prerequisite chain mechanic and adds ship design rules.

Questions to resolve:

- Research scope: multiple concurrent projects? research point accumulation? tech tree depth for 1880?
- Ship design scope: what is the minimum design system? (hull + machinery + armament + armor presets? full parametric design?)
- Does the canonical design (DESIGN-21 Ship Design) prescribe a specific minimum for B10b, or is most of it deferred?
- How does ship design integrate with the existing FleetState aggregate?
- What are the explicit out-of-scope items (e.g., full tech tree, mid-construction refits)?
- Acceptance criteria — what must be demonstrable?
- Does B10b need new packages or schema entities?

Type: grilling
Status: resolved
Blocked by: 02

## Answer

B10b scope resolved and brief produced at `.ai/briefs/b10b-research-design.md`.

### Research scope

- **Expenditure-driven**: Research is funded from treasury via a `ResearchBudgetCommand` (or extended `BudgetProjectCommand`). Only paid expenditure creates research resources (`researchResourceConversionBp = 10_000`).
- **15 canonical fields**: Each nation has field priorities (HIGH=4, MEDIUM=2, LOW=1). At least 1 HIGH, at most 5.
- **8-stage pipeline**: Replaces the existing random-draw `research_progress` phase. The pipeline is: paid resources → allocation by priority → advance eligible technologies → deterministic discovery selection → apply discovery → immediate-knowledge effects.
- **Stages 2, 4 deferred**: National/education modifiers and exhausted-field reallocation are out of scope for B10b.
- **Adoption deferred**: Only `IMMEDIATE_KNOWLEDGE` effects. Doctrine, equipment, refit, installation, ammunition adoption pipelines are deferred.
- **Historic timing modifier**: Shipped at 5_000/8_000/10_000/12_500 basis points relative to canonical availability month.
- **Keyed RNG stream**: `research/month/nation/field` for deterministic weighted candidate selection.

### Ship design scope

- **YAML-authored design templates**: Not parametric. Designs are authored at compile time as `CompiledDesignVersion` immutable records.
- **Design family**: Simple identity lineage. No similarity assessment.
- **Ship integration**: `Ship` gains `designVersionId`. Construction projects reference a `designVersionId`. Completion creates a ship from the design's compiled attributes.
- **Full 20-stage compilation pipeline deferred**: No hull capacity, machinery/speed, fuel/range, stability/flotation, or cost computation stages. Designs are authored, not computed.
- **Overweight, refit, treaty compliance, study projects all deferred**.

### Fixture

- Extends the B10a 3-nation fixture (GBR, FRA, GER) with a minimal 5-6 tech tree across 3 fields, pre-set field priorities, research budgets, and pre-compiled design templates for starting ships.

### Packages

- Extend `@bluewave/campaign` (types), `@bluewave/phase-engine` (research pipeline), `@bluewave/commands` (research priority/budget commands), `@bluewave/content-schema` (design template schema + expanded tech schema). No new packages.
